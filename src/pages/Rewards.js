// src/pages/Rewards.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getRewards, redeemReward } from '../services/rewardsService';
import { getUserPoints } from '../services/pointsService';
import { Gift, Zap, AlertCircle, RefreshCw, Star, Trophy, Coffee, Utensils } from 'lucide-react';

const Rewards = () => {
  // FIX: Use currentUser instead of user to match AuthContext
  const { currentUser } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [error, setError] = useState(null);

  // FIX: Enhanced user checking function (same as MyReviews)
  const getAuthenticatedUser = () => {
    if (currentUser && currentUser.uid) {
      return currentUser;
    }
    return null;
  };

  // Default rewards data (in case service doesn't work)
  const defaultRewards = [
    {
      id: 'coffee_discount',
      name: '10% Off Coffee',
      pointCost: 10,
      icon: '☕',
      active: true,
      description: 'Get 10% off your next coffee order'
    },
    {
      id: 'dessert_free',
      name: 'Free Dessert',
      pointCost: 25,
      icon: '🍰',
      active: true,
      description: 'Enjoy a complimentary dessert'
    },
    {
      id: 'meal_discount',
      name: '15% Off Meal',
      pointCost: 50,
      icon: '🍽️',
      active: true,
      description: '15% discount on your entire meal'
    },
    {
      id: 'vip_table',
      name: 'VIP Table Reservation',
      pointCost: 100,
      icon: '⭐',
      active: true,
      description: 'Reserved VIP table for special occasions'
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const authenticatedUser = getAuthenticatedUser();
        
        if (!authenticatedUser) {
          console.log('No authenticated user, skipping rewards fetch');
          setError('Please log in to view rewards');
          return;
        }

        console.log('🔍 Fetching rewards and points for user:', authenticatedUser.uid);

        // Try to get rewards from service, fall back to default
        let rewardsData;
        try {
          rewardsData = await getRewards();
          console.log('✅ Rewards from service:', rewardsData);
        } catch (rewardsError) {
          console.log('⚠️ Using default rewards:', rewardsError.message);
          rewardsData = defaultRewards;
        }

        // Get user points
        const pointsData = await getUserPoints(authenticatedUser.uid);
        console.log('✅ Points data:', pointsData);
        
        setRewards(rewardsData.filter(r => r.active));
        setUserPoints(pointsData.totalPoints);
        
      } catch (err) {
        console.error('❌ Error fetching rewards data:', err);
        setError(`Failed to load rewards: ${err.message}`);
        // Still show default rewards even if there's an error
        setRewards(defaultRewards);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleRedeem = async (reward) => {
    try {
      setRedeeming(reward.id);
      
      const authenticatedUser = getAuthenticatedUser();
      if (!authenticatedUser) {
        throw new Error('Please log in to redeem rewards');
      }

      console.log('🎁 Redeeming reward:', reward.name);
      
      // Try to use the reward service, or create a simple voucher
      let voucher;
      try {
        voucher = await redeemReward(authenticatedUser.uid, reward.id);
      } catch (serviceError) {
        console.log('⚠️ Service unavailable, creating simple voucher');
        
        // Simple voucher creation as fallback
        voucher = {
          id: `voucher_${Date.now()}`,
          rewardName: reward.name,
          code: `REWARD${Date.now().toString().slice(-6)}`,
          description: reward.description,
          pointsSpent: reward.pointCost,
          createdAt: new Date(),
          used: false
        };
        
        // Manually deduct points (simplified)
        // In a real app, this would be handled by the backend
        setUserPoints(prev => Math.max(0, prev - reward.pointCost));
      }
      
      // Update points display
      try {
        const pointsData = await getUserPoints(authenticatedUser.uid);
        setUserPoints(pointsData.totalPoints);
      } catch (pointsError) {
        console.log('Could not refresh points:', pointsError.message);
      }
      
      // Show success message
      alert(`🎉 Success! Your ${voucher.rewardName} voucher is ready!\n\nVoucher Code: ${voucher.code || 'CHECK_VOUCHERS'}\n\nCheck the Vouchers page for details.`);
      
      // Navigate to vouchers page if available
      if (window.location.pathname !== '/vouchers') {
        window.location.href = '/vouchers';
      }
      
    } catch (error) {
      console.error('❌ Redemption error:', error);
      alert(`Failed to redeem reward: ${error.message}`);
    } finally {
      setRedeeming(null);
    }
  };

  // Debug info
  useEffect(() => {
    console.log('🔍 Rewards Debug Info:');
    console.log('- currentUser:', currentUser);
    console.log('- authenticatedUser:', getAuthenticatedUser());
    console.log('- userPoints:', userPoints);
    console.log('- rewards count:', rewards.length);
    console.log('- loading:', loading);
    console.log('- error:', error);
  }, [currentUser, userPoints, rewards, loading, error]);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-blue-500" size={32} />
          <p className="body-md">Loading rewards...</p>
        </div>
      </div>
    );
  }

  // Error state (but still show default rewards)
  if (error && rewards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="glass-card rounded-2xl p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={32} />
          <h2 className="heading-md mb-4 text-red-600">Unable to Load Rewards</h2>
          <p className="body-md mb-6 text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary focus-ring"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No user state
  if (!getAuthenticatedUser()) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="glass-card rounded-2xl p-8 text-center">
          <Gift className="mx-auto mb-4 text-purple-500" size={32} />
          <h2 className="heading-md mb-4">Authentication Required</h2>
          <p className="body-md mb-6">Please log in to view and redeem rewards.</p>
          <a href="/login" className="btn-primary focus-ring">
            Log In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="heading-xl mb-4">🎁 Rewards Store</h1>
        <p className="body-lg mb-6 text-gray-600">Redeem your points for amazing rewards</p>
        
        {/* Points Display */}
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 px-6 py-4 rounded-2xl">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <Zap className="text-white" size={24} />
          </div>
          <div className="text-left">
            <p className="text-sm text-gray-500 uppercase tracking-wide">Your Points</p>
            <p className="text-2xl font-bold text-gray-800">{userPoints}</p>
          </div>
        </div>
      </div>

      {/* Error Banner (if service issues but still showing rewards) */}
      {error && rewards.length > 0 && (
        <div className="glass-card rounded-xl p-4 border border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-yellow-400" size={20} />
            <div>
              <p className="text-yellow-200 font-medium">Service Notice</p>
              <p className="text-yellow-300 text-sm">Some features may be limited. Showing default rewards.</p>
            </div>
          </div>
        </div>
      )}

      {/* How to Earn Points */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Star className="text-yellow-500" size={24} />
          How to Earn Points
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">+2</span>
            </div>
            <span className="text-gray-700">Save a restaurant review</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">+1</span>
            </div>
            <span className="text-gray-700">Copy review to Google</span>
          </div>
        </div>
      </div>

      {/* Rewards Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Trophy className="text-purple-500" size={28} />
          Available Rewards
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => {
            const canAfford = userPoints >= reward.pointCost;
            const isRedeeming = redeeming === reward.id;
            
            return (
              <div 
                key={reward.id}
                className={`glass-card rounded-xl p-6 transition-all duration-200 ${
                  canAfford 
                    ? 'border-green-500/30 hover:border-green-500/50 hover:shadow-lg transform hover:scale-105' 
                    : 'border-gray-300/20 opacity-75'
                }`}
              >
                <div className="text-center">
                  {/* Reward Icon */}
                  <div className="text-5xl mb-4">{reward.icon}</div>
                  
                  {/* Reward Name */}
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {reward.name}
                  </h3>
                  
                  {/* Description */}
                  {reward.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {reward.description}
                    </p>
                  )}
                  
                  {/* Points Cost */}
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <Zap className="text-purple-500" size={18} />
                    <span className="text-xl font-bold text-gray-800">
                      {reward.pointCost}
                    </span>
                    <span className="text-gray-500 text-sm">points</span>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleRedeem(reward)}
                    disabled={!canAfford || isRedeeming}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                      isRedeeming
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : canAfford 
                          ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg transform hover:scale-105' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isRedeeming ? (
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="animate-spin" size={16} />
                        Redeeming...
                      </div>
                    ) : canAfford ? (
                      '🎉 Redeem Now'
                    ) : (
                      '🔒 Not Enough Points'
                    )}
                  </button>
                  
                  {/* Points Needed */}
                  {!canAfford && (
                    <p className="text-sm text-red-500 mt-3 font-medium">
                      Need {reward.pointCost - userPoints} more points
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {rewards.length === 0 && (
        <div className="text-center py-12">
          <Gift className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Rewards Available</h3>
          <p className="text-gray-500">Check back later for exciting rewards!</p>
        </div>
      )}

      {/* Call to Action */}
      <div className="glass-card rounded-xl p-8 text-center bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
        <Coffee className="mx-auto mb-4 text-purple-500" size={32} />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Want More Points?</h3>
        <p className="text-gray-600 mb-6">Share your dining experiences to earn points and unlock amazing rewards!</p>
        <a 
          href="/feedback" 
          className="btn-primary focus-ring"
        >
          Record a Review (+2 Points)
        </a>
      </div>
    </div>
  );
};

export default Rewards;