import { useState, useEffect } from 'react';
import { db } from './fireBase'; // import your firebase configuration
import { collection, query, where, getDocs } from 'firebase/firestore';

const SearchUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery) {
        setSearchResults([]); 
        return;
      }
      
      const q = query(
        collection(db, 'users'), 
        where('displayName', '>=', searchQuery),
        where('displayName', '<=', searchQuery + '\uf8ff') 
      );

      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => doc.data());
      setSearchResults(results);
    };

    searchUsers();
  }, [searchQuery]);

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search for users..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-zinc-700 text-zinc-100 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-zinc-600"
      />

      {searchResults.length > 0 && (
        <div className="absolute top-full left-0 w-full bg-zinc-800 rounded-xl shadow-lg mt-2">
          {searchResults.map((user, index) => (
            <div key={index} className="flex items-center p-4 border-b border-zinc-700">
              <img src={user.photoURL || '/default-avatar.png'} alt="User Avatar" className="w-8 h-8 rounded-full mr-4" />
              <span className="text-zinc-100">{user.displayName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchUsers;
