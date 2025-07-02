// src/components/DebugTest.js
// TEMPORARY DEBUG COMPONENT - Add this to test your Firestore connection
// Remove this component once everything is working

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc,
  doc 
} from 'firebase/firestore';
import { testReviewPermissions } from '../services/reviewService';

const DebugTest = () => {
  const { currentUser, authDebug } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const addTestResult = (test, status, details) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runFullDiagnostic = async () => {
    setTesting(true);
    setTestResults([]);

    try {
      // Test 1: Authentication State
      addTestResult('Auth State', 'running', 'Checking authentication...');
      
      if (!currentUser) {
        addTestResult('Auth State', 'fail', 'No authenticated user found');
        setTesting(false);
        return;
      }

      if (!currentUser.uid) {
        addTestResult('Auth State', 'fail', 'User UID missing');
        setTesting(false);
        return;
      }

      addTestResult('Auth State', 'pass', `User authenticated: ${currentUser.email}`);

      // Test 2: Firestore Connection
      addTestResult('Firestore Connection', 'running', 'Testing basic connection...');
      
      try {
        // Try to read a collection (even if empty)
        const testQuery = query(collection(db, 'reviews'), where('user_id', '==', 'test'));
        await getDocs(testQuery);
        addTestResult('Firestore Connection', 'pass', 'Can connect to Firestore');
      } catch (error) {
        addTestResult('Firestore Connection', 'fail', `Connection failed: ${error.message}`);
        setTesting(false);
        return;
      }

      // Test 3: Review Permissions
      addTestResult('Review Permissions', 'running', 'Testing review save permissions...');
      
      try {
        const permissionResult = await testReviewPermissions(currentUser);
        if (permissionResult.success) {
          addTestResult('Review Permissions', 'pass', 'Review permissions working');
        } else {
          addTestResult('Review Permissions', 'fail', permissionResult.message);
        }
      } catch (error) {
        addTestResult('Review Permissions', 'fail', `Permission test failed: ${error.message}`);
      }

      // Test 4: Create Test Review
      addTestResult('Create Test Review', 'running', 'Creating actual test review...');
      
      try {
        const testReview = {
          summary: 'Test review from debug component',
          food_quality: 'Good',
          service: 'Good', 
          atmosphere: 'Good',
          music_and_entertainment: 'Good',
          specific_points: ['Test point'],
          sentiment_score: 4,
          improvement_suggestions: ['Test suggestion'],
          restaurant_id: 'test_restaurant',
          restaurant_name: 'Test Restaurant',
          user_id: currentUser.uid,
          user_email: currentUser.email || '',
          user_name: currentUser.displayName || '',
          timestamp: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        };

        const docRef = await addDoc(collection(db, 'reviews'), testReview);
        addTestResult('Create Test Review', 'pass', `Test review created: ${docRef.id}`);

        // Clean up - delete the test review
        await deleteDoc(doc(db, 'reviews', docRef.id));
        addTestResult('Cleanup', 'pass', 'Test review deleted successfully');

      } catch (error) {
        addTestResult('Create Test Review', 'fail', `Failed to create review: ${error.message}`);
      }

      // Test 5: Read User Reviews
      addTestResult('Read User Reviews', 'running', 'Testing review read permissions...');
      
      try {
        const userReviewsQuery = query(
          collection(db, 'reviews'),
          where('user_id', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(userReviewsQuery);
        const reviewCount = querySnapshot.docs.length;
        
        addTestResult('Read User Reviews', 'pass', `Found ${reviewCount} existing reviews`);
      } catch (error) {
        addTestResult('Read User Reviews', 'fail', `Failed to read reviews: ${error.message}`);
      }

    } catch (error) {
      addTestResult('Critical Error', 'fail', error.message);
    }

    setTesting(false);
  };

  return (
    <div className="bg-white border-2 border-yellow-400 rounded-lg p-6 m-4">
      <div className="bg-yellow-100 border border-yellow-400 rounded p-3 mb-4">
        <h2 className="text-lg font-bold text-yellow-800">🔧 DEBUG TEST COMPONENT</h2>
        <p className="text-sm text-yellow-700">
          This is a temporary component to test your Firestore connection. Remove this once everything works!
        </p>
      </div>

      {/* Current Auth State */}
      <div className="mb-6 bg-gray-50 rounded p-4">
        <h3 className="font-semibold mb-2">Current Authentication State:</h3>
        <div className="text-sm space-y-1">
          <div>User: {currentUser ? '✅ Authenticated' : '❌ Not authenticated'}</div>
          <div>UID: {currentUser?.uid || 'None'}</div>
          <div>Email: {currentUser?.email || 'None'}</div>
          <div>Auth Changes: {authDebug?.authAttempts || 0}</div>
          <div>Last Change: {authDebug?.lastAuthChange || 'Never'}</div>
        </div>
      </div>

      {/* Test Button */}
      <button
        onClick={runFullDiagnostic}
        disabled={testing || !currentUser}
        className={`w-full py-3 px-4 rounded-lg font-medium ${
          testing 
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : !currentUser
              ? 'bg-red-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {testing ? 'Running Tests...' : !currentUser ? 'Login Required' : 'Run Full Diagnostic'}
      </button>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3">Test Results:</h3>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded">
                <div className="flex-shrink-0 mt-0.5">
                  {result.status === 'pass' && <span className="text-green-500">✅</span>}
                  {result.status === 'fail' && <span className="text-red-500">❌</span>}
                  {result.status === 'running' && <span className="text-blue-500">🔄</span>}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{result.test}</div>
                  <div className="text-sm text-gray-600">{result.details}</div>
                  <div className="text-xs text-gray-400">{result.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t">
        <h3 className="font-semibold mb-2">Quick Actions:</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => console.log('Current User:', currentUser)}
            className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded"
          >
            Log User to Console
          </button>
          <button
            onClick={() => console.log('Auth Object:', auth)}
            className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded"
          >
            Log Auth to Console
          </button>
          <button
            onClick={() => console.log('DB Object:', db)}
            className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded"
          >
            Log DB to Console
          </button>
          <button
            onClick={() => window.location.reload()}
            className="text-sm bg-blue-100 hover:bg-blue-200 px-3 py-2 rounded text-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>

      {/* Firebase Project Info */}
      <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-2 rounded">
        <div>Project ID: {auth.app.options.projectId}</div>
        <div>Auth Domain: {auth.app.options.authDomain}</div>
      </div>
    </div>
  );
};

export default DebugTest;