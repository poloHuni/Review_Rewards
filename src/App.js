// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Sidebar from './components/Layout/Sidebar';
import Home from './pages/Home';
import Login from './pages/Login';
import MyReviews from './pages/MyReviews';
import OwnerDashboard from './pages/OwnerDashboard';
import RecordFeedback from './pages/RecordFeedback';
import { FeedbackForm } from './components/Feedback/FeedbackForm';


// Protected route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
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
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (!isOwner) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function AppContent() {
  const { currentUser, isOwner } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <Header />
      
      <div className="flex flex-1">
        {currentUser && (
          <aside className="hidden md:block w-64 bg-gray-800 p-4">
            <Sidebar />
          </aside>
        )}
        
        <main className="flex-1 p-4">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            {/* Add new route with restaurant name parameter */}
            <Route path="/feedback/:restaurantName" element={
              <ProtectedRoute>
                <RecordFeedback />
              </ProtectedRoute>
            } />
            
            {/* Keep original route for backward compatibility */}
            <Route path="/feedback" element={
              <ProtectedRoute>
                <RecordFeedback />
              </ProtectedRoute>
            } />
            
            <Route path="/my-reviews" element={
              <ProtectedRoute>
                <MyReviews />
              </ProtectedRoute>
            } />
            
            {/* Owner routes */}
            <Route path="/dashboard" element={
              <OwnerRoute>
                <OwnerDashboard />
              </OwnerRoute>
            } />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
      
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;