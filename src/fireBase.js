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
const database = getDatabase(app); 

const googleProvider = new GoogleAuthProvider();

// Sign in with Google
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    console.log('Signed in as:', user.displayName);

    // Check if user already exists in Firestore
    const userRef = doc(db, 'users', user.uid);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL || 'default-avatar-url',
      });
    }

    // Store user status in Realtime Database
    const userStatusRef = ref(database, 'presence/' + user.uid);
    await set(userStatusRef, {
      online: true,
      lastOnline: serverTimestamp(),
    });

    // Set up onDisconnect to update status when user leaves
    onDisconnect(userStatusRef).set({
      online: false,
      lastOnline: serverTimestamp(),
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
    const userStatusRef = ref(database, 'presence/' + auth.currentUser.uid);
    await update(userStatusRef, {
      online: false,
      lastOnline: serverTimestamp(),
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
    const userStatusRef = ref(database, 'presence/' + userId);
    await update(userStatusRef, {
      online: status,
      lastOnline: serverTimestamp(),
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
  const usersRef = ref(database, 'presence'); // Realtime DB reference to listen to user status changes
  onValue(usersRef, (snapshot) => {
    const data = snapshot.val();
    callback(data); // Callback function to update the UI with status changes
  });
};

// Export necessary modules
export const realtimeDb = database;

export {
  auth, 
  signInWithGoogle, 
  signOutUser, 
  db, 
  database, 
  setUserStatus, 
  listenForUsers, 
  listenForStatusUpdates
};
