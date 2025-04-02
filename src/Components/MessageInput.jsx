import { Smile, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const MessageInput = ({ message, setMessage, sendMessageToConversation, showEmojiPicker, toggleEmojiPicker, messageInputRef }) => {
  return (
    <motion.div className="p-4 bg-zinc-900/60 border-t border-zinc-800/50">
      <div className="flex items-center space-x-3 bg-zinc-800/90 rounded-xl p-2 px-4">
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Smile onClick={toggleEmojiPicker} className="text-zinc-400 hover:text-blue-400 cursor-pointer" size={24} />
        </motion.div>
        <input
          ref={messageInputRef}
          type="text"
          className="flex-1 p-2 bg-transparent text-zinc-100 outline-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
          onKeyPress={(e) => e.key === 'Enter' && sendMessageToConversation()}
        />
        <motion.div whileHover={{ scale: 1.1, rotate: -10 }} whileTap={{ scale: 0.9, rotate: 0 }}>
          <Send onClick={sendMessageToConversation} className={`cursor-pointer ${message.trim() ? 'text-blue-500' : 'text-zinc-600'}`} size={24} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MessageInput;
