// src/pages/Rewards.js - Enhanced Neumorphic Design
// EXACT SAME FUNCTIONALITY - ONLY VISUAL DESIGN CHANGED
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRewards, redeemReward } from '../services/rewardsService';
import { getUserPoints } from '../services/pointsService';
import { 
  GiftIcon, 
  CoffeeIcon, 
  CakeIcon, 
  UtensilsIcon, 
  StarIcon, 
  PercentIcon,
  CupSodaIcon,
  SparklesIcon,
  CoinsIcon,
  LoaderIcon,
  AlertTriangleIcon,
  RefreshCcwIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  LockIcon,
  ClockIcon
} from 'lucide-react';

const Rewards = () => {
  // EXACT SAME STATE MANAGEMENT AS ORIGINAL
  const { currentUser } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [error, setError] = useState(null);

  // EXACT SAME HELPER FUNCTION AS ORIGINAL
  const getAuthenticatedUser = () => {
    if (currentUser && currentUser.uid) {
      return currentUser;
    }
    return null;
  };

  // EXACT SAME DEFAULT REWARDS AS ORIGINAL
  const defaultRewards = [
    {
      id: 'coffee_discount',
      name: '10% Off Coffee',
      pointCost: 10,
      icon: 'coffee',
      active: true,
      description: 'Get 10% off your next coffee order'
    },
    {
      id: 'dessert_free',
      name: 'Free Dessert',
      pointCost: 25,
      icon: 'cake',
      active: true,
      description: 'Enjoy a complimentary dessert'
    },
    {
      id: 'appetizer_free',
      name: 'Free Appetizer',
      pointCost: 40,
      icon: 'salad',
      active: true,
      description: 'Start your meal with a free appetizer'
    },
    {
      id: 'meal_discount',
      name: '15% Off Meal',
      pointCost: 50,
      icon: 'utensils',
      active: true,
      description: '15% discount on your entire meal'
    },
    {
      id: 'drink_upgrade',
      name: 'Free Drink Upgrade',
      pointCost: 15,
      icon: 'cup-soda',
      active: true,
      description: 'Upgrade to premium beverages'
    },
    {
      id: 'vip_table',
      name: 'VIP Table Reservation',
      pointCost: 100,
      icon: 'star',
      active: true,
      description: 'Reserved VIP table for special occasions'
    }
  ];

  // Icon mapping for neumorphic icons
  const getRewardIcon = (iconName) => {
    const iconMap = {
      'coffee': CoffeeIcon,
      'cake': CakeIcon,
      'dessert': CakeIcon,
      'salad': UtensilsIcon,
      'appetizer': UtensilsIcon,
      'utensils': UtensilsIcon,
      'meal': UtensilsIcon,
      'cup-soda': CupSodaIcon,
      'drink': CupSodaIcon,
      'star': StarIcon,
      'vip': StarIcon,
      'percent': PercentIcon,
      'discount': PercentIcon,
      'gift': GiftIcon
    };
    
    return iconMap[iconName] || GiftIcon;
  };

  // EXACT SAME DATA FETCHING LOGIC AS ORIGINAL
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
        setRewards(defaultRewards.filter(r => r.active));
        setUserPoints(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // EXACT SAME REDEEM REWARD LOGIC AS ORIGINAL
  const handleRedeem = async (reward) => {
    const authenticatedUser = getAuthenticatedUser();
    if (!authenticatedUser) {
      alert('Please log in to redeem rewards');
      return;
    }

    if (!canAfford(reward.pointCost)) {
      alert(`You need ${getPointsNeeded(reward.pointCost)} more points to redeem this reward.`);
      return;
    }

    setRedeeming(reward.id);

    try {
      console.log('🎯 Attempting to redeem reward:', reward.name);
      
      let voucher;
      try {
        // Primary method: Use the service
        voucher = await redeemReward(authenticatedUser.uid, reward.id);
        console.log('✅ Reward redeemed via service:', voucher);
      } catch (serviceError) {
        console.log('⚠️ Service redemption failed, trying fallback:', serviceError.message);
        
        // Fallback method: Create voucher directly
        try {
          const { addDoc, collection, updateDoc, doc, increment } = await import('firebase/firestore');
          const { db } = await import('../firebase/config');
          
          const voucherCode = `FOOD${Date.now().toString().slice(-6)}`;
          const expiresAt = new Date();
          expiresAt.setHours(23, 59, 59, 999);
          
          const voucherData = {
            userId: authenticatedUser.uid,
            restaurantId: 'default_restaurant',
            rewardId: reward.id,
            rewardName: reward.name,
            pointCost: reward.pointCost,
            voucherCode,
            isUsed: false,
            redeemedAt: new Date(),
            expiresAt,
            icon: reward.icon
          };
          
          // Save to Firestore
          const voucherRef = await addDoc(collection(db, 'vouchers'), voucherData);
          console.log('✅ Fallback voucher saved to database:', voucherRef.id);
          
          // Deduct points from user in database
          await updateDoc(doc(db, 'users', authenticatedUser.uid), {
            totalPoints: increment(-reward.pointCost)
          });
          console.log('✅ Points deducted from database');
          
          // Create voucher object for response
          voucher = {
            ...voucherData,
            id: voucherRef.id,
            code: voucherCode
          };
          
        } catch (fallbackError) {
          console.error('❌ Fallback voucher creation failed:', fallbackError);
          
          // If even the fallback fails, create memory-only voucher
          voucher = {
            id: `voucher_${Date.now()}`,
            rewardName: reward.name,
            code: `FOOD${Date.now().toString().slice(-6)}`,
            description: reward.description,
            pointsSpent: reward.pointCost,
            createdAt: new Date(),
            used: false
          };
          
          // Manually deduct points locally only
          setUserPoints(prev => Math.max(0, prev - reward.pointCost));
        }
      }
      
      // Update points display
      try {
        const pointsData = await getUserPoints(authenticatedUser.uid);
        setUserPoints(pointsData.totalPoints);
      } catch (pointsError) {
        console.log('Could not refresh points:', pointsError.message);
      }
      
      // Show success message with custom styling
      alert(`🎉 Congratulations!\n\nYour ${voucher.rewardName} is ready!\n\n🎫 Voucher Code: ${voucher.code || 'REWARD_CODE'}\n\nShow this code to staff to redeem your reward!`);
      
    } catch (error) {
      console.error('❌ Redemption error:', error);
      alert(`Failed to redeem reward: ${error.message}`);
    } finally {
      setRedeeming(null);
    }
  };

  // EXACT SAME HELPER FUNCTIONS AS ORIGINAL
  const getPointsNeeded = (cost) => {
    return Math.max(0, cost - userPoints);
  };

  const canAfford = (cost) => {
    return userPoints >= cost;
  };

  // LOADING STATE - NEUMORPHIC DESIGN
  if (loading) {
    return (
      <div className="neuro-rewards-page">
        <div className="neuro-container">
          <div className="neuro-loading-container">
            <div className="neuro-loading-card">
              <div className="neuro-loading-icon">
                <LoaderIcon size={32} className="neuro-spin" />
              </div>
              <h2 className="neuro-loading-title">Loading Your Delicious Rewards</h2>
              <p className="neuro-loading-text">Preparing tasty treats just for you...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ERROR STATE - NEUMORPHIC DESIGN
  if (error && rewards.length === 0) {
    return (
      <div className="neuro-rewards-page">
        <div className="neuro-container">
          <div className="neuro-error-container">
            <div className="neuro-error-card">
              <div className="neuro-error-icon">
                <AlertTriangleIcon size={48} />
              </div>
              <h2 className="neuro-error-title">Oops! Something Went Wrong</h2>
              <p className="neuro-error-text">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="neuro-error-button"
              >
                <RefreshCcwIcon size={18} />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // NO USER STATE - NEUMORPHIC DESIGN
  if (!getAuthenticatedUser()) {
    return (
      <div className="neuro-rewards-page">
        <div className="neuro-container">
          <div className="neuro-auth-container">
            <div className="neuro-auth-card">
              <div className="neuro-auth-icon">
                <GiftIcon size={48} />
              </div>
              <h2 className="neuro-auth-title">Login Required</h2>
              <p className="neuro-auth-text">
                Please log in to view and redeem delicious food rewards.
              </p>
              <Link to="/login" className="neuro-auth-button">
                <ArrowRightIcon size={18} />
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="neuro-rewards-page">
      <div className="neuro-container">
        {/* Page Header with Points Display */}
        <div className="neuro-page-header">
          <div className="neuro-header-content">
            <div className="neuro-header-info">
              <div className="neuro-header-icon">
                <GiftIcon size={32} />
              </div>
              <div>
                <h1 className="neuro-page-title">Food Rewards</h1>
                <p className="neuro-page-subtitle">
                  Redeem your points for delicious treats and exclusive perks
                </p>
              </div>
            </div>
            <div className="neuro-points-display">
              <div className="neuro-points-icon">
                <CoinsIcon size={24} />
              </div>
              <div className="neuro-points-content">
                <div className="neuro-points-value">{userPoints}</div>
                <div className="neuro-points-label">Your Points</div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message (if any but still showing rewards) */}
        {error && rewards.length > 0 && (
          <div className="neuro-warning-banner">
            <AlertTriangleIcon size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Rewards Grid */}
        <div className="neuro-rewards-grid">
          {rewards.map((reward) => {
            const IconComponent = getRewardIcon(reward.icon);
            const affordable = canAfford(reward.pointCost);
            const isRedeeming = redeeming === reward.id;
            const pointsNeeded = getPointsNeeded(reward.pointCost);

            return (
              <div 
                key={reward.id} 
                className={`neuro-reward-card ${!affordable ? 'unaffordable' : ''}`}
              >
                {/* Reward Header */}
                <div className="neuro-reward-header">
                  <div className="neuro-reward-icon">
                    <IconComponent size={32} />
                  </div>
                  <div className="neuro-reward-cost">
                    <CoinsIcon size={16} />
                    <span>{reward.pointCost}</span>
                  </div>
                </div>

                {/* Reward Content */}
                <div className="neuro-reward-content">
                  <h3 className="neuro-reward-title">{reward.name}</h3>
                  <p className="neuro-reward-description">{reward.description}</p>
                </div>

                {/* Reward Action */}
                <div className="neuro-reward-action">
                  {!affordable ? (
                    <div className="neuro-reward-locked">
                      <div className="neuro-locked-content">
                        <LockIcon size={16} />
                        <span>Need {pointsNeeded} more points</span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRedeem(reward)}
                      disabled={isRedeeming}
                      className="neuro-redeem-button"
                    >
                      {isRedeeming ? (
                        <>
                          <LoaderIcon size={16} className="neuro-spin" />
                          Redeeming...
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon size={16} />
                          Redeem Now
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* How It Works Section */}
        <div className="neuro-how-it-works">
          <div className="neuro-how-card">
            <div className="neuro-how-header">
              <SparklesIcon size={24} />
              <h3>How Food Rewards Work</h3>
            </div>
            <div className="neuro-how-steps">
              <div className="neuro-step">
                <div className="neuro-step-number">1</div>
                <div className="neuro-step-content">
                  <h4>Earn Points</h4>
                  <p>Leave reviews and get points for every dining experience you share</p>
                </div>
              </div>
              <div className="neuro-step">
                <div className="neuro-step-number">2</div>
                <div className="neuro-step-content">
                  <h4>Choose Rewards</h4>
                  <p>Browse our delicious selection of food rewards and exclusive perks</p>
                </div>
              </div>
              <div className="neuro-step">
                <div className="neuro-step-number">3</div>
                <div className="neuro-step-content">
                  <h4>Redeem & Enjoy</h4>
                  <p>Get your voucher code and show it to restaurant staff to claim your reward</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="neuro-cta-section">
          <div className="neuro-cta-card">
            <div className="neuro-cta-icon">
              <ClockIcon size={48} />
            </div>
            <h3 className="neuro-cta-title">Need More Points?</h3>
            <p className="neuro-cta-text">
              Share your dining experiences and earn points for every review you leave!
            </p>
            <Link to="/feedback" className="neuro-cta-button">
              <ArrowRightIcon size={18} />
              Leave a Review
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .neuro-rewards-page {
          background: var(--neuro-bg);
          min-height: 100vh;
          padding: 2rem 0;
          color: var(--neuro-text-primary);
        }

        .neuro-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        /* Page Header */
        .neuro-page-header {
          background: var(--neuro-bg);
          border-radius: var(--neuro-radius-lg);
          padding: 2rem;
          box-shadow: 
            8px 8px 20px var(--neuro-shadow-dark),
            -8px -8px 20px var(--neuro-shadow-light);
        }

        .neuro-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
        }

        .neuro-header-info {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .neuro-header-icon {
          background: var(--neuro-bg);
          width: 4rem;
          height: 4rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--neuro-text-accent);
          box-shadow: 
            inset 4px 4px 8px var(--neuro-shadow-inner-dark),
            inset -4px -4px 8px var(--neuro-shadow-inner-light);
        }

        .neuro-page-title {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          color: var(--neuro-text-primary);
        }

        .neuro-page-subtitle {
          font-size: 1rem;
          color: var(--neuro-text-secondary);
          margin: 0;
        }

        .neuro-points-display {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: var(--neuro-bg);
          padding: 1rem 1.5rem;
          border-radius: var(--neuro-radius-md);
          box-shadow: 
            inset 4px 4px 8px var(--neuro-shadow-inner-dark),
            inset -4px -4px 8px var(--neuro-shadow-inner-light);
        }

        .neuro-points-icon {
          color: var(--neuro-text-accent);
        }

        .neuro-points-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--neuro-text-primary);
          line-height: 1;
        }

        .neuro-points-label {
          font-size: 0.875rem;
          color: var(--neuro-text-secondary);
          line-height: 1;
        }

        /* Loading, Error, Auth States */
        .neuro-loading-container,
        .neuro-error-container,
        .neuro-auth-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 60vh;
        }

        .neuro-loading-card,
        .neuro-error-card,
        .neuro-auth-card {
          background: var(--neuro-bg);
          padding: 3rem;
          border-radius: var(--neuro-radius-lg);
          text-align: center;
          max-width: 400px;
          box-shadow: 
            12px 12px 25px var(--neuro-shadow-dark),
            -12px -12px 25px var(--neuro-shadow-light);
        }

        .neuro-loading-icon,
        .neuro-error-icon,
        .neuro-auth-icon {
          color: var(--neuro-text-accent);
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: center;
        }

        .neuro-loading-title,
        .neuro-error-title,
        .neuro-auth-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--neuro-text-primary);
        }

        .neuro-loading-text,
        .neuro-error-text,
        .neuro-auth-text {
          color: var(--neuro-text-secondary);
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .neuro-error-button,
        .neuro-auth-button,
        .neuro-cta-button {
          background: var(--neuro-primary);
          color: white;
          border: none;
          padding: 0.875rem 1.5rem;
          border-radius: var(--neuro-radius-md);
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          transition: var(--neuro-transition);
          box-shadow: 
            4px 4px 12px var(--neuro-primary-shadow),
            -2px -2px 8px rgba(255, 255, 255, 0.1);
        }

        .neuro-error-button:hover,
        .neuro-auth-button:hover,
        .neuro-cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 
            6px 6px 16px var(--neuro-primary-shadow),
            -3px -3px 12px rgba(255, 255, 255, 0.1);
        }

        .neuro-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Warning Banner */
        .neuro-warning-banner {
          background: var(--neuro-bg);
          border: 2px solid rgba(245, 158, 11, 0.3);
          border-radius: var(--neuro-radius-md);
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #f59e0b;
          font-weight: 500;
          box-shadow: 
            4px 4px 8px var(--neuro-shadow-dark),
            -4px -4px 8px var(--neuro-shadow-light);
        }

        /* Rewards Grid */
        .neuro-rewards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .neuro-reward-card {
          background: var(--neuro-bg);
          border-radius: var(--neuro-radius-lg);
          padding: 1.5rem;
          transition: var(--neuro-transition);
          box-shadow: 
            8px 8px 20px var(--neuro-shadow-dark),
            -8px -8px 20px var(--neuro-shadow-light);
        }

        .neuro-reward-card:hover {
          transform: translateY(-2px);
          box-shadow: 
            12px 12px 25px var(--neuro-shadow-dark),
            -12px -12px 25px var(--neuro-shadow-light);
        }

        .neuro-reward-card.unaffordable {
          opacity: 0.6;
        }

        .neuro-reward-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .neuro-reward-icon {
          background: var(--neuro-bg);
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--neuro-text-accent);
          box-shadow: 
            inset 4px 4px 8px var(--neuro-shadow-inner-dark),
            inset -4px -4px 8px var(--neuro-shadow-inner-light);
        }

        .neuro-reward-cost {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--neuro-bg);
          padding: 0.5rem 0.75rem;
          border-radius: var(--neuro-radius-sm);
          color: var(--neuro-text-accent);
          font-weight: 600;
          font-size: 0.875rem;
          box-shadow: 
            4px 4px 8px var(--neuro-shadow-dark),
            -4px -4px 8px var(--neuro-shadow-light);
        }

        .neuro-reward-content {
          margin-bottom: 1.5rem;
        }

        .neuro-reward-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
          color: var(--neuro-text-primary);
        }

        .neuro-reward-description {
          font-size: 0.875rem;
          color: var(--neuro-text-secondary);
          line-height: 1.5;
          margin: 0;
        }

        .neuro-reward-action {
          margin-top: auto;
        }

        .neuro-redeem-button {
          background: var(--neuro-primary);
          color: white;
          border: none;
          padding: 0.75rem 1.25rem;
          border-radius: var(--neuro-radius-md);
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          transition: var(--neuro-transition);
          box-shadow: 
            4px 4px 12px var(--neuro-primary-shadow),
            -2px -2px 8px rgba(255, 255, 255, 0.1);
        }

        .neuro-redeem-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 
            6px 6px 16px var(--neuro-primary-shadow),
            -3px -3px 12px rgba(255, 255, 255, 0.1);
        }

        .neuro-redeem-button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 
            2px 2px 8px var(--neuro-primary-shadow),
            -1px -1px 4px rgba(255, 255, 255, 0.1);
        }

        .neuro-redeem-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .neuro-reward-locked {
          background: var(--neuro-bg);
          border-radius: var(--neuro-radius-md);
          padding: 0.75rem;
          box-shadow: 
            inset 4px 4px 8px var(--neuro-shadow-inner-dark),
            inset -4px -4px 8px var(--neuro-shadow-inner-light);
        }

        .neuro-locked-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: var(--neuro-text-light);
          font-size: 0.875rem;
          font-weight: 500;
        }

        /* How It Works Section */
        .neuro-how-it-works {
          margin-top: 1rem;
        }

        .neuro-how-card {
          background: var(--neuro-bg);
          padding: 2rem;
          border-radius: var(--neuro-radius-lg);
          box-shadow: 
            8px 8px 20px var(--neuro-shadow-dark),
            -8px -8px 20px var(--neuro-shadow-light);
        }

        .neuro-how-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          color: var(--neuro-text-primary);
        }

        .neuro-how-header h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
        }

        .neuro-how-steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .neuro-step {
          display: flex;
          gap: 1rem;
        }

        .neuro-step-number {
          background: var(--neuro-bg);
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--neuro-text-accent);
          font-weight: 700;
          font-size: 1.125rem;
          flex-shrink: 0;
          box-shadow: 
            4px 4px 8px var(--neuro-shadow-dark),
            -4px -4px 8px var(--neuro-shadow-light);
        }

        .neuro-step-content h4 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
          color: var(--neuro-text-primary);
        }

        .neuro-step-content p {
          font-size: 0.875rem;
          color: var(--neuro-text-secondary);
          line-height: 1.5;
          margin: 0;
        }

        /* Call to Action */
        .neuro-cta-section {
          margin-top: 1rem;
        }

        .neuro-cta-card {
          background: var(--neuro-bg);
          padding: 3rem 2rem;
          border-radius: var(--neuro-radius-lg);
          text-align: center;
          box-shadow: 
            12px 12px 25px var(--neuro-shadow-dark),
            -12px -12px 25px var(--neuro-shadow-light);
        }

        .neuro-cta-icon {
          color: var(--neuro-text-accent);
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: center;
        }

        .neuro-cta-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--neuro-text-primary);
        }

        .neuro-cta-text {
          color: var(--neuro-text-secondary);
          margin-bottom: 2rem;
          line-height: 1.6;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .neuro-container {
            padding: 0 0.5rem;
          }

          .neuro-header-content {
            flex-direction: column;
            gap: 1.5rem;
          }

          .neuro-header-info {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }

          .neuro-rewards-grid {
            grid-template-columns: 1fr;
          }

          .neuro-how-steps {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .neuro-page-title {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .neuro-container {
            gap: 1.5rem;
          }

          .neuro-page-header,
          .neuro-how-card,
          .neuro-cta-card {
            padding: 1.5rem;
          }

          .neuro-reward-card {
            padding: 1rem;
          }

          .neuro-step {
            flex-direction: column;
            text-align: center;
            gap: 0.75rem;
          }

          .neuro-step-number {
            align-self: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Rewards;