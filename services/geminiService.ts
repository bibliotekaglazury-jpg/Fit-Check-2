/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Теперь все запросы идут через Railway бэкенд
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://fit-check-backend-production.up.railway.app';

// Утилита для конвертации файлов в FormData
const fileToFormData = (file: File, fieldName: string = 'file') => {
    const formData = new FormData();
    formData.append(fieldName, file);
    return formData;
};

// Утилита для HTTP запросов к Railway API
const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
        },
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
        return response.json();
    }
    return response.text();
};

export const generateModelImage = async (userImage: File): Promise<string> => {
    const formData = fileToFormData(userImage, 'image');
    const response = await apiRequest('/api/ai/generate-model', {
        method: 'POST',
        body: formData,
    });
    return response.imageUrl || response;
};

export const generateVirtualTryOnImage = async (modelImageUrl: string, garmentImageFile: File): Promise<string> => {
    const formData = new FormData();
    formData.append('garment', garmentImageFile);
    formData.append('modelImageUrl', modelImageUrl);
    
    const response = await apiRequest('/api/ai/virtual-tryon', {
        method: 'POST',
        body: formData,
    });
    return response.imageUrl || response;
};

export const generateBackgroundFromPrompt = async (modelImageUrl: string, backgroundPrompt: string): Promise<string> => {
    const response = await apiRequest('/api/ai/generate-background', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            modelImageUrl,
            backgroundPrompt,
        }),
    });
    return response.imageUrl || response;
};

export const replaceBackgroundWithImage = async (modelImageUrl: string, backgroundImageFile: File): Promise<string> => {
    const formData = new FormData();
    formData.append('backgroundImage', backgroundImageFile);
    formData.append('modelImageUrl', modelImageUrl);
    
    const response = await apiRequest('/api/ai/replace-background', {
        method: 'POST',
        body: formData,
    });
    return response.imageUrl || response;
};

export const generatePoseVariation = async (tryOnImageUrl: string, poseInstruction: string): Promise<string> => {
    const response = await apiRequest('/api/ai/generate-pose', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            imageUrl: tryOnImageUrl,
            poseInstruction,
        }),
    });
    return response.imageUrl || response;
};

export const generateCloseupImage = async (imageUrl: string, outfitDescription: string): Promise<string> => {
    const response = await apiRequest('/api/ai/generate-closeup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            imageUrl,
            outfitDescription,
        }),
    });
    return response.imageUrl || response;
};


export const startVideoGeneration = async (modelImageUrl: string, templateId?: string) => {
    const response = await apiRequest('/api/ai/generate-video', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            imageUrl: modelImageUrl,
            templateId: templateId || 'runway-walk',
        }),
    });
    return response;
};

export const checkVideoGenerationStatus = async (operation: any) => {
    const response = await apiRequest(`/api/ai/video-status/${operation.id}`, {
        method: 'GET',
    });
    return response;
};

export const generatePostCopy = async (
    imageUrl: string, 
    outfitDescription: string, 
    sceneDescription: string,
    brandName: string
): Promise<string> => {
    const response = await apiRequest('/api/ai/generate-post-copy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            imageUrl,
            outfitDescription,
            sceneDescription,
            brandName,
        }),
    });
    return response.postCopy || response;
};
