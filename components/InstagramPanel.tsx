/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { CameraIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';
import Spinner from './Spinner';

interface InstagramPanelProps {
  onGenerateCarousel: () => void;
  isLoading: boolean;
  carouselImages: string[];
  carouselProgress: { current: number; total: number; stage: string } | null;
  isGeneratingCarousel: boolean;
}

const InstagramPanel: React.FC<InstagramPanelProps> = ({ 
  onGenerateCarousel, 
  isLoading, 
  carouselImages, 
  carouselProgress, 
  isGeneratingCarousel 
}) => {
  return (
    <div className="pt-6 border-t border-gray-400/50">
      <h2 className="text-xl font-serif tracking-wider text-gray-800 mb-3">Seller Tools</h2>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-600">
            Automatically generate a set of images for your social media posts, including different angles and close-ups.
        </p>
        
        <button
          onClick={onGenerateCarousel}
          disabled={isLoading || isGeneratingCarousel}
          className="w-full flex items-center justify-center text-center bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-gray-700 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {(isLoading || isGeneratingCarousel) ? <Spinner className="w-5 h-5" /> : <CameraIcon className="w-5 h-5" />}
            <span className="ml-2">
              {isGeneratingCarousel ? 'Generating Carousel...' : isLoading ? 'Generating...' : 'Create Post Carousel'}
            </span>
        </button>
        
        {/* Progress Indicator */}
        <AnimatePresence>
          {carouselProgress && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gray-50 rounded-lg p-3 border"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {carouselProgress.stage}
                </span>
                <span className="text-xs text-gray-500">
                  {carouselProgress.current}/{carouselProgress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-gray-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(carouselProgress.current / carouselProgress.total) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Streaming Carousel Images */}
        <AnimatePresence>
          {carouselImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-4"
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Generated Images</h3>
              <div className="grid grid-cols-2 gap-2">
                <AnimatePresence>
                  {carouselImages.map((imageUrl, index) => (
                    <motion.div
                      key={imageUrl}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border hover:border-gray-300 transition-colors"
                    >
                      <img
                        src={imageUrl}
                        alt={`Generated carousel image ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-1 right-1 bg-white/80 rounded-full px-2 py-1">
                        <span className="text-xs font-medium text-gray-600">{index + 1}</span>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Placeholder slots for remaining images */}
                  {isGeneratingCarousel && Array.from({ length: 4 - carouselImages.length }).map((_, index) => (
                    <motion.div
                      key={`placeholder-${index}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="relative aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
                    >
                      <div className="text-center">
                        <Spinner className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-xs text-gray-500">Generating...</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InstagramPanel;