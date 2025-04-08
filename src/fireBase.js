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
      photoURL: user.photoURL || 'default-avatar-url', 
    });

    const userStatusRef = ref(database, 'presence/' + user.uid);
    await set(userStatusRef, {
      online: true,
      lastOnline: serverTimestamp(), 
    });

    onDisconnect(userStatusRef).set({
      online: false,
      lastOnline: serverTimestamp(), 
    });

    return user;
  } catch (error) {
    console.error('Error during Google sign-in:', error);
  }
};

const signOutUser = async () => {
  try {
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

const setTypingStatus = async (conversationId, userId, isTyping) => {
  try {
    const typingStatusRef = ref(database, `typingStatus/${conversationId}/${userId}`);
    await set(typingStatusRef, {
      isTyping: isTyping,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating typing status:', error);
  }
};

const listenForUsers = (callback) => {
  const usersRef = collection(db, 'users'); 
  onSnapshot(usersRef, (snapshot) => {
    const users = snapshot.docs.map(doc => doc.data());
    callback(users);
  });
};

const listenForStatusUpdates = (callback) => {
  const usersRef = ref(database, 'presence'); 
  onValue(usersRef, (snapshot) => {
    const data = snapshot.val();
    callback(data); 
  });
};

export const realtimeDb = database;

export {
  auth, 
  signInWithGoogle, 
  signOutUser, 
  db, 
  database, 
  setUserStatus, 
  listenForUsers, 
  listenForStatusUpdates,
  serverTimestamp,
  setTypingStatus
};