/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { CameraIcon } from './icons';
import Spinner from './Spinner';

interface InstagramPanelProps {
  onGenerateCarousel: () => void;
  isLoading: boolean;
}

const InstagramPanel: React.FC<InstagramPanelProps> = ({ onGenerateCarousel, isLoading }) => {
  return (
    <div className="pt-6 border-t border-gray-400/50">
      <h2 className="text-xl font-serif tracking-wider text-gray-800 mb-3">Seller Tools</h2>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-600">
            Automatically generate a set of images for your social media posts, including different angles and close-ups.
        </p>
        <button
          onClick={onGenerateCarousel}
          disabled={isLoading}
          className="w-full flex items-center justify-center text-center bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-gray-700 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading ? <Spinner className="w-5 h-5" /> : <CameraIcon className="w-5 h-5" />}
            <span className="ml-2">
              {isLoading ? 'Generating...' : 'Create Post Carousel'}
            </span>
        </button>
      </div>
    </div>
  );
};

export default InstagramPanel;