// Integracja z Twelve Data (https://twelvedata.com) — realne wyszukiwanie i notowania.
// Wywoływane bezpośrednio z przeglądarki (API wspiera CORS, nie trzeba backendu).

const TD_BASE = "https://api.twelvedata.com";
const TD_APIKEY_STORAGE_KEY = "finance-center-td-apikey";

function getApiKey() {
  try {
    const stored = localStorage.getItem(TD_APIKEY_STORAGE_KEY);
    if (stored) return stored;
  } catch (e) { /* ignore */ }
  return typeof TWELVE_DATA_API_KEY !== "undefined" ? TWELVE_DATA_API_KEY : "";
}

function setApiKey(key) {
  localStorage.setItem(TD_APIKEY_STORAGE_KEY, key.trim());
}

function clearApiKey() {
  localStorage.removeItem(TD_APIKEY_STORAGE_KEY);
}

function hasApiKey() {
  return !!getApiKey();
}

async function tdFetch(path, params) {
  const key = getApiKey();
  if (!key) throw new Error("Brak klucza API Twelve Data");
  const url = new URL(TD_BASE + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set("apikey", key);
  const res = await fetch(url.toString());
  const json = await res.json();
  if (json.status === "error") {
    throw new Error(json.message || "Błąd API Twelve Data");
  }
  return json;
}

async function tdSearch(query) {
  if (!query.trim()) return [];
  const json = await tdFetch("/symbol_search", { symbol: query, outputsize: 8 });
  return (json.data || []).slice(0, 8).map((d) => ({
    ticker: d.symbol,
    name: d.instrument_name,
    exchange: d.exchange,
    type: d.instrument_type,
    currency: d.currency,
  }));
}

const quoteCache = new Map();
const QUOTE_TTL_MS = 60 * 1000;

async function tdQuote(ticker) {
  const cached = quoteCache.get(ticker);
  if (cached && Date.now() - cached.ts < QUOTE_TTL_MS) return cached.data;
  const json = await tdFetch("/quote", { symbol: ticker });
  const data = {
    name: json.name || ticker,
    price: parseFloat(json.close),
    changePct: parseFloat(json.percent_change),
    open: parseFloat(json.open),
    high: parseFloat(json.high),
    low: parseFloat(json.low),
    w52h: json.fifty_two_week ? parseFloat(json.fifty_two_week.high) : null,
    w52l: json.fifty_two_week ? parseFloat(json.fifty_two_week.low) : null,
    currency: json.currency || "USD",
    exchange: json.exchange || "",
  };
  quoteCache.set(ticker, { data, ts: Date.now() });
  return data;
}

const seriesCache = new Map();

async function tdTimeSeries(ticker, years = 5) {
  if (seriesCache.has(ticker)) return seriesCache.get(ticker);
  const promise = (async () => {
    const end = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - years);
    const fmt = (d) => d.toISOString().slice(0, 10);
    const json = await tdFetch("/time_series", {
      symbol: ticker,
      interval: "1day",
      start_date: fmt(start),
      end_date: fmt(end),
      outputsize: 5000,
    });
    const values = (json.values || []).slice().reverse();
    return values.map((v) => ({ date: v.datetime, close: parseFloat(v.close) }));
  })();
  seriesCache.set(ticker, promise);
  try {
    return await promise;
  } catch (e) {
    seriesCache.delete(ticker);
    throw e;
  }
}

// Pamięć nazw/walut instrumentów znalezionych na żywo (żeby po dodaniu do obserwowanych
// wiedzieć jak je opisać, zanim jeszcze przyjdzie pierwsza wycena)
const LIVE_META_STORAGE_KEY = "finance-center-live-meta";

function loadLiveMeta() {
  try {
    const raw = localStorage.getItem(LIVE_META_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return {};
}

const liveMetaCache = loadLiveMeta();

function saveLiveMeta(ticker, meta) {
  liveMetaCache[ticker] = meta;
  try {
    localStorage.setItem(LIVE_META_STORAGE_KEY, JSON.stringify(liveMetaCache));
  } catch (e) { /* ignore */ }
}

// ---- Ujednolicone pobieranie: żywe dane gdy jest klucz, w innym wypadku dane przykładowe ----

async function resolveQuote(ticker) {
  let liveError = null;
  if (hasApiKey()) {
    try {
      const q = await tdQuote(ticker);
      saveLiveMeta(ticker, { name: q.name, currency: q.currency, exchange: q.exchange });
      return { ...q, cap: "—", source: "live" };
    } catch (e) { liveError = e.message; }
  }
  if (MARKET_MOCK[ticker]) {
    const m = MARKET_MOCK[ticker];
    return {
      name: m.name, price: m.price, changePct: m.changePct, open: m.open,
      high: m.high, low: m.low, w52h: m.w52h, w52l: m.w52l,
      currency: "PLN", exchange: "", cap: m.cap, source: "mock",
    };
  }
  return liveError ? { error: liveError } : null;
}

async function resolveHistory(ticker) {
  if (hasApiKey()) {
    try {
      const series = await tdTimeSeries(ticker, 5);
      if (series && series.length > 1) {
        const currency = liveMetaCache[ticker]?.currency || "USD";
        return { series, currency, source: "live" };
      }
    } catch (e) { /* spadamy do danych przykładowych poniżej */ }
  }
  if (MARKET_MOCK[ticker]) {
    return { series: getPriceHistory(ticker), currency: "PLN", source: "mock" };
  }
  return { series: [], currency: "PLN", source: "none" };
}

function instrumentDisplayName(ticker) {
  if (liveMetaCache[ticker]) return liveMetaCache[ticker].name;
  if (MARKET_MOCK[ticker]) return MARKET_MOCK[ticker].name;
  return ticker;
}
