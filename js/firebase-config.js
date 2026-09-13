// Konfiguracja Firebase (do synchronizacji obserwowanych aktywów między urządzeniami).
// Te wartości są z założenia publiczne po stronie klienta (tak działa Firebase — każda
// strona z Firebase ma je widoczne w źródle) — bezpieczeństwo zapewniają reguły Firestore,
// nie ukrywanie tego pliku. Dlatego ten plik, w przeciwieństwie do config.local.js, jest
// commitowany do repozytorium.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDq8Y8mscne-5yY1V28-PPbRKoyJJ6F9aU",
  authDomain: "financecenter-e7571.firebaseapp.com",
  projectId: "financecenter-e7571",
  storageBucket: "financecenter-e7571.firebasestorage.app",
  messagingSenderId: "28883320102",
  appId: "1:28883320102:web:22d4476e61a30fcd1855e7",
};
