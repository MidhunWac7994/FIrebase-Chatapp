import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth, signOutUser, signInWithGoogle } from './fireBase';
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc, setDoc, getDocs, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Send, LogOut, MessageCircle, Smile, UserCircle2, Search, ChevronRight, X, Menu, Trash2, AlertCircle, Mail } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { Link } from 'react-router-dom';
import SearchUsers from './SearchUsers';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const storedChattedUsers = localStorage.getItem('chattedUsers');
    if (storedChattedUsers) {
      setRecentUsers(JSON.parse(storedChattedUsers));
    }
  }, []);

  useEffect(() => {
    const fetchChattedUsers = async () => {
      if (!user) return;

      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('users', 'array-contains', user.uid)
      );

      const querySnapshot = await getDocs(conversationsQuery);
      const chattedUserIds = new Set();

      querySnapshot.forEach((doc) => {
        const conversationData = doc.data();
        conversationData.users.forEach((userId) => {
          if (userId !== user.uid) {
            chattedUserIds.add(userId);
          }
        });
      });

      const chattedUsers = [];

      for (const userId of chattedUserIds) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          chattedUsers.push(userDoc.data());
        }
      }

      setRecentUsers(chattedUsers);
      localStorage.setItem('chattedUsers', JSON.stringify(chattedUsers));
    };

    fetchChattedUsers();
  }, [user]);

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
    setOtherUser(otherUserDoc.data());

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
        read: false,
      });

      // Update unread count for the receiver
      const receiverId = activeChat.id.replace(user.uid, '');
      const receiverDoc = doc(db, 'users', receiverId);
      const receiverSnap = await getDoc(receiverDoc);
      if (receiverSnap.exists()) {
        const currentUnread = receiverSnap.data().unreadCount || 0;
        await updateDoc(receiverDoc, {
          unreadCount: currentUnread + 1,
        });
      }

      setMessage('');
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = (msg) => {
    // Only allow users to delete their own messages
    if (msg.uid === user?.uid) {
      setSelectedMessage(msg);
      setShowDeleteModal(true);
    }
  };

  const deleteMessage = async () => {
    if (!selectedMessage || !activeChat) return;

    setDeleteLoading(true);
    try {
      const messageRef = doc(db, 'conversations', activeChat.id, 'messages', selectedMessage.id);
      await deleteDoc(messageRef);
      
      // Close modal after successful deletion
      setShowDeleteModal(false);
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error deleting message:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const onEmojiClick = (emojiObject) => {
    setMessage((prevMessage) => prevMessage + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const toggleProfilePanel = (selectedUser) => {
    if (showProfilePanel && profileUser?.uid === selectedUser?.uid) {
      setShowProfilePanel(false);
    } else {
      setShowProfilePanel(true);
      setProfileUser(selectedUser);
    }
  };

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

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.2,
      },
    },
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
              onClick={() => toggleProfilePanel(user)}
            >
              <motion.img
                initial={{ scale: 0.6, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
                src={user.photoURL}
                alt="Profile"
                className="w-14 h-14 rounded-full border-2 border-sky-500/50 shadow-lg shadow-sky-500/20 cursor-pointer"
              />
            </motion.div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleProfilePanel(user)}
            >
              <UserCircle2 className="text-sky-400 cursor-pointer" size={56} />
            </motion.div>
          )}
          <div>
            <p className="text-xl font-bold text-sky-100">{user?.displayName || 'Welcome'}</p>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <p className="text-sm text-sky-300">Online</p>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.2, rotate: 180 }} whileTap={{ scale: 0.9 }} className="ml-auto">
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
          {/* SearchUsers Component */}
          <SearchUsers onSelectUser={createConversation} />
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
                <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => toggleProfilePanel(otherUser)}>
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
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 bg-green-500"></span>
                  </motion.div>
                  <div className="flex flex-col">
                    <span className="text-xl font-semibold text-sky-100 group-hover:text-sky-400 transition-colors">
                      {otherUser.displayName}
                    </span>
                    <span className="text-sm text-sky-300">Online</span>
                  </div>
                </div>
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
                  onClick={() => handleMessageClick(msg)}
                >
                  <div 
                    className={`max-w-xs md:max-w-md ${msg.uid === user?.uid ? 'bg-gradient-to-r from-sky-600 to-sky-700 rounded-2xl rounded-br-sm' : 'bg-gray-800 rounded-2xl rounded-bl-sm'} p-4 shadow-lg cursor-pointer hover:brightness-110 transition-all relative group`}
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
                          {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    {/* Show delete indicator only for user's own messages */}
                    {msg.uid === user?.uid && (
                      <div 
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="text-red-300 hover:text-red-500 w-4 h-4" />
                      </div>
                    )}
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
              <motion.div whileHover={{ scale: 1.1, rotate: -10 }} whileTap={{ scale: 0.9, rotate: 0 }}>
                <Send
                  onClick={sendMessageToConversation}
                  className={`${message.trim() && activeChat ? 'text-sky-500 hover:text-sky-400' : 'text-gray-600'} cursor-pointer transition-colors`}
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

      {/* Profile Panel (Right Side) */}
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
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative mb-6"
                >
                  <motion.img
                    src={profileUser.photoURL || 'default-avatar-url'}
                    alt={profileUser.displayName}
                    className="w-32 h-32 rounded-full border-4 border-sky-600/50 shadow-lg shadow-sky-500/20"
                  />
                  <span className="absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-gray-900 bg-green-500"></span>
                </motion.div>
                
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

      {/* Delete Message Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-800 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="text-red-500" size={24} />
                  <h3 className="text-xl font-bold text-sky-100">Delete Message</h3>
                </div>
                <X
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-sky-300 cursor-pointer"
                  size={24}
                />
              </div>
              
              <p className="text-sky-200 mb-6">
                Are you sure you want to delete this message? This action cannot be undone.
              </p>
              
              {selectedMessage && (
                <div className="bg-gray-800 p-4 rounded-xl mb-6">
                  <p className="text-sky-100">{selectedMessage.text}</p>
                  <p className="text-xs text-sky-300 mt-2">
                    Sent {selectedMessage.timestamp?.toDate().toLocaleString()}
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sky-200"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={deleteMessage}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white flex items-center justify-center min-w-24"
                >
                  {deleteLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Trash2 size={18} className="mr-2" />
                      Delete
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;