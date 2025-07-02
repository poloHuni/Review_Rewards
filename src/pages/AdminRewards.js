// src/pages/AdminRewards.js - Simple Admin Panel for Owners
import React, { useState, useEffect } from 'react';
import { getRewards, updateRestaurantRewards, DEFAULT_REWARDS } from '../services/rewardsService';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

const AdminRewards = () => {
  const [rewards, setRewards] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newReward, setNewReward] = useState({
    name: '',
    pointCost: 0,
    category: 'beverage',
    icon: '☕',
    active: true
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    const rewardsData = await getRewards();
    setRewards(rewardsData);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateRestaurantRewards('default_restaurant', rewards);
      alert('Rewards updated successfully!');
      setEditingId(null);
      setShowAddForm(false);
    } catch (error) {
      alert('Error saving rewards: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (reward) => {
    setEditingId(reward.id);
  };

  const handleUpdate = (id, field, value) => {
    setRewards(rewards.map(reward => 
      reward.id === id ? { ...reward, [field]: value } : reward
    ));
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this reward?')) {
      setRewards(rewards.filter(reward => reward.id !== id));
    }
  };

  const handleAddNew = () => {
    const newId = Math.max(...rewards.map(r => r.id), 0) + 1;
    setRewards([...rewards, { ...newReward, id: newId }]);
    setNewReward({
      name: '',
      pointCost: 0,
      category: 'beverage',
      icon: '☕',
      active: true
    });
    setShowAddForm(false);
  };

  const resetToDefaults = () => {
    if (confirm('Reset to default rewards? This will overwrite your current settings.')) {
      setRewards(DEFAULT_REWARDS);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="heading-xl">Rewards Management</h1>
          <p className="body-lg">Customize rewards for your customers</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={resetToDefaults}
            className="btn-ghost"
          >
            Reset to Defaults
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Add Reward
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Add New Reward Form */}
      {showAddForm && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Reward</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Reward name"
              value={newReward.name}
              onChange={(e) => setNewReward({...newReward, name: e.target.value})}
              className="input-field"
            />
            <input
              type="number"
              placeholder="Point cost"
              value={newReward.pointCost}
              onChange={(e) => setNewReward({...newReward, pointCost: parseInt(e.target.value)})}
              className="input-field"
            />
            <select
              value={newReward.category}
              onChange={(e) => setNewReward({...newReward, category: e.target.value})}
              className="input-field"
            >
              <option value="beverage">Beverage</option>
              <option value="food">Food</option>
              <option value="discount">Discount</option>
              <option value="special">Special</option>
            </select>
            <input
              type="text"
              placeholder="Icon (emoji)"
              value={newReward.icon}
              onChange={(e) => setNewReward({...newReward, icon: e.target.value})}
              className="input-field"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleAddNew} className="btn-primary">Add Reward</button>
            <button onClick={() => setShowAddForm(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {/* Rewards List */}
      <div className="space-y-4">
        {rewards.map((reward) => (
          <div key={reward.id} className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="text-2xl">{reward.icon}</div>
                
                {editingId === reward.id ? (
                  <div className="grid md:grid-cols-4 gap-3 flex-1">
                    <input
                      type="text"
                      value={reward.name}
                      onChange={(e) => handleUpdate(reward.id, 'name', e.target.value)}
                      className="input-field"
                    />
                    <input
                      type="number"
                      value={reward.pointCost}
                      onChange={(e) => handleUpdate(reward.id, 'pointCost', parseInt(e.target.value))}
                      className="input-field"
                    />
                    <select
                      value={reward.category}
                      onChange={(e) => handleUpdate(reward.id, 'category', e.target.value)}
                      className="input-field"
                    >
                      <option value="beverage">Beverage</option>
                      <option value="food">Food</option>
                      <option value="discount">Discount</option>
                      <option value="special">Special</option>
                    </select>
                    <input
                      type="text"
                      value={reward.icon}
                      onChange={(e) => handleUpdate(reward.id, 'icon', e.target.value)}
                      className="input-field"
                    />
                  </div>
                ) : (
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{reward.name}</h3>
                    <p className="text-slate-300">{reward.pointCost} points • {reward.category}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reward.active}
                    onChange={(e) => handleUpdate(reward.id, 'active', e.target.checked)}
                    className="form-checkbox"
                  />
                  <span className="text-sm text-slate-300">Active</span>
                </label>

                {editingId === reward.id ? (
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-2 text-green-400 hover:bg-green-500/20 rounded"
                  >
                    <Save size={18} />
                  </button>
                ) : (
                  <button
                    onClick={() => handleEdit(reward)}
                    className="p-2 text-blue-400 hover:bg-blue-500/20 rounded"
                  >
                    <Edit2 size={18} />
                  </button>
                )}

                <button
                  onClick={() => handleDelete(reward.id)}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Preview */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{rewards.filter(r => r.active).length}</p>
            <p className="text-sm text-slate-300">Active Rewards</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{Math.min(...rewards.filter(r => r.active).map(r => r.pointCost))}</p>
            <p className="text-sm text-slate-300">Cheapest Reward</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{Math.max(...rewards.filter(r => r.active).map(r => r.pointCost))}</p>
            <p className="text-sm text-slate-300">Most Expensive</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{(rewards.filter(r => r.active).reduce((sum, r) => sum + r.pointCost, 0) / rewards.filter(r => r.active).length).toFixed(0)}</p>
            <p className="text-sm text-slate-300">Average Cost</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRewards;