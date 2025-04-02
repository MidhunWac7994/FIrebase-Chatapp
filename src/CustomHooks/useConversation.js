import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../fireBase';


const useConversation = (user, setActiveChat, setOtherUser) => {
  const createConversation = async (otherUserUid) => {
    const conversationId = [user.uid, otherUserUid].sort().join('-');
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      await setDoc(conversationRef, {
        users: [user.uid, otherUserUid],
        lastUpdated: new Date(),
      });
    }

    setActiveChat({ id: conversationId });
    const otherUserDoc = await getDoc(doc(db, 'users', otherUserUid));
    setOtherUser(otherUserDoc.data());
  };

  return { createConversation };
};

export default useConversation;
