// src/pages/OwnerDashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getRestaurantsByOwner, 
  saveRestaurant, 
  deleteRestaurant, 
  getRestaurantAnalytics,
  verifyOwnerPassword 
} from '../services/restaurantService';
import StarRating from '../components/Reviews/StarRating';
import { formatDate } from '../utils/dateUtils';
import { 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Star, 
  MessageSquare, 
  Calendar,
  MapPin,
  Phone,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';

const OwnerDashboard = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [restaurantPhone, setRestaurantPhone] = useState('');
  const [restaurantPlaceId, setRestaurantPlaceId] = useState('');
  const [formError, setFormError] = useState('');
  
  // Password verification
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { currentUser, isOwner } = useAuth();
  
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        
        if (!currentUser || !isOwner) {
          throw new Error('Unauthorized access');
        }
        
        const ownerId = currentUser.uid || currentUser.user_id;
        const restaurantsData = await getRestaurantsByOwner(ownerId);
        
        setRestaurants(restaurantsData);
        
        // Set first restaurant as selected for analytics
        if (restaurantsData.length > 0 && !selectedRestaurantId) {
          setSelectedRestaurantId(restaurantsData[0].restaurant_id);
        }
      } catch (err) {
        console.error('Error fetching restaurants:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (passwordVerified) {
      fetchRestaurants();
    }
  }, [currentUser, isOwner, passwordVerified, selectedRestaurantId]);
  
  // Fetch analytics when selected restaurant changes
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedRestaurantId || !passwordVerified) return;
      
      try {
        setAnalyticsLoading(true);
        const analyticsData = await getRestaurantAnalytics(selectedRestaurantId);
        setAnalytics(analyticsData);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setAnalyticsLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [selectedRestaurantId, passwordVerified]);
  
  const handleSubmitPassword = (e) => {
    e.preventDefault();
    
    if (!ownerPassword) {
      setPasswordError('Password is required');
      return;
    }
    
    if (verifyOwnerPassword(ownerPassword)) {
      setPasswordVerified(true);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
    }
  };
  
  // Reset form fields
  const resetForm = () => {
    setRestaurantName('');
    setRestaurantAddress('');
    setRestaurantPhone('');
    setRestaurantPlaceId('');
    setEditingRestaurant(null);
    setFormError('');
    setShowAddForm(false);
  };
  
  // Set form fields from restaurant data
  const populateForm = (restaurant) => {
    setEditingRestaurant(restaurant);
    setRestaurantName(restaurant.name || '');
    setRestaurantAddress(restaurant.address || '');
    setRestaurantPhone(restaurant.phone || '');
    setRestaurantPlaceId(restaurant.google_place_id || '');
    setShowAddForm(true);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!restaurantName) {
      setFormError('Restaurant name is required');
      return;
    }
    
    try {
      const restaurantData = {
        name: restaurantName,
        address: restaurantAddress,
        phone: restaurantPhone,
        google_place_id: restaurantPlaceId
      };
      
      // If editing, add restaurant_id
      if (editingRestaurant) {
        restaurantData.restaurant_id = editingRestaurant.restaurant_id;
      }
      
      const ownerId = currentUser.uid || currentUser.user_id;
      await saveRestaurant(restaurantData, ownerId);
      
      // Refresh restaurants list
      const updatedRestaurants = await getRestaurantsByOwner(ownerId);
      setRestaurants(updatedRestaurants);
      
      // Reset form
      resetForm();
      
      // Show success message
      alert(editingRestaurant ? 'Restaurant updated successfully' : 'Restaurant added successfully');
    } catch (err) {
      console.error('Error saving restaurant:', err);
      setFormError(`Failed to save restaurant: ${err.message}`);
    }
  };
  
  // Handle restaurant deletion
  const handleDeleteRestaurant = async (restaurantId) => {
    try {
      await deleteRestaurant(restaurantId);
      
      // Refresh restaurants list
      const ownerId = currentUser.uid || currentUser.user_id;
      const updatedRestaurants = await getRestaurantsByOwner(ownerId);
      setRestaurants(updatedRestaurants);
      
      // Clear selected restaurant if it was deleted
      if (selectedRestaurantId === restaurantId) {
        setSelectedRestaurantId(updatedRestaurants.length > 0 ? updatedRestaurants[0].restaurant_id : null);
      }
      
      // Reset confirmDelete
      setConfirmDelete(null);
      
      // Show success message
      alert('Restaurant deleted successfully');
    } catch (err) {
      console.error('Error deleting restaurant:', err);
      setError(`Failed to delete restaurant: ${err.message}`);
    }
  };
  
  // If password not verified, show password form
  if (!passwordVerified) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Building className="text-white" size={24} />
              </div>
              <h2 className="heading-md mb-2">Owner Verification</h2>
              <p className="body-md">Please enter your owner password to access the dashboard</p>
            </div>
            
            {passwordError && (
              <div className="mb-4 p-4 status-error rounded-lg flex items-center gap-3">
                <AlertCircle size={18} />
                <span>{passwordError}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmitPassword} className="space-y-4">
              <div>
                <label htmlFor="ownerPassword" className="block text-sm font-medium text-white mb-2">
                  Owner Password
                </label>
                <div className="relative">
                  <input
                    id="ownerPassword"
                    type={showPassword ? "text" : "password"}
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="Enter owner password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                className="btn-primary w-full focus-ring"
              >
                Verify Access
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="body-md">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="glass-card rounded-2xl p-8 text-center status-error">
          <h2 className="heading-md mb-4">Dashboard Error</h2>
          <p className="body-md mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary focus-ring"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Tab content components
  const OverviewTab = () => (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card-subtle rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="body-sm mb-1">Total Restaurants</p>
              <p className="text-3xl font-bold text-white">{restaurants.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Building className="text-blue-400" size={24} />
            </div>
          </div>
        </div>
        
        <div className="glass-card-subtle rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="body-sm mb-1">Total Reviews</p>
              <p className="text-3xl font-bold text-white">{analytics?.totalReviews || 0}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="text-emerald-400" size={24} />
            </div>
          </div>
        </div>
        
        <div className="glass-card-subtle rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="body-sm mb-1">Average Rating</p>
              <p className="text-3xl font-bold text-white">{analytics?.averageSentiment?.toFixed(1) || '0.0'}</p>
            </div>
            <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Star className="text-amber-400" size={24} />
            </div>
          </div>
        </div>
        
        <div className="glass-card-subtle rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="body-sm mb-1">Trend</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-white">
                  {analytics?.recentTrend?.average?.toFixed(1) || '0.0'}
                </p>
                {analytics?.recentTrend?.delta && (
                  analytics.recentTrend.delta > 0 ? (
                    <TrendingUp className="text-emerald-400" size={20} />
                  ) : (
                    <TrendingDown className="text-red-400" size={20} />
                  )
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-purple-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card-subtle rounded-xl p-6">
        <h3 className="heading-sm mb-4">Quick Actions</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => {
              setActiveTab('restaurants');
              setShowAddForm(true);
            }}
            className="p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all duration-200 text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                <Plus className="text-blue-400" size={20} />
              </div>
              <div>
                <h4 className="font-medium text-white">Add Restaurant</h4>
                <p className="body-sm">Register a new location</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            className="p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all duration-200 text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                <BarChart3 className="text-emerald-400" size={20} />
              </div>
              <div>
                <h4 className="font-medium text-white">View Analytics</h4>
                <p className="body-sm">Review performance data</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('restaurants')}
            className="p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all duration-200 text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                <Building className="text-purple-400" size={20} />
              </div>
              <div>
                <h4 className="font-medium text-white">Manage Restaurants</h4>
                <p className="body-sm">Edit locations and details</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      {analytics?.reviews && analytics.reviews.length > 0 && (
        <div className="glass-card-subtle rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="heading-sm">Recent Reviews</h3>
            <button
              onClick={() => setActiveTab('analytics')}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1"
            >
              View All
              <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="space-y-4">
            {analytics.reviews.slice(0, 3).map((review) => (
              <div key={review.id || review.review_id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-white">
                      {review.customer_name || 'Anonymous'}
                    </h4>
                    <p className="body-sm">
                      {review.timestamp ? formatDate(review.timestamp) : 'Unknown date'}
                    </p>
                  </div>
                  <StarRating rating={review.sentiment_score} size="sm" />
                </div>
                <p className="text-slate-300 text-sm line-clamp-2">{review.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const RestaurantsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="heading-lg">Restaurant Management</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center gap-2 focus-ring"
        >
          <Plus size={18} />
          Add Restaurant
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="glass-card-subtle rounded-xl p-6">
          <h3 className="heading-sm mb-6">
            {editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
          </h3>
          
          {formError && (
            <div className="mb-4 p-4 status-error rounded-lg flex items-center gap-3">
              <AlertCircle size={18} />
              <span>{formError}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="restaurantName" className="block text-sm font-medium text-white mb-2">
                  Restaurant Name *
                </label>
                <input
                  id="restaurantName"
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="input-field"
                  placeholder="Enter restaurant name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="restaurantPhone" className="block text-sm font-medium text-white mb-2">
                  Phone Number
                </label>
                <input
                  id="restaurantPhone"
                  type="text"
                  value={restaurantPhone}
                  onChange={(e) => setRestaurantPhone(e.target.value)}
                  className="input-field"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="restaurantAddress" className="block text-sm font-medium text-white mb-2">
                Address
              </label>
              <input
                id="restaurantAddress"
                type="text"
                value={restaurantAddress}
                onChange={(e) => setRestaurantAddress(e.target.value)}
                className="input-field"
                placeholder="Enter restaurant address"
              />
            </div>
            
            <div>
              <label htmlFor="restaurantPlaceId" className="block text-sm font-medium text-white mb-2">
                Google Place ID
              </label>
              <input
                id="restaurantPlaceId"
                type="text"
                value={restaurantPlaceId}
                onChange={(e) => setRestaurantPlaceId(e.target.value)}
                className="input-field"
                placeholder="Enter Google Place ID"
              />
              <p className="body-sm mt-1">
                Used to link directly to Google Reviews. You can find your Place ID using the Google Places API.
              </p>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="btn-primary focus-ring"
              >
                {editingRestaurant ? 'Update Restaurant' : 'Add Restaurant'}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary focus-ring"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Restaurants List */}
      <div className="space-y-4">
        {restaurants.length === 0 ? (
          <div className="glass-card-subtle rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">🏪</div>
            <h3 className="heading-sm mb-2">No Restaurants Yet</h3>
            <p className="body-md mb-6">Add your first restaurant to start collecting feedback.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary focus-ring"
            >
              <Plus size={18} className="mr-2" />
              Add Restaurant
            </button>
          </div>
        ) : (
          restaurants.map((restaurant) => (
            <div key={restaurant.restaurant_id} className="glass-card-subtle rounded-xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="heading-sm mb-2">{restaurant.name}</h3>
                  <div className="space-y-1">
                    <p className="body-sm flex items-center gap-2">
                      <span className="text-slate-400">ID:</span>
                      <span className="font-mono">{restaurant.restaurant_id}</span>
                    </p>
                    {restaurant.address && (
                      <p className="body-sm flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400" />
                        {restaurant.address}
                      </p>
                    )}
                    {restaurant.phone && (
                      <p className="body-sm flex items-center gap-2">
                        <Phone size={14} className="text-slate-400" />
                        {restaurant.phone}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => populateForm(restaurant)}
                    className="btn-ghost flex items-center gap-2 focus-ring"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDelete(restaurant.restaurant_id)}
                    className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 focus-ring"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
              
              {/* Delete confirmation */}
              {confirmDelete === restaurant.restaurant_id && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <p className="text-white mb-3">
                    Are you sure you want to delete <strong>{restaurant.name}</strong>?
                    This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDeleteRestaurant(restaurant.restaurant_id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors focus-ring"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="btn-secondary focus-ring"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Main render
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-xl">Owner Dashboard</h1>
          <p className="body-lg">Manage your restaurants and monitor feedback analytics</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="status-success px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
            <CheckCircle size={16} />
            Verified Owner
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="glass-card-subtle rounded-xl p-1">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'overview'
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('restaurants')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'restaurants'
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            Restaurants
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'analytics'
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'restaurants' && <RestaurantsTab />}
        {activeTab === 'analytics' && (
          <div>
            {/* Analytics content would go here - similar structure to existing analytics tab */}
            <p className="body-md">Analytics content coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;