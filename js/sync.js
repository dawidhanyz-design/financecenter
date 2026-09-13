// Synchronizacja obserwowanych aktywów między urządzeniami przez Firebase Firestore.
// Urządzenia dzielą listę, jeśli wpiszą ten sam "kod synchronizacji" w Ustawieniach —
// to on jest identyfikatorem dokumentu w Firestore (nie ma tu prawdziwego logowania).

const SYNC_CODE_STORAGE_KEY = "finance-center-sync-code";
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
  localStorage.setItem(SYNC_CODE_STORAGE_KEY, code.trim());
}

function clearSyncCode() {
  localStorage.removeItem(SYNC_CODE_STORAGE_KEY);
}

function normalizeSyncCode(code) {
  return code.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 60);
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

function startSync(code, onRemoteUpdate) {
  const ref = watchDocRef(code);
  if (!ref) return;
  stopSync();
  syncUnsubscribe = ref.onSnapshot(
    (snap) => {
      if (snap.exists) {
        const data = snap.data();
        if (Array.isArray(data.tickers)) onRemoteUpdate(data.tickers);
      }
    },
    (err) => console.warn("Błąd synchronizacji:", err.message)
  );
}

// Pierwsze podłączenie: jeśli w chmurze jest już lista pod tym kodem — pobierz ją,
// w przeciwnym razie zapisz w chmurze to, co mamy lokalnie (żeby nie nadpisać
// przypadkiem listy z drugiego urządzenia).
async function enableSync(code, currentLocalTickers, onRemoteUpdate) {
  const ref = watchDocRef(code);
  if (!ref) throw new Error("Firebase nie jest skonfigurowany");
  const snap = await ref.get();
  if (snap.exists && Array.isArray(snap.data().tickers)) {
    onRemoteUpdate(snap.data().tickers);
  } else {
    await ref.set({ tickers: currentLocalTickers, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  }
  startSync(code, onRemoteUpdate);
}

function pushWatchlistToCloud(code, tickers) {
  const ref = watchDocRef(code);
  if (!ref) return;
  ref.set({
    tickers,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  }).catch((err) => console.warn("Nie udało się zsynchronizować:", err.message));
}
