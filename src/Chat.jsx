import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth, signInWithGoogle, signOutUser } from './fireBase';
import { collection, addDoc, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  Send, 
  LogOut, 
  MessageCircle, 
  Smile,
  UserCircle2,
  ChevronRight 
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const sendMessage = async () => {
    if (message.trim() === '') return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'messages'), {
        text: message,
        timestamp: new Date(),
        uid: user?.uid,
        displayName: user?.displayName,
        group_id: activeChat.id,
      });
      setMessage('');
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeChat) return;
  
    let q;
    if (activeChat.id === 1) {
      q = query(
        collection(db, 'messages'),
        orderBy('timestamp', 'asc')
      );
    } else {
      q = query(
        collection(db, 'messages'),
        where('group_id', '==', activeChat.id),
        orderBy('timestamp', 'asc')
      );
    }
  
    const unsub = onSnapshot(q, (querySnapshot) => {
      let messagesData = [];
      if (activeChat.id === 1) {
        querySnapshot.forEach((doc) => {
          const msg = { id: doc.id, ...doc.data() };
          if (msg.group_id === 1 || !('group_id' in msg)) {
            messagesData.push(msg);
          }
        });
      } else {
        querySnapshot.forEach((doc) => {
          messagesData.push({ id: doc.id, ...doc.data() });
        });
      }
      setMessages(messagesData);
      scrollToBottom();
    });
  
    return () => unsub();
  }, [activeChat]);

  const onEmojiClick = (emojiObject) => {
    setMessage(prevMessage => prevMessage + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const chatGroups = [
    { id: 1, name: 'General', icon: MessageCircle },
    { id: 2, name: 'Random', icon: Smile },
  ];

  const containerVariants = {
    hidden: { 
      opacity: 0, 
      x: -50,
      transition: { 
        when: "afterChildren" 
      }
    },
    visible: { 
      opacity: 1,
      x: 0,
      transition: { 
        delayChildren: 0.3,
        staggerChildren: 0.2 
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      x: -20,
      scale: 0.8
    },
    visible: { 
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  const messageVariants = {
    initial: { 
      opacity: 0, 
      y: 50,
      scale: 0.9
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    },
    exit: { 
      opacity: 0, 
      y: 50,
      scale: 0.9,
      transition: { 
        duration: 0.3 
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex h-screen bg-zinc-900 text-zinc-100 overflow-hidden"
    >
      {/* Sidebar */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        className="w-80 bg-zinc-800 border-r border-zinc-700 flex flex-col"
      >
        {/* User Profile Section */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120 }}
          className="p-6 border-b border-zinc-700 flex items-center space-x-4"
        >
          {user?.photoURL ? (
            <motion.img 
              initial={{ scale: 0.6, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
              src={user.photoURL} 
              alt="Profile" 
              className="w-14 h-14 rounded-full border-2 border-zinc-600 shadow-lg"
            />
          ) : (
            <UserCircle2 className="text-zinc-500" size={56} />
          )}
          <div>
            <p className="text-xl font-bold text-zinc-100">{user?.displayName || 'Welcome'}</p>
            <p className="text-sm text-zinc-400">Online</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.2, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
          >
            <LogOut 
              onClick={signOutUser} 
              className="ml-auto text-zinc-500 hover:text-red-500 cursor-pointer transition" 
              size={28} 
            />
          </motion.div>
        </motion.div>

        {/* Chat Groups */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="py-4"
        >
          {chatGroups.map((group) => (
            <motion.div 
              key={group.id}
              variants={itemVariants}
              onClick={() => setActiveChat(group)}
              className={`
                flex items-center px-6 py-4 cursor-pointer transition 
                ${activeChat?.id === group.id 
                  ? 'bg-zinc-700 text-zinc-100' 
                  : 'hover:bg-zinc-700/50 text-zinc-400'}
              `}
              whileHover={{ 
                x: 10,
                backgroundColor: 'rgba(63, 63, 70, 0.5)'
              }}
              whileTap={{ scale: 0.95 }}
            >
              <group.icon className="mr-3 text-zinc-500" size={24} />
              <span className="flex-1 font-semibold">{group.name}</span>
              <ChevronRight size={20} className="text-zinc-500" />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Main Chat Area */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        className="flex-1 flex flex-col bg-zinc-800 m-4 rounded-3xl overflow-hidden"
      >
        {/* Chat Header */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-zinc-900 p-5 border-b border-zinc-700 flex justify-between items-center"
        >
          <div className="flex items-center space-x-3">
            <MessageCircle className="text-zinc-500" size={32} />
            <h2 className="text-2xl font-bold text-zinc-100">
              {activeChat?.name || 'Select a Chat'}
            </h2>
          </div>
        </motion.div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-900">
          {!user ? (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-full flex flex-col justify-center items-center text-center"
            >
              <MessageCircle className="text-zinc-700 mb-4" size={64} />
              <p className="text-zinc-500 mb-6 text-lg">Please sign in to start chatting</p>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={signInWithGoogle} 
                className="bg-zinc-700 text-zinc-100 px-8 py-3 
                  rounded-full shadow-xl transform transition hover:bg-zinc-600"
              >
                Sign In with Google
              </motion.button>
            </motion.div>
          ) : activeChat ? (
            <AnimatePresence>
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <motion.div 
                    key={msg.id} 
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={messageVariants}
                    className={`flex ${msg.uid === user.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <motion.div 
                      whileHover={{ 
                        scale: 1.05,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                      }}
                      className={`
                        max-w-md p-4 rounded-2xl shadow-lg
                        ${msg.uid === user.uid 
                          ? 'bg-zinc-700 text-zinc-100' 
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700'}
                        transform transition-all duration-300
                      `}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-sm opacity-80">
                          {msg.uid === user.uid ? 'You' : (msg.displayName || 'Anonymous')}
                        </span>
                      </div>
                      <p>{msg.text}</p>
                    </motion.div>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="h-full flex flex-col justify-center items-center text-center text-zinc-500"
                >
                  <MessageCircle size={64} className="mb-4 text-zinc-700" />
                  <p className="text-lg">No messages in this chat yet</p>
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-full flex flex-col justify-center items-center text-center text-zinc-500"
            >
              <MessageCircle size={64} className="mb-4 text-zinc-700" />
              <p className="text-lg">Select a chat to start messaging</p>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {user && activeChat && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-zinc-800 p-5 border-t border-zinc-700"
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Smile 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-zinc-500 cursor-pointer hover:text-zinc-300 transition"
                    size={28} 
                  />
                </motion.div>
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div 
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.7, opacity: 0 }}
                      className="absolute bottom-full left-0 mb-2 z-10 shadow-2xl rounded-xl overflow-hidden"
                    >
                      <EmojiPicker onEmojiClick={onEmojiClick} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-zinc-700 text-zinc-100 p-3 rounded-full 
                  focus:outline-none focus:ring-2 focus:ring-zinc-600 transition"
              />

              <motion.button 
                whileHover={{ 
                  scale: 1.1,
                  backgroundColor: '#3f3f46'
                }}
                whileTap={{ scale: 0.9 }}
                onClick={sendMessage} 
                disabled={loading}
                className="bg-zinc-700 text-zinc-100 p-3 
                  rounded-full transition disabled:opacity-50 
                  transform hover:scale-105 active:scale-95 shadow-xl"
              >
                {loading ? 'Sending...' : <Send size={20} />}
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Chat;