// Śledzenie własnych transakcji (ilość + cena zakupu) per ticker — niezależne od
// tego, jakie dane rynkowe akurat wyświetlamy (mock czy Twelve Data).

const TRANSACTIONS_STORAGE_KEY = "finance-center-transactions";

function loadTransactions() {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return {};
}

function saveTransactions() {
  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(state.transactions));
}

function addTransaction(ticker, txn) {
  if (!state.transactions[ticker]) state.transactions[ticker] = [];
  state.transactions[ticker].push(txn);
  saveTransactions();
}

function removeTransaction(ticker, index) {
  if (!state.transactions[ticker]) return;
  state.transactions[ticker].splice(index, 1);
  if (state.transactions[ticker].length === 0) delete state.transactions[ticker];
  saveTransactions();
}

// Uśrednia wszystkie transakcje dla danego tickera (metoda średniej ważonej kosztu).
function computePosition(ticker) {
  const txns = state.transactions[ticker];
  if (!txns || !txns.length) return null;
  let qty = 0;
  let cost = 0;
  txns.forEach((t) => {
    qty += t.qty;
    cost += t.qty * t.price;
  });
  if (qty <= 0) return null;
  const currency = txns[txns.length - 1].currency || "PLN";
  return { qty, avgCost: cost / qty, costBasis: cost, currency };
}
