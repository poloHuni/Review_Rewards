// src/components/Feedback/GoogleReviewModal.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  Trophy,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { formatReviewForSharing } from '../../services/reviewService';

const GoogleReviewModal = ({ 
  isOpen, 
  onClose, 
  reviewData, 
  placeId, 
  googleReviewLink 
}) => {
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1); // 1: celebration, 2: instructions
  
  const formattedReview = formatReviewForSharing(reviewData);
  
  // Auto-advance from celebration to instructions
  useEffect(() => {
    if (isOpen && step === 1) {
      const timer = setTimeout(() => setStep(2), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, step]);
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setStep(1);
    }
  }, [isOpen]);
  
  const handleCopyReview = async () => {
    try {
      await navigator.clipboard.writeText(formattedReview);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };
  
  const handleOpenGoogle = () => {
    if (googleReviewLink) {
      window.open(googleReviewLink, '_blank', 'noopener,noreferrer');
    }
    onClose();
  };
  
  const confettiVariants = {
    hidden: { scale: 0, rotate: -180, opacity: 0 },
    visible: {
      scale: [0, 1.2, 1],
      rotate: [0, 180, 360],
      opacity: [0, 1, 1],
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };
  
  const modalVariants = {
    hidden: { 
      scale: 0.8, 
      opacity: 0, 
      y: 20,
      rotateX: -15
    },
    visible: { 
      scale: 1, 
      opacity: 1, 
      y: 0,
      rotateX: 0,
      transition: { 
        type: "spring", 
        damping: 25, 
        stiffness: 300,
        delay: 0.1 
      }
    },
    exit: { 
      scale: 0.8, 
      opacity: 0, 
      y: 20,
      transition: { duration: 0.2 }
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Modal */}
          <motion.div
            className="relative glass-card rounded-2xl p-8 max-w-lg w-full shadow-2xl overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
            
            {/* Floating confetti */}
            <motion.div
              className="absolute -top-8 -left-8 text-4xl"
              variants={confettiVariants}
              initial="hidden"
              animate="visible"
            >
              🎉
            </motion.div>
            
            <motion.div
              className="absolute -top-6 -right-6 text-3xl"
              variants={confettiVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
            >
              ⭐
            </motion.div>
            
            <motion.div
              className="absolute -bottom-4 -left-4 text-2xl"
              variants={confettiVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.6 }}
            >
              🎊
            </motion.div>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors z-10"
            >
              <X size={20} className="text-slate-400" />
            </button>
            
            <div className="relative text-center">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  // Step 1: Celebration
                  <motion.div
                    key="celebration"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <motion.div
                      className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Trophy className="text-white" size={32} />
                    </motion.div>
                    
                    <div>
                      <motion.h3 
                        className="text-3xl font-bold text-white mb-2"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        Review Saved! 🎊
                      </motion.h3>
                      <motion.p 
                        className="text-slate-300 text-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        Thank you for your valuable feedback!
                      </motion.p>
                    </div>
                    
                    <motion.div
                      className="flex items-center justify-center gap-2 text-blue-400"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                    >
                      <Sparkles size={16} />
                      <span className="text-sm">Getting ready for the next step...</span>
                      <Sparkles size={16} />
                    </motion.div>
                  </motion.div>
                ) : (
                  // Step 2: Google Review Instructions
                  <motion.div
                    key="instructions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Star className="text-white" size={24} />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Share the Love on Google! 💝
                      </h3>
                      <p className="text-slate-300">
                        Help other diners discover this restaurant with your experience
                      </p>
                    </div>
                    
                    {/* Step indicators */}
                    <div className="grid grid-cols-2 gap-4 my-6">
                      <motion.div
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <span className="text-blue-400 font-bold text-sm">1</span>
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium text-sm">Copy Review</p>
                          <p className="text-slate-400 text-xs">Ready to paste</p>
                        </div>
                      </motion.div>
                      
                      <motion.div
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                          <span className="text-emerald-400 font-bold text-sm">2</span>
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium text-sm">Post on Google</p>
                          <p className="text-slate-400 text-xs">Help others decide</p>
                        </div>
                      </motion.div>
                    </div>
                    
                    {/* Review preview */}
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">Your Review Preview</span>
                        <motion.button
                          onClick={handleCopyReview}
                          className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
                          whileTap={{ scale: 0.95 }}
                        >
                          {copied ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex items-center gap-1 text-emerald-400"
                            >
                              <Check size={14} />
                              <span className="text-xs">Copied!</span>
                            </motion.div>
                          ) : (
                            <Copy size={14} className="text-slate-400" />
                          )}
                        </motion.button>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-3">
                        {formattedReview.substring(0, 120)}...
                      </p>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="space-y-3">
                      <motion.button
                        onClick={handleCopyReview}
                        className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-white/20"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {copied ? (
                          <>
                            <Check size={18} className="text-emerald-400" />
                            <span>Review Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={18} />
                            <span>Copy Review Text</span>
                          </>
                        )}
                      </motion.button>
                      
                      <motion.button
                        onClick={handleOpenGoogle}
                        disabled={!googleReviewLink}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <img
                          src="https://developers.google.com/identity/images/g-logo.png"
                          alt="Google"
                          className="h-5 w-5"
                        />
                        <span>Open Google Reviews</span>
                        <ArrowRight size={16} />
                      </motion.button>
                      
                      <motion.button
                        onClick={onClose}
                        className="w-full py-2 text-slate-400 hover:text-white transition-colors text-sm"
                        whileHover={{ scale: 1.02 }}
                      >
                        Maybe Later
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GoogleReviewModal;