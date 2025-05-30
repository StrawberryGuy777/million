import { useState, useCallback } from 'react';

const useCopyToClipboard = () => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);

  return [isCopied, handleCopy];
};

export default useCopyToClipboard;