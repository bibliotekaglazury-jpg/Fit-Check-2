/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

const fileToPart = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
};

export const dataUrlToParts = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    return { mimeType: mimeMatch[1], data: arr[1] };
}

const dataUrlToPart = (dataUrl: string) => {
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
}

const handleApiResponse = (response: GenerateContentResponse): string => {
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        throw new Error(errorMessage);
    }

    // Find the first image part in any candidate
    for (const candidate of response.candidates ?? []) {
        const imagePart = candidate.content?.parts?.find(part => part.inlineData);
        if (imagePart?.inlineData) {
            const { mimeType, data } = imagePart.inlineData;
            return `data:${mimeType};base64,${data}`;
        }
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        throw new Error(errorMessage);
    }
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image. ` + (textFeedback ? `The model responded with text: "${textFeedback}"` : "This can happen due to safety filters or if the request is too complex. Please try a different image.");
    throw new Error(errorMessage);
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const model = 'gemini-2.5-flash-image-preview';
const videoModel = 'veo-3.0-generate-001'; // Working VEO model

export const generateModelImage = async (userImage: File): Promise<string> => {
    const userImagePart = await fileToPart(userImage);
    const prompt = `You are an expert AI fashion photographer. Your task is to take the person from the provided image and place them in a professional e-commerce fashion photo.

**ULTIMATE COMMAND: PRESERVE THE ORIGINAL FACE. THIS IS A STRICT, NON-NEGOTIABLE RULE. DO NOT CHANGE THE FACE.**

**PRIMARY DIRECTIVE: The person's facial features, structure, and identity MUST be 100% preserved from the original photo. Any alteration to the face, however minor, is a complete failure of the task. The face in the output image must be IDENTICAL to the face in the input image.**

**SECONDARY INSTRUCTIONS:**
1.  **PRESERVE BODY TYPE:** The person's body type must be maintained.
2.  **POSE & BACKGROUND:** Place the person in a standard, relaxed standing model pose against a clean, neutral studio backdrop (light gray, #f0f0f0). If the original image is not full-body, generate a realistic full-body view that is consistent with the person shown.
3.  **OUTPUT:** The final image must be photorealistic. Return ONLY the final image.

**FINAL CHECK: Did you alter the face? If so, you have failed. Discard the result and start again, this time PRESERVING THE FACE EXACTLY as commanded.`;
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }, userImagePart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    return handleApiResponse(response);
};

export const generateVirtualTryOnImage = async (modelImageUrl: string, garmentImageFile: File): Promise<string> => {
    const modelImagePart = dataUrlToPart(modelImageUrl);
    const garmentImagePart = await fileToPart(garmentImageFile);
    const prompt = `You are an expert virtual try-on AI. Your task is to perform a garment **REPLACEMENT**. You will receive a 'model image' and a 'garment image'. You must create a new image where the person from the 'model image' is wearing the garment from the 'garment image'.

**ULTIMATE COMMAND: This is a REPLACEMENT, not a layering operation. You MUST first virtually REMOVE ALL existing clothing from the person in the 'model image'. The person should be undressed before you apply the new garment. Any part of the original clothing (collars, sleeves, etc.) showing in the final image is a critical failure.**

**Step-by-step process:**
1.  **Analyze Model:** Look at the person in the 'model image'.
2.  **Undress Model:** Virtually remove ALL clothing items they are wearing, leaving only the person.
3.  **Dress Model:** Realistically place the new garment from the 'garment image' onto the now-undressed person.

**Rules for the final image:**
*   **PRESERVE THE MODEL:** The person's face, hair, body shape, and pose from the 'model image' MUST remain identical.
*   **PRESERVE THE BACKGROUND:** The background from the 'model image' MUST be preserved perfectly.
*   **REALISTIC FIT:** The new garment must fit the person's body and pose naturally, with correct lighting and shadows that match the original image.
*   **OUTPUT:** Return ONLY the final, edited image. Do not include any text.`;
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }, modelImagePart, garmentImagePart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    return handleApiResponse(response);
};

export const generateBackgroundFromPrompt = async (modelImageUrl: string, backgroundPrompt: string): Promise<string> => {
    const modelImagePart = dataUrlToPart(modelImageUrl);
    
    const prompt = `You are an expert AI photo editor. You will receive a 'source image' containing a person on a neutral background, and a textual 'background prompt'. Your task is to place the person onto a newly generated background.

**ABSOLUTE CRITICAL RULE #1: MAINTAIN DIMENSIONS. The output image MUST have the exact same pixel dimensions (width and height) and aspect ratio as the original 'source image'. This is the most important instruction and is non-negotiable.**

**Crucial Rules:**
1.  **Generate Background:** Create a high-quality, realistic background scene as described by: "${backgroundPrompt}".
2.  **Isolate the Person:** Accurately cut out the person and all their clothing from the 'source image'.
3.  **Preserve the Person:** The person's appearance, pose, clothing, and any items they are holding must remain completely unchanged.
4.  **Composite Realistically:** Place the person onto the new background. The lighting, shadows, and scale must be adjusted to match the generated background to create a seamless, photorealistic final image.
5.  **Output:** Return ONLY the final, composited image. Do not include any text.`;

    const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }, modelImagePart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    return handleApiResponse(response);
};

export const replaceBackgroundWithImage = async (modelImageUrl: string, backgroundImageFile: File): Promise<string> => {
    const modelImagePart = dataUrlToPart(modelImageUrl);
    const backgroundImagePart = await fileToPart(backgroundImageFile);
    
    const prompt = `You are an expert AI photo editor. You will receive a 'source image' containing a person and a 'background image'. Your task is to perfectly and realistically place the person from the 'source image' onto the 'background image'.

**ABSOLUTE CRITICAL RULE #1: MAINTAIN DIMENSIONS. The output image MUST have the exact same pixel dimensions (width and height) and aspect ratio as the original 'source image'. This is the most important instruction and is non-negotiable.**

**Crucial Rules:**
1.  **Isolate the Person:** Accurately cut out the person and all their clothing from the 'source image'. The original background of the 'source image' must be completely discarded.
2.  **Preserve the Person:** The person's appearance, pose, clothing, and any items they are holding must remain completely unchanged.
3.  **Use New Background:** The provided 'background image' must be used as the new background.
4.  **Composite Realistically:** Place the person onto the new background. The lighting, shadows, and scale must be adjusted to match the new background to create a seamless, photorealistic final image.
5.  **Output:** Return ONLY the final, composited image. Do not include any text.`;

    const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }, modelImagePart, backgroundImagePart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    return handleApiResponse(response);
};

export const generatePoseVariation = async (tryOnImageUrl: string, poseInstruction: string): Promise<string> => {
    const tryOnImagePart = dataUrlToPart(tryOnImageUrl);
    const prompt = `Create a professional fashion photography variation of the provided image with a different camera angle.

**Technical Requirements:**
- Maintain exact same dimensions and aspect ratio
- Preserve the person's appearance, clothing, and background
- Apply new camera perspective: "${poseInstruction}"
- Professional fashion photography quality
- Return only the final image`;
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }, tryOnImagePart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    return handleApiResponse(response);
};

export const generateCloseupImage = async (imageUrl: string, outfitDescription: string): Promise<string> => {
    const imagePart = dataUrlToPart(imageUrl);
    
    const clothingFocus = outfitDescription ? `Highlight clothing details: ${outfitDescription}` : 'Highlight garment details';

    const prompt = `Create a professional close-up fashion photograph from the provided image.

**Requirements:**
- Same dimensions and aspect ratio as source
- Close-up view (waist up or detail shot)
- ${clothingFocus}
- Showcase fabric texture and craftsmanship
- Professional fashion photography quality
- Return only the final image`;

    const response = await ai.models.generateContent({
        model, // 'gemini-2.5-flash-image-preview'
        contents: { parts: [{ text: prompt }, imagePart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    return handleApiResponse(response);
};


export const startVideoGeneration = async (modelImageUrl: string, templateId?: string) => {
    const { data: imageBytes, mimeType } = dataUrlToParts(modelImageUrl);
    
    // Import video templates
    const { getTemplateById, getDefaultTemplate } = await import('../config/videoTemplates');
    const template = templateId ? getTemplateById(templateId) || getDefaultTemplate() : getDefaultTemplate();
    
    const prompt = template.prompt;
    
    // Use the working VEO-3.0-generate-001 model directly
    const operation = await ai.models.generateVideos({
        model: videoModel,
        prompt,
        image: { imageBytes, mimeType },
        config: { 
            numberOfVideos: 1,
            videoLength: template.duration, // Duration based on template
            aspectRatio: '9:16', // Vertical Instagram format
            motionStrength: template.motionStrength, // Motion strength from template
            quality: 'premium', // Best quality for sales
            cropMode: 'smart', // Intelligent cropping to fill frame
            scaleMode: 'fill' // Scale to fill entire frame
        }
    });
    
    return operation;
};

export const checkVideoGenerationStatus = async (operation: any) => {
    return await ai.operations.getVideosOperation({ operation });
};

export const generatePostCopy = async (
    imageUrl: string, 
    outfitDescription: string, 
    sceneDescription: string,
    brandName: string
): Promise<string> => {
    const imagePart = dataUrlToPart(imageUrl);
    
    const outfitText = outfitDescription ? `The outfit consists of: ${outfitDescription}.` : "The person is wearing the displayed outfit.";
    const sceneText = `The scene is: ${sceneDescription}.`;
    const brandText = brandName 
        ? `The fashion brand is "${brandName}". Mention the brand name at least once in a natural way.` 
        : `No brand name was provided. Do not invent a brand name.`;

    const prompt = `You are an expert social media marketer and copywriter for a trendy e-commerce fashion brand.
Based on the provided image, the outfit, and the scene, write an engaging Instagram post caption. Use relevant emojis to make the post more visually appealing.

The caption MUST include these three sections in order:
1.  **Product Description:** A captivating description of the outfit (2-3 sentences). Focus on the style, material, and how it makes the wearer feel.
2.  **Call to Action (CTA):** A clear and compelling call to action (1 sentence). Encourage users to shop, learn more, or comment.
3.  **Hashtags:** A list of 5-7 relevant and trending hashtags.

**Outfit Details:** ${outfitText}
**Scene Details:** ${sceneText}
**Brand Details:** ${brandText}

Generate ONLY the caption text, without any introductory phrases like "Here's the caption:".`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }, imagePart] },
    });

    let postCopy = response.text;

    if (!postCopy) {
        if (response.promptFeedback?.blockReason) {
            const { blockReason, blockReasonMessage } = response.promptFeedback;
            const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
            throw new Error(errorMessage);
        }
        throw new Error("The model did not return a post copy. This could be due to safety filters or a temporary issue.");
    }

    // Clean up potential introductory phrases from the model's response.
    postCopy = postCopy.replace(/^.*:\s*\n*/, '').trim();
    
    return postCopy;
};