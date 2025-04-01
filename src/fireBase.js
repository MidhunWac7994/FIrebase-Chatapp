import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getDatabase, ref, set, onValue, update } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  databaseURL: "https://chat-app-285ed-default-rtdb.firebaseio.com", 
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app); 
const auth = getAuth(app);   
const database = getDatabase(app); // Realtime Database instance


const googleProvider = new GoogleAuthProvider();

const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    console.log('Signed in as:', user.displayName);
    return user;
  } catch (error) {
    console.error('Error during Google sign-in:', error);
  }
};

const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log('User signed out');
  } catch (error) {
    console.error('Error during sign-out:', error);
  }
};

// Real-time database functions
const setUserStatus = (userId, status) => {
  const userStatusDatabaseRef = ref(database, 'users/' + userId);
  set(userStatusDatabaseRef, {
    status,
    last_changed: new Date().toISOString(),
  });
};

const updateUserStatus = (userId, status) => {
  const userStatusDatabaseRef = ref(database, 'users/' + userId);
  update(userStatusDatabaseRef, {
    status,
    last_changed: new Date().toISOString(),
  });
};

const listenForUsers = (callback) => {
  const usersRef = ref(database, 'users');
  onValue(usersRef, (snapshot) => {
    const data = snapshot.val();
    callback(data); // Callback function to update the UI
  });
};

export { auth, signInWithGoogle, signOutUser, db, database, setUserStatus, updateUserStatus, listenForUsers };
