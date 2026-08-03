import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// HƯỚNG DẪN: Thay thế toàn bộ object firebaseConfig dưới đây bằng Config lấy từ Firebase Console của bạn.
const firebaseConfig = {
  apiKey: "AIzaSyCm4Km4SnsUz5UTlIBqnu3zYElx25gQ5yk",
  authDomain: "device-managament.firebaseapp.com",
  projectId: "device-managament",
  storageBucket: "device-managament.firebasestorage.app",
  messagingSenderId: "323652781161",
  appId: "1:323652781161:web:c4d0d5bbe468e31d64cef8",
  measurementId: "G-YPEQW337DY"
};
// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Firestore Service
const db = getFirestore(app);

export { db };
