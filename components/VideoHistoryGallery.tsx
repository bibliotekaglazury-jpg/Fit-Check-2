/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadIcon, ShareIcon, XIcon } from './icons';

interface VideoHistoryItem {
  id: string;
  url: string;
  templateName: string;
  templateIcon: string;
  timestamp: Date;
}

interface VideoHistoryGalleryProps {
  history: VideoHistoryItem[];
  onSelect: (item: VideoHistoryItem) => void;
  isLoading: boolean;
}

const VideoHistoryGallery: React.FC<VideoHistoryGalleryProps> = ({
  history,
  onSelect,
  isLoading
}) => {

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-gray-50/50 border-t border-gray-200/60">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Generated Videos</h3>
          <span className="text-xs text-gray-500">{history.length} videos</span>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2">
          <AnimatePresence>
            {history.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative flex-shrink-0 group cursor-pointer"
                onClick={() => onSelect(item)}
              >
                <div className="relative w-16 h-28 bg-gray-200 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-300 transition-all duration-200">
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    onMouseEnter={(e) => {
                      const video = e.target as HTMLVideoElement;
                      video.play().catch(() => {});
                    }}
                    onMouseLeave={(e) => {
                      const video = e.target as HTMLVideoElement;
                      video.pause();
                      video.currentTime = 0;
                    }}
                  />
                  
                  {/* Template indicator */}
                  <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                    <span className="text-xs">{item.templateIcon}</span>
                  </div>
                </div>
                
                {/* Template name */}
                <div className="mt-1 text-center">
                  <p className="text-xs text-gray-600 truncate w-16" title={item.templateName}>
                    {item.templateName}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default VideoHistoryGallery;