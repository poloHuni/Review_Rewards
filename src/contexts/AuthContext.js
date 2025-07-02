// src/contexts/AuthContext.js
// Enhanced version with better error handling and state management

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
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const OWNER_EMAIL = "natnaelgebremichaeltewelde@gmail.com";

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  
  // Enhanced debugging state
  const [authDebug, setAuthDebug] = useState({
    lastAuthChange: null,
    authAttempts: 0,
    errors: []
  });

  async function register(name, email, password, phone, restaurantId = 'default_restaurant') {
    try {
      setError('');
      console.log('🔍 Starting registration for:', email);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('✅ User created in Firebase Auth:', user.uid);
      
      // Update profile with display name
      await updateProfile(user, { displayName: name });
      console.log('✅ Profile updated with display name');
      
      // Create user document in Firestore
      const userData = {
        user_id: user.uid,
        uid: user.uid, // Add both for compatibility
        username: email.split('@')[0],
        email: email.toLowerCase(),
        phone: phone || '',
        name: name,
        displayName: name, // Add for compatibility
        last_login: serverTimestamp(),
        registration_date: serverTimestamp(),
        restaurant_id: restaurantId,
        totalPoints: 0,
        reviewsToday: 0,
        created_at: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);
      console.log('✅ User document created in Firestore');
      
      return user;
    } catch (err) {
      console.error('❌ Registration error:', err);
      setError(err.message);
      throw err;
    }
  }

  async function login(email, password) {
    try {
      setError('');
      console.log('🔍 Starting login for:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('✅ User logged in:', user.uid);
      
      // Update last login time
      await setDoc(doc(db, 'users', user.uid), {
        last_login: serverTimestamp()
      }, { merge: true });
      
      console.log('✅ Last login updated');
      
      return user;
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.message);
      throw err;
    }
  }

  async function googleSignIn(restaurantId = 'default_restaurant') {
    try {
      setError('');
      console.log('🔍 Starting Google sign-in');
      
      const provider = new GoogleAuthProvider();
      // Add additional scopes if needed
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      console.log('✅ Google sign-in successful:', user.uid);
      
      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      const userData = {
        user_id: user.uid,
        uid: user.uid, // Add both for compatibility
        username: user.email.split('@')[0],
        email: user.email.toLowerCase(),
        phone: '',
        name: user.displayName || '',
        displayName: user.displayName || '', // Add for compatibility
        last_login: serverTimestamp(),
        google_id: user.uid,
        picture: user.photoURL || '',
        restaurant_id: restaurantId
      };
      
      if (!userSnap.exists()) {
        // Create new user document
        userData.registration_date = serverTimestamp();
        userData.totalPoints = 0;
        userData.reviewsToday = 0;
        userData.created_at = serverTimestamp();
        
        await setDoc(userRef, userData);
        console.log('✅ New Google user document created');
      } else {
        // Update existing user
        await setDoc(userRef, userData, { merge: true });
        console.log('✅ Existing Google user updated');
      }
      
      return user;
    } catch (err) {
      console.error('❌ Google sign-in error:', err);
      setError(err.message);
      throw err;
    }
  }

  function logout() {
    console.log('🔍 Starting logout');
    return signOut(auth);
  }

  // Enhanced auth state change handler
  useEffect(() => {
    console.log('🔍 Setting up enhanced auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        console.log('🔥 Enhanced Auth State Change:', {
          hasUser: !!user,
          uid: user?.uid,
          email: user?.email,
          emailVerified: user?.emailVerified,
          displayName: user?.displayName,
          timestamp: new Date().toISOString()
        });
        
        setAuthDebug(prev => ({
          ...prev,
          lastAuthChange: new Date().toISOString(),
          authAttempts: prev.authAttempts + 1
        }));
        
        if (user) {
          try {
            // Get user data from Firestore
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            
            let userData = null;
            
            if (userSnap.exists()) {
              userData = userSnap.data();
              console.log('✅ User data loaded from Firestore');
            } else {
              console.log('⚠️ No Firestore document found, using Auth data only');
              
              // Create minimal Firestore document if missing
              const minimalUserData = {
                user_id: user.uid,
                uid: user.uid,
                email: user.email?.toLowerCase() || '',
                name: user.displayName || '',
                displayName: user.displayName || '',
                last_login: serverTimestamp(),
                created_at: serverTimestamp(),
                totalPoints: 0,
                reviewsToday: 0,
                restaurant_id: 'default_restaurant'
              };
              
              await setDoc(userRef, minimalUserData);
              userData = minimalUserData;
              console.log('✅ Created minimal Firestore document');
            }
            
            // Check if user is the owner
            const userIsOwner = userData?.email && 
              userData.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
            setIsOwner(userIsOwner);
            
            // Combine Firebase Auth user with Firestore data
            const combinedUser = {
              ...user, // Firebase Auth properties
              ...userData, // Firestore properties
              // Ensure critical properties are available
              uid: user.uid,
              user_id: user.uid,
              email: user.email,
              displayName: user.displayName || userData?.name || ''
            };
            
            setCurrentUser(combinedUser);
            console.log('✅ Combined user data set:', {
              uid: combinedUser.uid,
              email: combinedUser.email,
              isOwner: userIsOwner
            });
            
          } catch (firestoreError) {
            console.error('❌ Firestore error during auth state change:', firestoreError);
            
            // Fall back to using just Firebase Auth data
            setCurrentUser({
              ...user,
              uid: user.uid,
              user_id: user.uid,
              email: user.email,
              displayName: user.displayName || ''
            });
            setIsOwner(user.email && user.email.toLowerCase() === OWNER_EMAIL.toLowerCase());
            
            setAuthDebug(prev => ({
              ...prev,
              errors: [...prev.errors, {
                timestamp: new Date().toISOString(),
                error: firestoreError.message,
                type: 'firestore'
              }]
            }));
          }
        } else {
          console.log('❌ No authenticated user');
          setCurrentUser(null);
          setIsOwner(false);
        }
      } catch (authError) {
        console.error('❌ Critical auth state change error:', authError);
        setCurrentUser(null);
        setIsOwner(false);
        
        setAuthDebug(prev => ({
          ...prev,
          errors: [...prev.errors, {
            timestamp: new Date().toISOString(),
            error: authError.message,
            type: 'auth'
          }]
        }));
      } finally {
        setLoading(false);
      }
    });

    return () => {
      console.log('🔍 Cleaning up enhanced auth listener');
      unsubscribe();
    };
  }, []);

  // Debug effect to log auth state changes
  useEffect(() => {
    if (!loading) {
      console.log('🔍 Auth state finalized:', {
        hasUser: !!currentUser,
        userUid: currentUser?.uid,
        userEmail: currentUser?.email,
        isOwner,
        loading,
        debugInfo: authDebug
      });
    }
  }, [currentUser, isOwner, loading, authDebug]);

  const value = {
    currentUser,
    isOwner,
    loading,
    error,
    authDebug, // Include debug info for troubleshooting
    login,
    register,
    googleSignIn,
    logout,
    // Helper function to get clean user object for Firestore operations
    getCleanUser: () => {
      if (!currentUser) return null;
      
      return {
        uid: currentUser.uid,
        user_id: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || currentUser.name || '',
        photoURL: currentUser.photoURL || ''
      };
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}