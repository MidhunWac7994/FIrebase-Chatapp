import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, where, getDocs, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onValue, onDisconnect, set, update } from 'firebase/database';
import Sidebar from './Components/Sidebar';
import MessageList from './Components/MessageList';
import MessageInput from './Components/MessageInput';
import ProfilePanel from './Components/ProfilePanel';
import DeleteMessageModal from './Components/DeleteMessage';
import { auth, db, realtimeDb, signInWithGoogle, signOutUser, serverTimestamp } from './fireBase';

// Format last seen time helper function
const formatLastSeen = (timestamp) => {
  if (!timestamp) return 'Never online';
  
  const lastOnlineDate = new Date(timestamp);
  const now = new Date();
  const diffMs = now - lastOnlineDate;
  
  // Convert to seconds
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} days ago`;
  
  return lastOnlineDate.toLocaleDateString();
};

// Set user status helper function
const setUserStatus = (uid, isOnline) => {
  if (!uid) return;
  
  const presenceRef = ref(realtimeDb, `presence/${uid}`);
  return update(presenceRef, {
    online: isOnline,
    lastOnline: serverTimestamp()
  }).catch(error => console.error("Error updating presence:", error));
};

// Beautiful Chat Header Component with Updated Icon
const ChatHeader = ({ activeChat, otherUser, toggleProfilePanel, user }) => {
  return (
    <div className="relative">
      {/* Decorative top gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-purple-500 to-pink-500"></div>
      
      <header className="p-4 flex items-center justify-between bg-gray-800/60 backdrop-blur">
        {/* Left side with Logo and Title */}
        <div className="flex items-center">
          <motion.div 
            initial={{ rotate: -10, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center mr-2 md:mr-4"
          >
            <div className="relative flex-shrink-0">
              {/* Chat bubble icon with gradient */}
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-sky-400 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  className="w-5 h-5 md:w-6 md:h-6 text-white"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-gray-800"></div>
            </div>
            <h1 className="ml-2 text-lg md:text-xl font-bold bg-gradient-to-r from-sky-200 to-purple-200 bg-clip-text text-transparent">
              M Chats
            </h1>
          </motion.div>
          
          {/* Separator */}
          <div className="hidden md:block h-8 w-px bg-gray-700/50 mx-2"></div>

          {/* Current chat info (only show when activeChat exists) */}
          {activeChat && otherUser && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center"
            >
              <div 
                className="relative cursor-pointer" 
                onClick={() => toggleProfilePanel(otherUser)}
              >
                <img 
                  src={otherUser.photoURL} 
                  alt={otherUser.displayName} 
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full"
                />
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 md:w-3 md:h-3 ${otherUser.online ? 'bg-green-500' : 'bg-gray-400'} rounded-full border-2 border-gray-800`}></div>
              </div>
              <div className="ml-2 hidden sm:block">
                <h2 className="font-medium text-sm md:text-base text-sky-100">
                  {otherUser.displayName}
                </h2>
                <p className="text-xs text-sky-200/70">
                  {otherUser.online ? 'Online' : `Last seen: ${formatLastSeen(otherUser.lastOnline)}`}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right side with user info/actions */}
        <div className="flex items-center">
          {user && (
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => toggleProfilePanel(user)}
            >
              <div className="hidden md:block text-right mr-3">
                <p className="text-sm font-medium text-sky-100">{user.displayName}</p>
                <p className="text-xs text-sky-200/70">Your Account</p>
              </div>
              <div className="relative">
                <img 
                  src={user.photoURL} 
                  alt={user.displayName} 
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-sky-400/30"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
              </div>
            </div>
          )}
        </div>
      </header>
    </div>
  );
};

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

  // Use onAuthStateChanged to monitor user login status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Online status and last online time update
  useEffect(() => {
    if (!user) return;

    const presenceRef = ref(realtimeDb, `presence/${user.uid}`);
    const connectedRef = ref(realtimeDb, `.info/connected`);

    // Set initial online status
    set(presenceRef, {
      online: true,
      lastOnline: serverTimestamp()
    }).catch(error => console.error("Error setting initial presence:", error));

    let interval;

    // Set up disconnection handler
    const disconnectRef = onDisconnect(presenceRef);
    disconnectRef.set({
      online: false,
      lastOnline: serverTimestamp()
    }).catch(error => console.error("Error setting disconnect handler:", error));

    const handleConnectedChange = (snapshot) => {
      if (snapshot.val() === true) {
        // User is connected
        set(presenceRef, {
          online: true,
          lastOnline: serverTimestamp()
        }).catch(error => console.error("Error updating presence on connect:", error));

        // Update last online time periodically
        interval = setInterval(() => {
          update(presenceRef, {
            lastOnline: serverTimestamp()
          }).catch(error => console.error("Error updating last online time:", error));
        }, 5 * 60 * 1000); // Every 5 minutes
      } else {
        clearInterval(interval);
      }
    };

    const unsubscribe = onValue(connectedRef, handleConnectedChange);

    // Handle visibility change 
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tabs or minimized
        update(presenceRef, {
          online: false,
          lastOnline: serverTimestamp()
        }).catch(error => console.error("Error updating presence on visibility change:", error));
      } else {
        // User returned to the tab
        update(presenceRef, {
          online: true,
          lastOnline: serverTimestamp()
        }).catch(error => console.error("Error updating presence on visibility change:", error));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle beforeunload event
    const handleBeforeUnload = () => {
      setUserStatus(user.uid, false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubscribe();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Set offline status when component unmounts
      set(presenceRef, {
        online: false,
        lastOnline: serverTimestamp()
      }).catch(error => console.error("Error setting offline status on unmount:", error));
    };
  }, [user]);

  // Listen for other user's presence status
  useEffect(() => {
    if (!otherUser || !otherUser.uid) return;
    
    const otherUserPresenceRef = ref(realtimeDb, `presence/${otherUser.uid}`);
    
    const unsubscribe = onValue(otherUserPresenceRef, (snapshot) => {
      const presenceData = snapshot.val();
      if (presenceData) {
        setOtherUser(prevUser => ({
          ...prevUser,
          online: presenceData.online,
          lastOnline: presenceData.lastOnline
        }));
      }
    });
    
    return () => unsubscribe();
  }, [otherUser]);

  useEffect(() => {
    const storedChattedUsers = localStorage.getItem('chattedUsers');
    if (storedChattedUsers) {
      setRecentUsers(JSON.parse(storedChattedUsers));
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchChattedUsers = async () => {
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('users', 'array-contains', user.uid)
      );

      try {
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
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              // Get presence data for each user
              const presenceRef = ref(realtimeDb, `presence/${userId}`);
              const presenceSnapshot = await new Promise(resolve => {
                onValue(presenceRef, snapshot => {
                  resolve(snapshot);
                }, { onlyOnce: true });
              });
              
              const userData = userDoc.data();
              const presenceData = presenceSnapshot.val() || { online: false };
              
              chattedUsers.push({
                ...userData,
                online: presenceData.online || false,
                lastOnline: presenceData.lastOnline || null
              });
            }
          } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
          }
        }

        setRecentUsers(chattedUsers);
        localStorage.setItem('chattedUsers', JSON.stringify(chattedUsers));
      } catch (error) {
        console.error("Error fetching chatted users:", error);
      }
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
    try {
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
      
      // Get other user data
      const otherUserDoc = await getDoc(doc(db, 'users', otherUserUid));
      if (otherUserDoc.exists()) {
        // Get presence data for other user
        const presenceRef = ref(realtimeDb, `presence/${otherUserUid}`);
        const presenceSnapshot = await new Promise(resolve => {
          onValue(presenceRef, snapshot => {
            resolve(snapshot);
          }, { onlyOnce: true });
        });
        
        const userData = otherUserDoc.data();
        const presenceData = presenceSnapshot.val() || { online: false };
        
        setOtherUser({
          ...userData,
          online: presenceData.online || false,
          lastOnline: presenceData.lastOnline || null
        });
      }

      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 300);

      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
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
      
      // Update conversation's lastUpdated field
      await updateDoc(conversationRef, {
        lastUpdated: new Date()
      });
      
      // Update unread count for receiver
      const receiverId = activeChat.id.split('-').filter(id => id !== user.uid)[0];
      if (receiverId) {
        const receiverDoc = doc(db, 'users', receiverId);
        const receiverSnap = await getDoc(receiverDoc);
        if (receiverSnap.exists()) {
          const currentUnread = receiverSnap.data().unreadCount || 0;
          await updateDoc(receiverDoc, {
            unreadCount: currentUnread + 1,
          });
        }
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
            onClick={() => signInWithGoogle()}
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
      <Sidebar 
        user={user} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        signOutUser={() => signOutUser()}
        toggleProfilePanel={toggleProfilePanel}
        recentUsers={recentUsers}
        createConversation={createConversation}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-sky-600 to-sky-800/10 pointer-events-none"></div>
        
        <div className="flex-1 flex flex-col bg-gray-900/60 backdrop-blur-md m-4 rounded-3xl overflow-hidden border border-gray-800/50 shadow-xl z-10">
          <ChatHeader 
            activeChat={activeChat}
            otherUser={otherUser}
            toggleProfilePanel={toggleProfilePanel}
            user={user}  
          />
          
          <MessageList 
            messages={messages}  
            user={user}
            activeChat={activeChat}
            handleMessageClick={handleMessageClick}
            messagesEndRef={messagesEndRef}
          />
          
          <MessageInput 
            message={message}
            setMessage={setMessage}
            activeChat={activeChat}
            sendMessageToConversation={sendMessageToConversation}
            showEmojiPicker={showEmojiPicker}
            setShowEmojiPicker={setShowEmojiPicker}
            messageInputRef={messageInputRef}
            loading={loading}
            user={user}  
          />
        </div>
      </motion.div>

      <ProfilePanel 
        showProfilePanel={showProfilePanel}
        setShowProfilePanel={setShowProfilePanel}
        profileUser={profileUser}
        user={user}
        createConversation={createConversation}
      />

      <DeleteMessageModal 
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        deleteMessage={deleteMessage}
        deleteLoading={deleteLoading}
        selectedMessage={selectedMessage}
      />
    </div>
  );
};

export default Chat;