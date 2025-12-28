// Minimal Firebase app initializer used by split modules
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyDU2I_4bDFPGnAocp2mq_jK6UO0RFa8kNQ",
  authDomain: "tiembachhoa-haituiminh.firebaseapp.com",
  projectId: "tiembachhoa-haituiminh",
  storageBucket: "tiembachhoa-haituiminh.firebasestorage.app",
  messagingSenderId: "545584619256",
  appId: "1:545584619256:web:49d9c18249a76f03a7e50d",
  measurementId: "G-ZCS3EVRSEL"
};

export const app = initializeApp(firebaseConfig);
export const firebaseApiKey = firebaseConfig.apiKey;
