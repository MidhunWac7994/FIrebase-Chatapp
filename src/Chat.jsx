import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth, signOutUser, signInWithGoogle } from './fireBase';
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc, setDoc, getDocs, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Send, LogOut, MessageCircle, Smile, UserCircle2, Search, ChevronRight, X, Menu } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import SearchUsers from './SearchUsers';
import { Link } from 'react-router-dom';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Define sidebar variants for animations
  const sidebarVariants = {
    open: { 
      x: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }
    },
    closed: { 
      x: "-100%",
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }
    }
  };

  // Function to update user's last active time
  const updateLastActive = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        lastActive: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error updating last active:', error);
    }
  };

  // Format last seen timestamp
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Last seen: Unknown";
    
    // Check if timestamp is a valid Firestore Timestamp
    if (timestamp.toDate) {
      const date = timestamp.toDate();
      return `Last seen: ${date.toLocaleString()}`;
    } else {
      return "Last seen: Unknown";
    }
  };

  // Check if user is online based on lastActive
  const isOnline = otherUser?.lastActive && 
    (otherUser.lastActive.toDate && 
     new Date().getTime() - otherUser.lastActive.toDate().getTime() < 5 * 60 * 1000);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Periodically update last active time
  useEffect(() => {
    if (!user) return;

    updateLastActive(); // Initial update

    const intervalId = setInterval(updateLastActive, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(intervalId);
  }, [user]);

  useEffect(() => {
    const fetchRecentUsers = async () => {
      const recentUsersQuery = query(
        collection(db, 'users'),
        orderBy('lastActive', 'desc')
      );
      const querySnapshot = await getDocs(recentUsersQuery);
      const recentUsersList = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        // Ensure lastActive is properly handled
        if (userData.lastActive && userData.lastActive.toDate) {
          userData.lastActive = userData.lastActive.toDate();
        }
        recentUsersList.push({ ...userData, id: doc.id });
      });
      setRecentUsers(recentUsersList);
    };

    fetchRecentUsers();
  }, []);

  useEffect(() => {
    if (!activeChat) return;

    const q = query(
      collection(db, 'conversations', activeChat.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(q, (querySnapshot) => {
      const messagesData = [];
      querySnapshot.forEach((doc) => {
        messagesData.push({ id: doc.id, ...doc.data() });
      });
      setMessages(messagesData);
      scrollToBottom();
    });

    return () => unsub();
  }, [activeChat]);

  const createConversation = async (otherUserUid) => {
    const conversationId = [user.uid, otherUserUid].sort().join('-');
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      await setDoc(conversationRef, {
        users: [user.uid, otherUserUid],
        lastUpdated: new Date(),
      });
    }

    setActiveChat({ id: conversationId });
    const otherUserDoc = await getDoc(doc(db, 'users', otherUserUid));
    const otherUserData = otherUserDoc.data();
    
    // Ensure lastActive is properly handled
    if (otherUserData.lastActive && otherUserData.lastActive.toDate) {
      otherUserData.lastActive = otherUserData.lastActive.toDate();
    }
    
    setOtherUser(otherUserData);
    
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 300);
    
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const sendMessageToConversation = async () => {
    if (message.trim() === '' || !activeChat) return;

    setLoading(true);
    try {
      const conversationRef = doc(db, 'conversations', activeChat.id);
      await addDoc(collection(conversationRef, 'messages'), {
        text: message,
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        timestamp: new Date(),
      });
      await updateLastActive(); // Update last active after sending message
      setMessage('');
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const onEmojiClick = (emojiObject) => {
    setMessage(prevMessage => prevMessage + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800/90 p-8 rounded-2xl shadow-xl"
        >
          <h2 className="text-2xl font-bold text-sky-100 mb-6 text-center">
            Welcome to Chat App
          </h2>
          <button
            onClick={signInWithGoogle}
            className="flex items-center justify-center space-x-2 bg-sky-600 hover:bg-sky-500 transition-colors rounded-lg py-3 px-6 w-full"
          >
            <span className="text-sky-100 font-medium">Sign in with Google</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-sky-400 to-gray-950 text-sky-50 overflow-hidden">
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
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120, delay: 0.1 }}
          className="p-6 border-b border-gray-800/70 flex items-center space-x-4"
        >
          {user?.photoURL ? (
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.img
                initial={{ scale: 0.6, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
                src={user.photoURL}
                alt="Profile"
                className="w-14 h-14 rounded-full border-2 border-sky-500/50 shadow-lg shadow-sky-500/20"
              />
            </motion.div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <UserCircle2 className="text-sky-400" size={56} />
            </motion.div>
          )}
          <div>
            <p className="text-xl font-bold text-sky-100">{user?.displayName || 'Welcome'}</p>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <p className="text-sm text-sky-300">Online</p>
            </div>
          </div>
          <motion.div 
            whileHover={{ scale: 1.2, rotate: 180 }} 
            whileTap={{ scale: 0.9 }}
            className="ml-auto"
          >
            <LogOut
              onClick={signOutUser}
              className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
              size={24}
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 overflow-y-auto"
        >
          <SearchUsers onSelectUser={createConversation} recentUsers={recentUsers} />
        </motion.div>
      </motion.div>

      {/* Main Chat Area */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-sky-600 to-sky-800/10 pointer-events-none"></div>
        
        <div className="flex-1 flex flex-col bg-gray-900/60 backdrop-blur-md m-4 rounded-3xl overflow-hidden border border-gray-800/50 shadow-xl z-10">
          {/* Chat Header */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 120 }}
            className="p-6 border-b border-gray-800/70 flex items-center space-x-4"
          >
            {activeChat && otherUser ? (
              <>
                <Link to={`/profile/${otherUser.uid}`} className="flex items-center space-x-3 group">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative"
                  >
                    <img
                      src={otherUser.photoURL || 'default-avatar-url'}
                      alt={otherUser.displayName}
                      className="w-12 h-12 rounded-full border-2 border-gray-700 group-hover:border-sky-500 transition-colors"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
                        isOnline ? 'bg-green-500' : 'bg-gray-500'
                      }`}
                    ></span>
                  </motion.div>
                  <div className="flex flex-col">
                    <span className="text-xl font-semibold text-sky-100 group-hover:text-sky-400 transition-colors">
                      {otherUser.displayName}
                    </span>
                    <span className="text-sm">
                      {isOnline ? (
                        <span className="text-green-500 font-medium">● Online Now</span>
                      ) : (
                        <span className="text-gray-400">
                          {formatLastSeen(otherUser.lastActive)}
                        </span>
                      )}
                    </span>
                  </div>
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <MessageCircle size={32} className="text-sky-500" />
                <span className="text-lg text-sky-300">Select a user to start chatting</span>
              </div>
            )}
          </motion.div>

          {/* Messages List */}
          <div className="flex-1 p-4 overflow-y-auto">
            <AnimatePresence>
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  className={`mb-4 flex ${msg.uid === user?.uid ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-xs md:max-w-md ${
                      msg.uid === user?.uid 
                        ? 'bg-gradient-to-r from-sky-600 to-sky-700 rounded-2xl rounded-br-sm' 
                        : 'bg-gray-800 rounded-2xl rounded-bl-sm'
                    } p-4 shadow-lg`}
                  >
                    <div className="flex items-start space-x-3">
                      {msg.uid !== user?.uid && (
                        <img
                          src={msg.photoURL || 'default-avatar-url'}
                          alt={msg.displayName}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div className="flex flex-col">
                        {msg.uid !== user?.uid && (
                          <span className="text-xs text-sky-300 mb-1">{msg.displayName}</span>
                        )}
                        <p className="text-sky-50">{msg.text}</p>
                        <span className="text-xs text-sky-200/70 mt-1 self-end">
                          {msg.timestamp?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
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
                disabled={!activeChat}
              />
              <motion.div 
                whileHover={{ scale: 1.1, rotate: -10 }} 
                whileTap={{ scale: 0.9, rotate: 0 }}
              >
                <Send
                  onClick={sendMessageToConversation}
                  className={`${
                    message.trim() && activeChat 
                      ? 'text-sky-500 hover:text-sky-400' 
                      : 'text-gray-600'
                  } cursor-pointer transition-colors`}
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
        </div>
      </motion.div>
    </div>
  );
};
 
export default Chat;