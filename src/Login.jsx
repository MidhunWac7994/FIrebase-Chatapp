
import React, { useState, useEffect } from 'react';
import { signInWithGoogle, signOutUser, auth } from './fireBase'
import { onAuthStateChanged } from 'firebase/auth';

const Login = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const signedInUser = await signInWithGoogle();
    setUser(signedInUser);
  };

  const handleLogout = async () => {
    await signOutUser();
    setUser(null);
  };
      
  return (
    <div>
      {!user ? (
        <div>
          <button onClick={handleLogin}>Sign in with Google</button>
        </div>
      ) : (
        <div>
          <p>Welcome, {user.displayName}</p>
          <button onClick={handleLogout}>Sign out</button>
        </div>
      )}
    </div>
  );
};

export default Login;
