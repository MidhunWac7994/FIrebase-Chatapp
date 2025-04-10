// MessageInput.jsx
import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Send } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { ref, set, remove } from 'firebase/database';
import { realtimeDb } from '../fireBase';

const MessageInput = ({ 
  message, 
  setMessage, 
  activeChat, 
  sendMessageToConversation,
  showEmojiPicker,
  setShowEmojiPicker,
  messageInputRef,
  loading,
  user
}) => {
  // Track typing status with debounce
  useEffect(() => {
    if (!activeChat || !user) return;
    
    // Get other user ID from conversation ID
    const otherUserId = activeChat.id.replace(user.uid, '').replace('-', '');
    
    // Create the typing status path
    const typingRef = ref(realtimeDb, `typing/${activeChat.id}/${user.uid}`);
    
    let typingTimeout = null;
    
    // Update typing status when message changes
    if (message.trim()) {
      // Set typing status to true
      set(typingRef, {
        isTyping: true,
        timestamp: Date.now()
      });
      
      // Clear any existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set timeout to stop typing indication after 2 seconds of inactivity
      typingTimeout = setTimeout(() => {
        remove(typingRef);
      }, 2000);
    } else {
      // Remove typing status if message is empty
      remove(typingRef);
    }
    
    // Cleanup function
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      remove(typingRef);
    };
  }, [message, activeChat, user]);

  const onEmojiClick = (emojiObject) => {
    setMessage((prevMessage) => prevMessage + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, delay: 0.3 }}
        className="p-4 bg-gray-900/80 border-t border-gray-800/50"
      >
        <div className="flex items-center space-x-3 bg-gray-800/90 rounded-xl p-2 px-4">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Smile
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-sky-400 hover:text-sky-300 cursor-pointer transition-colors"
              size={24}
            />
          </motion.div>
          <input
            ref={messageInputRef}
            type="text"
            className="flex-1 p-2 bg-transparent text-sky-100 outline-none placeholder-sky-300/50"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={activeChat ? "Type a message" : "Select a conversation to start"}
            onKeyPress={(e) => e.key === 'Enter' && sendMessageToConversation()}
            disabled={!activeChat || loading}
          />
          <motion.div whileHover={{ scale: 1.1, rotate: -10 }} whileTap={{ scale: 0.9, rotate: 0 }}>
            <Send
              onClick={sendMessageToConversation}
              className={`${message.trim() && activeChat && !loading ? 'text-sky-500 hover:text-sky-400' : 'text-gray-600'} cursor-pointer transition-colors`}
              size={24}
            />
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-50"
          >
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MessageInput;