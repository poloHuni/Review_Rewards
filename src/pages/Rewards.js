// src/pages/Rewards.js - Food Review Themed Design
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getRewards, redeemReward } from '../services/rewardsService';
import { getUserPoints } from '../services/pointsService';

const Rewards = () => {
  const { currentUser } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [error, setError] = useState(null);

  // Enhanced user checking function
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
      id: 'appetizer_free',
      name: 'Free Appetizer',
      pointCost: 40,
      icon: '🥗',
      active: true,
      description: 'Start your meal with a free appetizer'
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
      id: 'drink_upgrade',
      name: 'Free Drink Upgrade',
      pointCost: 15,
      icon: '🥤',
      active: true,
      description: 'Upgrade to premium beverages'
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
        console.log('⚠️ Service unavailable, creating fallback voucher with database save');
        
        try {
          // Import Firestore functions
          const { collection, addDoc, updateDoc, doc, increment } = await import('firebase/firestore');
          const { db } = await import('../firebase/config');
          
          // Create voucher data
          const voucherCode = `FOOD${Date.now().toString().slice(-6)}`;
          const expiresAt = new Date();
          expiresAt.setHours(23, 59, 59, 999); // Expires at end of day
          
          const voucherData = {
            userId: authenticatedUser.uid,
            restaurantId: 'default_restaurant',
            rewardId: reward.id,
            rewardName: reward.name,
            pointCost: reward.pointCost,
            voucherCode: voucherCode,
            isUsed: false,
            redeemedAt: new Date(),
            expiresAt: expiresAt,
            icon: reward.icon
          };
          
          // Save voucher to Firestore
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
      alert(`🎉 Congratulations! Your ${voucher.rewardName} is ready!\n\n🎫 Voucher Code: ${voucher.code || 'REWARD_CODE'}\n\nShow this code to staff to redeem your reward!`);
      
    } catch (error) {
      console.error('❌ Redemption error:', error);
      alert(`Failed to redeem reward: ${error.message}`);
    } finally {
      setRedeeming(null);
    }
  };

  const getPointsNeeded = (cost) => {
    return Math.max(0, cost - userPoints);
  };

  const canAfford = (cost) => {
    return userPoints >= cost;
  };

  // Loading state
  if (loading) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px',
        color: 'white',
        minHeight: '100vh',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          border: '4px solid rgba(139, 92, 246, 0.3)',
          borderTop: '4px solid #8b5cf6',
          borderRadius: '50%',
          margin: '0 auto 30px auto',
          animation: 'spin 1s linear infinite'
        }} />
        <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>
          🎁 Loading Your Delicious Rewards...
        </h2>
        <p style={{ opacity: 0.8 }}>Preparing tasty treats just for you</p>
        
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // Error state
  if (error && rewards.length === 0) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px',
        color: 'white',
        minHeight: '100vh'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            fontSize: '60px',
            marginBottom: '20px'
          }}>
            🚨
          </div>
          <h2 style={{ fontSize: '24px', marginBottom: '15px', color: '#ef4444' }}>
            Oops! Rewards Unavailable
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.8, marginBottom: '30px' }}>
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '10px',
              background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  // No user state
  if (!getAuthenticatedUser()) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px',
        color: 'white',
        minHeight: '100vh'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            fontSize: '60px',
            marginBottom: '20px'
          }}>
            🔐
          </div>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>
            Login to Access Tasty Rewards
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.8, marginBottom: '30px' }}>
            Please log in to view and redeem your delicious food rewards
          </p>
          <a 
            href="/login"
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '10px',
              background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
              color: 'white',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'all 0.3s ease'
            }}
          >
            🚀 Login Now
          </a>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '40px 20px',
      color: 'white',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '32px',
          marginBottom: '10px',
          background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold'
        }}>
          🎁 Food Lover's Reward Store
        </h1>
        <p style={{ fontSize: '16px', opacity: 0.8, marginBottom: '30px' }}>
          Turn your review points into delicious treats and amazing experiences
        </p>

        {/* Points Display */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '25px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'inline-block',
          minWidth: '250px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '15px'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              ⚡
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{
                fontSize: '14px',
                opacity: 0.8,
                marginBottom: '5px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Your Food Points
              </p>
              <p style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#fbbf24'
              }}>
                {userPoints}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner (if service issues but still showing rewards) */}
      {error && rewards.length > 0 && (
        <div style={{
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderRadius: '15px',
          padding: '20px',
          marginBottom: '30px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          backdropFilter: 'blur(10px)',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <div>
              <p style={{ color: '#fbbf24', fontWeight: 'bold', margin: 0 }}>Service Notice</p>
              <p style={{ color: '#fed7aa', fontSize: '14px', margin: '5px 0 0 0' }}>
                Some features may be limited. Showing default rewards.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* How to Earn Points */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '15px',
        padding: '25px',
        marginBottom: '30px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          ⭐ How to Earn Food Points
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '15px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            padding: '15px',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            borderRadius: '10px',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>
              +10
            </div>
            <span style={{ fontSize: '16px' }}>📝 Save a restaurant review</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            padding: '15px',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            borderRadius: '10px',
            border: '1px solid rgba(34, 197, 94, 0.3)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#22c55e',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>
              +1
            </div>
            <span style={{ fontSize: '16px' }}>📋 Copy review to Google</span>
          </div>
        </div>
      </div>

      {/* Rewards Grid */}
      <div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '25px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          🏆 Available Tasty Rewards
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {rewards.map((reward) => {
            const canAffordReward = canAfford(reward.pointCost);
            const isRedeeming = redeeming === reward.id;
            const pointsNeeded = getPointsNeeded(reward.pointCost);
            
            return (
              <div 
                key={reward.id}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '15px',
                  padding: '25px',
                  backdropFilter: 'blur(10px)',
                  border: canAffordReward 
                    ? '2px solid rgba(34, 197, 94, 0.4)' 
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  position: 'relative',
                  opacity: canAffordReward ? 1 : 0.75,
                  transform: 'scale(1)',
                  cursor: canAffordReward ? 'pointer' : 'default'
                }}
                onMouseEnter={(e) => {
                  if (canAffordReward) {
                    e.target.style.transform = 'translateY(-5px) scale(1.02)';
                    e.target.style.boxShadow = '0 10px 25px rgba(34, 197, 94, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {/* Affordable Badge */}
                {canAffordReward && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    backgroundColor: '#22c55e',
                    color: 'white',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}>
                    ✓
                  </div>
                )}
                
                {/* Reward Icon */}
                <div style={{ fontSize: '60px', marginBottom: '15px' }}>
                  {reward.icon}
                </div>
                
                {/* Reward Name */}
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                  color: 'white'
                }}>
                  {reward.name}
                </h3>
                
                {/* Description */}
                {reward.description && (
                  <p style={{
                    fontSize: '14px',
                    opacity: 0.8,
                    marginBottom: '20px',
                    lineHeight: '1.4'
                  }}>
                    {reward.description}
                  </p>
                )}
                
                {/* Points Cost */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '20px'
                }}>
                  <span style={{ fontSize: '20px' }}>⚡</span>
                  <span style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#fbbf24'
                  }}>
                    {reward.pointCost}
                  </span>
                  <span style={{ fontSize: '14px', opacity: 0.7 }}>points</span>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleRedeem(reward)}
                  disabled={!canAffordReward || isRedeeming}
                  style={{
                    width: '100%',
                    padding: '15px 20px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: (!canAffordReward || isRedeeming) ? 'not-allowed' : 'pointer',
                    background: isRedeeming
                      ? 'rgba(107, 114, 128, 0.5)'
                      : canAffordReward 
                        ? 'linear-gradient(45deg, #22c55e, #16a34a)'
                        : 'rgba(107, 114, 128, 0.5)',
                    color: 'white',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    if (canAffordReward && !isRedeeming) {
                      e.target.style.background = 'linear-gradient(45deg, #16a34a, #15803d)';
                      e.target.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canAffordReward && !isRedeeming) {
                      e.target.style.background = 'linear-gradient(45deg, #22c55e, #16a34a)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {isRedeeming ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Redeeming...
                    </>
                  ) : canAffordReward ? (
                    <>🎉 Redeem Now</>
                  ) : (
                    <>🔒 Need {pointsNeeded} More Points</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {rewards.length === 0 && (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '40px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🎁</div>
          <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>No Rewards Available</h3>
          <p style={{ opacity: 0.8 }}>Check back later for delicious rewards!</p>
        </div>
      )}

      {/* Call to Action */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '15px',
        padding: '30px',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>🍽️</div>
        <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Want More Food Points?</h3>
        <p style={{
          opacity: 0.8,
          marginBottom: '25px',
          lineHeight: '1.6'
        }}>
          Share your amazing dining experiences to earn points and unlock incredible food rewards!
        </p>
        <a 
          href="/feedback"
          style={{
            padding: '15px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '10px',
            background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
            color: 'white',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.4)';
          }}
        >
          🎤 Share Your Food Experience (+10 Points)
        </a>
      </div>
    </div>
  );
};

export default Rewards;