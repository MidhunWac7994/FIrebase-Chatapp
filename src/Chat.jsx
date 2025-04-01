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
  const [users, setUsers] = useState([]);
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

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (querySnapshot) => {
      const usersData = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() });
      });
      setUsers(usersData);
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
        photoURL: user?.photoURL,
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

        {/* Display Users */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="py-4 mt-4 border-t border-zinc-700"
        >
          <h3 className="px-6 py-2 text-zinc-300 font-semibold">Users</h3>
          {users.map((user) => (
            <motion.div 
              key={user.id}
              variants={itemVariants}
              className="flex items-center px-6 py-4 cursor-pointer transition hover:bg-zinc-700/50 text-zinc-400"
            >
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full border-2 border-zinc-600 shadow-lg mr-3"
                />
              ) : (
                <UserCircle2 className="mr-3 text-zinc-500" size={24} />
              )}
              <span className="flex-1 font-semibold">{user.displayName || 'Anonymous'}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Main Chat */}
      <motion.div 
        className="flex-1 bg-zinc-700 flex flex-col"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120 }}
      >
        {/* Messages Display */}
        <motion.div 
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
          variants={messageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {messages.map((msg) => (
            <div key={msg.id} className="flex items-start space-x-3">
              <img
                src={msg.photoURL}
                alt={msg.displayName}
                className="w-10 h-10 rounded-full border-2 border-zinc-600 shadow-lg"
              />
              <div className="flex flex-col space-y-1">
                <span className="font-semibold text-zinc-200">{msg.displayName}</span>
                <p className="text-sm text-zinc-300">{msg.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </motion.div>

        {/* Message Input */}
        <div className="p-4 flex items-center space-x-3 border-t border-zinc-700">
          <motion.div
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            whileTap={{ scale: 0.95 }}
            className="text-zinc-400 cursor-pointer"
          >
            <Smile size={20} />
          </motion.div>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message"
            className="flex-1 p-2 bg-zinc-800 text-zinc-100 rounded-lg focus:outline-none"
          />
          <motion.div
            onClick={sendMessage}
            whileTap={{ scale: 0.95 }}
            className="text-zinc-400 cursor-pointer"
          >
            {loading ? (
              <span>Sending...</span>
            ) : (
              <Send size={20} />
            )}
          </motion.div>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-20 left-10 z-50">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Chat;
