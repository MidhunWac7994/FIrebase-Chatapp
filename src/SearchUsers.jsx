import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './fireBase';

const SearchUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Handle input changes to update the search query
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Search for users based on the query
  const searchUsers = async () => {
    if (!searchQuery) {
      setSearchResults([]); // If the query is empty, clear the results
      return;
    }

    // Query Firestore "users" collection
    const q = query(
      collection(db, 'users'),
      where('displayName', '>=', searchQuery),
      where('displayName', '<=', searchQuery + '\uf8ff') // This ensures it does a range search
    );

    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map((doc) => doc.data()); // Extract user data
    setSearchResults(users); // Update search results
  };

  // Trigger search whenever searchQuery changes
  useEffect(() => {
    searchUsers();
  }, [searchQuery]);

  return (
    <div className="p-4">
      <input
        type="text"
        placeholder="Search Users"
        value={searchQuery}
        onChange={handleSearchChange}
        className="w-full p-2 rounded-md bg-zinc-700 text-zinc-100 mb-4"
      />
      {searchResults.length > 0 ? (
        <ul>
          {searchResults.map((user, index) => (
            // Make sure the `key` is unique, either use `uid` or `index` as a fallback
            <li key={user.uid || index} className="flex items-center py-2 border-b border-zinc-600">
              <img
                src={user.photoURL || 'default-avatar-url'} // If no photoURL, show a default one
                alt={user.displayName}
                className="w-8 h-8 rounded-full mr-3"
              />
              <span>{user.displayName}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No users found.</p>
      )}
    </div>
  );
};

export default SearchUsers;
