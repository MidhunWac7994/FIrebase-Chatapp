import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc, collection, onSnapshot } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getDatabase, ref, set, update, onValue } from 'firebase/database';

// Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  databaseURL: "https://chat-app-285ed-default-rtdb.firebaseio.com", // Firebase Realtime DB URL
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Firestore instance
const auth = getAuth(app); // Firebase Auth instance
const database = getDatabase(app); // Realtime Database instance

const googleProvider = new GoogleAuthProvider();

// Sign in with Google
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    console.log('Signed in as:', user.displayName);

    // Save user to Firestore
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL || 'default-avatar-url', // Default avatar if no photoURL
    });

    // Store user status in Realtime Database
    const userStatusRef = ref(database, 'users/' + user.uid);
    set(userStatusRef, {
      status: 'online',
      last_changed: new Date().toISOString(),
    });

    return user;
  } catch (error) {
    console.error('Error during Google sign-in:', error);
  }
};

// Sign out the user
const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log('User signed out');
  } catch (error) {
    console.error('Error during sign-out:', error);
  }
};

// Update user status in Realtime Database
const setUserStatus = async (userId, status) => {
  try {
    const userStatusRef = ref(database, 'users/' + userId);
    await update(userStatusRef, {
      status,
      last_changed: new Date().toISOString(),
    });
    console.log(`User status updated to ${status}`);
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

// Listen for users (Firestore or Realtime Database)
const listenForUsers = (callback) => {
  const usersRef = collection(db, 'users'); // Firestore collection to listen for changes
  onSnapshot(usersRef, (snapshot) => {
    const users = snapshot.docs.map(doc => doc.data());
    callback(users); // Callback function to update the UI
  });
};

// Listen for user status updates in Realtime Database
const listenForStatusUpdates = (callback) => {
  const usersRef = ref(database, 'users'); // Realtime DB reference to listen to user status changes
  onValue(usersRef, (snapshot) => {
    const data = snapshot.val();
    callback(data); // Callback function to update the UI with status changes
  });
};

export { auth, signInWithGoogle, signOutUser, db, database, setUserStatus, listenForUsers, listenForStatusUpdates };
