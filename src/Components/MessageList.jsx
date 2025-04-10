import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

const MessageList = ({ 
  messages, 
  user, 
  activeChat, 
  handleMessageClick,
  messagesEndRef
}) => {
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
            onClick={() => handleMessageClick(msg)} 
          >
            <div className={`max-w-xs md:max-w-md ${msg.uid === user?.uid ? 'bg-gradient-to-r from-sky-600 to-sky-700 rounded-2xl rounded-br-sm' : 'bg-gray-800 rounded-2xl rounded-bl-sm'} p-4 shadow-lg cursor-pointer hover:brightness-110 transition-all relative group`}>
              
            
              <div className="flex items-start space-x-3">
           
                {msg.uid !== user?.uid && (
                  <img
                    src={msg.photoURL || 'default-avatar-url'}
                    alt={msg.displayName || 'User'}
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
              
          
              {msg.uid === user?.uid && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 
                    className="text-red-300 hover:text-red-500 w-4 h-4 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation(); 
                      handleMessageClick(msg); 
                    }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
     
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
