/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StartScreen from './components/StartScreen';
import Canvas from './components/Canvas';
import WardrobePanel from './components/WardrobeModal';
import OutfitStack from './components/OutfitStack';
import BackgroundPanel from './components/BackgroundPanel';
import { generateVirtualTryOnImage, generatePoseVariation, generateBackgroundFromPrompt, startVideoGeneration, checkVideoGenerationStatus, replaceBackgroundWithImage, generatePostCopy, generateCloseupImage } from './services/geminiService';
import { OutfitLayer, WardrobeItem } from './types';
import { ChevronDownIcon, ChevronUpIcon } from './components/icons';
import { defaultWardrobe } from './wardrobe';
import Footer from './components/Footer';
import { getFriendlyErrorMessage } from './lib/utils';
import Spinner from './components/Spinner';
import PostCopyPanel from './components/PostCopyPanel';
import HistoryGallery from './components/HistoryGallery';
import VideoHistoryGallery from './components/VideoHistoryGallery';
import InstagramPanel from './components/InstagramPanel';
import { getTemplateById, videoMovementTemplates } from './config/videoTemplates';

interface VideoHistoryItem {
  id: string;
  url: string;
  templateName: string;
  templateIcon: string;
  timestamp: Date;
}

const POSE_INSTRUCTIONS = [
  "Full frontal view, hands on hips",
  "Slightly turned, 3/4 view",
  "Side profile view",
  "Jumping in the air, mid-action shot",
  "Walking towards camera",
  "Leaning against a wall",
];

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQueryList.addEventListener('change', listener);
    
    if (mediaQueryList.matches !== matches) {
      setMatches(mediaQueryList.matches);
    }

    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query, matches]);

  return matches;
};


const App: React.FC = () => {
  const [modelImageUrl, setModelImageUrl] = useState<string | null>(null);
  const [outfitHistory, setOutfitHistory] = useState<OutfitLayer[]>([]);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);
  const [loadingState, setLoadingState] = useState<{ context: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(defaultWardrobe);
  const [currentBackgroundId, setCurrentBackgroundId] = useState<string | null>(null);
  const [uploadedBgFile, setUploadedBgFile] = useState<File | null>(null);
  const [backgroundAppliedImageUrl, setBackgroundAppliedImageUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [backgroundPromptHistory, setBackgroundPromptHistory] = useState<string[]>([]);
  const [generatedPostCopy, setGeneratedPostCopy] = useState<string | null>(null);
  const [brandName, setBrandName] = useState<string>('');
  const [generationHistory, setGenerationHistory] = useState<string[]>([]);
  const [videoHistory, setVideoHistory] = useState<VideoHistoryItem[]>([]);
  const [gallerySelectedImageUrl, setGallerySelectedImageUrl] = useState<string | null>(null);
  const [carouselImages, setCarouselImages] = useState<string[]>([]);
  const [carouselProgress, setCarouselProgress] = useState<{ current: number; total: number; stage: string } | null>(null);
  const [isGeneratingCarousel, setIsGeneratingCarousel] = useState(false);
  const loadingMessageIntervalRef = useRef<number | null>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const isLoading = loadingState !== null;
  const loadingMessage = loadingState?.message ?? '';
  const loadingContext = loadingState?.context ?? null;

  const videoLoadingMessages = [
    "Preparing your image for video...",
    "Applying a smooth slow-zoom effect...",
    "Calibrating motion for social media...",
    "Rendering the video frames...",
    "Creating a seamless loop...",
    "Finalizing your dynamic reel...",
    "Your video is almost ready!",
  ];

  const activeOutfitLayers = useMemo(() => 
    outfitHistory.slice(0, currentOutfitIndex + 1), 
    [outfitHistory, currentOutfitIndex]
  );
  
  const activeGarmentIds = useMemo(() => 
    activeOutfitLayers.map(layer => layer.garment?.id).filter(Boolean) as string[], 
    [activeOutfitLayers]
  );
  
  const baseDisplayImageUrl = useMemo(() => {
    if (outfitHistory.length === 0) return modelImageUrl;
    const currentLayer = outfitHistory[currentOutfitIndex];
    if (!currentLayer) return modelImageUrl;

    const poseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
    return currentLayer.poseImages[poseInstruction] ?? Object.values(currentLayer.poseImages)[0];
  }, [outfitHistory, currentOutfitIndex, currentPoseIndex, modelImageUrl]);
  
  const displayImageUrl = useMemo(() => {
    return gallerySelectedImageUrl || backgroundAppliedImageUrl || baseDisplayImageUrl;
  }, [gallerySelectedImageUrl, backgroundAppliedImageUrl, baseDisplayImageUrl]);

  const availablePoseKeys = useMemo(() => {
    if (outfitHistory.length === 0) return [];
    const currentLayer = outfitHistory[currentOutfitIndex];
    return currentLayer ? Object.keys(currentLayer.poseImages) : [];
  }, [outfitHistory, currentOutfitIndex]);

  const handleModelFinalized = (url: string) => {
    setModelImageUrl(url);
    setOutfitHistory([{
      garment: null,
      poseImages: { [POSE_INSTRUCTIONS[0]]: url }
    }]);
    setGenerationHistory([url]);
    setCurrentOutfitIndex(0);
    setGeneratedPostCopy(null);
  };

  const handleStartOver = () => {
    setModelImageUrl(null);
    setOutfitHistory([]);
    setCurrentOutfitIndex(0);
    setLoadingState(null);
    setError(null);
    setCurrentPoseIndex(0);
    setIsSheetCollapsed(false);
    setWardrobe(defaultWardrobe);
    setCurrentBackgroundId(null);
    setBackgroundAppliedImageUrl(null);
    setUploadedBgFile(null);
    setGeneratedVideoUrl(null);
    setBackgroundPromptHistory([]);
    setGeneratedPostCopy(null);
    setGenerationHistory([]);
    setVideoHistory([]);
    setCarouselImages([]);
    setCarouselProgress(null);
    setIsGeneratingCarousel(false);
    setGallerySelectedImageUrl(null);
    
    // Clean up video URLs to prevent memory leaks
    videoHistory.forEach(item => {
      URL.revokeObjectURL(item.url);
    });
  };

  const handleGarmentSelect = useCallback(async (garmentFile: File, garmentInfo: WardrobeItem) => {
    if (!baseDisplayImageUrl || isLoading) return;

    setGeneratedVideoUrl(null);
    setCurrentBackgroundId(null);
    setBackgroundAppliedImageUrl(null);
    setUploadedBgFile(null);
    setGeneratedPostCopy(null);
    setGallerySelectedImageUrl(null);

    // Caching: Check if we are re-applying a previously generated layer
    const nextLayer = outfitHistory[currentOutfitIndex + 1];
    if (nextLayer && nextLayer.garment?.id === garmentInfo.id) {
        setCurrentOutfitIndex(prev => prev + 1);
        setCurrentPoseIndex(0); // Reset pose when changing layer
        return;
    }

    setError(null);
    setLoadingState({ context: 'canvas', message: `Adding ${garmentInfo.name}...` });

    try {
      const newImageUrl = await generateVirtualTryOnImage(baseDisplayImageUrl, garmentFile);
      const currentPoseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
      
      const newLayer: OutfitLayer = { 
        garment: garmentInfo, 
        poseImages: { [currentPoseInstruction]: newImageUrl } 
      };

      setOutfitHistory(prevHistory => {
        // Cut the history at the current point before adding the new layer
        const newHistory = prevHistory.slice(0, currentOutfitIndex + 1);
        return [...newHistory, newLayer];
      });
      setCurrentOutfitIndex(prev => prev + 1);
      setGenerationHistory(prev => [...prev, newImageUrl]);
      
      // Add to personal wardrobe if it's not already there
      setWardrobe(prev => {
        if (prev.find(item => item.id === garmentInfo.id)) {
            return prev;
        }
        return [...prev, garmentInfo];
      });
    } catch (err: unknown) {
      setError(getFriendlyErrorMessage(err, 'Failed to add garment'));
    } finally {
      setLoadingState(null);
    }
  }, [baseDisplayImageUrl, isLoading, currentPoseIndex, outfitHistory, currentOutfitIndex]);

  const handleRemoveLastGarment = () => {
    if (currentOutfitIndex > 0) {
      setGeneratedVideoUrl(null);
      setCurrentBackgroundId(null);
      setBackgroundAppliedImageUrl(null);
      setUploadedBgFile(null);
      setGeneratedPostCopy(null);
      setGallerySelectedImageUrl(null);
      setCurrentOutfitIndex(prevIndex => prevIndex - 1);
      setCurrentPoseIndex(0); // Reset pose to default when removing a layer
    }
  };
  
  const handlePoseSelect = useCallback(async (newIndex: number) => {
    if (isLoading || outfitHistory.length === 0 || newIndex === currentPoseIndex) return;
    
    const poseInstruction = POSE_INSTRUCTIONS[newIndex];
    const currentLayer = outfitHistory[currentOutfitIndex];

    // Clear other generated content that depends on the specific image
    setGeneratedVideoUrl(null);
    setGeneratedPostCopy(null);
    
    setError(null);
    
    const prevPoseIndex = currentPoseIndex;
    // Optimistically update the pose index for the UI
    setCurrentPoseIndex(newIndex);
    setLoadingState({ context: 'canvas', message: 'Changing pose...' });

    try {
      // Step 1: Ensure we have the new pose on a neutral background.
      let newPoseNeutralUrl = currentLayer.poseImages[poseInstruction];

      if (!newPoseNeutralUrl) {
        // If not, generate it from an existing pose in the current layer.
        const baseImageForPoseChange = Object.values(currentLayer.poseImages)[0];
        if (!baseImageForPoseChange) {
            throw new Error("No base image available to generate new pose.");
        }

        setLoadingState({ context: 'canvas', message: 'Generating new pose...' });
        newPoseNeutralUrl = await generatePoseVariation(baseImageForPoseChange, poseInstruction);
        
        // Save the newly generated neutral pose to history to avoid re-generating.
        setOutfitHistory(prevHistory => {
          const newHistory = [...prevHistory];
          const updatedLayer = { ...newHistory[currentOutfitIndex] };
          updatedLayer.poseImages = { ...updatedLayer.poseImages, [poseInstruction]: newPoseNeutralUrl! };
          newHistory[currentOutfitIndex] = updatedLayer;
          return newHistory;
        });
        setGenerationHistory(prev => [...prev, newPoseNeutralUrl!]);
      }

      // Step 2: If a background is active AND we are not in gallery-view mode, re-apply it.
      // Otherwise, reset to a neutral state, effectively exiting gallery-view and returning to the main editing flow.
      if (currentBackgroundId && !gallerySelectedImageUrl) {
        setLoadingState({ context: 'canvas', message: 'Applying scene to new pose...' });
        
        if (typeof newPoseNeutralUrl !== 'string' || !newPoseNeutralUrl) {
          throw new Error("Could not determine the model image for applying the new background.");
        }

        let newImageUrlWithBg: string;
        if (uploadedBgFile) {
          // Re-apply uploaded background
          newImageUrlWithBg = await replaceBackgroundWithImage(newPoseNeutralUrl, uploadedBgFile);
        } else {
          // Re-apply prompted background
          newImageUrlWithBg = await generateBackgroundFromPrompt(newPoseNeutralUrl, currentBackgroundId);
        }
        setBackgroundAppliedImageUrl(newImageUrlWithBg);
        setGenerationHistory(prev => [...prev, newImageUrlWithBg]);
      } else {
         // This branch is taken when:
         // a) a gallery image was selected (signaling a desire to edit from that point, which resets the background)
         // b) no background was active in the first place.
         // In both cases, we must reset all background and gallery state to ensure a clean return to the main editing flow.
         setBackgroundAppliedImageUrl(null);
         setCurrentBackgroundId(null);
         setUploadedBgFile(null);
         setGallerySelectedImageUrl(null);
      }
    } catch (err: unknown) {
      setError(getFriendlyErrorMessage(err, 'Failed to change pose'));
      // Revert pose index on failure
      setCurrentPoseIndex(prevPoseIndex);
    } finally {
      setLoadingState(null);
    }
  }, [currentPoseIndex, outfitHistory, isLoading, currentOutfitIndex, currentBackgroundId, uploadedBgFile, gallerySelectedImageUrl]);


  const handleBackgroundGenerate = useCallback(async (prompt: string) => {
    if (isLoading || !baseDisplayImageUrl) return;

    setGeneratedVideoUrl(null);
    setGeneratedPostCopy(null);
    setError(null);
    setLoadingState({ context: 'canvas', message: `Generating scene: ${prompt}` });
    setGallerySelectedImageUrl(null);
    setUploadedBgFile(null);
    
    try {
        const newImageUrl = await generateBackgroundFromPrompt(baseDisplayImageUrl, prompt);
        setBackgroundAppliedImageUrl(newImageUrl);
        setCurrentBackgroundId(prompt);
        setGenerationHistory(prev => [...prev, newImageUrl]);
        setBackgroundPromptHistory(prevHistory => {
          const newHistory = [prompt, ...prevHistory.filter(p => p !== prompt)];
          return newHistory.slice(0, 5); // Keep last 5 unique prompts
        });
    } catch (err: unknown) {
        setError(getFriendlyErrorMessage(err, 'Failed to generate scene'));
    } finally {
        setLoadingState(null);
    }
  }, [isLoading, baseDisplayImageUrl]);
  
  const handleBackgroundUpload = useCallback(async (file: File) => {
    if (isLoading || !baseDisplayImageUrl) return;

    setGeneratedVideoUrl(null);
    setGeneratedPostCopy(null);
    setError(null);
    setLoadingState({ context: 'canvas', message: `Applying custom scene...` });
    setGallerySelectedImageUrl(null);
    
    try {
        const newImageUrl = await replaceBackgroundWithImage(baseDisplayImageUrl, file);
        setBackgroundAppliedImageUrl(newImageUrl);
        setCurrentBackgroundId(`custom-upload-${file.name}-${Date.now()}`);
        setUploadedBgFile(file);
        setGenerationHistory(prev => [...prev, newImageUrl]);
    } catch (err: unknown) {
        setError(getFriendlyErrorMessage(err, 'Failed to apply custom scene'));
    } finally {
        setLoadingState(null);
    }
  }, [isLoading, baseDisplayImageUrl]);

  const handleBackgroundRemove = useCallback(() => {
    setGeneratedVideoUrl(null);
    setGeneratedPostCopy(null);
    setCurrentBackgroundId(null);
    setBackgroundAppliedImageUrl(null);
    setUploadedBgFile(null);
    setGallerySelectedImageUrl(null);
  }, []);

  const handleGenerateVideo = useCallback(async (templateId?: string) => {
    if (isLoading || !baseDisplayImageUrl) return;

    if (generatedVideoUrl) {
        URL.revokeObjectURL(generatedVideoUrl);
    }
    setGeneratedVideoUrl(null);
    setGeneratedPostCopy(null);
    setError(null);
    setLoadingState({ context: 'canvas', message: videoLoadingMessages[0] });

    loadingMessageIntervalRef.current = window.setInterval(() => {
        setLoadingState(prevState => {
            if (!prevState) return null;
            const currentIndex = videoLoadingMessages.indexOf(prevState.message);
            const nextIndex = (currentIndex + 1) % videoLoadingMessages.length;
            return { ...prevState, message: videoLoadingMessages[nextIndex] };
        });
    }, 4000);

    try {
        let operation = await startVideoGeneration(baseDisplayImageUrl, templateId);

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await checkVideoGenerationStatus(operation);
        }
        
        const opError = (operation as any).error;
        if (opError) {
            throw new Error(`Video generation failed: ${opError.message || 'Unknown error'}`);
        }

        const opResponse = (operation as any).response;
        if (opResponse?.promptFeedback?.blockReason) {
            const { blockReason, blockReasonMessage } = opResponse.promptFeedback;
            throw new Error(`Video generation blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`);
        }

        const downloadLink = opResponse?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink && process.env.API_KEY) {
            const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch video: ${response.statusText}`);
            }
            const videoBlob = await response.blob();
            const videoUrl = URL.createObjectURL(videoBlob);
            setGeneratedVideoUrl(videoUrl);
            
            // Add to video history
            const template = getTemplateById(templateId || 'runway-walk') || videoMovementTemplates[0];
            const historyItem: VideoHistoryItem = {
              id: Date.now().toString(),
              url: videoUrl,
              templateName: template.name,
              templateIcon: template.icon,
              timestamp: new Date()
            };
            setVideoHistory(prev => [historyItem, ...prev]);
        } else if (!downloadLink) {
            throw new Error('Video generation finished, but no video was returned. This may be due to content safety filters. Please try a different pose or outfit.');
        } else if (!process.env.API_KEY) {
            throw new Error('API_KEY is not available to download the video.');
        }
    } catch (err: unknown) {
        const errorMessage = getFriendlyErrorMessage(err, 'Failed to generate video');
        setError(errorMessage);
    } finally {
        setLoadingState(null);
        if (loadingMessageIntervalRef.current) {
            clearInterval(loadingMessageIntervalRef.current);
            loadingMessageIntervalRef.current = null;
        }
    }
  }, [isLoading, baseDisplayImageUrl, generatedVideoUrl, videoLoadingMessages]);

  const handleGeneratePostCopy = useCallback(async () => {
    if (isLoading || !displayImageUrl) return;

    setError(null);
    setLoadingState({ context: 'post-copy', message: 'Generating post copy...' });
    setGeneratedPostCopy(null);
    
    try {
        const outfitDescription = activeOutfitLayers
            .slice(1) // Exclude base model
            .map(layer => layer.garment?.name)
            .filter(Boolean)
            .join(', ');
        
        const sceneDescription = currentBackgroundId?.startsWith('custom-upload') 
            ? 'a custom uploaded scene' 
            : currentBackgroundId || 'a neutral studio background';

        const copy = await generatePostCopy(displayImageUrl, outfitDescription, sceneDescription, brandName);
        setGeneratedPostCopy(copy);

    } catch (err: unknown) {
        setError(getFriendlyErrorMessage(err, 'Failed to generate post copy'));
    } finally {
        setLoadingState(null);
    }
  }, [isLoading, displayImageUrl, activeOutfitLayers, currentBackgroundId, brandName]);

  const handleGenerateCarousel = useCallback(async () => {
    if (isLoading || !baseDisplayImageUrl) return;

    setError(null);
    setIsGeneratingCarousel(true);
    setCarouselImages([]);
    setCarouselProgress({ current: 0, total: 4, stage: 'Generating Instagram Carousel...' });

    try {
        const carouselImages: string[] = [];
        const totalNewImages = 4; // 3 new poses + 1 close-up

        // 1. Different Angles
        for (let i = 1; i <= 3; i++) {
          setCarouselProgress({ 
            current: i - 1, 
            total: totalNewImages, 
            stage: `Generating angle shot (${i}/${totalNewImages})...` 
          });
          
          // Ensure we don't pick the same pose.
          const nextPoseIndex = (currentPoseIndex + i) % POSE_INSTRUCTIONS.length;
          const differentAngleInstruction = POSE_INSTRUCTIONS[nextPoseIndex];
          const angleImageUrl = await generatePoseVariation(baseDisplayImageUrl, differentAngleInstruction);
          
          carouselImages.push(angleImageUrl);
          
          // Stream: Add to carousel display immediately
          setCarouselImages(prev => [...prev, angleImageUrl]);
        }

        // 2. Close-up shot
        setCarouselProgress({ 
          current: 3, 
          total: totalNewImages, 
          stage: `Generating close-up shot (${totalNewImages}/${totalNewImages})...` 
        });
        
        const outfitDescription = activeOutfitLayers
            .slice(1)
            .map(layer => layer.garment?.name)
            .filter(Boolean)
            .join(', ');
        const closeupImageUrl = await generateCloseupImage(baseDisplayImageUrl, outfitDescription);
        carouselImages.push(closeupImageUrl);
        
        // Stream: Add close-up to carousel display immediately
        setCarouselImages(prev => [...prev, closeupImageUrl]);

        // Add new images to history, avoiding duplicates (original logic)
        setGenerationHistory(prev => {
            const uniqueNewImages = carouselImages.filter(img => !prev.includes(img));
            return [...prev, ...uniqueNewImages];
        });
        
        setCarouselProgress({ 
          current: 4, 
          total: totalNewImages, 
          stage: 'Carousel completed!' 
        });

    } catch (err: unknown) {
        setError(getFriendlyErrorMessage(err, 'Failed to generate carousel'));
    } finally {
        setIsGeneratingCarousel(false);
        setTimeout(() => {
          setCarouselProgress(null);
        }, 2000);
    }
  }, [isLoading, baseDisplayImageUrl, currentPoseIndex, activeOutfitLayers]);

  const handleCloseVideo = useCallback(() => {
      if (generatedVideoUrl) {
          URL.revokeObjectURL(generatedVideoUrl);
      }
      setGeneratedVideoUrl(null);
  }, [generatedVideoUrl]);

  const handleHistorySelect = (url: string) => {
    setGallerySelectedImageUrl(url);
    setGeneratedVideoUrl(null); // Close video if it's open when selecting from history
  };

  const handleVideoHistorySelect = (item: VideoHistoryItem) => {
    setGeneratedVideoUrl(item.url);
  };

  const handleVideoHistoryRemove = (id: string) => {
    setVideoHistory(prev => {
      const itemToRemove = prev.find(item => item.id === id);
      if (itemToRemove) {
        URL.revokeObjectURL(itemToRemove.url);
        if (generatedVideoUrl === itemToRemove.url) {
          setGeneratedVideoUrl(null);
        }
      }
      return prev.filter(item => item.id !== id);
    });
  };

  const handleDownloadAll = () => {
    generationHistory.forEach((url, index) => {
      const link = document.createElement('a');
      link.href = url;
      const extension = url.match(/\.(jpeg|jpg|png|webp)/)?.[1] || 'png';
      link.download = `outfit-story-${index + 1}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const viewVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
  };

  return (
    <div className="font-sans">
      <AnimatePresence mode="wait">
        {!modelImageUrl ? (
          <motion.div
            key="start-screen"
            className="w-screen min-h-screen flex items-start sm:items-center justify-center bg-gray-50 p-4 pb-20"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <StartScreen onModelFinalized={handleModelFinalized} />
          </motion.div>
        ) : (
          <motion.div
            key="main-app"
            className="relative flex flex-col h-screen bg-white overflow-hidden"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {outfitHistory.length > 0 ? (
              <>
                <main className="flex-grow relative flex flex-col md:flex-row overflow-hidden">
                  <div className="w-full h-full flex-grow flex flex-col bg-white">
                    <div className="flex-grow w-full relative flex items-center justify-center overflow-hidden">
                      <Canvas 
                        displayImageUrl={displayImageUrl}
                        onStartOver={handleStartOver}
                        isLoading={isLoading && (loadingContext === 'canvas' || loadingContext === 'carousel')}
                        loadingMessage={loadingMessage}
                        onSelectPose={handlePoseSelect}
                        poseInstructions={POSE_INSTRUCTIONS}
                        currentPoseIndex={currentPoseIndex}
                        availablePoseKeys={availablePoseKeys}
                        displayVideoUrl={generatedVideoUrl}
                        onGenerateVideo={handleGenerateVideo}
                        onCloseVideo={handleCloseVideo}
                      />
                    </div>
                    <div className="sm:pb-16">
                      <HistoryGallery
                        history={generationHistory}
                        selectedImage={displayImageUrl}
                        onSelect={handleHistorySelect}
                        onDownloadAll={handleDownloadAll}
                        isLoading={isLoading}
                      />
                      <VideoHistoryGallery
                        history={videoHistory}
                        onSelect={handleVideoHistorySelect}
                        isLoading={isLoading}
                      />
                    </div>
                  </div>

                  <aside 
                    className={`absolute md:relative md:flex-shrink-0 bottom-0 right-0 h-auto md:h-full w-full md:w-1/3 md:max-w-sm bg-white/80 backdrop-blur-md flex flex-col border-t md:border-t-0 md:border-l border-gray-200/60 transition-transform duration-500 ease-in-out ${isSheetCollapsed ? 'translate-y-[calc(100%-4.5rem)]' : 'translate-y-0'} md:translate-y-0`}
                    style={{ transitionProperty: 'transform' }}
                  >
                      <button 
                        onClick={() => setIsSheetCollapsed(!isSheetCollapsed)} 
                        className="md:hidden w-full h-8 flex items-center justify-center bg-gray-100/50"
                        aria-label={isSheetCollapsed ? 'Expand panel' : 'Collapse panel'}
                      >
                        {isSheetCollapsed ? <ChevronUpIcon className="w-6 h-6 text-gray-500" /> : <ChevronDownIcon className="w-6 h-6 text-gray-500" />}
                      </button>
                      <div className="p-4 md:p-6 pb-28 overflow-y-auto flex-grow flex flex-col gap-8">
                        <AnimatePresence>
                          {error && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.3 }}
                              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert"
                            >
                              <p className="font-bold">Error</p>
                              <p>{error}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <OutfitStack 
                          outfitHistory={activeOutfitLayers}
                          onRemoveLastGarment={handleRemoveLastGarment}
                        />
                        <WardrobePanel
                          onGarmentSelect={handleGarmentSelect}
                          activeGarmentIds={activeGarmentIds}
                          isLoading={isLoading}
                          wardrobe={wardrobe}
                        />
                        <BackgroundPanel
                          onBackgroundGenerate={handleBackgroundGenerate}
                          onBackgroundUpload={handleBackgroundUpload}
                          onBackgroundRemove={handleBackgroundRemove}
                          currentBackgroundPrompt={currentBackgroundId}
                          isLoading={isLoading}
                          backgroundPromptHistory={backgroundPromptHistory}
                        />
                        <InstagramPanel
                          onGenerateCarousel={handleGenerateCarousel}
                          isLoading={isLoading && loadingContext === 'carousel'}
                          carouselImages={carouselImages}
                          carouselProgress={carouselProgress}
                          isGeneratingCarousel={isGeneratingCarousel}
                        />
                        <PostCopyPanel
                          onGeneratePostCopy={handleGeneratePostCopy}
                          postCopy={generatedPostCopy}
                          setPostCopy={setGeneratedPostCopy}
                          isLoading={isLoading && loadingContext === 'post-copy'}
                          brandName={brandName}
                          setBrandName={setBrandName}
                        />
                      </div>
                  </aside>
                </main>
                <AnimatePresence>
                  {isLoading && isMobile && (
                    <motion.div
                      className="fixed inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-50"
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
                <div className="hidden md:block">
                  <Footer isOnDressingScreen={!!modelImageUrl} />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Spinner />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
