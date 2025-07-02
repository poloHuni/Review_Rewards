// src/pages/Vouchers.js - Fixed Import Path
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext'; // ✅ Fixed: added 's' to contexts
import { getUserVouchers } from '../services/rewardsService';
import { Ticket, Clock, CheckCircle } from 'lucide-react';

const Vouchers = () => {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVouchers = async () => {
      if (user) {
        const userVouchers = await getUserVouchers(user.uid);
        setVouchers(userVouchers);
      }
      setLoading(false);
    };

    fetchVouchers();
  }, [user]);

  const formatTime = (date) => {
    return new Date(date.seconds * 1000).toLocaleString();
  };

  if (loading) return <div className="text-center py-8">Loading vouchers...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="heading-xl">My Vouchers</h1>
        <p className="body-lg">Show these to staff to redeem your rewards</p>
      </div>

      {vouchers.length === 0 ? (
        <div className="text-center py-12">
          <Ticket className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">No Active Vouchers</h3>
          <p className="text-slate-300">Redeem rewards to see your vouchers here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {vouchers.map((voucher) => (
            <div key={voucher.id} className="voucher-card">
              <div className="glass-card rounded-xl p-6 border-2 border-green-500/30 bg-gradient-to-r from-green-500/10 to-blue-500/10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <div className="text-4xl">{voucher.icon}</div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{voucher.rewardName}</h3>
                      <p className="text-green-400 font-medium">FREE - Show to Staff</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="bg-white/10 rounded-lg px-4 py-2 mb-2">
                      <p className="text-sm text-slate-300">Voucher Code</p>
                      <p className="text-2xl font-mono font-bold text-white">{voucher.voucherCode}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Clock size={16} />
                      <span>Expires at midnight</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle size={16} />
                      <span>Ready to use</span>
                    </div>
                    <span className="text-slate-300">
                      Redeemed: {formatTime(voucher.redeemedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Instructions */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3">How to Use Vouchers</h3>
        <div className="space-y-2 text-slate-300">
          <p>• Show this screen to restaurant staff</p>
          <p>• Staff will verify the voucher code</p>
          <p>• Vouchers expire at midnight on the day they're created</p>
          <p>• You can only redeem one reward per day</p>
        </div>
      </div>
    </div>
  );
};

export default Vouchers;