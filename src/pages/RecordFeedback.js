// src/pages/RecordFeedback.js - CLEAN VERSION (no debug info)
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import FeedbackForm from '../components/Feedback/FeedbackForm';

// Simple utility function
const slugToReadable = (slug) => {
  if (!slug) return '';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const RecordFeedback = () => {
  const { restaurantName } = useParams();
  const [searchParams] = useSearchParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading restaurant data
    setTimeout(() => {
      const mockRestaurant = {
        id: 'default_restaurant',
        restaurant_id: 'default_restaurant',
        name: restaurantName ? slugToReadable(restaurantName) : 'Default Restaurant',
        address: '123 Main Street',
        phone: '555-1234',
        google_place_id: ''
      };
      
      setRestaurant(mockRestaurant);
      setLoading(false);
    }, 1000);
  }, [restaurantName]);

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #3b82f6',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>
            Loading Restaurant
          </h2>
          <p style={{ color: '#9ca3af' }}>
            Preparing your review experience...
          </p>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div style={{
      minHeight: '100vh',
      padding: '40px 20px',
      color: 'white'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Restaurant Header */}
        <div style={{
          marginBottom: '40px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '40px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center'
        }}>
          {/* Restaurant Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#fb923c',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 30px auto',
            fontSize: '40px'
          }}>
            🍽️
          </div>

          {/* Restaurant Name */}
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            background: 'linear-gradient(to right, #fb923c, #ef4444, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '20px'
          }}>
            {restaurant?.name || 'Restaurant'}
          </h1>

          {/* Restaurant Details */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '30px',
            flexWrap: 'wrap',
            color: '#d1d5db'
          }}>
            {restaurant?.address && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                📍 {restaurant.address}
              </div>
            )}
            
            {restaurant?.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                📞 {restaurant.phone}
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⏰ Open for reviews
            </div>
          </div>

          {/* Decorative Element */}
          <div style={{
            marginTop: '30px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px'
          }}>
            ✨ <span style={{ color: '#fbbf24', fontWeight: '600' }}>Share Your Experience</span> ✨
          </div>
        </div>

        {/* FeedbackForm Component */}
        <FeedbackForm 
          restaurantId={restaurant?.restaurant_id || restaurant?.id || 'default_restaurant'}
          restaurantName={restaurant?.name || 'this restaurant'}
          placeId={restaurant?.google_place_id}
        />

        {/* Additional Info */}
        <div style={{
          marginTop: '60px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '30px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            ⭐ Why Share Your Review?
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px',
            color: '#d1d5db'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px auto',
                fontSize: '24px'
              }}>
                💡
              </div>
              <h4 style={{ fontWeight: '600', color: 'white', marginBottom: '10px' }}>Help Others</h4>
              <p style={{ fontSize: '14px' }}>Your insights help fellow diners make informed choices</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px auto',
                fontSize: '24px'
              }}>
                📈
              </div>
              <h4 style={{ fontWeight: '600', color: 'white', marginBottom: '10px' }}>Improve Service</h4>
              <p style={{ fontSize: '14px' }}>Restaurants use feedback to enhance their offerings</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(147, 51, 234, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px auto',
                fontSize: '24px'
              }}>
                🎁
              </div>
              <h4 style={{ fontWeight: '600', color: 'white', marginBottom: '10px' }}>Earn Rewards</h4>
              <p style={{ fontSize: '14px' }}>Get points for sharing authentic feedback</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RecordFeedback;