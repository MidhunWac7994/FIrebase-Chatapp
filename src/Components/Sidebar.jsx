import React from 'react';
import { motion } from 'framer-motion';
import { X, Menu, LogOut, UserCircle2, Mail } from 'lucide-react';
import SearchUsers from '../SearchUsers';

const Sidebar = ({ 
  user, 
  sidebarOpen, 
  setSidebarOpen, 
  signOutUser,
  toggleProfilePanel,
  recentUsers,
  createConversation
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
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <motion.div
        variants={sidebarVariants}
        initial="closed"
        animate={sidebarOpen ? "open" : "closed"}
        className="w-80 bg-gray-900/90 backdrop-blur-md border-r border-sky-500/20 flex flex-col fixed md:relative h-full z-40 shadow-xl"
      >
        {/* User Profile Section */}
        <div className="p-6 border-b border-sky-500/30 flex items-center space-x-4 bg-gradient-to-r from-gray-900 to-gray-800">
          {user?.photoURL ? (
            <div
              onClick={() => toggleProfilePanel(user)}
              className="transition-transform hover:scale-105"
            >
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-14 h-14 rounded-full border-2 border-sky-500/70 shadow-lg shadow-sky-500/20 cursor-pointer hover:border-sky-400 transition-all"
              />
            </div>
          ) : (
            <div
              onClick={() => toggleProfilePanel(user)}
              className="transition-transform hover:scale-105"
            >
              <UserCircle2 className="text-sky-400 cursor-pointer hover:text-sky-300 transition-colors" size={56} />
            </div>
          )}
          <div>
            <p className="text-xl font-bold text-sky-100">{user?.displayName || 'Welcome'}</p>
            <div className="flex items-center mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <p className="text-sm text-sky-300">Online</p>
            </div>
            {user?.email && (
              <div className="flex items-center mt-1 text-xs text-gray-400">
                <Mail size={12} className="mr-1" />
                <span className="truncate max-w-32">{user.email}</span>
              </div>
            )}
          </div>
          <div className="ml-auto">
            <LogOut
              onClick={signOutUser}
              className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
              size={24}
            />
          </div>
        </div>

        {/* Recent Users Section */}
        <div className="px-4 py-3 border-b border-sky-500/20">
          <h3 className="text-sky-300 font-semibold text-sm uppercase tracking-wider mb-2">Recent Conversations</h3>
          {recentUsers && recentUsers.length > 0 ? (
            <div className="space-y-2">
              {recentUsers.map((recentUser) => (
                <div 
                  key={recentUser.uid} 
                  onClick={() => createConversation(recentUser)}
                  className="flex items-center p-2 rounded-lg cursor-pointer hover:bg-sky-500/10 border border-transparent hover:border-sky-500/30 transition-all group"
                >
                  {recentUser.photoURL ? (
                    <img 
                      src={recentUser.photoURL} 
                      alt={recentUser.displayName} 
                      className="w-10 h-10 rounded-full border border-gray-700 group-hover:border-sky-500/50 transition-colors"
                    />
                  ) : (
                    <UserCircle2 className="text-gray-400 group-hover:text-sky-400 transition-colors" size={40} />
                  )}
                  <div className="ml-3">
                    <p className="text-gray-200 group-hover:text-sky-100 transition-colors">{recentUser.displayName}</p>
                    {recentUser.email && (
                      <p className="text-xs text-gray-500 group-hover:text-sky-300 transition-colors truncate max-w-32">{recentUser.email}</p>
                    )}
                  </div>
                  <div className="ml-auto">
                    <span className="w-2 h-2 bg-gray-600 rounded-full block group-hover:bg-sky-500 transition-colors"></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">No recent conversations</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto border-t border-sky-500/10">
          {/* SearchUsers Component */}
          <div className="p-4">
            <SearchUsers onSelectUser={createConversation} />
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;    