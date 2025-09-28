/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InstagramIcon, CopyIcon, CheckIcon } from './icons';
import Spinner from './Spinner';

interface PostCopyPanelProps {
  onGeneratePostCopy: () => void;
  postCopy: string | null;
  setPostCopy: (copy: string | null) => void;
  isLoading: boolean;
  brandName: string;
  setBrandName: (name: string) => void;
}

const PostCopyPanel: React.FC<PostCopyPanelProps> = ({ onGeneratePostCopy, postCopy, setPostCopy, isLoading, brandName, setBrandName }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (!postCopy || isCopied) return;
    navigator.clipboard.writeText(postCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };
  
  return (
    <div className="pt-6 border-t border-gray-400/50">
      <h2 className="text-xl font-serif tracking-wider text-gray-800 mb-3">Post Copy</h2>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="brand-name" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Brand Name (Optional)</label>
          <input
            id="brand-name"
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="e.g., Your Brand Name"
            disabled={isLoading}
            className="w-full text-base bg-white border border-gray-300 text-gray-800 p-3 rounded-lg transition-all duration-200 ease-in-out focus:ring-2 focus:ring-gray-800 focus:border-gray-800 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
        <button
          onClick={onGeneratePostCopy}
          disabled={isLoading}
          className="w-full flex items-center justify-center text-center bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-gray-700 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Spinner className="w-5 h-5" />
          ) : (
            <InstagramIcon className="w-5 h-5" />
          )}
          <span className="ml-2">
            {isLoading ? 'Generating...' : 'Generate Post Copy'}
          </span>
        </button>
        
        <AnimatePresence>
          {postCopy !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="bg-gray-50/80 rounded-lg border border-gray-200 relative"
            >
              <textarea
                value={postCopy}
                onChange={(e) => setPostCopy(e.target.value)}
                className="w-full h-48 p-4 pr-12 font-serif text-gray-700 leading-relaxed bg-transparent border-none rounded-lg resize-none focus:ring-1 focus:ring-gray-800"
                aria-label="Generated post copy"
              />
               <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm text-gray-600 hover:text-gray-900 p-2 rounded-full transition-colors"
                  aria-label={isCopied ? "Copied" : "Copy text"}
                  title={isCopied ? "Copied" : "Copy text"}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isCopied ? 'copied' : 'copy'}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {isCopied ? <CheckIcon className="w-5 h-5 text-green-600" /> : <CopyIcon className="w-5 h-5" />}
                    </motion.div>
                  </AnimatePresence>
                </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PostCopyPanel;