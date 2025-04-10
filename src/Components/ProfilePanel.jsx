
import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Mail, MessageCircle } from 'lucide-react';

const ProfilePanel = ({ 
  showProfilePanel, 
  setShowProfilePanel,
  profileUser,
  user,
  createConversation
}) => {
  const profilePanelVariants = {
    open: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      x: '100%',
      opacity: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
  }; 

  

  return (
    <AnimatePresence>
      {showProfilePanel && (
        <motion.div
          variants={profilePanelVariants}
          initial="closed"
          animate="open"
          exit="closed"
          className="w-80 bg-gray-900/80 backdrop-blur-md border-l border-gray-800/50 flex flex-col fixed right-0 h-full z-40"
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-800/70">
            <h3 className="text-xl font-bold text-sky-100">Profile</h3>
            <X 
              onClick={() => setShowProfilePanel(false)}
              className="text-gray-400 hover:text-sky-300 cursor-pointer"
              size={24}
            />
          </div>
          
          {profileUser && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center p-6"
            >
              <div className="relative mb-6">
                <img
                  src={profileUser.photoURL || 'default-avatar-url'}
                  alt={profileUser.displayName}
                  className="w-32 h-32 rounded-full border-4 border-sky-600/50 shadow-lg shadow-sky-500/20"
                />
                <span className="absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-gray-900 bg-green-500"></span>
              </div>
              
              <h2 className="text-2xl font-bold text-sky-100 mb-2">{profileUser.displayName}</h2>
              
              <div className="flex items-center space-x-2 text-sky-300 mb-6">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span>Online</span>
              </div>
              
              <div className="w-full space-y-4">
                <div className="flex items-center p-4 bg-gray-800/60 rounded-xl">
                  <Mail className="text-sky-500 mr-3" size={20} />
                  <div>
                    <p className="text-xs text-sky-400 mb-1">Email</p>
                    <p className="text-sky-100">{profileUser.email}</p>
                  </div>
                </div>
                
                {profileUser.uid !== user.uid && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      createConversation(profileUser.uid);
                      setShowProfilePanel(false);
                    }}
                    className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center"
                  >
                    <MessageCircle size={18} className="mr-2" />
                    Send Message
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfilePanel;