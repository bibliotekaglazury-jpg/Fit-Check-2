/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { XIcon, UploadCloudIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';

const BG_SUGGESTIONS = [
  "Use this for your next social media post.",
  "Create a banner for your online store.",
  "Generate content for an email campaign.",
  "Visualize your product in a new catalog.",
  "Make a creative ad for a marketing campaign.",
  "Showcase your design in a professional lookbook.",
];

const EXAMPLE_PROMPTS = [
  "Studio background with a soft gradient from pastel pink to baby blue",
  "Clean studio with a vertical gradient from warm peach to soft cream",
  "Minimalist studio with a color wash of lavender and mint green",
  "Studio cyclorama wall with a gradient of pale yellow and light coral",
];


interface BackgroundPanelProps {
  onBackgroundGenerate: (prompt: string) => void;
  onBackgroundUpload: (file: File) => void;
  onBackgroundRemove: () => void;
  currentBackgroundPrompt: string | null;
  isLoading: boolean;
  backgroundPromptHistory: string[];
}

const BackgroundPanel: React.FC<BackgroundPanelProps> = ({ onBackgroundGenerate, onBackgroundUpload, onBackgroundRemove, currentBackgroundPrompt, isLoading, backgroundPromptHistory }) => {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setSuggestionIndex((prevIndex) => (prevIndex + 1) % BG_SUGGESTIONS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      setError(null);
      onBackgroundGenerate(prompt.trim());
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError("Please select a valid image file.");
        e.target.value = '';
        return;
      }
      onBackgroundUpload(file);
      e.target.value = ''; // Allow selecting the same file again
    }
  };
  
  const handleHistoryClick = (historyPrompt: string) => {
    if (isLoading || historyPrompt === currentBackgroundPrompt) return;
    setPrompt(historyPrompt);
    onBackgroundGenerate(historyPrompt);
  };

  const handleExampleClick = (examplePrompt: string) => {
    if (isLoading) return;
    setPrompt(examplePrompt);
  };

  return (
    <div className="pt-6 border-t border-gray-400/50">
      <div className="flex justify-between items-center mb-3">
         <h2 className="text-xl font-serif tracking-wider text-gray-800">Scene Generator</h2>
         {currentBackgroundPrompt && (
            <button 
              onClick={onBackgroundRemove}
              disabled={isLoading}
              className="text-xs font-semibold text-gray-600 hover:text-red-600 disabled:opacity-50 flex items-center gap-1"
            >
              <XIcon className="w-4 h-4" />
              Remove
            </button>
         )}
      </div>
      <div className="flex flex-col gap-3">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A bustling street in Paris at night"
            disabled={isLoading}
            className="w-full text-base bg-white border border-gray-300 text-gray-800 p-3 rounded-lg transition-all duration-200 ease-in-out focus:ring-2 focus:ring-gray-800 focus:border-gray-800 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
            rows={2}
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="flex-grow w-1/2 text-center bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-gray-700 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && currentBackgroundPrompt === prompt ? 'Generating...' : 'Generate'}
            </button>
            <label 
              htmlFor="background-upload"
              className={`flex-grow w-1/2 flex items-center justify-center text-center bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-gray-100 active:scale-95 text-base ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <UploadCloudIcon className="w-5 h-5 mr-2" />
              Upload
            </label>
            <input id="background-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" onChange={handleFileChange} disabled={isLoading}/>
          </div>
        </form>

        <div className="mt-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Examples</h3>
            <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((example) => (
                    <button
                        key={example}
                        type="button"
                        onClick={() => handleExampleClick(example)}
                        disabled={isLoading}
                        className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={example}
                    >
                        {example}
                    </button>
                ))}
            </div>
        </div>

        {backgroundPromptHistory.length > 0 && (
          <div className="mt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Scenes</h3>
              <div className="flex flex-wrap gap-2">
                  {backgroundPromptHistory.map((historyPrompt) => (
                      <button
                          key={historyPrompt}
                          type="button"
                          onClick={() => handleHistoryClick(historyPrompt)}
                          disabled={isLoading}
                          className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed truncate max-w-full"
                          title={historyPrompt}
                      >
                          {historyPrompt}
                      </button>
                  ))}
              </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        
        <div className="h-4 mt-2 text-center text-xs text-gray-500 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={suggestionIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              {BG_SUGGESTIONS[suggestionIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default BackgroundPanel;