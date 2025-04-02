import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { db, auth, signOutUser } from './fireBase';
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Send, LogOut, MessageCircle, Smile, UserCircle2 } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import SearchUsers from './SearchUsers';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Function to create a conversation
  const createConversation = async (otherUserUid) => {
    const conversationId = [user.uid, otherUserUid].sort().join('-');
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      // Create a new conversation if it doesn't exist
      await setDoc(conversationRef, {
        users: [user.uid, otherUserUid],
        lastUpdated: new Date(),
      });
    }

    setActiveChat({ id: conversationId });
  };

  // Function to send a message to a conversation
  const sendMessageToConversation = async () => {
    if (message.trim() === '') return;

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
      setMessage('');
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for the active chat
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

  // Emoji picker click handler
  const onEmojiClick = (emojiObject) => {
    setMessage(prevMessage => prevMessage + emojiObject.emoji);
    setShowEmojiPicker(false);
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
          <motion.div whileHover={{ scale: 1.2, rotate: 180 }} whileTap={{ scale: 0.9 }}>
            <LogOut
              onClick={signOutUser}
              className="ml-auto text-zinc-500 hover:text-red-500 cursor-pointer transition"
              size={28}
            />
          </motion.div>
        </motion.div>

        <SearchUsers onSelectUser={createConversation} />
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
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120 }}
          className="p-6 border-b border-zinc-700 flex items-center space-x-4"
        >
          {activeChat ? (
            <>
              <MessageCircle className="text-zinc-500" size={32} />
              <span className="text-xl font-semibold">{activeChat.id}</span>
            </>
          ) : (
            <span>Select a user to start chatting</span>
          )}
        </motion.div>

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-lg mb-3 ${msg.uid === user.uid ? 'bg-blue-600 self-end' : 'bg-zinc-700'}`}
            >
              <div className="flex items-center space-x-3">
                <img
                  src={msg.photoURL || 'default-avatar-url'}
                  alt={msg.displayName}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-400">{msg.displayName}</span>
                  <p>{msg.text}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 flex items-center space-x-4">
          <Smile
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-zinc-400 cursor-pointer"
            size={24}
          />
          <input
            type="text"
            className="flex-1 p-2 rounded-md bg-zinc-700 text-zinc-100"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message"
            onKeyPress={(e) => e.key === 'Enter' && sendMessageToConversation()}
          />
          <Send
            onClick={sendMessageToConversation}
            className="text-zinc-400 cursor-pointer"
            size={24}
          />
        </div>

        {showEmojiPicker && (
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Chat;
