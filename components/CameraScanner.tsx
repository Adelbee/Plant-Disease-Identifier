
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CameraIcon } from './icons/CameraIcon';

interface CameraScannerProps {
  onAnalyze: (base64Data: string, mimeType: string) => Promise<void>;
  isLoading: boolean;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onAnalyze, isLoading }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const enableCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
             setIsCameraReady(true);
          }
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        if (err instanceof DOMException) {
            if (err.name === 'NotAllowedError') {
                setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
            } else if (err.name === 'NotFoundError') {
                setCameraError('No camera found. Please ensure a camera is connected and enabled.');
            } else {
                 setCameraError('Could not access the camera. Please check your browser settings.');
            }
        } else {
            setCameraError('An unexpected error occurred while accessing the camera.');
        }
      }
    };

    enableCamera();

    return () => {
      // Cleanup: stop the camera stream when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleAnalyzeClick = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame onto the canvas
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get the image data from the canvas
      const dataUrl = canvas.toDataURL('image/jpeg');
      const base64Data = dataUrl.split(',')[1];
      const mimeType = 'image/jpeg';
      
      await onAnalyze(base64Data, mimeType);
    }
  }, [onAnalyze]);

  return (
    <div className="w-full space-y-4">
      <div className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden border-2 border-gray-300">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {!isCameraReady && !cameraError && (
             <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                <div className="w-8 h-8 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
                <span className="ml-3">Starting camera...</span>
            </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 p-4 text-center text-white">
            <p className="font-semibold">Camera Error</p>
            <p className="text-sm mt-1">{cameraError}</p>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleAnalyzeClick}
          disabled={isLoading || !!cameraError || !isCameraReady}
          className="px-8 py-3 bg-green-600 text-white font-bold rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center space-x-2"
        >
          <CameraIcon className="w-5 h-5" />
          <span>{isLoading ? 'Analyzing...' : 'Analyze from Camera'}</span>
        </button>
      </div>
    </div>
  );
};

export default CameraScanner;