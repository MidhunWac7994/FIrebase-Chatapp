import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ChatHeader = ({ activeChat, otherUser }) => {
  return (
    <div className="p-6 border-b border-zinc-800/70 flex items-center space-x-4">
      {activeChat && otherUser ? (
        <Link to={`/profile/${otherUser.uid}`} className="flex items-center space-x-3 group">
          <img
            src={otherUser.photoURL || 'default-avatar-url'}
            alt={otherUser.displayName}
            className="w-12 h-12 rounded-full border-2 border-zinc-700 group-hover:border-blue-500 transition-colors"
          />
          <div className="flex flex-col">
            <span className="text-xl font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors">{otherUser.displayName}</span>
            <span className="text-sm text-zinc-400">{otherUser.status === 'online' ? 'Online' : 'Offline'}</span>
          </div>
        </Link>
      ) : (
        <div className="flex items-center space-x-3">
          <MessageCircle size={32} className="text-zinc-500" />
          <span className="text-lg text-zinc-400">Select a user to start chatting</span>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
