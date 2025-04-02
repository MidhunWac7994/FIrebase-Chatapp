import React, { useState, useEffect } from 'react';
import { db } from './fireBase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { UserCircle2 } from 'lucide-react';

const SearchUsers = ({ onSelectUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersQuery = query(
        collection(db, 'users'),
        where('displayName', '>=', searchQuery),
        where('displayName', '<=', searchQuery + '\uf8ff')
      );
      const querySnapshot = await getDocs(usersQuery);
      const usersList = querySnapshot.docs.map((doc) => doc.data());
      setUsers(usersList);
    };

    if (searchQuery) {
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

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
        {users.length > 0 ? (
          users.map((user) => (
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
