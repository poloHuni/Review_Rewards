// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCVBJx9gtlSsme4tfb7hb-bl12aNf4SW7g",
  authDomain: "review-system-2000.firebaseapp.com",
  projectId: "review-system-2000",
  storageBucket: "review-system-2000.firebasestorage.app",
  messagingSenderId: "579451043474",
  appId: "1:579451043474:web:d7c6a8a6dc1a58c4b6304b",
  measurementId: "G-0TGE0NLKT5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;