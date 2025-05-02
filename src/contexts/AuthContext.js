// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import firebase from 'firebase/compat/app';

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
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      await user.updateProfile({ displayName: name });
      
      // Create user document in Firestore
      const userId = user.uid;
      await db.collection('users').doc(userId).set({
        user_id: userId,
        username: email.split('@')[0],
        email: email.toLowerCase(),
        phone: phone || '',
        name: name,
        last_login: firebase.firestore.FieldValue.serverTimestamp(),
        registration_date: firebase.firestore.FieldValue.serverTimestamp(),
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
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Update last login time
      await db.collection('users').doc(user.uid).set({
        last_login: firebase.firestore.FieldValue.serverTimestamp()
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
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDoc = await db.collection('users').doc(user.uid).get();
      
      if (!userDoc.exists) {
        // Create new user document
        await db.collection('users').doc(user.uid).set({
          user_id: user.uid,
          username: user.email.split('@')[0],
          email: user.email.toLowerCase(),
          phone: '',
          name: user.displayName || '',
          last_login: firebase.firestore.FieldValue.serverTimestamp(),
          registration_date: firebase.firestore.FieldValue.serverTimestamp(),
          google_id: user.uid,
          picture: user.photoURL || '',
          restaurant_id: restaurantId
        });
      } else {
        // Update last login time
        await db.collection('users').doc(user.uid).set({
          last_login: firebase.firestore.FieldValue.serverTimestamp(),
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
    return auth.signOut();
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Get user data from Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
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