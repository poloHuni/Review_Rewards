// src/pages/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight,
  Shield,
  Zap,
  Users
} from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerMode, setRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [restaurantId, setRestaurantId] = useState('default_restaurant');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
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
  
  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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
    
    return false;
  };

  const validateForm = () => {
    const errors = {};
    
    if (!email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (registerMode) {
      if (!name) {
        errors.name = 'Full name is required';
      } else if (name.length < 2) {
        errors.name = 'Name must be at least 2 characters';
      }
      
      if (phone && !validateSAPhoneNumber(phone)) {
        errors.phone = 'Please enter a valid South African phone number';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setError('');
      setLoading(true);
      await register(name, email, password, phone, restaurantId);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
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
      setError(err.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Zap,
      title: "AI-Powered Analysis",
      description: "Get intelligent insights from your feedback"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security"
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Help improve dining experiences for everyone"
    }
  ];
  
  return (
    <div className="min-h-screen flex">
      {/* Left side - Features and branding */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 py-8">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <span className="text-2xl">🍽️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Restaurant Review</h1>
                <p className="text-blue-100 text-sm">AI-Powered Feedback Platform</p>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              Transform dining experiences with intelligent feedback
            </h2>
            
            <p className="text-lg text-blue-100 mb-8 leading-relaxed">
              Join thousands of food enthusiasts and restaurant owners using our platform to create better dining experiences through AI-powered insights.
            </p>
            
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <feature.icon className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-blue-100 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <span className="text-2xl">🍽️</span>
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold text-white">Restaurant Review</h1>
                <p className="text-slate-400 text-sm">AI-Powered Feedback</p>
              </div>
            </div>
            
            <h2 className="heading-lg mb-2">
              {registerMode ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="body-md">
              {registerMode 
                ? 'Start sharing your dining experiences and help restaurants improve'
                : 'Sign in to access your account and continue providing valuable feedback'
              }
            </p>
          </div>
          
          <div className="glass-card rounded-2xl p-8">
            {error && (
              <div className="mb-6 p-4 status-error rounded-lg flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Authentication Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            )}
            
            {/* Google Sign-In */}
            <div className="mb-6">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-lg transition-all duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img
                  src="https://developers.google.com/identity/images/g-logo.png"
                  alt="Google"
                  className="h-5 w-5"
                />
                {loading ? 'Signing in...' : `${registerMode ? 'Sign up' : 'Sign in'} with Google`}
              </button>
            </div>
            
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-800 text-slate-400">
                  Or {registerMode ? 'register' : 'sign in'} with email
                </span>
              </div>
            </div>
            
            {/* Email/Password Form */}
            <form onSubmit={registerMode ? handleRegister : handleLogin} className="space-y-4">
              {registerMode && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (validationErrors.name) {
                          setValidationErrors(prev => ({ ...prev, name: '' }));
                        }
                      }}
                      className={`input-field pl-10 ${validationErrors.name ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : ''}`}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {validationErrors.name && (
                    <p className="mt-1 text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle size={14} />
                      {validationErrors.name}
                    </p>
                  )}
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (validationErrors.email) {
                        setValidationErrors(prev => ({ ...prev, email: '' }));
                      }
                    }}
                    className={`input-field pl-10 ${validationErrors.email ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : ''}`}
                    placeholder="Enter your email"
                  />
                </div>
                {validationErrors.email && (
                  <p className="mt-1 text-red-400 text-sm flex items-center gap-1">
                    <AlertCircle size={14} />
                    {validationErrors.email}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (validationErrors.password) {
                        setValidationErrors(prev => ({ ...prev, password: '' }));
                      }
                    }}
                    className={`input-field pl-10 pr-10 ${validationErrors.password ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : ''}`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="mt-1 text-red-400 text-sm flex items-center gap-1">
                    <AlertCircle size={14} />
                    {validationErrors.password}
                  </p>
                )}
              </div>
              
              {registerMode && (
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-white mb-2">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (validationErrors.phone) {
                          setValidationErrors(prev => ({ ...prev, phone: '' }));
                        }
                      }}
                      className={`input-field pl-10 ${validationErrors.phone ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : ''}`}
                      placeholder="0XX XXX XXXX"
                    />
                  </div>
                  {validationErrors.phone && (
                    <p className="mt-1 text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle size={14} />
                      {validationErrors.phone}
                    </p>
                  )}
                  <p className="mt-1 text-slate-400 text-xs">
                    South African format (e.g., 071 123 4567 or +27 71 123 4567)
                  </p>
                </div>
              )}
              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      {registerMode ? 'Create Account' : 'Sign In'}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          
          <div className="mt-6 text-center">
            <p className="body-md">
              {registerMode ? (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setRegisterMode(false);
                      setValidationErrors({});
                      setError('');
                    }}
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors focus-ring rounded"
                  >
                    Sign in here
                  </button>
                </>
              ) : (
                <>
                  New to our platform?{' '}
                  <button
                    onClick={() => {
                      setRegisterMode(true);
                      setValidationErrors({});
                      setError('');
                    }}
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors focus-ring rounded"
                  >
                    Create an account
                  </button>
                </>
              )}
            </p>
          </div>
          
          {/* Terms and Privacy */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">
              By {registerMode ? 'creating an account' : 'signing in'}, you agree to our{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;