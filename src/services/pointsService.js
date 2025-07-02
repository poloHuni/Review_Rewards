// src/services/pointsService.js
import { doc, updateDoc, getDoc, increment, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Points configuration
export const POINTS_CONFIG = {
  SAVE_FEEDBACK: 2,
  COPY_TO_GOOGLE: 1,
  DAILY_LIMIT: 1 // Max reviews per day
};

// Check if user can earn points today
export const canEarnPointsToday = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    if (!userData) return true;
    
    const lastReviewDate = userData.lastReviewDate?.toDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!lastReviewDate) return true;
    
    const lastReviewDay = new Date(lastReviewDate);
    lastReviewDay.setHours(0, 0, 0, 0);
    
    return today.getTime() !== lastReviewDay.getTime();
  } catch (error) {
    console.error('Error checking daily limit:', error);
    return true; // Default to allowing points on error
  }
};

// Award points to user
export const awardPoints = async (userId, pointsToAdd, action) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Update user points and last review date
    await updateDoc(userRef, {
      totalPoints: increment(pointsToAdd),
      lastReviewDate: new Date(),
      reviewsToday: increment(1)
    });
    
    // Log the transaction
    await addDoc(collection(db, 'pointTransactions'), {
      userId,
      action,
      pointsEarned: pointsToAdd,
      timestamp: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error awarding points:', error);
    return false;
  }
};

// Get user's current points
export const getUserPoints = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    return {
      totalPoints: userData?.totalPoints || 0,
      canEarnToday: await canEarnPointsToday(userId),
      reviewsToday: userData?.reviewsToday || 0
    };
  } catch (error) {
    console.error('Error getting user points:', error);
    return { totalPoints: 0, canEarnToday: true, reviewsToday: 0 };
  }
};

// Reset daily counters (can be called by a scheduled function)
export const resetDailyCounters = async () => {
  // This would typically be done by a cloud function
  // For now, we rely on date comparison in canEarnPointsToday
};

// Get points needed for next reward
export const getNextRewardInfo = (currentPoints, rewards) => {
  const nextReward = rewards
    .filter(reward => reward.active && reward.pointCost > currentPoints)
    .sort((a, b) => a.pointCost - b.pointCost)[0];
    
  if (!nextReward) return null;
  
  return {
    name: nextReward.name,
    pointsNeeded: nextReward.pointCost - currentPoints,
    totalCost: nextReward.pointCost
  };
};