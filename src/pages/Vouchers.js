// src/pages/Vouchers.js - Enhanced Neumorphic Design
// EXACT SAME FUNCTIONALITY - ONLY VISUAL DESIGN CHANGED
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserVouchers } from '../services/rewardsService';
import { TicketIcon, ClockIcon, CheckCircleIcon, XCircleIcon, RefreshCcwIcon, GiftIcon, ArrowRightIcon, InfoIcon, CreditCardIcon, CalendarIcon, SparklesIcon } from 'lucide-react';

const Vouchers = () => {
  // EXACT SAME STATE MANAGEMENT AS ORIGINAL
  const { currentUser } = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // EXACT SAME HELPER FUNCTIONS AS ORIGINAL
  const getAuthenticatedUser = () => {
    if (currentUser && currentUser.uid) {
      return currentUser;
    }
    return null;
  };

  const formatDate = (timestamp) => {
    try {
      let date;
      if (timestamp?.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp?.toDate) {
        date = timestamp.toDate();
      } else {
        date = new Date(timestamp);
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getVoucherStatus = (voucher) => {
    const now = new Date();
    let expiryDate;
    
    try {
      if (voucher.expiresAt?.seconds) {
        expiryDate = new Date(voucher.expiresAt.seconds * 1000);
      } else if (voucher.expiresAt?.toDate) {
        expiryDate = voucher.expiresAt.toDate();
      } else {
        expiryDate = new Date(voucher.expiresAt);
      }
    } catch (error) {
      expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    if (voucher.isUsed || voucher.used) {
      return { status: 'used', text: 'Used', icon: CheckCircleIcon, color: 'var(--neuro-text-secondary)' };
    } else if (expiryDate < now) {
      return { status: 'expired', text: 'Expired', icon: XCircleIcon, color: '#ef4444' };
    } else {
      return { status: 'active', text: 'Active', icon: TicketIcon, color: '#22c55e' };
    }
  };

  // EXACT SAME DATA LOADING LOGIC AS ORIGINAL
  useEffect(() => {
    const loadVouchers = async () => {
      const authenticatedUser = getAuthenticatedUser();
      if (!authenticatedUser) {
        setError('Please log in to view your vouchers');
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const userVouchers = await getUserVouchers(authenticatedUser.uid);
        setVouchers(userVouchers);
      } catch (error) {
        console.error('Error loading vouchers:', error);
        setError('Unable to load vouchers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadVouchers();
  }, [currentUser]);

  // LOADING STATE - NEUMORPHIC DESIGN
  if (loading) {
    return (
      <div className="neuro-vouchers-page">
        <div className="neuro-container">
          <div className="neuro-loading-container">
            <div className="neuro-loading-card">
              <div className="neuro-loading-icon">
                <RefreshCcwIcon size={32} className="neuro-spin" />
              </div>
              <h2 className="neuro-loading-title">Loading Your Vouchers</h2>
              <p className="neuro-loading-text">Fetching your delicious rewards...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ERROR STATE - NEUMORPHIC DESIGN
  if (error) {
    return (
      <div className="neuro-vouchers-page">
        <div className="neuro-container">
          <div className="neuro-error-container">
            <div className="neuro-error-card">
              <div className="neuro-error-icon">
                <XCircleIcon size={48} />
              </div>
              <h2 className="neuro-error-title">Vouchers Unavailable</h2>
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
      <div className="neuro-vouchers-page">
        <div className="neuro-container">
          <div className="neuro-auth-container">
            <div className="neuro-auth-card">
              <div className="neuro-auth-icon">
                <TicketIcon size={48} />
              </div>
              <h2 className="neuro-auth-title">Login Required</h2>
              <p className="neuro-auth-text">
                Please log in to view your vouchers and redeem delicious rewards.
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
    <div className="neuro-vouchers-page">
      <div className="neuro-container">
        {/* Page Header */}
        <div className="neuro-page-header">
          <div className="neuro-header-icon">
            <TicketIcon size={32} />
          </div>
          <div className="neuro-header-content">
            <h1 className="neuro-page-title">My Food Vouchers</h1>
            <p className="neuro-page-subtitle">
              Your redeemed rewards ready to use at participating restaurants
            </p>
          </div>
        </div>

        {/* Vouchers List */}
        {vouchers.length === 0 ? (
          <div className="neuro-empty-state">
            <div className="neuro-empty-card">
              <div className="neuro-empty-icon">
                <GiftIcon size={64} />
              </div>
              <h3 className="neuro-empty-title">No Vouchers Yet</h3>
              <p className="neuro-empty-text">
                Redeem rewards with your food points to get delicious vouchers!
              </p>
              <Link to="/rewards" className="neuro-empty-button">
                <GiftIcon size={18} />
                Browse Food Rewards
              </Link>
            </div>
          </div>
        ) : (
          <div className="neuro-vouchers-grid">
            {vouchers.map((voucher) => {
              const status = getVoucherStatus(voucher);
              const StatusIcon = status.icon;
              
              return (
                <div key={voucher.id} className={`neuro-voucher-card ${status.status}`}>
                  {/* Voucher Header */}
                  <div className="neuro-voucher-header">
                    <div className="neuro-voucher-info">
                      <h3 className="neuro-voucher-title">
                        {voucher.rewardName || voucher.name || 'Food Voucher'}
                      </h3>
                      <p className="neuro-voucher-subtitle">
                        {voucher.pointsSpent || voucher.pointCost || 100} points redeemed
                      </p>
                    </div>
                    <div className="neuro-voucher-status" style={{ color: status.color }}>
                      <StatusIcon size={20} />
                      <span>{status.text}</span>
                    </div>
                  </div>

                  {/* Voucher Code Section */}
                  <div className="neuro-voucher-code-section">
                    <div className="neuro-code-header">
                      <CreditCardIcon size={16} />
                      <span>Show this code to restaurant staff</span>
                    </div>
                    <div className="neuro-voucher-code">
                      {voucher.voucherCode || voucher.code || 'FOOD123'}
                    </div>
                    <div className="neuro-code-label">Voucher Code</div>
                  </div>

                  {/* Voucher Details */}
                  <div className="neuro-voucher-details">
                    <div className="neuro-detail-item">
                      <CalendarIcon size={16} />
                      <div className="neuro-detail-content">
                        <span className="neuro-detail-label">Created</span>
                        <span className="neuro-detail-value">
                          {formatDate(voucher.createdAt || voucher.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="neuro-detail-item">
                      <ClockIcon size={16} />
                      <div className="neuro-detail-content">
                        <span className="neuro-detail-label">Expires</span>
                        <span className="neuro-detail-value">
                          {formatDate(voucher.expiresAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {voucher.description && (
                    <div className="neuro-voucher-description">
                      <InfoIcon size={16} />
                      <p>{voucher.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Usage Instructions */}
        <div className="neuro-instructions-section">
          <div className="neuro-instructions-card">
            <div className="neuro-instructions-header">
              <InfoIcon size={24} />
              <h3>How to Use Your Food Vouchers</h3>
            </div>
            <div className="neuro-instructions-grid">
              <div className="neuro-instruction-item">
                <div className="neuro-instruction-icon">
                  <CreditCardIcon size={20} />
                </div>
                <p>Show this screen to restaurant staff</p>
              </div>
              <div className="neuro-instruction-item">
                <div className="neuro-instruction-icon">
                  <CheckCircleIcon size={20} />
                </div>
                <p>Staff will verify your voucher code</p>
              </div>
              <div className="neuro-instruction-item">
                <div className="neuro-instruction-icon">
                  <ClockIcon size={20} />
                </div>
                <p>Vouchers expire at midnight</p>
              </div>
              <div className="neuro-instruction-item">
                <div className="neuro-instruction-icon">
                  <SparklesIcon size={20} />
                </div>
                <p>One reward redemption per day</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        {vouchers.length > 0 && (
          <div className="neuro-cta-section">
            <div className="neuro-cta-card">
              <div className="neuro-cta-icon">
                <GiftIcon size={48} />
              </div>
              <h3 className="neuro-cta-title">Want More Food Rewards?</h3>
              <p className="neuro-cta-text">
                Keep sharing your dining experiences to earn more points and unlock tasty rewards!
              </p>
              <Link to="/rewards" className="neuro-cta-button">
                <GiftIcon size={18} />
                Browse Food Rewards
              </Link>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .neuro-vouchers-page {
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
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 2rem;
          background: var(--neuro-bg);
          border-radius: var(--neuro-radius-lg);
          box-shadow: 
            8px 8px 20px var(--neuro-shadow-dark),
            -8px -8px 20px var(--neuro-shadow-light);
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

        /* Loading State */
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
        .neuro-empty-button,
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
        .neuro-empty-button:hover,
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

        /* Empty State */
        .neuro-empty-state {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 40vh;
        }

        .neuro-empty-card {
          background: var(--neuro-bg);
          padding: 3rem;
          border-radius: var(--neuro-radius-lg);
          text-align: center;
          max-width: 500px;
          box-shadow: 
            12px 12px 25px var(--neuro-shadow-dark),
            -12px -12px 25px var(--neuro-shadow-light);
        }

        .neuro-empty-icon {
          color: var(--neuro-text-light);
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: center;
        }

        .neuro-empty-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--neuro-text-primary);
        }

        .neuro-empty-text {
          color: var(--neuro-text-secondary);
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        /* Vouchers Grid */
        .neuro-vouchers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .neuro-voucher-card {
          background: var(--neuro-bg);
          border-radius: var(--neuro-radius-lg);
          padding: 1.5rem;
          position: relative;
          transition: var(--neuro-transition);
          box-shadow: 
            8px 8px 20px var(--neuro-shadow-dark),
            -8px -8px 20px var(--neuro-shadow-light);
        }

        .neuro-voucher-card.active {
          border: 2px solid rgba(34, 197, 94, 0.2);
        }

        .neuro-voucher-card.expired {
          opacity: 0.6;
          border: 2px solid rgba(239, 68, 68, 0.2);
        }

        .neuro-voucher-card.used {
          opacity: 0.7;
          border: 2px solid rgba(156, 163, 175, 0.2);
        }

        .neuro-voucher-card:hover {
          transform: translateY(-2px);
          box-shadow: 
            12px 12px 25px var(--neuro-shadow-dark),
            -12px -12px 25px var(--neuro-shadow-light);
        }

        /* Voucher Card Elements */
        .neuro-voucher-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          gap: 1rem;
        }

        .neuro-voucher-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
          color: var(--neuro-text-primary);
        }

        .neuro-voucher-subtitle {
          font-size: 0.875rem;
          color: var(--neuro-text-secondary);
          margin: 0;
        }

        .neuro-voucher-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          padding: 0.5rem 0.75rem;
          background: var(--neuro-bg);
          border-radius: var(--neuro-radius-sm);
          box-shadow: 
            inset 2px 2px 4px var(--neuro-shadow-inner-dark),
            inset -2px -2px 4px var(--neuro-shadow-inner-light);
        }

        .neuro-voucher-code-section {
          background: var(--neuro-bg);
          border-radius: var(--neuro-radius-md);
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          text-align: center;
          box-shadow: 
            inset 4px 4px 8px var(--neuro-shadow-inner-dark),
            inset -4px -4px 8px var(--neuro-shadow-inner-light);
        }

        .neuro-code-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: var(--neuro-text-secondary);
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .neuro-voucher-code {
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 2rem;
          font-weight: 700;
          color: var(--neuro-text-accent);
          letter-spacing: 0.25rem;
          margin-bottom: 0.5rem;
          text-shadow: 0 0 10px rgba(102, 126, 234, 0.3);
        }

        .neuro-code-label {
          font-size: 0.75rem;
          color: var(--neuro-text-light);
          text-transform: uppercase;
          letter-spacing: 0.1rem;
          font-weight: 500;
        }

        .neuro-voucher-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .neuro-detail-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--neuro-text-secondary);
        }

        .neuro-detail-content {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .neuro-detail-label {
          font-size: 0.75rem;
          color: var(--neuro-text-light);
          text-transform: uppercase;
          letter-spacing: 0.05rem;
          font-weight: 500;
        }

        .neuro-detail-value {
          font-size: 0.875rem;
          color: var(--neuro-text-primary);
          font-weight: 500;
        }

        .neuro-voucher-description {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          background: var(--neuro-bg);
          border-radius: var(--neuro-radius-sm);
          color: var(--neuro-text-secondary);
          font-size: 0.875rem;
          line-height: 1.5;
          box-shadow: 
            inset 2px 2px 4px var(--neuro-shadow-inner-dark),
            inset -2px -2px 4px var(--neuro-shadow-inner-light);
        }

        .neuro-voucher-description p {
          margin: 0;
        }

        /* Instructions Section */
        .neuro-instructions-section {
          margin-top: 1rem;
        }

        .neuro-instructions-card {
          background: var(--neuro-bg);
          padding: 2rem;
          border-radius: var(--neuro-radius-lg);
          box-shadow: 
            8px 8px 20px var(--neuro-shadow-dark),
            -8px -8px 20px var(--neuro-shadow-light);
        }

        .neuro-instructions-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          color: var(--neuro-text-primary);
        }

        .neuro-instructions-header h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
        }

        .neuro-instructions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .neuro-instruction-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .neuro-instruction-icon {
          background: var(--neuro-bg);
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--neuro-text-accent);
          flex-shrink: 0;
          box-shadow: 
            4px 4px 8px var(--neuro-shadow-dark),
            -4px -4px 8px var(--neuro-shadow-light);
        }

        .neuro-instruction-item p {
          font-size: 0.875rem;
          color: var(--neuro-text-secondary);
          line-height: 1.5;
          margin: 0;
          padding-top: 0.375rem;
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

          .neuro-page-header {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }

          .neuro-vouchers-grid {
            grid-template-columns: 1fr;
          }

          .neuro-voucher-header {
            flex-direction: column;
            gap: 0.75rem;
          }

          .neuro-voucher-code {
            font-size: 1.5rem;
            letter-spacing: 0.15rem;
          }

          .neuro-instructions-grid {
            grid-template-columns: 1fr;
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
          .neuro-instructions-card,
          .neuro-cta-card {
            padding: 1.5rem;
          }

          .neuro-voucher-card {
            padding: 1rem;
          }

          .neuro-voucher-code-section {
            padding: 1rem;
          }

          .neuro-voucher-code {
            font-size: 1.25rem;
            letter-spacing: 0.1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Vouchers;