/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo } from 'react';
import type { WardrobeItem } from '../types';
import { UploadCloudIcon, CheckCircleIcon } from './icons';
import { urlToFile } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface WardrobePanelProps {
  onGarmentSelect: (garmentFile: File, garmentInfo: WardrobeItem) => void;
  activeGarmentIds: string[];
  isLoading: boolean;
  wardrobe: WardrobeItem[];
}

const WardrobePanel: React.FC<WardrobePanelProps> = ({ onGarmentSelect, activeGarmentIds, isLoading, wardrobe }) => {
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedColor, setSelectedColor] = useState<string>('All');

    const { categories, colors } = useMemo(() => {
        const catSet = new Set<string>();
        const colSet = new Set<string>();
        wardrobe.forEach(item => {
            if (item.category) catSet.add(item.category);
            if (item.color) colSet.add(item.color);
        });
        return {
            categories: ['All', ...Array.from(catSet).sort()],
            colors: ['All', ...Array.from(colSet).sort()]
        };
    }, [wardrobe]);

    const filteredWardrobe = useMemo(() => {
        return wardrobe.filter(item => {
            const isCustomUpload = !item.category || !item.color;
            
            const categoryMatch = selectedCategory === 'All' || item.category === selectedCategory;
            const colorMatch = selectedColor === 'All' || item.color === selectedColor;

            if (isCustomUpload) {
                // Custom uploads only appear when no filters are active
                return selectedCategory === 'All' && selectedColor === 'All';
            }

            return categoryMatch && colorMatch;
        });
    }, [wardrobe, selectedCategory, selectedColor]);

    const handleGarmentClick = async (item: WardrobeItem) => {
        if (isLoading || activeGarmentIds.includes(item.id)) return;
        setError(null);
        try {
            // If the item was from an upload, its URL is a blob URL. We need to fetch it to create a file.
            // If it was a default item, it's a regular URL. This handles both.
            const file = await urlToFile(item.url, item.name);
            onGarmentSelect(file, item);
        // FIX: Catch clauses should use `unknown` for better type safety.
        } catch (err: unknown) {
            const detailedError = `Failed to load wardrobe item. This is often a CORS issue. Check the developer console for details.`;
            setError(detailedError);
            console.error(`[CORS Check] Failed to load and convert wardrobe item from URL: ${item.url}. The browser's console should have a specific CORS error message if that's the issue.`, err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file.');
                return;
            }
            const customGarmentInfo: WardrobeItem = {
                id: `custom-${Date.now()}`,
                name: file.name,
                url: URL.createObjectURL(file),
            };
            onGarmentSelect(file, customGarmentInfo);
        }
    };

  return (
    <div className="pt-6 border-t border-gray-400/50">
        <h2 className="text-xl font-serif tracking-wider text-gray-800 mb-3">Wardrobe</h2>
        
        <div className="flex flex-col gap-3 mb-4">
            {categories.length > 1 && (
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</h3>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(category => (
                            <motion.button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                disabled={isLoading}
                                className={`capitalize text-xs font-medium px-3 py-1 rounded-full transition-colors disabled:opacity-50 ${selectedCategory === category ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                whileTap={{ scale: 0.95 }}
                            >
                                {category}
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}
             {colors.length > 1 && (
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Color</h3>
                    <div className="flex flex-wrap gap-2">
                        {colors.map(color => (
                            <motion.button
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                disabled={isLoading}
                                className={`capitalize text-xs font-medium px-3 py-1 rounded-full transition-colors disabled:opacity-50 flex items-center gap-1.5 ${selectedColor === color ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                whileTap={{ scale: 0.95 }}
                            >
                                {color !== 'All' && (
                                    <span 
                                        className="w-3 h-3 rounded-full border border-gray-400/50" 
                                        style={{ backgroundColor: color.toLowerCase() }} 
                                    />
                                )}
                                {color}
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div className="grid grid-cols-3 gap-3">
            {filteredWardrobe.map((item) => {
            const isActive = activeGarmentIds.includes(item.id);
            return (
                <motion.button
                key={item.id}
                onClick={() => handleGarmentClick(item)}
                disabled={isLoading || isActive}
                className="relative aspect-square border rounded-lg overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 group disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label={`Select ${item.name}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                >
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-bold text-center p-1">{item.name}</p>
                    </div>
                    <AnimatePresence>
                        {isActive && (
                            <motion.div 
                                className="absolute inset-0 bg-gray-900/70 flex items-center justify-center"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                            >
                                <CheckCircleIcon className="w-8 h-8 text-white" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
            );
            })}
            <motion.label 
                htmlFor="custom-garment-upload" 
                className={`relative aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-500 transition-colors ${isLoading ? 'cursor-not-allowed bg-gray-100' : 'hover:border-gray-400 hover:text-gray-600 cursor-pointer'}`}
                whileTap={{ scale: 0.95 }}
                animate={!isLoading ? {
                    scale: [1, 1.05, 1],
                } : {
                    scale: 1,
                }}
                transition={!isLoading ? {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                } : {}}
            >
                <UploadCloudIcon className="w-6 h-6 mb-1"/>
                <span className="text-xs text-center">Upload</span>
                <input id="custom-garment-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" onChange={handleFileChange} disabled={isLoading}/>
            </motion.label>
        </div>
        {filteredWardrobe.length === 0 && wardrobe.length > 0 && (
             <p className="text-center text-sm text-gray-500 mt-4">No items match your selected filters.</p>
        )}
        {wardrobe.length === 0 && (
             <p className="text-center text-sm text-gray-500 mt-4">Your uploaded garments will appear here.</p>
        )}
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
    </div>
  );
};

export default WardrobePanel;