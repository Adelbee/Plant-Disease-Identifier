
import React, { useState, useCallback, ChangeEvent } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { fileToBase64 } from '../utils/fileUtils';

interface ImageUploaderProps {
  onAnalyze: (base64Data: string, mimeType: string) => Promise<void>;
  isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onAnalyze, isLoading }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreview(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
  };

  const handleAnalyzeClick = async () => {
    if (!imageFile) return;
    const { base64Data, mimeType } = await fileToBase64(imageFile);
    await onAnalyze(base64Data, mimeType);
  };

  return (
    <div className="w-full space-y-4">
      {preview ? (
        <div className="relative w-full max-w-md mx-auto border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
            <img src={preview} alt="Plant preview" className="rounded-lg max-h-80 mx-auto" />
            <p className="text-sm text-gray-500 mt-2 truncate">{imageFile?.name}</p>
            <button 
              onClick={handleRemoveImage} 
              className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold text-lg hover:bg-red-600 transition-colors"
              aria-label="Remove image"
            >
              &times;
            </button>
        </div>
      ) : (
        <label
          htmlFor="file-upload"
          className="relative block w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors"
        >
          <div className="flex flex-col items-center justify-center text-gray-500">
            <UploadIcon className="w-12 h-12 text-gray-400" />
            <span className="mt-2 block text-lg font-semibold">
              Click to upload a photo
            </span>
            <span className="mt-1 block text-sm">PNG, JPG, GIF up to 10MB</span>
          </div>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="sr-only"
            accept="image/*"
            onChange={handleFileChange}
          />
        </label>
      )}

      {imageFile && (
        <div className="flex justify-center">
            <button
              onClick={handleAnalyzeClick}
              disabled={!imageFile || isLoading}
              className="px-8 py-3 bg-green-600 text-white font-bold rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100"
            >
              {isLoading ? 'Analyzing...' : 'Analyze Plant Photo'}
            </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;