// src/App.js - Updated with Mobile-First Layout
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import MyReviews from './pages/MyReviews';
import OwnerDashboard from './pages/OwnerDashboard';
import RecordFeedback from './pages/RecordFeedback';
import Rewards from './pages/Rewards';
import Vouchers from './pages/Vouchers';
import './styles/neumorphic.css';
import { AnimatePresence, motion } from 'framer-motion';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
          <div className="text-2xl mb-4">🍽️</div>
          <p className="text-slate-300 text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Owner route component
const OwnerRoute = ({ children }) => {
  const { currentUser, loading, isOwner } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-300 text-lg font-medium">Verifying permissions...</p>
        </div>
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (!isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card rounded-3xl p-8 text-center border border-red-500/20 w-full max-w-md">
          <div className="text-6xl mb-6">🚫</div>
          <h2 className="text-2xl font-bold mb-4 text-red-400">Access Denied</h2>
          <p className="text-slate-300 mb-6 text-base leading-relaxed">
            You don't have permission to access the owner dashboard.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 px-6 rounded-2xl text-lg font-bold hover:shadow-lg hover:scale-105 transition-all duration-300 active:scale-95"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return children;
};

// Layout wrapper
const AppLayout = ({ children, showFooter = true }) => {
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Header />
      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
          <div className="text-center max-w-md mx-auto">
            <div className="text-8xl mb-6">😵</div>
            <h1 className="text-3xl font-bold text-white mb-4">Something went wrong</h1>
            <p className="text-slate-300 mb-8 text-lg leading-relaxed">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-6 rounded-2xl text-lg font-bold hover:shadow-lg hover:scale-105 transition-all duration-300 active:scale-95"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          <AppLayout showFooter={false}>
            <Login />
          </AppLayout>
        } />
        
        <Route path="/" element={
          <AppLayout>
            <Home />
          </AppLayout>
        } />
        
        {/* Protected Routes */}
        <Route path="/feedback/:restaurantName" element={
          <AppLayout>
            <ProtectedRoute>
              <RecordFeedback />
            </ProtectedRoute>
          </AppLayout>
        } />
        
        <Route path="/feedback" element={
          <AppLayout>
            <ProtectedRoute>
              <RecordFeedback />
            </ProtectedRoute>
          </AppLayout>
        } />
        
        <Route path="/my-reviews" element={
          <AppLayout>
            <ProtectedRoute>
              <MyReviews />
            </ProtectedRoute>
          </AppLayout>
        } />

        <Route path="/rewards" element={
          <AppLayout>
            <ProtectedRoute>
              <Rewards />
            </ProtectedRoute>
          </AppLayout>
        } />

        <Route path="/vouchers" element={
          <AppLayout>
            <ProtectedRoute>
              <Vouchers />
            </ProtectedRoute>
          </AppLayout>
        } />
        
        {/* Owner Routes */}
        <Route path="/dashboard" element={
          <AppLayout>
            <OwnerRoute>
              <OwnerDashboard />
            </OwnerRoute>
          </AppLayout>
        } />
        
        {/* Catch all route */}
        <Route path="*" element={
          <AppLayout>
            <div className="min-h-screen flex items-center justify-center p-6">
              <div className="text-center max-w-md mx-auto">
                <div className="text-8xl mb-6">🤔</div>
                <h1 className="text-3xl font-bold text-white mb-4">Page Not Found</h1>
                <p className="text-slate-300 mb-8 text-lg leading-relaxed">
                  The page you're looking for doesn't exist.
                </p>
                <Link 
                  to="/"
                  className="inline-block w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-2xl text-lg font-bold hover:shadow-lg hover:scale-105 transition-all duration-300 active:scale-95"
                >
                  Go Home
                </Link>
              </div>
            </div>
          </AppLayout>
        } />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;