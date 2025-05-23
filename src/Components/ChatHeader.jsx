import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { ref, onValue, off } from "firebase/database";
import { realtimeDb } from "../fireBase";

const ChatHeader = ({ activeChat, otherUser, toggleProfilePanel, user }) => {
  const [isOpponentOnline, setIsOpponentOnline] = useState(false);
  const [lastOnline, setLastOnline] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

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

  // Monitor typing status
  useEffect(() => {
    if (!activeChat || !otherUser || !user) return;

    // Get the correct typing reference path for the other user
    const typingRef = ref(realtimeDb, `typing/${activeChat.id}/${otherUser.uid}`);
    
    const typingListener = onValue(typingRef, (snapshot) => {
      const typingData = snapshot.val();
      setIsTyping(!!typingData);
      
      // Auto-reset typing status after 3 seconds as a fallback
      if (typingData) {
        const now = Date.now();
        const typingTime = typingData.timestamp;
        
        // If typing data is more than 3 seconds old, consider it stale
        if (now - typingTime > 3000) {
          setIsTyping(false);
        }
      }
    });

    return () => off(typingRef);
  }, [activeChat, otherUser, user]);

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Typing indicator animation
  const TypingIndicator = () => (
    <div className="flex space-x-1 mt-1">
      <motion.div 
        className="w-2 h-2 bg-sky-400 rounded-full"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
      />
      <motion.div 
        className="w-2 h-2 bg-sky-400 rounded-full"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
      />
      <motion.div 
        className="w-2 h-2 bg-sky-400 rounded-full"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
      />
    </div>
  );

  return (
    <motion.div
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120 }}
      className="p-6 border-b border-gray-800/70 flex items-center space-x-4"
    >
      {activeChat && otherUser ? (
        <div
          className="flex items-center space-x-3 group cursor-pointer"
          onClick={() => toggleProfilePanel(otherUser)}
        >
          <div className="relative">
            <img
              src={otherUser.photoURL || "default-avatar-url"}
              alt={otherUser.displayName}
              className="w-12 h-12 rounded-full border-2 border-gray-700 group-hover:border-sky-500 transition-colors"
            />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${
                isOpponentOnline ? "bg-green-500" : "bg-red-500"
              }`}
            ></span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-semibold text-sky-100 group-hover:text-sky-400 transition-colors">
              {otherUser.displayName}
            </span>
            <span className="text-sm text-sky-300">
              {isTyping ? (
                <div className="flex items-center">
                  <span className="mr-2">Typing</span>
                  <TypingIndicator />
                </div>
              ) : isOpponentOnline ? (
                "Online"
              ) : (
                `Last seen: ${formatLastSeen(lastOnline)}`
              )}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-3">
          <MessageCircle size={32} className="text-sky-500" />
          <span className="text-lg text-sky-300">
            Select a user to start chatting 
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default ChatHeader;