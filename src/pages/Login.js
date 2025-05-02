// src/pages/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerMode, setRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [restaurantId, setRestaurantId] = useState('default_restaurant');
  
  const { currentUser, login, register, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for restaurant_id in the URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const restaurantIdParam = params.get('restaurant_id');
    if (restaurantIdParam) {
      setRestaurantId(restaurantIdParam);
    }
  }, [location.search]);
  
  // If user is already logged in, redirect to home
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }
    
    if (!password) {
      setError('Password is required');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(`Failed to log in: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }
    
    if (!password) {
      setError('Password is required');
      return;
    }
    
    if (!name) {
      setError('Name is required');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await register(name, email, password, phone, restaurantId);
      navigate('/');
    } catch (err) {
      setError(`Failed to register: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await googleSignIn(restaurantId);
      navigate('/');
    } catch (err) {
      setError(`Failed to sign in with Google: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Validate South African phone number
  const validateSAPhoneNumber = (phone) => {
    if (!phone || phone.trim() === '') {
      return true; // Empty phone is allowed
    }
    
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // South African numbers should be 10 digits (excluding country code)
    if (digitsOnly.length === 10 && digitsOnly.startsWith('0')) {
      return true;
    }
    
    // Check if it has international code (+27)
    if (digitsOnly.length === 11 && digitsOnly.startsWith('27')) {
      return true;
    }
    
    // Check if it has international code with + (+27)
    if (digitsOnly.length === 12 && digitsOnly.startsWith('270')) {
      return true;
    }
    
    return false;
  };
  
  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="text-center mb-8">
        <span className="text-4xl mb-2">👋</span>
        <h1 className="text-2xl font-bold text-white mt-4">
          Welcome to Restaurant Feedback Portal
        </h1>
        <p className="text-gray-400 mt-2">
          {registerMode
            ? 'Create an account to start sharing your dining experiences'
            : 'Sign in to access your account and share your feedback'}
        </p>
      </div>
      
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            {registerMode ? 'Register' : 'Login'}
          </h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-900 text-white rounded-md">
              {error}
            </div>
          )}
          
          {/* Google Sign-In */}
          <div className="mb-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google logo"
                className="h-5 w-5 mr-2"
              />
              {loading ? 'Processing...' : 'Sign in with Google'}
            </button>
          </div>
          
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">
                Or {registerMode ? 'register' : 'log in'} with email
              </span>
            </div>
          </div>
          
          {/* Registration/Login Form */}
          <form onSubmit={registerMode ? handleRegister : handleLogin}>
            {registerMode && (
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your name"
                />
              </div>
            )}
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>
            
            {registerMode && (
              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                  Phone (South African format, optional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-700 border ${
                    phone && !validateSAPhoneNumber(phone)
                      ? 'border-red-500'
                      : 'border-gray-600'
                  } rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="0XX XXX XXXX"
                />
                {phone && !validateSAPhoneNumber(phone) && (
                  <p className="mt-1 text-sm text-red-500">
                    Please enter a valid South African phone number (e.g., 071 123 4567 or +27 71 123 4567)
                  </p>
                )}
              </div>
            )}
            
            <div className="mt-6">
              <button
                type="submit"
                disabled={loading || (registerMode && phone && !validateSAPhoneNumber(phone))}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? 'Processing...'
                  : registerMode
                    ? 'Register'
                    : 'Login'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="px-6 py-4 bg-gray-700 text-center">
          <p className="text-sm text-gray-300">
            {registerMode ? (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setRegisterMode(false)}
                  className="text-blue-400 hover:text-blue-300 focus:outline-none"
                >
                  Login
                </button>
              </>
            ) : (
              <>
                New user?{' '}
                <button
                  onClick={() => setRegisterMode(true)}
                  className="text-blue-400 hover:text-blue-300 focus:outline-none"
                >
                  Register here
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;