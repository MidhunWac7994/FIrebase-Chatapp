// DeleteMessageModal.js
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, AlertCircle, Trash2 } from 'lucide-react';

const DeleteMessageModal = ({ 
  showDeleteModal, 
  setShowDeleteModal,
  deleteMessage,
  deleteLoading,
  selectedMessage
}) => {
  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <AnimatePresence>
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowDeleteModal(false)}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-800 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <AlertCircle className="text-red-500" size={24} />
                <h3 className="text-xl font-bold text-sky-100">Delete Message</h3>
              </div>
              <X
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-sky-300 cursor-pointer"
                size={24}
              />
            </div>
            
            <p className="text-sky-200 mb-6">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            
            {selectedMessage && (
              <div className="bg-gray-800 p-4 rounded-xl mb-6">
                <p className="text-sky-100">{selectedMessage.text}</p>
                <p className="text-xs text-sky-300 mt-2">
                  Sent {selectedMessage.timestamp?.toDate().toLocaleString()}
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sky-200"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={deleteMessage}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white flex items-center justify-center min-w-24"
              >
                {deleteLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Trash2 size={18} className="mr-2" />
                    Delete
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteMessageModal;