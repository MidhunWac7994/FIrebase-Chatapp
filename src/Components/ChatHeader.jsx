import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { ref, onValue, off } from 'firebase/database';
import { realtimeDb } from '../fireBase';

const ChatHeader = ({ activeChat, otherUser, toggleProfilePanel }) => {
  const [isOpponentOnline, setIsOpponentOnline] = useState(false);
  const [lastOnline, setLastOnline] = useState(null);

  // Fetch opponent's online status and last seen time
  useEffect(() => {
    if (!otherUser) return;

    const presenceRef = ref(realtimeDb, `presence/${otherUser.uid}`);
    onValue(presenceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setIsOpponentOnline(data.online);
        setLastOnline(data.lastOnline);
      }
    });

    return () => off(presenceRef);
  }, [otherUser]);

  // Format last seen timestamp to a readable time
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Unknown";  // Return "Unknown" if no timestamp
    const date = new Date(timestamp);
    return date.toLocaleString([], { hour: "2-digit", minute: "2-digit" });  // Format as time only (e.g. 9:30 AM)
  };

  return (
    <motion.div
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120 }}
      className="p-6 border-b border-gray-800/70 flex items-center space-x-4"
    >
      {activeChat && otherUser ? (
        <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => toggleProfilePanel(otherUser)}>
          <div className="relative">
            <img
              src={otherUser.photoURL || 'default-avatar-url'}
              alt={otherUser.displayName}
              className="w-12 h-12 rounded-full border-2 border-gray-700 group-hover:border-sky-500 transition-colors"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 bg-green-500"></span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-semibold text-sky-100 group-hover:text-sky-400 transition-colors">
              {otherUser.displayName}
            </span>
            <span className="text-sm text-sky-300">
              {isOpponentOnline
                ? "Online Now"
                : `Last seen: ${formatLastSeen(lastOnline)}`}  
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-3">
          <MessageCircle size={32} className="text-sky-500" />
          <span className="text-lg text-sky-300">Select a user to start chatting</span>
        </div>
      )}
    </motion.div>
  );
};

export default ChatHeader;
