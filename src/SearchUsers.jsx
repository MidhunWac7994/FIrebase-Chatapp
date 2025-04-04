import React, { useState, useEffect } from 'react';
import { db } from './fireBase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { UserCircle2 } from 'lucide-react';

const SearchUsers = ({ onSelectUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      const usersQuery = query(collection(db, 'users'));
      const querySnapshot = await getDocs(usersQuery);
      const usersList = querySnapshot.docs.map((doc) => doc.data());
      setUsers(usersList);
      setFilteredUsers(usersList);
    };

    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter((user) =>
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  return (
    <div className="p-6">
      <input
        type="text"
        className="w-full p-2 rounded-md bg-zinc-700 text-zinc-100"
        placeholder="Search users"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div className="mt-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.uid}
              className="flex items-center space-x-4 p-3 hover:bg-zinc-700 rounded-lg cursor-pointer"
              onClick={() => onSelectUser(user.uid)}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <UserCircle2 className="text-zinc-500" size={32} />
              )}
              <span className="text-lg font-semibold text-zinc-100">{user.displayName}</span>
              {user.unreadCount > 0 && (
                <span className="ml-auto bg-sky-500 text-sky-50 text-xs px-2 py-1 rounded-full">
                  {user.unreadCount}
                </span>
              )}
            </div>
          ))
        ) : (
          <p className="text-zinc-400">No users found</p>
        )}
      </div>
    </div>
  );
};

export default SearchUsers;