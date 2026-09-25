// Synchronizacja danych (obserwowane aktywa + transakcje) między urządzeniami przez
// Firebase Firestore. Urządzenia dzielą dane, jeśli mają ten sam "kod synchronizacji" —
// to on jest identyfikatorem dokumentu w Firestore (nie ma tu prawdziwego logowania),
// dlatego kod musi być długi i losowy: wtedy działa jak klucz, którego nie da się odgadnąć.

const SYNC_CODE_STORAGE_KEY = "finance-center-sync-code";
const SYNC_MIN_CODE_LENGTH = 20;
let firestoreDb = null;
let syncUnsubscribe = null;

function initFirebase() {
  if (firestoreDb) return firestoreDb;
  if (typeof firebase === "undefined" || typeof FIREBASE_CONFIG === "undefined") return null;
  if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  firestoreDb = firebase.firestore();
  return firestoreDb;
}

function loadSyncCode() {
  try { return localStorage.getItem(SYNC_CODE_STORAGE_KEY) || ""; } catch (e) { return ""; }
}

function saveSyncCode(code) {
  localStorage.setItem(SYNC_CODE_STORAGE_KEY, code);
}

function clearSyncCode() {
  localStorage.removeItem(SYNC_CODE_STORAGE_KEY);
}

function normalizeSyncCode(code) {
  return code.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 60);
}

// Losowy kod z kryptograficznego generatora (~124 bity) — praktycznie nie do odgadnięcia.
function generateSyncCode() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes, (b) => (b % 36).toString(36)).join("");
  return `fin-${body}`;
}

function stopSync() {
  if (syncUnsubscribe) {
    syncUnsubscribe();
    syncUnsubscribe = null;
  }
}

function watchDocRef(code) {
  const db = initFirebase();
  if (!db) return null;
  return db.collection("watchlists").doc(normalizeSyncCode(code));
}

// snapshot = { tickers: string[], transactions: object }; w chmurze transakcje leżą
// jako jeden tekst JSON, żeby nie zależeć od ograniczeń Firestore co do nazw pól.
function toCloudDoc(snapshot) {
  return {
    tickers: snapshot.tickers,
    transactions: JSON.stringify(snapshot.transactions || {}),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
}

function fromCloudDoc(data) {
  if (!data || !Array.isArray(data.tickers)) return null;
  let transactions = {};
  try { transactions = data.transactions ? JSON.parse(data.transactions) : {}; } catch (e) { /* zostaje puste */ }
  return { tickers: data.tickers, transactions };
}

function startSync(code, onRemoteUpdate) {
  const ref = watchDocRef(code);
  if (!ref) return;
  stopSync();
  syncUnsubscribe = ref.onSnapshot(
    (snap) => {
      if (!snap.exists || snap.metadata.hasPendingWrites) return; // pomijamy echo własnych zapisów
      const remote = fromCloudDoc(snap.data());
      if (remote) onRemoteUpdate(remote);
    },
    (err) => console.warn("Błąd synchronizacji:", err.message)
  );
}

// Pierwsze podłączenie: jeśli w chmurze są już dane pod tym kodem — pobierz je (to drugie
// urządzenie), w przeciwnym razie zapisz w chmurze to, co mamy lokalnie.
async function enableSync(code, localSnapshot, onRemoteUpdate) {
  const ref = watchDocRef(code);
  if (!ref) throw new Error("Firebase nie jest skonfigurowany");
  const snap = await ref.get();
  const remote = snap.exists ? fromCloudDoc(snap.data()) : null;
  if (remote) {
    onRemoteUpdate(remote);
  } else {
    await ref.set(toCloudDoc(localSnapshot));
  }
  startSync(code, onRemoteUpdate);
}

function pushToCloud(code, snapshot) {
  const ref = watchDocRef(code);
  if (!ref) return;
  ref.set(toCloudDoc(snapshot)).catch((err) => console.warn("Nie udało się zsynchronizować:", err.message));
}
