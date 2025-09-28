/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { DownloadIcon, ShareIcon } from './icons';
import { motion } from 'framer-motion';
import { urlToFile } from '../lib/utils';

interface HistoryGalleryProps {
  history: string[];
  selectedImage: string | null;
  onSelect: (url: string) => void;
  onDownloadAll: () => void;
  isLoading: boolean;
}

const HistoryGallery: React.FC<HistoryGalleryProps> = ({ history, selectedImage, onSelect, onDownloadAll, isLoading }) => {
  if (history.length <= 1) {
    return null; // Don't show the gallery if there's only the initial image or nothing
  }

  const handleShare = async () => {
    if (!selectedImage) {
      console.warn("No image selected to share.");
      return;
    }

    if (!navigator.share) {
      alert("Sharing is not supported on this browser.");
      return;
    }
    
    try {
      // urlToFile converts the image to a PNG file.
      const file = await urlToFile(selectedImage, 'outfit-story.png');

      await navigator.share({
        files: [file],
        title: 'My Outfit Story',
        text: 'Check out this look I created!',
      });

    // FIX: Catch clauses should use `unknown` for better type safety.
    } catch (error: unknown) {
      console.error('Error sharing:', error);
      // Don't alert if user cancels share dialog
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      alert(`Could not share image. ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur-md border-t border-gray-200/60 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-serif tracking-wider text-gray-800">Generation History</h3>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={handleShare}
            disabled={isLoading || !selectedImage}
            className="flex items-center justify-center text-center bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-3 rounded-lg transition-all duration-200 ease-in-out hover:bg-gray-100 text-sm disabled:opacity-50"
            aria-label="Share selected image"
            title="Share selected image"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ShareIcon className="w-4 h-4 mr-2" />
            Share
          </motion.button>
          <motion.button
            onClick={onDownloadAll}
            disabled={isLoading || history.length === 0}
            className="flex items-center justify-center text-center bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-3 rounded-lg transition-all duration-200 ease-in-out hover:bg-gray-100 text-sm disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Download All
          </motion.button>
        </div>
      </div>
      <div className="flex space-x-3 overflow-x-auto pb-2 -mb-2">
        {history.map((imageUrl, index) => (
          <motion.button
            key={imageUrl}
            onClick={() => onSelect(imageUrl)}
            className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 border-transparent hover:border-gray-400/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`Select generation ${index + 1}`}
          >
            <img src={imageUrl} alt={`Generation ${index + 1}`} className="w-full h-full object-cover" />
            {selectedImage === imageUrl && (
              <motion.div 
                className="absolute inset-0 border-2 border-gray-800 rounded-lg bg-gray-900/30"
                layoutId="selected-history-item"
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default HistoryGallery;