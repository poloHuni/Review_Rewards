// src/firebase/config.js
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "review-system-2000",
  privateKey: process.env.REACT_APP_FIREBASE_PRIVATE_KEY,
  clientEmail: process.env.REACT_APP_FIREBASE_CLIENT_EMAIL,
  clientId: process.env.REACT_APP_FIREBASE_CLIENT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "review-ai-storage",
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export Firebase services
export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();

export default firebase;