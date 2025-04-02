import { motion, AnimatePresence } from 'framer-motion';

const MessageList = ({ messages, user }) => {
  return (
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
            <div className={`max-w-xs md:max-w-md ${msg.uid === user?.uid ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-zinc-800'} p-4 shadow-lg`}>
              <div className="flex items-start space-x-3">
                {msg.uid !== user?.uid && <img src={msg.photoURL} alt={msg.displayName} className="w-8 h-8 rounded-full" />}
                <div className="flex flex-col">
                  {msg.uid !== user?.uid && <span className="text-xs text-zinc-400 mb-1">{msg.displayName}</span>}
                  <p className="text-zinc-100">{msg.text}</p>
                  <span className="text-xs text-zinc-400/70 mt-1 self-end">{new Date(msg.timestamp?.toDate()).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default MessageList;
