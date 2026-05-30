import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO(karasi): Firebase コンソールから設定値を取得して .env.local に記入してください
// .env.local に以下の変数を追加:
//   VITE_FIREBASE_API_KEY=xxx
//   VITE_FIREBASE_AUTH_DOMAIN=xxx
//   VITE_FIREBASE_PROJECT_ID=xxx
//   VITE_FIREBASE_STORAGE_BUCKET=xxx
//   VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
//   VITE_FIREBASE_APP_ID=xxx

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
