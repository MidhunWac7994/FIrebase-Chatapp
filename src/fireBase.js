// fireBase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc, collection, onSnapshot } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getDatabase, ref, set, update, onValue, onDisconnect, serverTimestamp } from 'firebase/database';

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
const realtimeDb = getDatabase(app); 

const googleProvider = new GoogleAuthProvider();

const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    console.log('Signed in as:', user.displayName);

    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL || 'default-avatar-url', // Default avatar if no photoURL
    });

    // Store user status in Realtime Database
    const userStatusRef = ref(realtimeDb, 'presence/' + user.uid);
    await set(userStatusRef, {
      online: true,
      lastOnline: serverTimestamp(), // 使用 serverTimestamp
    });

    // Set up onDisconnect to update status when user leaves
    onDisconnect(userStatusRef).set({
      online: false,
      lastOnline: serverTimestamp(), // 使用 serverTimestamp
    });

    return user;
  } catch (error) {
    console.error('Error during Google sign-in:', error);
  }
};

// Sign out the user
const signOutUser = async () => {
  try {
    // Update user status to offline before signing out
    const userStatusRef = ref(realtimeDb, 'presence/' + auth.currentUser.uid);
    await update(userStatusRef, {
      online: false,
      lastOnline: serverTimestamp(), // 使用 serverTimestamp
    });

    await signOut(auth);
    console.log('User signed out');
  } catch (error) {
    console.error('Error during sign-out:', error);
  }
};

// Update user status in Realtime Database
const setUserStatus = async (userId, status) => {
  try {
    const userStatusRef = ref(realtimeDb, 'presence/' + userId);
    await update(userStatusRef, {
      online: status,
      lastOnline: serverTimestamp(), // 使用 serverTimestamp
    });
    console.log(`User status updated to ${status}`);
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

export {
  auth, 
  signInWithGoogle, 
  signOutUser, 
  db, 
  realtimeDb, 
  setUserStatus, 
  serverTimestamp // 导出 serverTimestamp
};