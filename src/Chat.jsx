import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth, signOutUser } from './fireBase';
import { collection, addDoc, getDocs, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Send, LogOut, Search, UserCircle2, MessageCircle, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const SingleChat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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

  // Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map((doc) => doc.data());
        console.log('Fetched users:', usersList); // Log users for debugging
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  // Search filter
  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sendMessage = async () => {
    if (message.trim() === '' || !selectedUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'messages'), {
        text: message,
        timestamp: new Date(),
        senderId: user?.uid,
        receiverId: selectedUser?.uid,
        displayName: user?.displayName,
        photoURL: user?.photoURL,
      });
      setMessage('');
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for selected user
  useEffect(() => {
    if (!user || !selectedUser) return;

    const q = query(
      collection(db, 'messages'),
      where('senderId', 'in', [user.uid, selectedUser.uid]),
      where('receiverId', 'in', [user.uid, selectedUser.uid]),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(q, (querySnapshot) => {
      let messagesData = [];
      querySnapshot.forEach((doc) => {
        messagesData.push({ id: doc.id, ...doc.data() });
      });
      setMessages(messagesData);
      scrollToBottom();
    });

    return () => unsub();
  }, [user, selectedUser]);

  const onEmojiClick = (emojiObject) => {
    setMessage(prevMessage => prevMessage + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleUserSelection = (user) => {
    setSelectedUser(user);
    setMessages([]);
  };

  return (
    <motion.div className="flex h-screen bg-zinc-900 text-zinc-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-zinc-800 border-r border-zinc-700 flex flex-col">
        <div className="p-6 border-b border-zinc-700 flex items-center space-x-4">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-14 h-14 rounded-full border-2 border-zinc-600 shadow-lg" />
          ) : (
            <UserCircle2 className="text-zinc-500" size={56} />
          )}
          <h2 className="text-xl text-zinc-200">{user?.displayName}</h2>
        </div>

        <div className="p-6 border-b border-zinc-700">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-zinc-500" size={20} />
            <input
              type="text"
              placeholder="Search users"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 pl-10 pr-4 bg-zinc-700 text-zinc-200 rounded-full"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredUsers.map((userItem) => (
            <motion.div
              key={userItem.uid || userItem.displayName}
              className="flex items-center space-x-4 p-3 cursor-pointer hover:bg-zinc-700 rounded-lg"
              onClick={() => handleUserSelection(userItem)}
            >
              <img src={userItem.photoURL} alt="User" className="w-10 h-10 rounded-full" />
              <p>{userItem.displayName}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <motion.div
        className="flex-1 bg-zinc-900 flex flex-col"
        animate={{ x: 0, opacity: 1 }}
      >
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence>
            {messages.length > 0 ? (
              messages.map((msg) => (
                <motion.div key={msg.id} className={`mb-4 ${msg.senderId === user.uid ? 'text-right' : ''}`}>
                  <motion.div className={`inline-block p-4 rounded-xl ${msg.senderId === user.uid ? 'bg-blue-600' : 'bg-zinc-600'}`}>
                    <p>{msg.text}</p>
                  </motion.div>
                </motion.div>
              ))
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-zinc-500">
                <MessageCircle size={64} className="mb-4 text-zinc-700" />
                <p className="text-lg">No messages yet...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Message Input */}
        {user && selectedUser && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-zinc-800 p-5 border-t border-zinc-700">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <motion.div whileHover={{ scale: 1.2, rotate: 15 }} whileTap={{ scale: 0.9 }}>
                  <Smile onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-zinc-500 cursor-pointer hover:text-zinc-300 transition" size={28} />
                </motion.div>
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} className="absolute bottom-full left-0 mb-2 z-10 shadow-2xl rounded-xl overflow-hidden">
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
                className="flex-1 bg-zinc-700 text-zinc-100 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-zinc-600 transition"
              />

              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: '#3f3f46' }}
                whileTap={{ scale: 0.9 }}
                onClick={sendMessage}
                disabled={loading}
                className="bg-zinc-700 text-zinc-100 p-3 rounded-full transition disabled:opacity-50 transform hover:scale-105 active:scale-95 shadow-xl"
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

export default SingleChat;
