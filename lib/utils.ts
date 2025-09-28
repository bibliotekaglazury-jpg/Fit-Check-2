/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to convert image URL to a File object using a canvas to bypass potential CORS issues.
export const urlToFile = (url: string, filename:string): Promise<File> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.setAttribute('crossOrigin', 'anonymous');

        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context.'));
            }
            ctx.drawImage(image, 0, 0);

            canvas.toBlob((blob) => {
                if (!blob) {
                    return reject(new Error('Canvas toBlob failed.'));
                }
                const mimeType = blob.type || 'image/png';
                const file = new File([blob], filename, { type: mimeType });
                resolve(file);
            }, 'image/png');
        };

        image.onerror = (error) => {
            reject(new Error(`Could not load image from URL for canvas conversion. Error: ${error}`));
        };

        image.src = url;
    });
};

export function getFriendlyErrorMessage(error: unknown, context: string): string {
    let rawMessage: string;

    if (error instanceof Error) {
        rawMessage = error.message;
    } else if (typeof error === 'string') {
        rawMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
        // This handles plain objects with a 'message' property, a common pattern for API errors.
        rawMessage = (error as { message: string }).message;
    } else if (error) {
        // As a last resort, stringify the error. This is better than `String(error)` which gives "[object Object]".
        try {
           const jsonStr = JSON.stringify(error);
           rawMessage = jsonStr !== undefined ? jsonStr : String(error);
        } catch {
           rawMessage = String(error); // Fallback for circular structures, etc.
        }
    } else {
        rawMessage = 'An unknown error occurred.';
    }
    
    // Check for specific error messages before generic handling
    if (rawMessage.toLowerCase().includes('rate limit') || rawMessage.includes('429')) {
        return "We're experiencing high traffic right now. Please wait a moment and try again.";
    }

    // The error message from an API might itself be a stringified JSON object.
    // Try to parse it to get a more specific message from inside.
    try {
        const parsed = JSON.parse(rawMessage);
        const nestedMessage = parsed?.error?.message;
        if (typeof nestedMessage === 'string') {
            rawMessage = nestedMessage;
        } else if (typeof parsed.message === 'string') {
            rawMessage = parsed.message;
        }
    // FIX: Catch clauses should use `unknown` for better type safety.
    } catch (e: unknown) {
        // It wasn't a JSON string, so we just use rawMessage as is.
    }

    // Check for specific unsupported MIME type error from Gemini API
    if (rawMessage.includes("Unsupported MIME type")) {
        const mimeType = rawMessage.split(': ')[1] || 'unsupported';
        return `File type '${mimeType}' is not supported. Please use a format like PNG, JPEG, or WEBP.`;
    }
    
    return `${context}. ${rawMessage}`;
}