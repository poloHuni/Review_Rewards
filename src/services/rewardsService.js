// src/services/rewardsService.js
import { doc, updateDoc, getDoc, increment, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

// Default rewards (owners can customize these)
export const DEFAULT_REWARDS = [
  { id: 1, name: 'Free Coffee', pointCost: 30, category: 'beverage', active: true, icon: '☕' },
  { id: 2, name: 'Free Dessert', pointCost: 60, category: 'food', active: true, icon: '🍰' },
  { id: 3, name: '10% Discount', pointCost: 100, category: 'discount', active: true, icon: '💰' },
  { id: 4, name: 'Free Appetizer', pointCost: 120, category: 'food', active: true, icon: '🥗' },
  { id: 5, name: 'Free Main Course', pointCost: 250, category: 'food', active: true, icon: '🍽️' }
];

// Get available rewards for a restaurant
export const getRewards = async (restaurantId = 'default_restaurant') => {
  try {
    const rewardsDoc = await getDoc(doc(db, 'restaurantSettings', restaurantId));
    
    if (rewardsDoc.exists() && rewardsDoc.data().rewards) {
      return rewardsDoc.data().rewards;
    }
    
    // Return default rewards if none set
    return DEFAULT_REWARDS;
  } catch (error) {
    console.error('Error getting rewards:', error);
    return DEFAULT_REWARDS;
  }
};

// Redeem a reward (create voucher)
export const redeemReward = async (userId, rewardId, restaurantId = 'default_restaurant') => {
  try {
    // Get user's current points
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    const currentPoints = userData?.totalPoints || 0;
    
    // Get reward details
    const rewards = await getRewards(restaurantId);
    const reward = rewards.find(r => r.id === rewardId);
    
    if (!reward) {
      throw new Error('Reward not found');
    }
    
    if (currentPoints < reward.pointCost) {
      throw new Error('Insufficient points');
    }
    
    // Check if user already redeemed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const vouchersQuery = query(
      collection(db, 'vouchers'),
      where('userId', '==', userId),
      where('redeemedAt', '>=', today)
    );
    
    const todayVouchers = await getDocs(vouchersQuery);
    
    if (todayVouchers.size > 0) {
      throw new Error('You can only redeem one reward per day');
    }
    
    // Create voucher
    const voucherCode = generateVoucherCode();
    const expiresAt = new Date();
    expiresAt.setHours(23, 59, 59, 999); // Expires at end of day
    
    const voucherData = {
      userId,
      restaurantId,
      rewardId,
      rewardName: reward.name,
      pointCost: reward.pointCost,
      voucherCode,
      isUsed: false,
      redeemedAt: new Date(),
      expiresAt,
      icon: reward.icon
    };
    
    const voucherRef = await addDoc(collection(db, 'vouchers'), voucherData);
    
    // Deduct points from user
    await updateDoc(doc(db, 'users', userId), {
      totalPoints: increment(-reward.pointCost)
    });
    
    // Log the transaction
    await addDoc(collection(db, 'pointTransactions'), {
      userId,
      action: `Redeemed: ${reward.name}`,
      pointsEarned: -reward.pointCost,
      timestamp: new Date(),
      voucherId: voucherRef.id
    });
    
    return {
      ...voucherData,
      id: voucherRef.id
    };
    
  } catch (error) {
    console.error('Error redeeming reward:', error);
    throw error;
  }
};

// Get user's active vouchers
export const getUserVouchers = async (userId) => {
  try {
    const now = new Date();
    
    const vouchersQuery = query(
      collection(db, 'vouchers'),
      where('userId', '==', userId),
      where('isUsed', '==', false),
      where('expiresAt', '>', now)
    );
    
    const snapshot = await getDocs(vouchersQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user vouchers:', error);
    return [];
  }
};

// Mark voucher as used (for staff)
export const markVoucherAsUsed = async (voucherId) => {
  try {
    await updateDoc(doc(db, 'vouchers', voucherId), {
      isUsed: true,
      usedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error marking voucher as used:', error);
    return false;
  }
};

// Generate simple 4-digit voucher code
const generateVoucherCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// For owners: Update restaurant rewards
export const updateRestaurantRewards = async (restaurantId, rewards) => {
  try {
    await updateDoc(doc(db, 'restaurantSettings', restaurantId), {
      rewards: rewards,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error updating rewards:', error);
    return false;
  }
};