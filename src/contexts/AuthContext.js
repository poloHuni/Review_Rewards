// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const OWNER_EMAIL = "natnaelgebremichaeltewelde@gmail.com";

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  async function register(name, email, password, phone, restaurantId = 'default_restaurant') {
    try {
      setError('');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      await updateProfile(user, { displayName: name });
      
      // Create user document in Firestore
      const userId = user.uid;
      await setDoc(doc(db, 'users', userId), {
        user_id: userId,
        username: email.split('@')[0],
        email: email.toLowerCase(),
        phone: phone || '',
        name: name,
        last_login: serverTimestamp(),
        registration_date: serverTimestamp(),
        restaurant_id: restaurantId
      });
      
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function login(email, password) {
    try {
      setError('');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update last login time
      await setDoc(doc(db, 'users', user.uid), {
        last_login: serverTimestamp()
      }, { merge: true });
      
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function googleSignIn(restaurantId = 'default_restaurant') {
    try {
      setError('');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Create new user document
        await setDoc(userRef, {
          user_id: user.uid,
          username: user.email.split('@')[0],
          email: user.email.toLowerCase(),
          phone: '',
          name: user.displayName || '',
          last_login: serverTimestamp(),
          registration_date: serverTimestamp(),
          google_id: user.uid,
          picture: user.photoURL || '',
          restaurant_id: restaurantId
        });
      } else {
        // Update last login time
        await setDoc(userRef, {
          last_login: serverTimestamp(),
          restaurant_id: restaurantId
        }, { merge: true });
      }
      
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get user data from Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          // Check if user is the owner
          setIsOwner(userData.email && userData.email.toLowerCase() === OWNER_EMAIL.toLowerCase());
          setCurrentUser({ ...user, ...userData });
        } else {
          setCurrentUser(user);
          setIsOwner(user.email && user.email.toLowerCase() === OWNER_EMAIL.toLowerCase());
        }
      } else {
        setCurrentUser(null);
        setIsOwner(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isOwner,
    loading,
    error,
    login,
    register,
    googleSignIn,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}