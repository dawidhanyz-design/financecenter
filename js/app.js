// ---- Stan aplikacji ----
const WATCHLIST_STORAGE_KEY = "finance-center-watchlist";

function loadWatchlist() {
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return ["^GSPC", "CDR.WA", "GC=F"];
}

function saveWatchlist() {
  localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(state.watchlist));
}

const CURRENCY_STORAGE_KEY = "finance-center-currency";

function loadCurrency() {
  try {
    const raw = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (raw && FX_RATES_PLN[raw]) return raw;
  } catch (e) { /* ignore */ }
  return "USD";
}

function saveCurrency() {
  localStorage.setItem(CURRENCY_STORAGE_KEY, state.currency);
}

const state = {
  currentView: "cycle",
  selectedAssetId: "akcje",
  watchlist: loadWatchlist(),
  expandedTickers: new Set(),
  watchCharts: {},
  currency: loadCurrency(),
  lastMarketTicker: null,
  watchRequestToken: 0,
  marketRequestToken: 0,
};

// Przelicza kwotę z jej waluty natywnej (domyślnie PLN — tak są wyrażone dane przykładowe)
// na walutę wybraną w przełączniku, przez PLN jako pivot. Nieznana waluta -> null.
const convertAmount = (amount, nativeCurrency = "PLN") => {
  const toPln = FX_RATES_PLN[nativeCurrency];
  if (toPln === undefined) return null;
  const amountPln = amount * toPln;
  return amountPln / FX_RATES_PLN[state.currency];
};
const fmtMoney = (amount, nativeCurrency = "PLN") => {
  if (amount === null || amount === undefined || !isFinite(amount)) return "—";
  const converted = convertAmount(amount, nativeCurrency);
  if (converted === null) {
    // Waluta spoza znanej tabeli kursów — pokaż bez przeliczenia, w walucie natywnej
    return amount.toLocaleString("en-US", { style: "currency", currency: nativeCurrency, maximumFractionDigits: 2 });
  }
  const maximumFractionDigits = Math.abs(converted) >= 1000 ? 0 : 2;
  return converted.toLocaleString(CURRENCY_LOCALES[state.currency], { style: "currency", currency: state.currency, maximumFractionDigits });
};
const fmtPct = (n) => {
  if (n === null || n === undefined || !isFinite(n)) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
};

function renderCurrencySwitch() {
  document.querySelectorAll("#currency-switch button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.currency === state.currency);
  });
}

document.querySelectorAll("#currency-switch button").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.currency = btn.dataset.currency;
    saveCurrency();
    renderCurrencySwitch();
    if (state.currentView === "watch") renderWatchlistView();
    if (state.currentView === "market" && state.lastMarketTicker) renderMarketResult(state.lastMarketTicker);
  });
});
renderCurrencySwitch();

function byId(id, list) {
  return list.find((x) => x.id === id);
}

// ---- Nawigacja ----
const viewTitles = {
  cycle: ["Stan obecny", "Na jakim etapie cyklu koniunkturalnego jesteśmy"],
  assets: ["Klasy aktywów", "Ocena, historyczne analogie oraz plusy i minusy każdej klasy"],
  watch: ["Aktywa", "Obserwuj wybrane spółki, indeksy i surowce oraz ich zachowanie w czasie"],
  market: ["Analizy rynkowe", "Wyszukaj i sprawdź dowolną spółkę lub instrument"],
  settings: ["Ustawienia", "Źródło danych i metodologia"],
};

function setView(view) {
  state.currentView = view;
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
  document.querySelectorAll(".view").forEach((sec) => {
    sec.classList.toggle("active", sec.id === `view-${view}`);
  });
  const [title, subtitle] = viewTitles[view];
  document.getElementById("view-title").textContent = title;
  document.getElementById("view-subtitle").textContent = subtitle;

  if (view === "cycle") renderCycleView();
  if (view === "assets") renderAssetsView();
  if (view === "watch") renderWatchlistView();
}

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => setView(btn.dataset.view));
});

document.querySelectorAll("[data-goto]").forEach((btn) => {
  btn.addEventListener("click", () => setView(btn.dataset.goto));
});

// ---- Stan obecny: cykl koniunkturalny ----
function renderCycleView() {
  const phase = byId(CURRENT_CYCLE.phaseId, CYCLE_PHASES);

  document.getElementById("cycle-phase-name").textContent = phase.name;
  document.getElementById("cycle-phase-desc").textContent = CURRENT_CYCLE.description;
  document.getElementById("cycle-confidence").textContent = `Pewność oceny: ${CURRENT_CYCLE.confidence}`;

  renderCycleWheel(phase);
  renderIndicators();
  renderAssetQuickRow();
}

function renderCycleWheel(phase) {
  const midAngle = (phase.angle[0] + phase.angle[1]) / 2;
  const cssRotate = ((midAngle - 180) + 360) % 360;
  document.getElementById("cycle-wheel-pointer").style.transform = `translateX(-50%) rotate(${cssRotate}deg)`;

  const positions = {
    early: { top: "4px", right: "-4px", textAlign: "right" },
    mid: { bottom: "4px", right: "-4px", textAlign: "right" },
    late: { bottom: "4px", left: "-4px", textAlign: "left" },
    recession: { top: "4px", left: "-4px", textAlign: "left" },
  };

  const labelsWrap = document.getElementById("cycle-wheel-labels");
  labelsWrap.innerHTML = "";
  CYCLE_PHASES.forEach((p) => {
    const el = document.createElement("div");
    el.className = `cycle-wheel-label${p.id === phase.id ? " is-current" : ""}`;
    el.textContent = p.name.split(" (")[0];
    Object.assign(el.style, positions[p.id]);
    labelsWrap.appendChild(el);
  });
}

function renderIndicators() {
  const grid = document.getElementById("indicators-grid");
  grid.innerHTML = "";
  CURRENT_CYCLE.indicators.forEach((ind) => {
    const div = document.createElement("div");
    div.className = "indicator-card";
    div.innerHTML = `
      <span class="indicator-label">${ind.label}</span>
      <span class="indicator-value trend-${ind.trend}">${ind.value}</span>
      <span class="indicator-note">${ind.note}</span>
    `;
    grid.appendChild(div);
  });
}

function renderAssetQuickRow() {
  const row = document.getElementById("asset-quick-row");
  row.innerHTML = "";
  ASSET_CLASSES.forEach((a) => {
    const div = document.createElement("div");
    div.className = "asset-quick-item";
    div.innerHTML = `
      <span class="asset-quick-name"><span>${a.icon}</span> ${a.name}</span>
      <span class="verdict-badge verdict-${a.verdictLevel}">${a.verdict}</span>
    `;
    div.addEventListener("click", () => {
      state.selectedAssetId = a.id;
      setView("assets");
    });
    row.appendChild(div);
  });
}

// ---- Klasy aktywów ----
function renderAssetsView() {
  const grid = document.getElementById("asset-grid");
  grid.innerHTML = "";
  ASSET_CLASSES.forEach((a) => {
    const btn = document.createElement("button");
    btn.className = `asset-card${a.id === state.selectedAssetId ? " selected" : ""}`;
    btn.innerHTML = `
      <div class="asset-card-icon">${a.icon}</div>
      <div class="asset-card-name">${a.name}</div>
      <div class="asset-card-tagline">${a.tagline}</div>
      <span class="verdict-badge verdict-${a.verdictLevel}">${a.verdict}</span>
    `;
    btn.addEventListener("click", () => {
      state.selectedAssetId = a.id;
      renderAssetsView();
    });
    grid.appendChild(btn);
  });

  renderAssetDetail(state.selectedAssetId);
}

function renderAssetDetail(id) {
  const a = byId(id, ASSET_CLASSES);
  const phaseOrder = ["early", "mid", "late", "recession"];
  const container = document.getElementById("asset-detail");
  if (!a) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <div class="card">
      <div class="asset-detail-header">
        <h2><span>${a.icon}</span> ${a.name}</h2>
        <span class="verdict-badge verdict-${a.verdictLevel}">${a.verdict}</span>
      </div>
      <p class="asset-detail-tagline">${a.tagline}</p>

      <div class="phase-table">
        ${phaseOrder.map((pid) => {
          const phaseDef = byId(pid, CYCLE_PHASES);
          const isCurrent = pid === CURRENT_CYCLE.phaseId;
          return `
            <div class="phase-row${isCurrent ? " is-current" : ""}">
              <div class="phase-row-name">${phaseDef.name.split(" (")[0]}${isCurrent ? " · teraz" : ""}</div>
              <div class="phase-row-value">${a.phaseTable[pid]}</div>
            </div>
          `;
        }).join("")}
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h2>Jak zachowywało się to aktywo w podobnych okresach cyklu</h2></div>
      ${a.analogs.map((an) => `
        <div class="analog-item">
          <div class="analog-period">${an.period}</div>
          <p class="analog-text">${an.text}</p>
        </div>
      `).join("")}
    </div>

    <div class="card">
      <div class="card-header"><h2>Plusy i minusy</h2></div>
      <div class="pros-cons-grid">
        <div class="pros-cons-col pros">
          <h3>Plusy</h3>
          <ul>${a.pros.map((p) => `<li>${p}</li>`).join("")}</ul>
        </div>
        <div class="pros-cons-col cons">
          <h3>Minusy</h3>
          <ul>${a.cons.map((c) => `<li>${c}</li>`).join("")}</ul>
        </div>
      </div>
    </div>
  `;
}

// ---- Aktywa (obserwowana lista) ----
function cssSafeTicker(ticker) {
  return ticker.replace(/[^a-zA-Z0-9]/g, "_");
}

function pctCell(pct) {
  if (pct === null || pct === undefined || !isFinite(pct)) {
    return `<div class="watch-cell muted">—</div>`;
  }
  const cls = pct >= 0 ? "pl-positive" : "pl-negative";
  return `<div class="watch-cell ${cls}">${fmtPct(pct)}</div>`;
}

function addToWatchlist(ticker) {
  if (!state.watchlist.includes(ticker)) {
    state.watchlist.push(ticker);
    saveWatchlist();
  }
  renderWatchlistView();
}

function removeFromWatchlist(ticker) {
  state.watchlist = state.watchlist.filter((t) => t !== ticker);
  state.expandedTickers.delete(ticker);
  saveWatchlist();
  renderWatchlistView();
}

function toggleWatchExpand(ticker) {
  if (state.expandedTickers.has(ticker)) state.expandedTickers.delete(ticker);
  else state.expandedTickers.add(ticker);
  renderWatchlistView();
}

async function renderWatchlistView() {
  const rowsWrap = document.getElementById("watch-rows");
  const emptyState = document.getElementById("watch-empty");
  const table = document.getElementById("watch-table");

  if (state.watchlist.length === 0) {
    Object.values(state.watchCharts).forEach((chart) => chart.destroy());
    state.watchCharts = {};
    rowsWrap.innerHTML = "";
    emptyState.classList.remove("hidden");
    table.classList.add("hidden");
    return;
  }
  emptyState.classList.add("hidden");
  table.classList.remove("hidden");
  rowsWrap.innerHTML = `<div class="watch-loading">Pobieranie notowań…</div>`;

  const myToken = ++state.watchRequestToken;
  const rows = await Promise.all(state.watchlist.map(async (ticker) => {
    const [quote, history] = await Promise.all([resolveQuote(ticker), resolveHistory(ticker)]);
    return { ticker, quote, history };
  }));
  if (myToken !== state.watchRequestToken) return;

  Object.values(state.watchCharts).forEach((chart) => chart.destroy());
  state.watchCharts = {};
  rowsWrap.innerHTML = "";

  rows.forEach(({ ticker, quote, history }) => {
    if (!quote || quote.error) {
      const warn = document.createElement("div");
      warn.className = "watch-row";
      const reason = quote && quote.error ? quote.error : "brak danych";
      warn.innerHTML = `
        <div class="watch-cell watch-name"><strong>${ticker}</strong><span class="muted">${reason}</span></div>
        <div></div><div></div><div></div><div></div><div></div>
        <button class="watch-remove" data-ticker="${ticker}" title="Usuń z obserwowanych">✕</button>
      `;
      warn.querySelector(".watch-remove").addEventListener("click", () => removeFromWatchlist(ticker));
      rowsWrap.appendChild(warn);
      return;
    }
    const series = history.series;
    const pct14 = pctChangeOverDays(series, 14);
    const pct30 = pctChangeOverDays(series, 30);
    const pct365 = pctChangeOverDays(series, 365);
    const pct5y = pctChange5y(series);
    const isExpanded = state.expandedTickers.has(ticker);
    const safeId = cssSafeTicker(ticker);

    const group = document.createElement("div");
    group.innerHTML = `
      <div class="watch-row${isExpanded ? " expanded" : ""}" data-ticker="${ticker}">
        <div class="watch-cell watch-name">
          <strong>${quote.name}</strong>
          <span class="muted">${ticker}${quote.source === "mock" ? " · przykładowe" : ""}</span>
        </div>
        <div class="watch-cell watch-price">${fmtMoney(quote.price, quote.currency)}</div>
        ${pctCell(pct14)}
        ${pctCell(pct30)}
        ${pctCell(pct365)}
        ${pctCell(pct5y)}
        <button class="watch-remove" data-ticker="${ticker}" title="Usuń z obserwowanych">✕</button>
      </div>
      <div class="watch-chart-wrap" ${isExpanded ? "" : "hidden"}>
        <canvas id="watch-chart-${safeId}" height="90"></canvas>
      </div>
    `;
    rowsWrap.appendChild(group);

    group.querySelector(".watch-row").addEventListener("click", (e) => {
      if (e.target.closest(".watch-remove")) return;
      toggleWatchExpand(ticker);
    });
    group.querySelector(".watch-remove").addEventListener("click", (e) => {
      e.stopPropagation();
      removeFromWatchlist(ticker);
    });

    if (isExpanded && series.length > 1) {
      renderWatchChart(ticker, series, quote.currency, safeId);
    }
  });
}

function renderWatchChart(ticker, series, nativeCurrency, safeId) {
  const canvas = document.getElementById(`watch-chart-${safeId}`);
  if (!canvas) return;
  const weekly = downsampleWeekly(series);
  const labels = weekly.map((pt) => formatMonthYear(pt.date));
  const dataPoints = weekly.map((pt) => convertAmount(pt.close, nativeCurrency));
  const chart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: dataPoints,
        borderColor: "#2f6fed",
        backgroundColor: "rgba(47,111,237,0.08)",
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { maxTicksLimit: 5, font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { font: { size: 10 } }, grid: { color: "#eef1f6" } },
      },
    },
  });
  state.watchCharts[ticker] = chart;
}

// ---- Podpowiedzi wyszukiwania instrumentów (jak w wyszukiwarce sklepu) ----
// Dopasowuje po nazwie firmy LUB tickerze, więc nie trzeba pamiętać że "Apple" to "AAPL".
// Gdy skonfigurowany jest klucz Twelve Data, pyta o wyniki na żywo (praktycznie cały świat
// instrumentów); bez klucza — lub gdy zapytanie się nie powiedzie — spada do lokalnego katalogu.
async function resolveSearchResults(query) {
  if (hasApiKey()) {
    try {
      const results = await tdSearch(query);
      if (results.length) return { results, usedLive: true };
    } catch (e) { /* spadamy do lokalnego katalogu poniżej */ }
  }
  return { results: searchInstruments(query), usedLive: false };
}

function wireInstrumentSearch(inputEl, boxEl, onSelect) {
  let debounceTimer = null;
  let requestId = 0;

  function renderResults(results, usedLive, query) {
    if (!results.length) {
      boxEl.innerHTML = `<div class="suggestion-empty">Brak wyników dla "${query}". Spróbuj nazwy firmy (np. Apple) lub tickera.</div>`;
      boxEl.classList.add("open");
      return;
    }
    boxEl.innerHTML = results.map((r) => `
      <button type="button" class="suggestion-item" data-ticker="${r.ticker}">
        <span class="suggestion-name">${r.name}</span>
        <span class="suggestion-meta">${r.ticker} · ${usedLive ? [r.exchange, r.type].filter(Boolean).join(" · ") : (ASSET_CLASS_LABELS[r.assetClass] || r.assetClass)}</span>
      </button>
    `).join("");
    boxEl.classList.add("open");
    boxEl.querySelectorAll(".suggestion-item").forEach((btn, i) => {
      btn.addEventListener("click", () => {
        const r = results[i];
        if (usedLive) saveLiveMeta(r.ticker, { name: r.name, currency: r.currency || "USD", exchange: r.exchange });
        onSelect(r.ticker);
        boxEl.innerHTML = "";
        boxEl.classList.remove("open");
      });
    });
  }

  async function performSearch(query) {
    const myRequestId = ++requestId;
    if (!query.trim()) {
      boxEl.innerHTML = "";
      boxEl.classList.remove("open");
      return;
    }
    if (hasApiKey()) {
      boxEl.innerHTML = `<div class="suggestion-empty">Szukam…</div>`;
      boxEl.classList.add("open");
    }
    const { results, usedLive } = await resolveSearchResults(query);
    if (myRequestId !== requestId) return;
    renderResults(results, usedLive, query);
  }

  inputEl.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value;
    debounceTimer = setTimeout(() => performSearch(query), 300);
  });
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      clearTimeout(debounceTimer);
      const query = inputEl.value;
      if (!query.trim()) return;
      const myRequestId = ++requestId;
      resolveSearchResults(query).then(({ results, usedLive }) => {
        if (myRequestId !== requestId || !results.length) return;
        const r = results[0];
        if (usedLive) saveLiveMeta(r.ticker, { name: r.name, currency: r.currency || "USD", exchange: r.exchange });
        onSelect(r.ticker);
        boxEl.innerHTML = "";
        boxEl.classList.remove("open");
      });
    } else if (e.key === "Escape") {
      boxEl.classList.remove("open");
    }
  });
  document.addEventListener("click", (e) => {
    if (!inputEl.contains(e.target) && !boxEl.contains(e.target)) {
      boxEl.classList.remove("open");
    }
  });
}

const watchAddInput = document.getElementById("watch-add-input");
wireInstrumentSearch(watchAddInput, document.getElementById("watch-suggestions"), (ticker) => {
  addToWatchlist(ticker);
  watchAddInput.value = "";
});

// ---- Analizy rynkowe ----
let chartMarket;

async function renderMarketResult(ticker) {
  const key = ticker.toUpperCase().trim();
  const empty = document.getElementById("market-empty");
  const result = document.getElementById("market-result");

  empty.classList.remove("hidden");
  empty.innerHTML = `<p>Ładowanie danych dla "<strong>${key}</strong>"…</p>`;
  result.classList.add("hidden");

  const myToken = ++state.marketRequestToken;
  const [quote, history] = await Promise.all([resolveQuote(key), resolveHistory(key)]);
  if (myToken !== state.marketRequestToken) return;

  if (!quote || quote.error) {
    const reason = quote && quote.error
      ? `Twelve Data odpowiedziało: „${quote.error}”`
      : "Spróbuj wpisać nazwę firmy (np. Apple) lub dokładny ticker.";
    empty.innerHTML = `<p>Nie udało się pobrać danych dla "<strong>${key}</strong>". ${reason}</p>`;
    return;
  }

  state.lastMarketTicker = key;
  empty.classList.add("hidden");
  result.classList.remove("hidden");

  document.getElementById("market-name").textContent = quote.name;
  document.getElementById("market-ticker").textContent = key + (quote.source === "mock" ? " · przykładowe dane" : "");
  document.getElementById("market-price").textContent = fmtMoney(quote.price, quote.currency);
  const changeEl = document.getElementById("market-change");
  changeEl.textContent = fmtPct(quote.changePct);
  changeEl.className = `market-change ${quote.changePct >= 0 ? "pl-positive" : "pl-negative"}`;

  document.getElementById("m-open").textContent = fmtMoney(quote.open, quote.currency);
  document.getElementById("m-high").textContent = fmtMoney(quote.high, quote.currency);
  document.getElementById("m-low").textContent = fmtMoney(quote.low, quote.currency);
  document.getElementById("m-52h").textContent = fmtMoney(quote.w52h, quote.currency);
  document.getElementById("m-52l").textContent = fmtMoney(quote.w52l, quote.currency);
  document.getElementById("m-cap").textContent = quote.cap || "—";

  const series = history.series || [];
  const recent = series.slice(-90);
  const ctx = document.getElementById("chart-market");
  if (chartMarket) chartMarket.destroy();
  if (recent.length > 1) {
    const sparkValues = recent.map((pt) => convertAmount(pt.close, history.currency));
    chartMarket = new Chart(ctx, {
      type: "line",
      data: {
        labels: recent.map((pt) => pt.date),
        datasets: [{
          data: sparkValues,
          borderColor: quote.changePct >= 0 ? "#16a34a" : "#dc2626",
          backgroundColor: "transparent",
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.25,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
      },
    });
  }
}

const tickerSearchInput = document.getElementById("ticker-search");
wireInstrumentSearch(tickerSearchInput, document.getElementById("ticker-suggestions"), (ticker) => {
  tickerSearchInput.value = ticker;
  setView("market");
  renderMarketResult(ticker);
});

// ---- Status źródła danych (sidebar + ustawienia) ----
function updateDataStatus() {
  const connected = hasApiKey();
  const dot = document.getElementById("data-status-dot");
  const text = document.getElementById("data-status-text");
  dot.className = `dot ${connected ? "dot-live" : "dot-mock"}`;
  text.textContent = connected ? "Dane na żywo (Twelve Data)" : "Dane przykładowe";

  const badge = document.getElementById("td-status-badge");
  const statusText = document.getElementById("td-status-text");
  if (connected) {
    badge.textContent = "Połączono";
    badge.className = "verdict-badge verdict-positive";
    statusText.textContent = "Klucz API jest zapisany — wyszukiwanie i notowania pobierają realne dane z Twelve Data.";
  } else {
    badge.textContent = "Brak klucza";
    badge.className = "verdict-badge verdict-neutral";
    statusText.textContent = "Bez klucza aplikacja korzysta z lokalnego katalogu ~66 instrumentów i danych przykładowych.";
  }
}

const tdApiKeyInput = document.getElementById("td-apikey-input");
tdApiKeyInput.value = getApiKey();

document.getElementById("td-apikey-save").addEventListener("click", () => {
  const val = tdApiKeyInput.value.trim();
  if (!val) return;
  setApiKey(val);
  quoteCache.clear();
  seriesCache.clear();
  updateDataStatus();
  if (state.currentView === "watch") renderWatchlistView();
  if (state.currentView === "market" && state.lastMarketTicker) renderMarketResult(state.lastMarketTicker);
});

document.getElementById("td-apikey-clear").addEventListener("click", () => {
  clearApiKey();
  tdApiKeyInput.value = "";
  quoteCache.clear();
  seriesCache.clear();
  updateDataStatus();
  if (state.currentView === "watch") renderWatchlistView();
  if (state.currentView === "market" && state.lastMarketTicker) renderMarketResult(state.lastMarketTicker);
});

updateDataStatus();

// ---- Init ----
setView("cycle");
