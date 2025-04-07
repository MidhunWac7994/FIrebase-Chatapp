// Sidebar.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { X, Menu, LogOut, UserCircle2 } from 'lucide-react';
import SearchUsers from '../SearchUsers'
const Sidebar = ({ 
  user, 
  sidebarOpen, 
  setSidebarOpen, 
  signOutUser,
  toggleProfilePanel,
  recentUsers,
  createConversation // Add this prop
}) => {
  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      x: '-100%',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-full shadow-lg"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <motion.div
        variants={sidebarVariants}
        initial="closed"
        animate={sidebarOpen ? "open" : "closed"}
        className="w-80 bg-gray-900/80 backdrop-blur-md border-r border-gray-800/50 flex flex-col fixed md:relative h-full z-40"
      >
        {/* User Profile Section */}
        <div className="p-6 border-b border-gray-800/70 flex items-center space-x-4">
          {user?.photoURL ? (
            <div
              onClick={() => toggleProfilePanel(user)}
            >
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-14 h-14 rounded-full border-2 border-sky-500/50 shadow-lg shadow-sky-500/20 cursor-pointer"
              />
            </div>
          ) : (
            <div
              onClick={() => toggleProfilePanel(user)}
            >
              <UserCircle2 className="text-sky-400 cursor-pointer" size={56} />
            </div>
          )}
          <div>
            <p className="text-xl font-bold text-sky-100">{user?.displayName || 'Welcome'}</p>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <p className="text-sm text-sky-300">Online</p>
            </div>
          </div>
          <div className="ml-auto">
            <LogOut
              onClick={signOutUser}
              className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
              size={24}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* SearchUsers Component */}
          <SearchUsers onSelectUser={createConversation} />
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;