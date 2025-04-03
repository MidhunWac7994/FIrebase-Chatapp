
import { useState } from 'react';

const [showDeleteModal, setShowDeleteModal] = useState(false);
const [messageToDelete, setMessageToDelete] = useState(null);

const LogoutModal = async () => {
  try {

    await deleteDoc(doc(db, 'conversations', activeChat.id, 'messages', messageToDelete));
    setShowDeleteModal(false);
  } catch (error) {
    console.error('Error deleting message:', error);
  }
};

const cancelDelete = () => {
  setShowDeleteModal(false);
  setMessageToDelete(null);
};


{showDeleteModal && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg"
    >
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Delete Message
      </h3>
      <p className="text-gray-600 mb-6">
        Are you sure you want to delete this message? This action cannot be undone.
      </p>
      <div className="flex justify-end space-x-3">
        <button
          onClick={cancelDelete}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={handleDeleteMessage}
          className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-500"
        >
          Delete
        </button>
      </div>
    </motion.div>
  </motion.div>
)}


<div className="flex items-center space-x-2">

  <button
    onClick={() => {
      setMessageToDelete(msg.id);
      setShowDeleteModal(true);
    }}
    className="text-red-500 hover:text-red-600"
  >
    Delete
  </button>
</div>

export default LogoutModal;