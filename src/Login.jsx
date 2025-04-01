import React, { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from './firebase'; // Make sure to import Firebase auth and firestore
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Chrome } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const currentUser = result.user;

      // Check if the user already exists in the Firestore database
      const userDocRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        // If user doesn't exist, create a new user document
        await setDoc(userDocRef, {
          displayName: currentUser.displayName,
          searchName: currentUser.displayName.toLowerCase(),
          email: currentUser.email,
          photoUrl: currentUser.photoURL,
          chatList: [],
        });
      }

      // Set user info in local state
      setUser({
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
      });

      // Redirect user to home page after successful login
      navigate('/home');
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Sign in to Your Account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Welcome back! Please sign in with Google
            </p>
          </div>

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
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
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
