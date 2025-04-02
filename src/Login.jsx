import React, { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Chrome } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Track auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Redirect user if authenticated
  useEffect(() => {
    if (user) {
      navigate('/home'); // Only redirect once the user is set
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const currentUser = result.user;

      // Check if the user already exists in Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        // If the user doesn't exist, create a new user document in Firestore
        await setDoc(userDocRef, {
          displayName: currentUser.displayName,
          searchName: currentUser.displayName.toLowerCase(), // For search
          email: currentUser.email,
          photoUrl: currentUser.photoURL,
          chatList: [],
        });
        console.log("✅ User saved to Firestore:", currentUser.uid);
      } else {
        console.log("⚠️ User already exists:", currentUser.uid);
      }

      // Set the user state
      setUser({
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
      });
    } catch (error) {
      setError(error.message); // Handle error
      console.error('Error signing in with Google:', error);
    }
  };

  // Handle Sign-Out
  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null); // Reset user state
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
            <h2 className="text-3xl font-extrabold text-gray-900">Sign in to Your Account</h2>
            <p className="mt-2 text-sm text-gray-600">Welcome back! Please sign in with Google</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4">
              <p>{error}</p>
            </div>
          )}

          {!user ? (
            <div className="mt-6">
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex justify-center py-3 px-4 border border-transparent 
                         rounded-md shadow-sm text-lg font-medium text-white 
                         bg-red-600 hover:bg-red-700 focus:outline-none 
                         focus:ring-2 focus:ring-offset-2 focus:ring-red-500 
                         transition duration-300 ease-in-out transform hover:scale-105"
              >
                <Chrome className="mr-3 h-6 w-6" />
                Sign In With Google
              </button>
            </div>
          ) : (
            <div>
              <p className="mt-4 text-center text-sm text-gray-600">
                Welcome, {user.displayName}
              </p>
              <div className="mt-4 text-center">
                <button
                  onClick={handleLogout}
                  className="w-full py-3 px-4 border border-transparent 
                             rounded-md shadow-sm text-lg font-medium text-white 
                             bg-red-600 hover:bg-red-700 focus:outline-none 
                             focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-gray-600">
            Don't have an account?
            <a
              href="#"
              className="font-medium text-red-600 hover:text-red-500 ml-1"
            >
              Sign up
            </a>
          </p>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          © 2024 Your Company. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Login;
