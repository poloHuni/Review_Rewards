// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import MyReviews from './pages/MyReviews';
import OwnerDashboard from './pages/OwnerDashboard';
import RecordFeedback from './pages/RecordFeedback';
import { AnimatePresence, motion } from 'framer-motion';

// Protected route component with smooth loading
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="body-md">Loading...</p>
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="body-md">Verifying permissions...</p>
        </div>
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (!isOwner) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="glass-card rounded-2xl p-8 text-center status-error">
          <h2 className="heading-md mb-4">Access Denied</h2>
          <p className="body-md mb-6">You don't have permission to access the owner dashboard.</p>
          <button 
            onClick={() => window.history.back()}
            className="btn-primary focus-ring"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return children;
};

// Page transition wrapper
const PageTransition = ({ children }) => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ 
          duration: 0.3,
          ease: "easeInOut"
        }}
        className="min-h-screen flex flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Layout wrapper for consistent spacing and structure
const AppLayout = ({ children, showFooter = true }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip header on login page for cleaner design */}
      {!isLoginPage && <Header />}
      
      {/* Main content area */}
      <main className={`flex-1 ${isLoginPage ? '' : 'py-8 px-4 sm:px-6 lg:px-8'}`}>
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      
      {/* Footer */}
      {showFooter && !isLoginPage && <Footer />}
    </div>
  );
};

// Error boundary for better error handling
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
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <div className="glass-card rounded-2xl p-8 max-w-md mx-auto">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="heading-md mb-4">Something went wrong</h2>
              <p className="body-md mb-6">
                We apologize for the inconvenience. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary focus-ring"
              >
                Refresh Page
              </button>
            </div>
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
        
        {/* Feedback routes */}
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
        
        {/* User routes */}
        <Route path="/my-reviews" element={
          <AppLayout>
            <ProtectedRoute>
              <MyReviews />
            </ProtectedRoute>
          </AppLayout>
        } />
        
        {/* Owner routes */}
        <Route path="/dashboard" element={
          <AppLayout>
            <OwnerRoute>
              <OwnerDashboard />
            </OwnerRoute>
          </AppLayout>
        } />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="app-container">
          {/* Global background */}
          <div className="fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent"></div>
          </div>
          
          <AppContent />
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;