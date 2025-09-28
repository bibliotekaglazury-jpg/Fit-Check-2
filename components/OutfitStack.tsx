/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { OutfitLayer } from '../types';
import { Trash2Icon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';

interface OutfitStackProps {
  outfitHistory: OutfitLayer[];
  onRemoveLastGarment: () => void;
}

const OutfitStack: React.FC<OutfitStackProps> = ({ outfitHistory, onRemoveLastGarment }) => {
  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-serif tracking-wider text-gray-800 border-b border-gray-400/50 pb-2 mb-3">Outfit Stack</h2>
      <div className="space-y-2">
        <AnimatePresence initial={false}>
            {outfitHistory.map((layer, index) => (
            <motion.div
                key={layer.garment?.id || 'base'}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                className="flex items-center justify-between bg-white/50 p-2 rounded-lg border border-gray-200/80"
            >
                <div className="flex items-center overflow-hidden">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 mr-3 text-xs font-bold text-gray-600 bg-gray-200 rounded-full">
                    {index + 1}
                    </span>
                    {layer.garment && (
                        <img src={layer.garment.url} alt={layer.garment.name} className="flex-shrink-0 w-12 h-12 object-cover rounded-md mr-3" />
                    )}
                    <span className="font-semibold text-gray-800 truncate" title={layer.garment?.name}>
                    {layer.garment ? layer.garment.name : 'Base Model'}
                    </span>
                </div>
                {index > 0 && index === outfitHistory.length - 1 && (
                <motion.button
                    onClick={onRemoveLastGarment}
                    className="flex-shrink-0 text-gray-500 hover:text-red-600 transition-colors p-2 rounded-md hover:bg-red-50"
                    aria-label={`Remove ${layer.garment?.name}`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Trash2Icon className="w-5 h-5" />
                </motion.button>
                )}
            </motion.div>
            ))}
        </AnimatePresence>
        {outfitHistory.length === 1 && (
            <p className="text-center text-sm text-gray-500 pt-4">Your stacked items will appear here. Select an item from the wardrobe below.</p>
        )}
      </div>
    </div>
  );
};

export default OutfitStack;