// src/TestSetup.js
// Temporary component to run the points system setup

import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext'; // ✅ Correct path with 's'
import { 
  completePointsSystemSetup,
  addTestPoints,
  getUserPointsStatus,
  initializeRestaurantRewards,
  updateExistingUsersWithPoints 
} from './services/firebaseSetup';

const TestSetup = () => {
  const { user } = useAuth();
  const [results, setResults] = useState('');
  const [loading, setLoading] = useState(false);

  const runCompleteSetup = async () => {
    if (!user) {
      setResults('❌ Please log in first!');
      return;
    }

    setLoading(true);
    setResults('🚀 Starting setup...\n');

    try {
      const result = await completePointsSystemSetup(user.uid);
      setResults(prev => prev + '\n✅ Setup completed!\n' + JSON.stringify(result, null, 2));
    } catch (error) {
      setResults(prev => prev + '\n❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const runRewardsSetup = async () => {
    setLoading(true);
    setResults('🎁 Setting up rewards...\n');

    try {
      const result = await initializeRestaurantRewards();
      setResults(prev => prev + '\n✅ Rewards setup: ' + result);
    } catch (error) {
      setResults(prev => prev + '\n❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const runUsersUpdate = async () => {
    setLoading(true);
    setResults('👥 Updating existing users...\n');

    try {
      const result = await updateExistingUsersWithPoints();
      setResults(prev => prev + '\n✅ Users updated: ' + JSON.stringify(result, null, 2));
    } catch (error) {
      setResults(prev => prev + '\n❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const giveTestPoints = async () => {
    if (!user) {
      setResults('❌ Please log in first!');
      return;
    }

    setLoading(true);
    setResults('💰 Adding test points...\n');

    try {
      const result = await addTestPoints(user.uid, 150);
      setResults(prev => prev + '\n✅ Test points added: ' + result);
    } catch (error) {
      setResults(prev => prev + '\n❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkPointsStatus = async () => {
    if (!user) {
      setResults('❌ Please log in first!');
      return;
    }

    setLoading(true);
    setResults('📊 Checking points status...\n');

    try {
      const status = await getUserPointsStatus(user.uid);
      setResults(prev => prev + '\n📋 Points Status:\n' + JSON.stringify(status, null, 2));
    } catch (error) {
      setResults(prev => prev + '\n❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔧 Points System Setup</h1>
      
      {user ? (
        <div style={{ marginBottom: '20px', padding: '10px', background: '#e8f5e8', borderRadius: '5px' }}>
          ✅ Logged in as: {user.email || user.uid}
        </div>
      ) : (
        <div style={{ marginBottom: '20px', padding: '10px', background: '#ffe8e8', borderRadius: '5px' }}>
          ❌ Please log in first!
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <button 
          onClick={runCompleteSetup}
          disabled={loading || !user}
          style={{ 
            padding: '10px 20px', 
            background: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: loading || !user ? 'not-allowed' : 'pointer',
            opacity: loading || !user ? 0.5 : 1
          }}
        >
          🚀 Complete Setup
        </button>

        <button 
          onClick={runRewardsSetup}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            background: '#2196F3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          🎁 Setup Rewards
        </button>

        <button 
          onClick={runUsersUpdate}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            background: '#FF9800', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          👥 Update Users
        </button>

        <button 
          onClick={giveTestPoints}
          disabled={loading || !user}
          style={{ 
            padding: '10px 20px', 
            background: '#9C27B0', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: loading || !user ? 'not-allowed' : 'pointer',
            opacity: loading || !user ? 0.5 : 1
          }}
        >
          💰 Add Test Points
        </button>

        <button 
          onClick={checkPointsStatus}
          disabled={loading || !user}
          style={{ 
            padding: '10px 20px', 
            background: '#607D8B', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: loading || !user ? 'not-allowed' : 'pointer',
            opacity: loading || !user ? 0.5 : 1
          }}
        >
          📊 Check Status
        </button>

        <button 
          onClick={() => setResults('')}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            background: '#757575', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          🗑️ Clear
        </button>
      </div>

      {loading && (
        <div style={{ padding: '10px', background: '#fff3cd', borderRadius: '5px', marginBottom: '20px' }}>
          ⏳ Processing...
        </div>
      )}

      <div style={{ 
        background: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '5px', 
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        minHeight: '200px',
        border: '1px solid #ddd'
      }}>
        {results || 'Click a button above to run setup functions...'}
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#e3f2fd', borderRadius: '5px' }}>
        <h3>📋 Instructions:</h3>
        <ol>
          <li><strong>Complete Setup</strong> - Runs everything automatically (recommended)</li>
          <li><strong>Setup Rewards</strong> - Creates the rewards catalog</li>
          <li><strong>Update Users</strong> - Adds points fields to existing users</li>
          <li><strong>Add Test Points</strong> - Gives you 150 test points</li>
          <li><strong>Check Status</strong> - Shows your current points</li>
        </ol>
        <p><strong>After setup:</strong> Delete this component and test your points system!</p>
      </div>
    </div>
  );
};

export default TestSetup;