import { useState } from 'react';

const useEmojiPicker = () => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const toggleEmojiPicker = () => setShowEmojiPicker((prev) => !prev);

  return { showEmojiPicker, toggleEmojiPicker };
};

export default useEmojiPicker;
