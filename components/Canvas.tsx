/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { RotateCcwIcon, ChevronLeftIcon, ChevronRightIcon, InstagramIcon, XIcon, DownloadIcon } from './icons';
import Spinner from './Spinner';
import { AnimatePresence, motion } from 'framer-motion';

interface CanvasProps {
  displayImageUrl: string | null;
  onStartOver: () => void;
  isLoading: boolean;
  loadingMessage: string;
  onSelectPose: (index: number) => void;
  poseInstructions: string[];
  currentPoseIndex: number;
  availablePoseKeys: string[];
  displayVideoUrl: string | null;
  onGenerateVideo: () => void;
  onCloseVideo: () => void;
}

const Canvas: React.FC<CanvasProps> = ({ displayImageUrl, onStartOver, isLoading, loadingMessage, onSelectPose, poseInstructions, currentPoseIndex, availablePoseKeys, displayVideoUrl, onGenerateVideo, onCloseVideo }) => {
  const [isPoseMenuOpen, setIsPoseMenuOpen] = useState(false);
  
  const handlePreviousPose = () => {
    if (isLoading || availablePoseKeys.length <= 1) return;

    const currentPoseInstruction = poseInstructions[currentPoseIndex];
    const currentIndexInAvailable = availablePoseKeys.indexOf(currentPoseInstruction);
    
    // Fallback if current pose not in available list (shouldn't happen)
    if (currentIndexInAvailable === -1) {
        onSelectPose((currentPoseIndex - 1 + poseInstructions.length) % poseInstructions.length);
        return;
    }

    const prevIndexInAvailable = (currentIndexInAvailable - 1 + availablePoseKeys.length) % availablePoseKeys.length;
    const prevPoseInstruction = availablePoseKeys[prevIndexInAvailable];
    const newGlobalPoseIndex = poseInstructions.indexOf(prevPoseInstruction);
    
    if (newGlobalPoseIndex !== -1) {
        onSelectPose(newGlobalPoseIndex);
    }
  };

  const handleNextPose = () => {
    if (isLoading) return;

    const currentPoseInstruction = poseInstructions[currentPoseIndex];
    const currentIndexInAvailable = availablePoseKeys.indexOf(currentPoseInstruction);

    // Fallback or if there are no generated poses yet
    if (currentIndexInAvailable === -1 || availablePoseKeys.length === 0) {
        onSelectPose((currentPoseIndex + 1) % poseInstructions.length);
        return;
    }
    
    const nextIndexInAvailable = currentIndexInAvailable + 1;
    if (nextIndexInAvailable < availablePoseKeys.length) {
        // There is another generated pose, navigate to it
        const nextPoseInstruction = availablePoseKeys[nextIndexInAvailable];
        const newGlobalPoseIndex = poseInstructions.indexOf(nextPoseInstruction);
        if (newGlobalPoseIndex !== -1) {
            onSelectPose(newGlobalPoseIndex);
        }
    } else {
        // At the end of generated poses, generate the next one from the master list
        const newGlobalPoseIndex = (currentPoseIndex + 1) % poseInstructions.length;
        onSelectPose(newGlobalPoseIndex);
    }
  };
  
  return (
    <div className="w-full h-full flex items-center justify-center p-4 relative animate-zoom-in group">
      {/* Start Over Button */}
      <motion.button 
          onClick={onStartOver}
          className="absolute top-4 left-4 z-30 flex items-center justify-center text-center bg-white/60 border border-gray-300/80 text-gray-700 font-semibold py-2 px-4 rounded-full transition-all duration-200 ease-in-out hover:bg-white hover:border-gray-400 text-sm backdrop-blur-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
      >
          <RotateCcwIcon className="w-4 h-4 mr-2" />
          Start Over
      </motion.button>

      {/* Image Display or Placeholder */}
      <div className="relative w-full h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
            {displayImageUrl ? (
            <motion.img
                key={displayImageUrl}
                src={displayImageUrl}
                alt="Virtual try-on model"
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
            ) : (
                <div className="w-[400px] h-[600px] bg-gray-100 border border-gray-200 rounded-lg flex flex-col items-center justify-center">
                <Spinner />
                <p className="text-md font-serif text-gray-600 mt-4">Loading Model...</p>
                </div>
            )}
        </AnimatePresence>
        
        <AnimatePresence>
          {isLoading && (
              <motion.div
                  className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-20 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
              >
                  <Spinner />
                  {loadingMessage && (
                      <p className="text-lg font-serif text-gray-700 mt-4 text-center px-4">{loadingMessage}</p>
                  )}
              </motion.div>
          )}
        </AnimatePresence>
      </div>

       {/* Video Player Overlay */}
       <AnimatePresence>
        {displayVideoUrl && (
          <motion.div
            className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                key={displayVideoUrl}
                src={displayVideoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                 <a
                    href={displayVideoUrl}
                    download="virtual-try-on.mp4"
                    className="flex items-center justify-center w-10 h-10 bg-white/60 backdrop-blur-md rounded-full text-gray-800 hover:bg-white transition-colors"
                    aria-label="Download video"
                 >
                    <DownloadIcon className="w-5 h-5" />
                 </a>
                 <button
                    onClick={onCloseVideo}
                    className="flex items-center justify-center w-10 h-10 bg-white/60 backdrop-blur-md rounded-full text-gray-800 hover:bg-white transition-colors"
                    aria-label="Close video"
                 >
                    <XIcon className="w-5 h-5" />
                 </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      {displayImageUrl && !isLoading && !displayVideoUrl && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-4">
          
          {/* Pose Controls Wrapper for Popover */}
          <div
            className="relative"
            onMouseEnter={() => setIsPoseMenuOpen(true)}
            onMouseLeave={() => setIsPoseMenuOpen(false)}
          >
            {/* Pose Selection Popover */}
            <AnimatePresence>
              {isPoseMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute bottom-full mb-3 w-64 bg-white/80 backdrop-blur-lg rounded-xl p-2 border border-gray-200/80 shadow-lg"
                  style={{ left: '50%', transform: 'translateX(-50%)' }}
                >
                  <div className="grid grid-cols-2 gap-1">
                    {poseInstructions.map((pose, index) => (
                      <button
                        key={pose}
                        onClick={() => onSelectPose(index)}
                        disabled={isLoading || index === currentPoseIndex}
                        className="w-full text-left text-sm font-medium text-gray-800 p-2 rounded-md transition-colors hover:bg-gray-200/70 disabled:opacity-100 disabled:bg-gray-900/10 disabled:font-semibold disabled:cursor-default"
                      >
                        {pose}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Pose Controls (prev/next) */}
            <div className="flex items-center justify-center gap-2 bg-white/60 backdrop-blur-md rounded-full p-2 border border-gray-300/50">
              <motion.button 
                onClick={handlePreviousPose}
                aria-label="Previous pose"
                className="p-2 rounded-full hover:bg-white/80 transition-all disabled:opacity-50"
                disabled={isLoading}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-800" />
              </motion.button>
              <span className="text-sm font-semibold text-gray-800 w-48 text-center truncate cursor-pointer" title={poseInstructions[currentPoseIndex]}>
                {poseInstructions[currentPoseIndex]}
              </span>
              <motion.button 
                onClick={handleNextPose}
                aria-label="Next pose"
                className="p-2 rounded-full hover:bg-white/80 transition-all disabled:opacity-50"
                disabled={isLoading}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-800" />
              </motion.button>
            </div>
          </div>

          {/* Video Button */}
          <motion.button
              onClick={onGenerateVideo}
              disabled={isLoading}
              className="flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-full py-3 pl-4 pr-3 border border-gray-300/50 hover:bg-white/80 transition-all disabled:opacity-50"
              aria-label="Create Reel Video"
              title="Create Reel Video"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <InstagramIcon className="w-5 h-5 text-gray-800" />
              <span className="text-sm font-semibold text-gray-800">Create Reel</span>
              <span className="ml-1 bg-gray-200 text-gray-600 text-xs font-mono px-1.5 py-0.5 rounded-md">9:16</span>
            </motion.button>
        </div>
      )}
    </div>
  );
};

export default Canvas;