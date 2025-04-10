import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onValue, onDisconnect, set, update } from 'firebase/database';
import Sidebar from './Components/Sidebar';
import MessageList from './Components/MessageList';
import ChatHeader from './Components/ChatHeader';
import MessageInput from './Components/MessageInput';
import ProfilePanel from './Components/ProfilePanel';
import DeleteMessageModal from './Components/DeleteMessage';
import { auth, db, realtimeDb, signInWithGoogle, signOutUser, setUserStatus, serverTimestamp } from './fireBase';

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

  // 使用 onAuthStateChanged 监听用户登录状态
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 在线状态和最后在线时间的更新
  useEffect(() => {
    if (!user) return;

    const presenceRef = ref(realtimeDb, `presence/${user.uid}`);
    const connectedRef = ref(realtimeDb, `.info/connected`);

    let interval;

    // 设置断开连接时的处理程序
    onDisconnect(presenceRef).set({
      online: false,
      lastOnline: serverTimestamp()
    });

    const handleConnectedChange = (snapshot) => {
      const connected = snapshot.val();
      
      if (connected) {
        // 用户已连接
        set(presenceRef, {
          online: true,
          lastOnline: serverTimestamp()
        });

        // 每 5 分钟更新一次最后在线时间
        interval = setInterval(() => {
          set(presenceRef, {
            online: true,
            lastOnline: serverTimestamp()
          });
        }, 5 * 60 * 1000);
      } else {
        // 用户已断开连接（由 onDisconnect 处理）
        clearInterval(interval);
      }
    };

    onValue(connectedRef, handleConnectedChange);

    // 添加 beforeunload 事件监听器
    const handleBeforeUnload = () => {
      setUserStatus(user.uid, false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // 添加 visibilitychange 事件监听器
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setUserStatus(user.uid, false);
      } else {
        setUserStatus(user.uid, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

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

      // 更新接收者的未读消息数
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
  user={user} // <-- pass user here
  loading={loading}
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