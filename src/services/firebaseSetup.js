// src/services/firebaseSetup.js
// Firebase setup functions for the points system
// Run these functions once to initialize your points system

import { 
  doc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  writeBatch,
  getDoc,
  increment 
} from 'firebase/firestore';
import { db } from '../firebase/config';

// ==========================================
// 1. INITIALIZE USER POINTS
// ==========================================
// Call this when a new user signs up or for existing users

export const initializeUserPoints = async (userId, existingUserData = {}) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Check if user document exists
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // User exists, just add points fields if they don't have them
      const userData = userDoc.data();
      const updateData = {};
      
      if (!userData.hasOwnProperty('totalPoints')) {
        updateData.totalPoints = 0;
      }
      if (!userData.hasOwnProperty('reviewsToday')) {
        updateData.reviewsToday = 0;
      }
      if (!userData.hasOwnProperty('lastReviewDate')) {
        updateData.lastReviewDate = null;
      }
      
      if (Object.keys(updateData).length > 0) {
        await updateDoc(userRef, updateData);
        console.log('✅ Added points fields to existing user:', userId);
      } else {
        console.log('✅ User already has points fields:', userId);
      }
    } else {
      // User doesn't exist, create new document
      await setDoc(userRef, {
        ...existingUserData,
        totalPoints: 0,
        reviewsToday: 0,
        lastReviewDate: null,
        createdAt: new Date()
      });
      console.log('✅ Created new user document with points:', userId);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing user points:', error);
    return false;
  }
};

// ==========================================
// 2. INITIALIZE DEFAULT REWARDS
// ==========================================
// Run this ONCE to set up your rewards catalog

export const initializeRestaurantRewards = async (restaurantId = 'default_restaurant') => {
  try {
    const restaurantRef = doc(db, 'restaurantSettings', restaurantId);
    
    // Check if rewards already exist
    const existingDoc = await getDoc(restaurantRef);
    
    if (existingDoc.exists()) {
      console.log('✅ Rewards already exist for restaurant:', restaurantId);
      return true;
    }
    
    const defaultRewards = [
      { 
        id: 1, 
        name: 'Free Coffee', 
        pointCost: 30, 
        category: 'beverage', 
        active: true, 
        icon: '☕' 
      },
      { 
        id: 2, 
        name: 'Free Dessert', 
        pointCost: 60, 
        category: 'food', 
        active: true, 
        icon: '🍰' 
      },
      { 
        id: 3, 
        name: '10% Discount', 
        pointCost: 100, 
        category: 'discount', 
        active: true, 
        icon: '💰' 
      },
      { 
        id: 4, 
        name: 'Free Appetizer', 
        pointCost: 120, 
        category: 'food', 
        active: true, 
        icon: '🥗' 
      },
      { 
        id: 5, 
        name: 'Free Main Course', 
        pointCost: 250, 
        category: 'food', 
        active: true, 
        icon: '🍽️' 
      }
    ];
    
    await setDoc(restaurantRef, {
      rewards: defaultRewards,
      updatedAt: new Date(),
      createdAt: new Date()
    });
    
    console.log('✅ Default rewards initialized for restaurant:', restaurantId);
    console.log('📋 Created', defaultRewards.length, 'default rewards');
    return true;
    
  } catch (error) {
    console.error('❌ Error initializing restaurant rewards:', error);
    return false;
  }
};

// ==========================================
// 3. UPDATE ALL EXISTING USERS WITH POINTS
// ==========================================
// Run this ONCE to add points fields to all existing users

export const updateExistingUsersWithPoints = async () => {
  try {
    console.log('🔄 Starting bulk update of existing users...');
    
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    if (snapshot.empty) {
      console.log('📭 No users found in database');
      return { success: true, updated: 0, total: 0 };
    }
    
    const batch = writeBatch(db);
    let updateCount = 0;
    let totalUsers = snapshot.docs.length;
    
    snapshot.docs.forEach((docSnap) => {
      const userData = docSnap.data();
      
      // Only update if points fields don't exist
      if (!userData.hasOwnProperty('totalPoints')) {
        const userRef = doc(db, 'users', docSnap.id);
        batch.update(userRef, {
          totalPoints: 0,
          reviewsToday: 0,
          lastReviewDate: null
        });
        updateCount++;
        console.log('📝 Queued update for user:', docSnap.id);
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ Successfully updated ${updateCount} out of ${totalUsers} users with points fields`);
    } else {
      console.log('✅ All users already have points fields');
    }
    
    return { 
      success: true, 
      updated: updateCount, 
      total: totalUsers,
      alreadyUpdated: totalUsers - updateCount
    };
    
  } catch (error) {
    console.error('❌ Error updating existing users:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// 4. TESTING FUNCTIONS
// ==========================================

// Give yourself test points for development
export const addTestPoints = async (userId, points = 100) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Check if user exists first
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      console.log('❌ User not found. Creating user first...');
      await initializeUserPoints(userId);
    }
    
    await updateDoc(userRef, {
      totalPoints: points,
      lastReviewDate: new Date(Date.now() - 86400000), // Yesterday, so you can earn more
      reviewsToday: 0 // Reset so you can earn today
    });
    
    console.log(`✅ Added ${points} test points to user:`, userId);
    console.log('🎯 You can now earn points again today!');
    return true;
    
  } catch (error) {
    console.error('❌ Error adding test points:', error);
    return false;
  }
};

// Reset a user's points (for testing)
export const resetUserPoints = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      totalPoints: 0,
      reviewsToday: 0,
      lastReviewDate: null
    });
    
    console.log('✅ Reset points for user:', userId);
    return true;
    
  } catch (error) {
    console.error('❌ Error resetting user points:', error);
    return false;
  }
};

// Get user's current points status
export const getUserPointsStatus = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('❌ User not found');
      return null;
    }
    
    const userData = userDoc.data();
    const status = {
      totalPoints: userData.totalPoints || 0,
      reviewsToday: userData.reviewsToday || 0,
      lastReviewDate: userData.lastReviewDate,
      hasPointsFields: userData.hasOwnProperty('totalPoints')
    };
    
    console.log('📊 User points status:', status);
    return status;
    
  } catch (error) {
    console.error('❌ Error getting user points status:', error);
    return null;
  }
};

// ==========================================
// 5. SETUP VERIFICATION FUNCTIONS
// ==========================================

// Check if points system is properly set up
export const verifyPointsSystemSetup = async (userId = null) => {
  try {
    console.log('🔍 Verifying points system setup...');
    
    const results = {
      rewards: false,
      userPoints: false,
      collections: {
        users: false,
        restaurantSettings: false,
        pointTransactions: false,
        vouchers: false
      }
    };
    
    // Check if rewards are set up
    try {
      const rewardsRef = doc(db, 'restaurantSettings', 'default_restaurant');
      const rewardsDoc = await getDoc(rewardsRef);
      results.rewards = rewardsDoc.exists();
      results.collections.restaurantSettings = rewardsDoc.exists();
    } catch (error) {
      console.log('⚠️ Restaurant settings collection not accessible');
    }
    
    // Check user points if userId provided
    if (userId) {
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          results.userPoints = userData.hasOwnProperty('totalPoints');
          results.collections.users = true;
        }
      } catch (error) {
        console.log('⚠️ Users collection not accessible');
      }
    }
    
    // Check if other collections exist (they'll be created automatically)
    results.collections.pointTransactions = true; // Created automatically
    results.collections.vouchers = true; // Created automatically
    
    console.log('📋 Setup verification results:', results);
    
    const allGood = results.rewards && (userId ? results.userPoints : true);
    
    if (allGood) {
      console.log('✅ Points system setup verification passed!');
    } else {
      console.log('⚠️ Points system setup incomplete. Run the setup functions.');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Error verifying setup:', error);
    return null;
  }
};

// ==========================================
// 6. COMPLETE SETUP FUNCTION
// ==========================================

// Run this to set up everything at once
export const completePointsSystemSetup = async (currentUserId = null) => {
  try {
    console.log('🚀 Starting complete points system setup...');
    
    // Step 1: Initialize rewards
    console.log('1️⃣ Setting up rewards catalog...');
    const rewardsResult = await initializeRestaurantRewards();
    
    // Step 2: Update existing users
    console.log('2️⃣ Updating existing users...');
    const usersResult = await updateExistingUsersWithPoints();
    
    // Step 3: Initialize current user if provided
    if (currentUserId) {
      console.log('3️⃣ Initializing current user...');
      await initializeUserPoints(currentUserId);
      
      // Give test points
      console.log('4️⃣ Adding test points...');
      await addTestPoints(currentUserId, 150);
    }
    
    // Step 4: Verify setup
    console.log('5️⃣ Verifying setup...');
    const verification = await verifyPointsSystemSetup(currentUserId);
    
    console.log('🎉 Complete setup finished!');
    console.log('📊 Results:', {
      rewards: rewardsResult,
      users: usersResult,
      verification
    });
    
    return {
      success: true,
      rewards: rewardsResult,
      users: usersResult,
      verification
    };
    
  } catch (error) {
    console.error('❌ Error in complete setup:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// 7. HOW TO USE THESE FUNCTIONS
// ==========================================

/*
COPY THIS TO YOUR BROWSER CONSOLE OR A TEST COMPONENT:

// Import the functions:
import { 
  completePointsSystemSetup, 
  addTestPoints, 
  getUserPointsStatus 
} from './services/firebaseSetup';

// Run complete setup (replace 'your-user-id' with your actual user ID):
await completePointsSystemSetup('your-user-id');

// OR run individual functions:

// 1. Set up rewards catalog:
await initializeRestaurantRewards();

// 2. Update existing users:
await updateExistingUsersWithPoints();

// 3. Initialize your account:
await initializeUserPoints('your-user-id');

// 4. Give yourself test points:
await addTestPoints('your-user-id', 200);

// 5. Check your points:
await getUserPointsStatus('your-user-id');

// 6. Verify everything is working:
await verifyPointsSystemSetup('your-user-id');
*/

export default {
  initializeUserPoints,
  initializeRestaurantRewards,
  updateExistingUsersWithPoints,
  addTestPoints,
  resetUserPoints,
  getUserPointsStatus,
  verifyPointsSystemSetup,
  completePointsSystemSetup
};