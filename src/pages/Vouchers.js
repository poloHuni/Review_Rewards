// src/pages/Vouchers.js - Food Review Themed Design
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserVouchers } from '../services/rewardsService';

const Vouchers = () => {
  const { currentUser } = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Enhanced user checking function
  const getAuthenticatedUser = () => {
    if (currentUser && currentUser.uid) {
      return currentUser;
    }
    return null;
  };

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const authenticatedUser = getAuthenticatedUser();
        
        if (!authenticatedUser) {
          console.log('No authenticated user, skipping vouchers fetch');
          setError('Please log in to view vouchers');
          return;
        }

        console.log('🎫 Fetching vouchers for user:', authenticatedUser.uid);

        // Try to get vouchers from service
        try {
          const userVouchers = await getUserVouchers(authenticatedUser.uid);
          console.log('✅ Vouchers fetched:', userVouchers);
          setVouchers(userVouchers);
        } catch (vouchersError) {
          console.log('⚠️ Error fetching vouchers:', vouchersError.message);
          setError(`Failed to load vouchers: ${vouchersError.message}`);
          setVouchers([]); // Set empty array on error
        }
        
      } catch (err) {
        console.error('❌ Error in vouchers fetch:', err);
        setError(`Failed to load vouchers: ${err.message}`);
        setVouchers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, [currentUser]);

  const formatTime = (date) => {
    if (!date) return 'Unknown time';
    
    try {
      // Handle both Firestore timestamp and regular Date
      const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  const isExpiringSoon = (expiresAt) => {
    if (!expiresAt) return false;
    
    try {
      const expireDate = expiresAt.seconds ? new Date(expiresAt.seconds * 1000) : new Date(expiresAt);
      const now = new Date();
      const timeDiff = expireDate.getTime() - now.getTime();
      const hoursLeft = timeDiff / (1000 * 60 * 60);
      
      return hoursLeft <= 2 && hoursLeft > 0; // Expiring within 2 hours
    } catch (error) {
      return false;
    }
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    
    try {
      const expireDate = expiresAt.seconds ? new Date(expiresAt.seconds * 1000) : new Date(expiresAt);
      const now = new Date();
      
      return expireDate.getTime() <= now.getTime();
    } catch (error) {
      return false;
    }
  };

  const getVoucherStatus = (voucher) => {
    if (voucher.isUsed) return { status: 'used', color: '#6b7280', emoji: '✅', text: 'Used' };
    if (isExpired(voucher.expiresAt)) return { status: 'expired', color: '#ef4444', emoji: '⏰', text: 'Expired' };
    if (isExpiringSoon(voucher.expiresAt)) return { status: 'expiring', color: '#f59e0b', emoji: '⚠️', text: 'Expiring Soon' };
    return { status: 'active', color: '#22c55e', emoji: '🎉', text: 'Ready to Use' };
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
          🎫 Loading Your Food Vouchers...
        </h2>
        <p style={{ opacity: 0.8 }}>Gathering your delicious rewards</p>
        
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
  if (error) {
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
            Vouchers Unavailable
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
            Login to View Your Food Vouchers
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.8, marginBottom: '30px' }}>
            Please log in to access your redeemed food rewards and vouchers
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
          🎫 My Food Vouchers
        </h1>
        <p style={{ fontSize: '16px', opacity: 0.8 }}>
          Your delicious rewards ready to be enjoyed
        </p>
      </div>

      {/* Vouchers List */}
      {vouchers.length === 0 ? (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>🎫</div>
          <h3 style={{ 
            fontSize: '24px', 
            marginBottom: '15px',
            fontWeight: 'bold'
          }}>
            No Active Food Vouchers
          </h3>
          <p style={{ 
            fontSize: '16px', 
            opacity: 0.8, 
            marginBottom: '30px',
            lineHeight: '1.6'
          }}>
            You don't have any vouchers yet. Redeem rewards with your food points to get delicious vouchers!
          </p>
          <a 
            href="/rewards"
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
              transition: 'all 0.3s ease'
            }}
          >
            🎁 Browse Food Rewards
          </a>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {vouchers.map((voucher) => {
            const status = getVoucherStatus(voucher);
            
            return (
              <div 
                key={voucher.id}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  padding: '25px',
                  backdropFilter: 'blur(10px)',
                  border: `2px solid ${status.status === 'active' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255, 255, 255, 0.2)'}`,
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Voucher Pattern Background */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '-10px',
                  width: '20px',
                  height: '20px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '50%',
                  transform: 'translateY(-50%)'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  right: '-10px',
                  width: '20px',
                  height: '20px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '50%',
                  transform: 'translateY(-50%)'
                }} />

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}>
                  {/* Voucher Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '15px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px'
                    }}>
                      <div style={{ fontSize: '50px' }}>
                        {voucher.icon || '🍽️'}
                      </div>
                      <div>
                        <h3 style={{
                          fontSize: '22px',
                          fontWeight: 'bold',
                          marginBottom: '5px',
                          color: 'white'
                        }}>
                          {voucher.rewardName}
                        </h3>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          color: status.color
                        }}>
                          <span>{status.emoji}</span>
                          <span style={{ fontWeight: 'bold' }}>{status.text}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      backgroundColor: `${status.color}20`,
                      border: `1px solid ${status.color}40`,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: status.color
                    }}>
                      {status.text}
                    </div>
                  </div>

                  {/* Voucher Code Section */}
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '15px',
                    padding: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    textAlign: 'center'
                  }}>
                    <p style={{
                      fontSize: '14px',
                      opacity: 0.8,
                      marginBottom: '10px'
                    }}>
                      🎫 Show this code to restaurant staff
                    </p>
                    <div style={{
                      fontSize: '32px',
                      fontFamily: 'Monaco, monospace',
                      fontWeight: 'bold',
                      color: '#fbbf24',
                      letterSpacing: '3px',
                      marginBottom: '10px'
                    }}>
                      {voucher.voucherCode || voucher.code || 'FOOD123'}
                    </div>
                    <p style={{
                      fontSize: '12px',
                      opacity: 0.6,
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      Voucher Code
                    </p>
                  </div>

                  {/* Voucher Details */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px',
                    paddingTop: '15px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div>
                      <p style={{
                        fontSize: '12px',
                        opacity: 0.8,
                        marginBottom: '5px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        📅 Redeemed
                      </p>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        {formatTime(voucher.redeemedAt || voucher.createdAt)}
                      </p>
                    </div>
                    
                    <div>
                      <p style={{
                        fontSize: '12px',
                        opacity: 0.8,
                        marginBottom: '5px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        ⏰ Expires
                      </p>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: isExpiringSoon(voucher.expiresAt) ? '#f59e0b' : 'white'
                      }}>
                        {voucher.expiresAt ? formatTime(voucher.expiresAt) : 'End of day'}
                      </p>
                    </div>

                    <div>
                      <p style={{
                        fontSize: '12px',
                        opacity: 0.8,
                        marginBottom: '5px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        ⚡ Points Used
                      </p>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#8b5cf6'
                      }}>
                        {voucher.pointCost || voucher.pointsSpent || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Instructions */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '15px',
        padding: '25px',
        marginBottom: '20px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📋 How to Use Your Food Vouchers
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '15px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>📱</span>
            <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.5' }}>
              Show this screen to restaurant staff
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>✅</span>
            <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.5' }}>
              Staff will verify your voucher code
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>⏰</span>
            <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.5' }}>
              Vouchers expire at midnight
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>🎁</span>
            <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.5' }}>
              One reward redemption per day
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      {vouchers.length > 0 && (
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
          <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Want More Food Rewards?</h3>
          <p style={{
            opacity: 0.8,
            marginBottom: '25px',
            lineHeight: '1.6'
          }}>
            Keep sharing your dining experiences to earn more points and unlock tasty rewards!
          </p>
          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <a 
              href="/feedback"
              style={{
                padding: '15px 25px',
                fontSize: '16px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '10px',
                background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
                color: 'white',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              🎤 Leave Review (+10 pts)
            </a>
            <a 
              href="/rewards"
              style={{
                padding: '15px 25px',
                fontSize: '16px',
                fontWeight: 'bold',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '10px',
                background: 'transparent',
                color: 'white',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              🎁 Browse Rewards
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vouchers;