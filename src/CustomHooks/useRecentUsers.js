import { useEffect, useState } from 'react';
import { db } from '../fireBase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

const useRecentUsers = () => {
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentUsers = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('lastActive', 'desc'));
        const querySnapshot = await getDocs(q);

        const users = [];
        querySnapshot.forEach((doc) => {
          users.push(doc.data());
        });
        setRecentUsers(users);
      } catch (error) {
        console.error('Error fetching recent users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentUsers();
  }, []);

  return { recentUsers, loading };
};

export default useRecentUsers;
