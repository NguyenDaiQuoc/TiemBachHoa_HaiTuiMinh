// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDU2I_4bDFPGnAocp2mq_jK6UO0RFa8kNQ",
  authDomain: "tiembachhoa-haituiminh.firebaseapp.com",
  projectId: "tiembachhoa-haituiminh",
  storageBucket: "tiembachhoa-haituiminh.firebasestorage.app",
  messagingSenderId: "545584619256",
  appId: "1:545584619256:web:49d9c18249a76f03a7e50d",
  measurementId: "G-ZCS3EVRSEL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
// Export Firebase Storage instance so other modules can import { storage }
export const storage = getStorage(app);
// Export apiKey for diagnostic/test purposes only (do not leak in production logs)
export const firebaseApiKey = firebaseConfig.apiKey;

// Initialize ADMIN app với tên riêng để tránh conflict auth với user
const adminApp = initializeApp(firebaseConfig, 'admin');
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);