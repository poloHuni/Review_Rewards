// src/pages/Rewards.js - Fixed Import Path
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext'; // ✅ Fixed: added 's' to contexts
import { getRewards, redeemReward } from '../services/rewardsService';
import { getUserPoints } from '../services/pointsService';
import { Gift, Zap, AlertCircle } from 'lucide-react';

const Rewards = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const [rewardsData, pointsData] = await Promise.all([
          getRewards(),
          getUserPoints(user.uid)
        ]);
        
        setRewards(rewardsData.filter(r => r.active));
        setUserPoints(pointsData.totalPoints);
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleRedeem = async (rewardId) => {
    try {
      setRedeeming(rewardId);
      const voucher = await redeemReward(user.uid, rewardId);
      
      // Update points
      const pointsData = await getUserPoints(user.uid);
      setUserPoints(pointsData.totalPoints);
      
      // Show success and redirect to vouchers
      alert(`Success! Your ${voucher.rewardName} voucher is ready!`);
      window.location.href = '/vouchers';
      
    } catch (error) {
      alert(error.message);
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) return <div className="text-center py-8">Loading rewards...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="heading-xl">Rewards Store</h1>
        <p className="body-lg mb-4">Redeem your points for amazing rewards</p>
        
        <div className="inline-flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-full">
          <Zap className="text-purple-400" size={20} />
          <span className="text-white font-semibold">{userPoints} Points</span>
        </div>
      </div>

      {/* Daily Limit Notice */}
      <div className="glass-card rounded-xl p-4 border border-yellow-500/20 bg-yellow-500/5">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-yellow-400" size={20} />
          <div>
            <p className="text-yellow-200 font-medium">Daily Limit</p>
            <p className="text-yellow-300 text-sm">You can redeem one reward per day</p>
          </div>
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards.map((reward) => {
          const canAfford = userPoints >= reward.pointCost;
          const isRedeeming = redeeming === reward.id;
          
          return (
            <div 
              key={reward.id}
              className={`glass-card rounded-xl p-6 transition-all ${
                canAfford ? 'border-green-500/20 hover:border-green-500/40' : 'border-gray-500/20'
              }`}
            >
              <div className="text-center">
                <div className="text-4xl mb-3">{reward.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{reward.name}</h3>
                
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Zap className="text-purple-400" size={16} />
                  <span className="text-lg font-bold text-white">{reward.pointCost}</span>
                  <span className="text-slate-300 text-sm">points</span>
                </div>

                <button
                  onClick={() => handleRedeem(reward.id)}
                  disabled={!canAfford || isRedeeming}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    canAfford 
                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isRedeeming ? 'Redeeming...' : canAfford ? 'Redeem Now' : 'Not Enough Points'}
                </button>
                
                {!canAfford && (
                  <p className="text-sm text-red-400 mt-2">
                    Need {reward.pointCost - userPoints} more points
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Rewards;