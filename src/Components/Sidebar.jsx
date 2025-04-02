import { motion } from 'framer-motion';
import { UserCircle2, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth'; // Import signOut from firebase/auth
import { auth } from '../fireBase';
import SearchUsers from '../SearchUsers';

const Sidebar = ({ user, recentUsers, createConversation, sidebarOpen, setSidebarOpen }) => {
  // Sign out function
  const handleSignOut = () => {
    signOut(auth)  // Firebase sign out
      .then(() => {
        console.log('User signed out');
        // Optionally, handle any additional logic after sign-out
      })
      .catch((error) => {
        console.error('Error signing out:', error.message);
      });
  };

  return (
    <motion.div
      variants={{
        open: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
        closed: { x: "-100%", transition: { type: "spring", stiffness: 300, damping: 30 } },
      }}
      initial="closed"
      animate={sidebarOpen ? "open" : "closed"}
      className="w-80 bg-zinc-900/60 backdrop-blur-md border-r border-zinc-800/50 flex flex-col fixed md:relative h-full z-40"
    >
      <div className="p-6 border-b border-zinc-800/70 flex items-center space-x-4">
        {user?.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="w-14 h-14 rounded-full" />
        ) : (
          <UserCircle2 className="text-blue-400" size={56} />
        )}
        <div>
          <p className="text-xl font-bold text-zinc-100">{user?.displayName || 'Welcome'}</p>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <p className="text-sm text-zinc-400">Online</p>
          </div>
        </div>
        <div className="ml-auto">
          <LogOut onClick={handleSignOut} className="text-zinc-500 hover:text-red-500 cursor-pointer" size={24} />
        </div>
      </div>

      <SearchUsers onSelectUser={createConversation} recentUsers={recentUsers} />
    </motion.div>
  );
};

export default Sidebar;
