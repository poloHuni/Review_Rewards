// src/pages/OwnerDashboard.js - Food Review Themed Design
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getRestaurantsByOwner, 
  saveRestaurant, 
  deleteRestaurant,
  getRestaurantAnalytics,  // Fixed: changed from getOwnerAnalytics
  verifyOwnerPassword 
} from '../services/restaurantService';
import { getRewards, updateRestaurantRewards } from '../services/rewardsService';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatDate } from '../utils/dateUtils';
import ReviewCategories from '../components/Reviews/ReviewCategories'; // ADD THIS LINE

const OwnerDashboard = () => {
  const { currentUser, isOwner } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [restaurants, setRestaurants] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Admin Rewards State - Load from database
  const [rewards, setRewards] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newReward, setNewReward] = useState({
    name: '',
    pointCost: 100,
    category: 'beverage',
    icon: '☕',
    active: true
  });
  const [rewardsSaving, setRewardsSaving] = useState(false);
  
  // Reviews filtering state
  const [selectedRestaurantFilter, setSelectedRestaurantFilter] = useState('');
  const [reviewSearchTerm, setReviewSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [reviewSortBy, setReviewSortBy] = useState('date-desc');
  const [expandedReview, setExpandedReview] = useState(null);

  // Form state for adding/editing restaurants
  const [formData, setFormData] = useState({
    restaurant_id: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    category: '',
    hours: {
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: ''
    }
  });

  const resetForm = () => {
    setFormData({
      restaurant_id: '',
      name: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      description: '',
      category: '',
      hours: {
        monday: '',
        tuesday: '',
        wednesday: '',
        thursday: '',
        friday: '',
        saturday: '',
        sunday: ''
      }
    });
  };

  const handleEdit = (restaurant) => {
    setFormData({ ...restaurant });
    setEditingRestaurant(restaurant);
    setShowAddForm(true);
  };

  // Icon options for dropdown
  const iconOptions = [
    // Food & Drinks
    '☕', '🍵', '🧃', '🥤', '🍷', '🍺', '🍽️', '🍔', '🍟', '🌭', '🍕', '🥪', '🌮', '🌯', '🥗', '🥘', '🍝', '🍜', '🍲', '🥫', '🍣', '🍱', '🍛', '🍚', '🍙', '🍢', '🍡', '🍧', '🍨', '🍦', '🎂', '🍰', '🧁', '🍩', '🍪',
    // Health & Wellness  
    '🧘', '🏋️', '🧗', '🚴', '🚶', '🧍', '🛌', '🧴', '💊', '💉', '🩺', '🏥', '🩹', '🧼', '🛀', '🚿',
    // Business & Office
    '💼', '📁', '📂', '📊', '📈', '📉', '📋', '🗂️', '🗃️', '🗄️', '🖇️', '📎', '📌', '📍', '🖊️', '🖋️', '🖌️', '📝', '🗒️', '🗓️', '📅', '📆',
    // Transportation
    '🚗', '🚕', '🚙', '🚌', '🚎', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛺', '🚲', '🛴', '🛵', '🛶', '🚤', '🛳️', '✈️', '🚁', '🚀', '🚉', '🚂',
    // Tools & Technology
    '🔧', '🔨', '🪓', '🛠️', '⚙️', '🧰', '🪛', '🗜️', '🧲', '🧪', '🧬', '🔬', '🔭', '🧫', '🖥️', '💻', '📱', '🖨️', '📷', '🎥', '🎙️', '🎚️',
    // Weather & Nature
    '☀️', '🌤️', '⛅', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '🌪️', '🌫️', '🌈', '🌊', '🔥', '💨', '🌱', '🌳', '🌴', '🌵', '🍀', '🍁', '🍂', '🍃',
    // Shopping & Money
    '🛒', '🛍️', '💰', '💸', '💳', '🏧', '💲', '💵', '💶', '💷', '💴', '🪙', '🧾', '📦',
    // People & Professions
    '👶', '🧒', '👦', '👧', '🧑', '👨', '👩', '🧓', '👴', '👵', '🧑‍🎓', '👨‍⚕️', '👩‍⚕️', '👨‍🏫', '👩‍🏫', '👨‍🔧', '👩‍🔧', '👨‍🍳', '👩‍🍳', '👨‍💻', '👩‍💻'
  ];

  // Load rewards from database with enhanced debugging
  const loadRewards = async () => {
    try {
      console.log('🎁 Loading rewards from database...');
      
      // Try to get from restaurantSettings first (old structure)
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      const restaurantRef = doc(db, 'restaurantSettings', 'default_restaurant');
      const restaurantDoc = await getDoc(restaurantRef);
      
      let rewardsData = null;
      
      if (restaurantDoc.exists() && restaurantDoc.data().rewards) {
        rewardsData = restaurantDoc.data().rewards;
        console.log('📦 Found rewards in restaurantSettings:', rewardsData);
      } else {
        // Try to get from rewards collection (new structure)
        const { collection, getDocs } = await import('firebase/firestore');
        const rewardsCollection = collection(db, 'rewards');
        const querySnapshot = await getDocs(rewardsCollection);
        
        if (!querySnapshot.empty) {
          rewardsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log('📦 Found rewards in rewards collection:', rewardsData);
        }
      }
      
      if (rewardsData && rewardsData.length > 0) {
        setRewards(rewardsData);
        console.log('✅ Rewards set in state:', rewardsData);
      } else {
        console.log('⚠️ No rewards found, initializing defaults...');
        const defaultRewards = [
          { id: 1, name: 'Free Coffee', pointCost: 30, category: 'beverage', icon: '☕', active: true },
          { id: 2, name: 'Free Dessert', pointCost: 60, category: 'food', icon: '🍰', active: true },
          { id: 3, name: '10% Discount', pointCost: 100, category: 'discount', icon: '💰', active: true }
        ];
        
        // Initialize the database with default rewards
        const initSuccess = await saveRewardsToDatabase(defaultRewards);
        if (initSuccess) {
          setRewards(defaultRewards);
          console.log('✅ Default rewards initialized and set');
        }
      }
    } catch (error) {
      console.error('❌ Error loading rewards:', error);
      // Set default rewards on error
      const fallbackRewards = [
        { id: 1, name: 'Free Coffee', pointCost: 30, category: 'beverage', icon: '☕', active: true },
        { id: 2, name: 'Free Dessert', pointCost: 60, category: 'food', icon: '🍰', active: true },
        { id: 3, name: '10% Discount', pointCost: 100, category: 'discount', icon: '💰', active: true }
      ];
      setRewards(fallbackRewards);
      console.log('⚠️ Using fallback rewards due to error');
    }
  };

  // Save rewards to database with enhanced debugging and proper collection creation
  const saveRewardsToDatabase = async (updatedRewards) => {
    try {
      setRewardsSaving(true);
      console.log('💾 Saving rewards to database...');
      console.log('📤 Rewards to save:', JSON.stringify(updatedRewards, null, 2));
      
      // Import the Firebase functions directly
      const { doc, setDoc, collection, writeBatch } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      // Method 1: Save to restaurantSettings (for compatibility)
      const restaurantRef = doc(db, 'restaurantSettings', 'default_restaurant');
      await setDoc(restaurantRef, {
        rewards: updatedRewards,
        updatedAt: new Date(),
        lastModifiedBy: currentUser?.email || 'unknown'
      }, { merge: true });
      
      console.log('✅ Saved to restaurantSettings collection');
      
      // Method 2: Create individual reward documents in rewards collection
      const batch = writeBatch(db);
      
      // First, clear existing rewards (we'll recreate them)
      // Note: In production, you might want to handle this differently
      
      // Add each reward as a separate document
      updatedRewards.forEach(reward => {
        const rewardRef = doc(db, 'rewards', reward.id.toString());
        batch.set(rewardRef, {
          ...reward,
          updatedAt: new Date(),
          lastModifiedBy: currentUser?.email || 'unknown'
        });
      });
      
      await batch.commit();
      console.log('✅ Rewards saved to rewards collection');
      
      // Verify the save by reading it back
      const { getDoc } = await import('firebase/firestore');
      const verifyDoc = await getDoc(restaurantRef);
      if (verifyDoc.exists()) {
        const savedData = verifyDoc.data();
        console.log('✅ Verification: Data exists in Firebase:', savedData.rewards?.length || 0, 'rewards');
      } else {
        console.log('⚠️ Verification: Document does not exist after save');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error saving rewards:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      setError(`Failed to save rewards: ${error.message}`);
      return false;
    } finally {
      setRewardsSaving(false);
    }
  };

  const handleRewardEdit = async (id, field, value) => {
    console.log(`📝 Editing reward ${id}: ${field} = ${value}`);
    const updatedRewards = rewards.map(reward => 
      reward.id === id ? { ...reward, [field]: value } : reward
    );
    setRewards(updatedRewards);
    console.log('🔄 Local state updated:', updatedRewards);
    
    // Auto-save when toggling active status
    if (field === 'active') {
      console.log('💾 Auto-saving due to active status change...');
      const success = await saveRewardsToDatabase(updatedRewards);
      if (success) {
        console.log('✅ Auto-save successful, reloading rewards...');
        // Reload to confirm changes persisted
        setTimeout(() => loadRewards(), 1000);
      }
    }
  };

  const handleSave = async (id) => {
    console.log(`💾 Manual save for reward ${id}`);
    const success = await saveRewardsToDatabase(rewards);
    if (success) {
      setEditingId(null);
      console.log('✅ Manual save successful, reloading rewards...');
      // Reload to confirm changes persisted
      setTimeout(() => loadRewards(), 1000);
    }
  };

  const handleDelete = async (id) => {
    console.log(`🗑️ Deleting reward ${id}`);
    const updatedRewards = rewards.filter(reward => reward.id !== id);
    setRewards(updatedRewards);
    const success = await saveRewardsToDatabase(updatedRewards);
    if (success) {
      console.log('✅ Delete successful, reloading rewards...');
      // Reload to confirm changes persisted
      setTimeout(() => loadRewards(), 1000);
    }
  };

  const handleAddReward = async () => {
    if (!newReward.name.trim()) return;
    
    console.log('➕ Adding new reward:', newReward);
    const newId = rewards.length > 0 ? Math.max(...rewards.map(r => Number(r.id) || 0)) + 1 : 1;
    const rewardToAdd = {
      ...newReward,
      id: newId,
      pointCost: Number(newReward.pointCost)
    };
    
    console.log('🆕 New reward to add:', rewardToAdd);
    const updatedRewards = [...rewards, rewardToAdd];
    setRewards(updatedRewards);
    
    const success = await saveRewardsToDatabase(updatedRewards);
    if (success) {
      setNewReward({
        name: '',
        pointCost: 100,
        category: 'beverage',
        icon: '☕',
        active: true
      });
      console.log('✅ Add successful, reloading rewards...');
      // Reload to confirm changes persisted
      setTimeout(() => loadRewards(), 1000);
    }
  };

  // FIXED: Enhanced function to get all reviews for owner's restaurants
  const getReviewsForOwnerRestaurants = async (restaurantIds) => {
    try {
      console.log('🔍 Fetching reviews for restaurant IDs:', restaurantIds);
      
      if (!restaurantIds || restaurantIds.length === 0) {
        console.log('❌ No restaurant IDs provided');
        return [];
      }

      // Remove any undefined, null, or empty string values from restaurantIds
      const validRestaurantIds = restaurantIds.filter(id => id && id.trim() !== '');
      
      if (validRestaurantIds.length === 0) {
        console.log('❌ No valid restaurant IDs found');
        return [];
      }

      console.log('✅ Valid restaurant IDs:', validRestaurantIds);

      const reviewsCollection = collection(db, 'reviews');
      
      // Split into chunks if more than 10 (Firestore 'in' limit)
      const chunks = [];
      for (let i = 0; i < validRestaurantIds.length; i += 10) {
        chunks.push(validRestaurantIds.slice(i, i + 10));
      }
      
      const allReviews = [];
      
      for (const chunk of chunks) {
        try {
          const reviewsQuery = query(
            reviewsCollection,
            where('restaurant_id', 'in', chunk),
            orderBy('timestamp', 'desc')
          );
          
          console.log('🔍 Querying chunk:', chunk);
          const querySnapshot = await getDocs(reviewsQuery);
          console.log('📊 Found reviews in this chunk:', querySnapshot.docs.length);
          
          querySnapshot.forEach((doc) => {
            const reviewData = { id: doc.id, ...doc.data() };
            console.log('📝 Review found:', reviewData.restaurant_id, reviewData.summary?.substring(0, 50));
            allReviews.push(reviewData);
          });
        } catch (chunkError) {
          console.error('❌ Error querying chunk:', chunk, chunkError);
        }
      }
      
      console.log('✅ Total reviews found:', allReviews.length);
      return allReviews;
    } catch (error) {
      console.error('❌ Error getting owner reviews:', error);
      return [];
    }
  };

  // Calculate overall analytics for owner
  const calculateOwnerAnalytics = (restaurantsData) => {
    try {
      let totalReviews = 0;
      let totalRating = 0;
      let positiveReviews = 0;
      let thisMonthReviews = 0;
      let totalSentiment = 0;
      let sentimentCount = 0;

      restaurantsData.forEach(restaurant => {
        if (restaurant.analytics) {
          totalReviews += restaurant.analytics.totalReviews || 0;
          
          if (restaurant.analytics.averageRating) {
            totalRating += restaurant.analytics.averageRating * (restaurant.analytics.totalReviews || 0);
          }
          
          positiveReviews += restaurant.analytics.positiveReviews || 0;
          thisMonthReviews += restaurant.analytics.thisMonthReviews || 0;
          
          // Calculate sentiment if available
          if (restaurant.analytics.reviews) {
            restaurant.analytics.reviews.forEach(review => {
              if (review.sentiment_score !== undefined) {
                totalSentiment += review.sentiment_score;
                sentimentCount++;
              }
            });
          }
        }
      });

      const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
      const averageSentiment = sentimentCount > 0 ? totalSentiment / sentimentCount : 0;
      const satisfactionRate = totalReviews > 0 ? Math.round((positiveReviews / totalReviews) * 100) : 0;

      return {
        totalReviews,
        thisMonthReviews,
        averageRating,
        positiveReviews,
        satisfactionRate
      };
    } catch (error) {
      console.error('Error calculating owner analytics:', error);
      return {
        totalReviews: 0,
        thisMonthReviews: 0,
        averageRating: 0,
        positiveReviews: 0,
        satisfactionRate: 0
      };
    }
  };

  // Load data
  useEffect(() => {
    if (isOwner && passwordVerified) {
      loadDashboardData();
      loadRewards(); // Load rewards when dashboard loads
    }
  }, [isOwner, passwordVerified]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const ownerId = currentUser.uid;
      
      console.log('🏪 Loading dashboard data for owner:', ownerId);
      
      // First get all restaurants owned by this owner
      const restaurantsData = await getRestaurantsByOwner(ownerId);
      console.log('🏪 Restaurants found:', restaurantsData.length);
      
      // FIXED: Get restaurant IDs with better handling
      const restaurantIds = restaurantsData.map(r => {
        // Try multiple possible ID fields
        const id = r.restaurant_id || r.id || r.name?.toLowerCase().replace(/\s+/g, '_');
        console.log('🆔 Restaurant ID extracted:', id, 'from restaurant:', r.name);
        return id;
      }).filter(id => id); // Remove any undefined/null values
      
      console.log('🆔 All restaurant IDs:', restaurantIds);
      
      // FIXED: Get all reviews for owner's restaurants with enhanced error handling
      const allReviewsData = await getReviewsForOwnerRestaurants(restaurantIds);
      console.log('📊 Total reviews loaded:', allReviewsData.length);
      
      // Then get analytics for each restaurant
      const restaurantsWithAnalytics = await Promise.all(
        restaurantsData.map(async (restaurant) => {
          try {
            const restaurantId = restaurant.restaurant_id || restaurant.id;
            const restaurantAnalytics = await getRestaurantAnalytics(restaurantId);
            return {
              ...restaurant,
              analytics: restaurantAnalytics
            };
          } catch (error) {
            console.error(`Error getting analytics for restaurant ${restaurant.restaurant_id}:`, error);
            return {
              ...restaurant,
              analytics: {
                totalReviews: 0,
                averageRating: 0,
                reviews: []
              }
            };
          }
        })
      );
      
      // Calculate overall analytics
      const ownerAnalytics = calculateOwnerAnalytics(restaurantsWithAnalytics);
      
      setRestaurants(restaurantsWithAnalytics || []);
      setAnalytics(ownerAnalytics || {});
      setAllReviews(allReviewsData || []);
      
      console.log('✅ Dashboard data loaded successfully');
      console.log('📊 Final state - Restaurants:', restaurantsWithAnalytics.length, 'Reviews:', allReviewsData.length);
      
    } catch (err) {
      console.error('❌ Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get restaurant name by ID
  const getRestaurantName = (restaurantId) => {
    const restaurant = restaurants.find(r => (r.restaurant_id || r.id) === restaurantId);
    return restaurant ? restaurant.name : 'Unknown Restaurant';
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError(null);
      
      const restaurantData = {
        ...formData,
        owner_id: currentUser.uid,
        created_at: editingRestaurant ? undefined : new Date()
      };
      
      if (editingRestaurant) {
        restaurantData.updated_at = new Date();
        await saveRestaurant(restaurantData, editingRestaurant.id);
      } else {
        await saveRestaurant(restaurantData);
      }
      
      await loadDashboardData();
      setShowAddForm(false);
      setEditingRestaurant(null);
      resetForm();
    } catch (err) {
      console.error('Error saving restaurant:', err);
      setError('Failed to save restaurant. Please try again.');
    }
  };

  // Handle password verification
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (verifyOwnerPassword(ownerPassword)) {
      setPasswordVerified(true);
      setError(null);
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  // Handle restaurant deletion
  const handleDeleteRestaurant = async (restaurantId) => {
    try {
      await deleteRestaurant(restaurantId);
      await loadDashboardData();
      setConfirmDelete(null);
    } catch (err) {
      console.error('Error deleting restaurant:', err);
      setError('Failed to delete restaurant. Please try again.');
    }
  };

  // Check if user is owner and authenticated
  if (!currentUser || !isOwner) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        textAlign: 'center'
      }}>
        <div>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>🔒 Access Denied</h2>
          <p style={{ fontSize: '16px', opacity: 0.8 }}>
            You need owner permissions to access this dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Password verification form
  if (!passwordVerified) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '40px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🔐</div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '10px',
            background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Owner Verification
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.8, marginBottom: '30px' }}>
            Please enter the owner password to access the dashboard.
          </p>
          
          <form onSubmit={handlePasswordSubmit}>
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder="Enter owner password"
                style={{
                  width: '100%',
                  padding: '15px 50px 15px 20px',
                  fontSize: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
            
            {error && (
              <div style={{
                color: '#ff6b6b',
                marginBottom: '20px',
                padding: '10px',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 107, 107, 0.3)'
              }}>
                {error}
              </div>
            )}
            
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '16px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '12px',
                background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              🔓 Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        textAlign: 'center'
      }}>
        <div>
          <div style={{
            fontSize: '60px',
            marginBottom: '20px',
            animation: 'spin 2s linear infinite'
          }}>
            🔄
          </div>
          <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Loading Dashboard...</h2>
          <p style={{ fontSize: '16px', opacity: 0.8 }}>
            Please wait while we fetch your restaurant data.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '40px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          maxWidth: '500px'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>❌</div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '15px'
          }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.8, marginBottom: '25px' }}>
            {error}
          </p>
          <button
            onClick={loadDashboardData}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '8px',
              background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  // Filter and sort reviews
  const filteredReviews = allReviews.filter(review => {
    const matchesRestaurant = !selectedRestaurantFilter || 
      review.restaurant_id === selectedRestaurantFilter;
    
    const matchesSearch = !reviewSearchTerm || 
      review.feedback?.toLowerCase().includes(reviewSearchTerm.toLowerCase()) ||
      review.user_name?.toLowerCase().includes(reviewSearchTerm.toLowerCase());
    
    const reviewDate = new Date(review.timestamp?.toDate ? review.timestamp.toDate() : review.timestamp);
    const matchesMonth = !selectedMonth || 
      reviewDate.getMonth() + 1 === parseInt(selectedMonth);
    const matchesYear = !selectedYear || 
      reviewDate.getFullYear() === parseInt(selectedYear);
    
    return matchesRestaurant && matchesSearch && matchesMonth && matchesYear;
  }).sort((a, b) => {
    const dateA = new Date(a.timestamp?.toDate ? a.timestamp.toDate() : a.timestamp);
    const dateB = new Date(b.timestamp?.toDate ? b.timestamp.toDate() : b.timestamp);
    
    switch (reviewSortBy) {
      case 'date-desc':
        return dateB - dateA;
      case 'date-asc':
        return dateA - dateB;
      case 'rating-high':
        return (b.overall_rating || 0) - (a.overall_rating || 0);
      case 'rating-low':
        return (a.overall_rating || 0) - (b.overall_rating || 0);
      default:
        return dateB - dateA;
    }
  });

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      color: 'white',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '30px',
        marginBottom: '30px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '60px', marginBottom: '15px' }}>🏪</div>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '10px',
          background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Restaurant Owner Dashboard
        </h1>
        <p style={{ fontSize: '16px', opacity: 0.8 }}>
          Welcome back, {currentUser?.displayName || currentUser?.name || 'Owner'}! 
          Manage your restaurants and track performance.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '15px',
        padding: '10px',
        marginBottom: '30px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        display: 'flex',
        gap: '10px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'restaurants', label: 'Restaurants', icon: '🏪' },
          { id: 'reviews', label: 'Reviews', icon: '⭐' },
          { id: 'admin-rewards', label: 'Manage Rewards', icon: '🎁' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderRadius: '10px',
              background: activeTab === tab.id 
                ? 'linear-gradient(45deg, #8b5cf6, #ec4899)' 
                : 'transparent',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
              opacity: activeTab === tab.id ? 1 : 0.7
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {/* Analytics Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {[
              {
                title: 'Total Reviews',
                value: analytics.totalReviews || 0,
                icon: '📝',
                gradient: 'linear-gradient(45deg, #10b981, #059669)'
              },
              {
                title: 'Average Rating',
                value: analytics.averageRating ? analytics.averageRating.toFixed(1) : '0.0',
                icon: '⭐',
                gradient: 'linear-gradient(45deg, #f59e0b, #d97706)'
              },
              {
                title: 'This Month',
                value: analytics.thisMonthReviews || 0,
                icon: '📈',
                gradient: 'linear-gradient(45deg, #8b5cf6, #7c3aed)'
              },
              {
                title: 'Satisfaction Rate',
                value: `${analytics.satisfactionRate || 0}%`,
                icon: '😊',
                gradient: 'linear-gradient(45deg, #ec4899, #db2777)'
              }
            ].map((stat, index) => (
              <div
                key={index}
                style={{
                  background: stat.gradient,
                  borderRadius: '15px',
                  padding: '25px',
                  textAlign: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>
                  {stat.icon}
                </div>
                <h3 style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  marginBottom: '5px'
                }}>
                  {stat.value}
                </h3>
                <p style={{
                  fontSize: '14px',
                  opacity: 0.9,
                  fontWeight: '500'
                }}>
                  {stat.title}
                </p>
              </div>
            ))}
          </div>

          {/* Recent Reviews */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '25px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              ⭐ Recent Reviews ({allReviews.length})
            </h3>
            
            {allReviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {allReviews.slice(0, 5).map((review, index) => (
                  <div
                    key={review.id || index}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '10px',
                      padding: '15px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '10px'
                    }}>
                      <div>
                        <div style={{
                          fontWeight: 'bold',
                          fontSize: '14px',
                          marginBottom: '5px'
                        }}>
                          {getRestaurantName(review.restaurant_id)}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          by {review.user_name || 'Anonymous'} • {formatDate(review.timestamp)}
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '4px 8px'
                      }}>
                        ⭐ {review.overall_rating || review.sentiment_score || 'N/A'}
                      </div>
                    </div>
                    <p style={{
                      fontSize: '14px',
                      opacity: 0.9,
                      lineHeight: '1.5',
                      margin: 0
                    }}>
                      {review.summary || review.feedback || 'No summary available'}
                    </p>
                  </div>
                ))}
                
                {allReviews.length > 5 && (
                  <button
                    onClick={() => setActiveTab('reviews')}
                    style={{
                      padding: '10px 20px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    View All {allReviews.length} Reviews →
                  </button>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', opacity: 0.6, padding: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>📝</div>
                <p>No reviews yet. Reviews will appear here once customers start reviewing your restaurants!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Restaurants Tab */}
      {activeTab === 'restaurants' && (
        <div>
          {/* Header with Add Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              margin: 0
            }}>
              Your Restaurants ({restaurants.length})
            </h2>
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '10px',
                background: 'linear-gradient(45deg, #10b981, #059669)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ➕ Add Restaurant
            </button>
          </div>

          {/* Restaurants Grid */}
          {restaurants.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '20px'
            }}>
              {restaurants.map((restaurant, index) => (
                <div
                  key={restaurant.id || index}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '15px',
                    padding: '20px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '15px'
                  }}>
                    <div>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        marginBottom: '5px',
                        color: 'white'
                      }}>
                        {restaurant.name}
                      </h3>
                      <p style={{
                        fontSize: '12px',
                        opacity: 0.7,
                        margin: 0
                      }}>
                        ID: {restaurant.restaurant_id || restaurant.id}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(restaurant)}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '6px',
                          backgroundColor: 'transparent',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(restaurant)}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid rgba(255, 107, 107, 0.5)',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(255, 107, 107, 0.1)',
                          color: '#ff6b6b',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  {/* Restaurant Details */}
                  <div style={{ marginBottom: '15px' }}>
                    {restaurant.address && (
                      <p style={{
                        fontSize: '14px',
                        opacity: 0.8,
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        📍 {restaurant.address}
                      </p>
                    )}
                    {restaurant.phone && (
                      <p style={{
                        fontSize: '14px',
                        opacity: 0.8,
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        📞 {restaurant.phone}
                      </p>
                    )}
                    {restaurant.category && (
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        backgroundColor: 'rgba(139, 92, 246, 0.3)',
                        color: '#a78bfa',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {restaurant.category}
                      </span>
                    )}
                  </div>

                  {/* Analytics Summary */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                    paddingTop: '15px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        {restaurant.analytics?.totalReviews || 0}
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.7 }}>Reviews</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        {restaurant.analytics?.averageRating ? restaurant.analytics.averageRating.toFixed(1) : '0.0'}
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.7 }}>Rating</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        {restaurant.analytics?.thisMonthReviews || 0}
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.7 }}>This Month</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '15px',
              padding: '60px',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '80px', marginBottom: '20px' }}>🏪</div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '15px'
              }}>
                No Restaurants Yet
              </h3>
              <p style={{
                fontSize: '16px',
                opacity: 0.8,
                marginBottom: '25px',
                maxWidth: '400px',
                margin: '0 auto 25px'
              }}>
                Get started by adding your first restaurant to begin managing reviews and analytics.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  padding: '15px 30px',
                  border: 'none',
                  borderRadius: '12px',
                  background: 'linear-gradient(45deg, #10b981, #059669)',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ➕ Add Your First Restaurant
              </button>
            </div>
          )}

          {/* Add/Edit Restaurant Form Modal */}
          {showAddForm && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '30px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '25px'
                }}>
                  <h3 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    margin: 0
                  }}>
                    {editingRestaurant ? '✏️ Edit Restaurant' : '➕ Add New Restaurant'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingRestaurant(null);
                      resetForm();
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      fontSize: '24px',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        Restaurant ID *
                      </label>
                      <input
                        type="text"
                        value={formData.restaurant_id}
                        onChange={(e) => setFormData({ ...formData, restaurant_id: e.target.value })}
                        placeholder="e.g., honeys_sweets"
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        Restaurant Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Honey's Sweets"
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        Address
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="e.g., 123 Main Street, City"
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div>
                        <label style={{
                          display: 'block',
                          marginBottom: '8px',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="(555) 123-4567"
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{
                          display: 'block',
                          marginBottom: '8px',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                          Category
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="">Select Category</option>
                          <option value="Fast Food">Fast Food</option>
                          <option value="Fine Dining">Fine Dining</option>
                          <option value="Casual Dining">Casual Dining</option>
                          <option value="Cafe">Cafe</option>
                          <option value="Bakery">Bakery</option>
                          <option value="Bar">Bar</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of your restaurant..."
                        rows="3"
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          fontSize: '14px',
                          boxSizing: 'border-box',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '15px',
                      justifyContent: 'flex-end',
                      paddingTop: '20px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setEditingRestaurant(null);
                          resetForm();
                        }}
                        style={{
                          padding: '12px 24px',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '8px',
                          backgroundColor: 'transparent',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{
                          padding: '12px 24px',
                          border: 'none',
                          borderRadius: '8px',
                          background: 'linear-gradient(45deg, #10b981, #059669)',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}
                      >
                        {editingRestaurant ? 'Update Restaurant' : 'Add Restaurant'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {confirmDelete && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '30px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                maxWidth: '400px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '60px', marginBottom: '20px' }}>⚠️</div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginBottom: '15px'
                }}>
                  Delete Restaurant?
                </h3>
                <p style={{
                  fontSize: '16px',
                  opacity: 0.8,
                  marginBottom: '25px'
                }}>
                  Are you sure you want to delete "{confirmDelete.name}"? This action cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    style={{
                      padding: '12px 24px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteRestaurant(confirmDelete.id)}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: '#ff6b6b',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div>
          {/* Filters */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '25px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🔍 Filter Reviews
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Restaurant
                </label>
                <select
                  value={selectedRestaurantFilter}
                  onChange={(e) => setSelectedRestaurantFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value="">All Restaurants</option>
                  {restaurants.map((restaurant) => (
                    <option 
                      key={restaurant.restaurant_id || restaurant.id} 
                      value={restaurant.restaurant_id || restaurant.id}
                      style={{ backgroundColor: '#1a1a1a' }}
                    >
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Search
                </label>
                <input
                  type="text"
                  value={reviewSearchTerm}
                  onChange={(e) => setReviewSearchTerm(e.target.value)}
                  placeholder="Search reviews..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Sort By
                </label>
                <select
                  value={reviewSortBy}
                  onChange={(e) => setReviewSortBy(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value="date-desc" style={{ backgroundColor: '#1a1a1a' }}>Newest First</option>
                  <option value="date-asc" style={{ backgroundColor: '#1a1a1a' }}>Oldest First</option>
                  <option value="rating-high" style={{ backgroundColor: '#1a1a1a' }}>Highest Rating</option>
                  <option value="rating-low" style={{ backgroundColor: '#1a1a1a' }}>Lowest Rating</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  >
                    <option value="" style={{ backgroundColor: '#1a1a1a' }}>All</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1} style={{ backgroundColor: '#1a1a1a' }}>
                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  >
                    <option value="" style={{ backgroundColor: '#1a1a1a' }}>All</option>
                    <option value="2024" style={{ backgroundColor: '#1a1a1a' }}>2024</option>
                    <option value="2025" style={{ backgroundColor: '#1a1a1a' }}>2025</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '25px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                margin: 0
              }}>
                Reviews ({filteredReviews.length})
              </h3>
              
              {filteredReviews.length > 0 && (
                <div style={{
                  fontSize: '14px',
                  opacity: 0.7
                }}>
                  Showing {filteredReviews.length} of {allReviews.length} total reviews
                </div>
              )}
            </div>

            {filteredReviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {filteredReviews.map((review, index) => (
                  <div
                    key={review.id || index}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {/* Review Header */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '15px'
                    }}>
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '8px'
                        }}>
                          <h4 style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            margin: 0,
                            color: '#8b5cf6'
                          }}>
                            {getRestaurantName(review.restaurant_id)}
                          </h4>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            padding: '4px 8px'
                          }}>
                            ⭐ {review.overall_rating || review.sentiment_score || 'N/A'}
                          </div>
                        </div>
                        <div style={{
                          fontSize: '14px',
                          opacity: 0.7,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '15px'
                        }}>
                          <span>👤 {review.user_name || 'Anonymous'}</span>
                          <span>📅 {formatDate(review.timestamp)}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setExpandedReview(
                          expandedReview === review.id ? null : review.id
                        )}
                        style={{
                          padding: '8px 16px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        {expandedReview === review.id ? '👆 Collapse' : '👇 Expand'}
                      </button>
                    </div>

                    {/* Review Summary */}
                    <div style={{
                      marginBottom: '15px'
                    }}>
                      <p style={{
                        fontSize: '15px',
                        lineHeight: '1.6',
                        margin: 0,
                        opacity: 0.9
                      }}>
                        {review.summary || review.feedback || 'No summary available'}
                      </p>
                    </div>

                    {/* Expanded Content */}
                    {expandedReview === review.id && (
                      <div style={{
                        paddingTop: '20px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        {/* Review Categories */}
                        <div style={{ marginBottom: '20px' }}>
                          <ReviewCategories 
                            review={review} 
                            layout="grid" 
                            showEmptyCategories={true}
                            style={{
                              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                              gap: '15px'
                            }}
                          />
                        </div>

                        {/* Specific Points */}
                        {(() => {
                          // Ensure specific_points is an array
                          const specificPoints = Array.isArray(review.specific_points) 
                            ? review.specific_points 
                            : (review.specific_points ? [review.specific_points] : []);
                          
                          return specificPoints.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                              <h5 style={{
                                fontSize: '16px',
                                fontWeight: 'bold',
                                marginBottom: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                🎯 Key Highlights
                              </h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {specificPoints.map((point, pointIndex) => (
                                  <div
                                    key={pointIndex}
                                    style={{
                                      padding: '10px 15px',
                                      backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                      borderRadius: '8px',
                                      border: '1px solid rgba(139, 92, 246, 0.2)',
                                      fontSize: '14px'
                                    }}
                                  >
                                    • {point}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Improvement Suggestions */}
                        {(() => {
                          // Ensure improvement_suggestions is an array
                          const improvementSuggestions = Array.isArray(review.improvement_suggestions) 
                            ? review.improvement_suggestions 
                            : (review.improvement_suggestions ? [review.improvement_suggestions] : []);
                          
                          return improvementSuggestions.length > 0 && (
                            <div>
                              <h5 style={{
                                fontSize: '16px',
                                fontWeight: 'bold',
                                marginBottom: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                💡 Improvement Suggestions
                              </h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {improvementSuggestions.map((suggestion, suggestionIndex) => (
                                  <div
                                    key={suggestionIndex}
                                    style={{
                                      padding: '10px 15px',
                                      backgroundColor: 'rgba(236, 72, 153, 0.1)',
                                      borderRadius: '8px',
                                      border: '1px solid rgba(236, 72, 153, 0.2)',
                                      fontSize: '14px'
                                    }}
                                  >
                                    • {suggestion}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', opacity: 0.6, padding: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>
                  {allReviews.length === 0 ? '📝' : '🔍'}
                </div>
                <p style={{ fontSize: '16px' }}>
                  {allReviews.length === 0 
                    ? 'No reviews yet. Reviews will appear here once customers start reviewing your restaurants!'
                    : 'No reviews match your current filters. Try adjusting your search criteria.'
                  }
                </p>
                {allReviews.length > 0 && filteredReviews.length === 0 && (
                  <button
                    onClick={() => {
                      setSelectedRestaurantFilter('');
                      setReviewSearchTerm('');
                      setSelectedMonth('');
                      setSelectedYear('');
                    }}
                    style={{
                      marginTop: '15px',
                      padding: '10px 20px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Rewards Tab */}
      {activeTab === 'admin-rewards' && (
        <div>
          {/* Debug Section */}
          <div style={{
            backgroundColor: 'rgba(255, 165, 0, 0.1)',
            borderRadius: '12px',
            padding: '15px 20px',
            marginBottom: '25px',
            border: '1px solid rgba(255, 165, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>🔧</span>
              <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                <strong>Debug Tools:</strong> Use these tools to troubleshoot rewards management.
                Current rewards count: {rewards.length}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  console.log('🔍 Current rewards state:', rewards);
                  console.log('🔍 Current user:', currentUser);
                }}
                style={{
                  padding: '8px 16px',
                  border: '1px solid rgba(255, 165, 0, 0.5)',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  color: '#ffb366',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                📝 Log State
              </button>
              <button
                onClick={loadRewards}
                disabled={rewardsSaving}
                style={{
                  padding: '8px 16px',
                  border: '1px solid rgba(255, 165, 0, 0.5)',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  color: '#ffb366',
                  cursor: rewardsSaving ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  opacity: rewardsSaving ? 0.5 : 1
                }}
              >
                🔄 Reload Rewards
              </button>
            </div>
          </div>

          {/* Info Banner */}
          <div style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '12px',
            padding: '15px 20px',
            marginBottom: '25px',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>ℹ️</span>
            <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
              <strong>Rewards Management:</strong> Changes made here are automatically saved and will be reflected on the customer-facing rewards page immediately. 
              Active rewards are visible to customers, while inactive rewards are hidden.
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              margin: 0
            }}>
              Manage Rewards ({rewards.length})
            </h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {rewardsSaving && (
                <div style={{
                  fontSize: '14px',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  ⏳ Saving changes...
                </div>
              )}
              <button
                onClick={async () => {
                  if (window.confirm('Reset to default rewards? This will overwrite your current settings.')) {
                    console.log('🔄 Resetting to default rewards...');
                    const defaultRewards = [
                      { id: 1, name: 'Free Coffee', pointCost: 30, category: 'beverage', icon: '☕', active: true },
                      { id: 2, name: 'Free Dessert', pointCost: 60, category: 'food', icon: '🍰', active: true },
                      { id: 3, name: '10% Discount', pointCost: 100, category: 'discount', icon: '💰', active: true },
                      { id: 4, name: 'Free Appetizer', pointCost: 120, category: 'food', icon: '🥗', active: true },
                      { id: 5, name: 'Free Main Course', pointCost: 250, category: 'food', icon: '🍽️', active: true }
                    ];
                    setRewards(defaultRewards);
                    const success = await saveRewardsToDatabase(defaultRewards);
                    if (success) {
                      console.log('✅ Reset successful, reloading rewards...');
                      setTimeout(() => loadRewards(), 1000);
                    }
                  }
                }}
                disabled={rewardsSaving}
                style={{
                  padding: '10px 20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: 'white',
                  cursor: rewardsSaving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: rewardsSaving ? 0.5 : 1
                }}
              >
                🔄 Reset to Defaults
              </button>
            </div>
          </div>

          {/* Add New Reward Form */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '25px',
            marginBottom: '25px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              ➕ Add New Reward
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              marginBottom: '20px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Reward Name
                </label>
                <input
                  type="text"
                  value={newReward.name}
                  onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                  placeholder="e.g., Free Coffee"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Point Cost
                </label>
                <input
                  type="number"
                  value={newReward.pointCost}
                  onChange={(e) => setNewReward({ ...newReward, pointCost: parseInt(e.target.value) })}
                  min="10"
                  step="10"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Category
                </label>
                <select
                  value={newReward.category}
                  onChange={(e) => setNewReward({ ...newReward, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value="beverage" style={{ backgroundColor: '#1a1a1a' }}>Beverage</option>
                  <option value="food" style={{ backgroundColor: '#1a1a1a' }}>Food</option>
                  <option value="discount" style={{ backgroundColor: '#1a1a1a' }}>Discount</option>
                  <option value="other" style={{ backgroundColor: '#1a1a1a' }}>Other</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Icon
                </label>
                <select
                  value={newReward.icon}
                  onChange={(e) => setNewReward({ ...newReward, icon: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  {iconOptions.map((icon, index) => (
                    <option key={index} value={icon} style={{ backgroundColor: '#1a1a1a' }}>
                      {icon} {icon}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleAddReward}
              disabled={!newReward.name.trim() || rewardsSaving}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                background: newReward.name.trim() && !rewardsSaving
                  ? 'linear-gradient(45deg, #10b981, #059669)' 
                  : 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                cursor: newReward.name.trim() && !rewardsSaving ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 'bold',
                opacity: newReward.name.trim() && !rewardsSaving ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {rewardsSaving ? '⏳ Saving...' : '➕ Add Reward'}
            </button>
          </div>

          {/* Existing Rewards */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '25px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🎁 Current Rewards
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    opacity: reward.active ? 1 : 0.6
                  }}
                >
                  {editingId === reward.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <input
                        type="text"
                        value={reward.name}
                        onChange={(e) => handleRewardEdit(reward.id, 'name', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                      <input
                        type="number"
                        value={reward.pointCost}
                        onChange={(e) => handleRewardEdit(reward.id, 'pointCost', parseInt(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                      <select
                        value={reward.icon}
                        onChange={(e) => handleRewardEdit(reward.id, 'icon', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          fontSize: '14px'
                        }}
                      >
                        {iconOptions.map((icon, index) => (
                          <option key={index} value={icon} style={{ backgroundColor: '#1a1a1a' }}>
                            {icon} {icon}
                          </option>
                        ))}
                      </select>
                      <select
                        value={reward.category}
                        onChange={(e) => handleRewardEdit(reward.id, 'category', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          fontSize: '14px'
                        }}
                      >
                        <option value="beverage" style={{ backgroundColor: '#1a1a1a' }}>Beverage</option>
                        <option value="food" style={{ backgroundColor: '#1a1a1a' }}>Food</option>
                        <option value="discount" style={{ backgroundColor: '#1a1a1a' }}>Discount</option>
                        <option value="other" style={{ backgroundColor: '#1a1a1a' }}>Other</option>
                      </select>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => handleSave(reward.id)}
                          disabled={rewardsSaving}
                          style={{
                            flex: 1,
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: rewardsSaving ? 'rgba(16, 185, 129, 0.5)' : '#10b981',
                            color: 'white',
                            cursor: rewardsSaving ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px'
                          }}
                        >
                          {rewardsSaving ? '⏳ Saving...' : '✅ Save'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            loadRewards();
                          }}
                          disabled={rewardsSaving}
                          style={{
                            flex: 1,
                            padding: '8px 16px',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '6px',
                            backgroundColor: 'transparent',
                            color: 'white',
                            cursor: rewardsSaving ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            opacity: rewardsSaving ? 0.5 : 1
                          }}
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '15px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <span style={{ fontSize: '24px' }}>{reward.icon}</span>
                          <div>
                            <h4 style={{
                              fontSize: '16px',
                              fontWeight: 'bold',
                              margin: 0,
                              marginBottom: '5px'
                            }}>
                              {reward.name}
                            </h4>
                            <div style={{
                              fontSize: '14px',
                              opacity: 0.7,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}>
                              <span>💎 {reward.pointCost} points</span>
                              <span>•</span>
                              <span style={{
                                padding: '2px 8px',
                                backgroundColor: 'rgba(139, 92, 246, 0.3)',
                                borderRadius: '12px',
                                fontSize: '12px'
                              }}>
                                {reward.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <span style={{
                            padding: '4px 8px',
                            backgroundColor: reward.active 
                              ? 'rgba(16, 185, 129, 0.2)' 
                              : 'rgba(107, 114, 128, 0.2)',
                            color: reward.active ? '#10b981' : '#6b7280',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {reward.active ? '✅ Active' : '🔒 Inactive'}
                          </span>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        paddingTop: '15px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <button
                          onClick={() => setEditingId(reward.id)}
                          disabled={rewardsSaving}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '6px',
                            backgroundColor: 'transparent',
                            color: 'white',
                            cursor: rewardsSaving ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            opacity: rewardsSaving ? 0.5 : 1
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleRewardEdit(reward.id, 'active', !reward.active)}
                          disabled={rewardsSaving}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '6px',
                            backgroundColor: reward.active 
                              ? 'rgba(107, 114, 128, 0.2)' 
                              : 'rgba(16, 185, 129, 0.2)',
                            color: reward.active ? '#6b7280' : '#10b981',
                            cursor: rewardsSaving ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            opacity: rewardsSaving ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px'
                          }}
                        >
                          {reward.active ? '🔒 Hide' : '✅ Show'}
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${reward.name}"?`)) {
                              handleDelete(reward.id);
                            }
                          }}
                          disabled={rewardsSaving}
                          style={{
                            padding: '8px 12px',
                            border: '1px solid rgba(255, 107, 107, 0.5)',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(255, 107, 107, 0.1)',
                            color: '#ff6b6b',
                            cursor: rewardsSaving ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            opacity: rewardsSaving ? 0.5 : 1
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;