import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import AnalysisResult from './components/AnalysisResult';
import Loader from './components/Loader';
import { analyzePlantImage } from './services/geminiService';
import CameraScanner from './components/CameraScanner';
import ModeToggle from './components/ModeToggle';
import AudioChat from './components/AudioChat';
import TextChat from './components/TextChat';

const App: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [mode, setMode] = useState<'upload' | 'camera' | 'audio' | 'text'>('upload');

  const handleAnalyze = useCallback(async (base64Data: string, mimeType: string) => {
    if (!base64Data) {
      setError('No image data provided for analysis.');
      return;
    }

    setIsLoading(true);
    setAnalysisResult('');
    setError('');

    try {
      const result = await analyzePlantImage(base64Data, mimeType);
      setAnalysisResult(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Analysis failed: ${err.message}`);
      } else {
        setError('An unknown error occurred during analysis.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const resetState = () => {
    setAnalysisResult('');
    setError('');
  };

  const renderContent = () => {
    switch (mode) {
      case 'upload':
      case 'camera':
        return (
          <>
            {mode === 'upload' ? (
              <ImageUploader onAnalyze={handleAnalyze} isLoading={isLoading} />
            ) : (
              <CameraScanner onAnalyze={handleAnalyze} isLoading={isLoading} />
            )}

            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                <p className="font-bold">Error</p>
                <p>{error}</p>
            </div>}
            
            {isLoading && <Loader />}
            
            {analysisResult && !isLoading && (
                <AnalysisResult result={analysisResult} />
            )}
          </>
        );
      case 'audio':
        return <AudioChat />;
      case 'text':
        return <TextChat />;
      default:
        return null;
    }
  }

  return (
    <div className="bg-green-50 min-h-screen flex flex-col font-sans text-gray-800">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-green-800">Is your plant feeling under the weather?</h2>
            <p className="text-gray-600 mt-2">Upload a photo, use your camera, or chat with our AI botanist for a diagnosis.</p>
          </div>

          <ModeToggle mode={mode} onModeChange={(newMode) => { setMode(newMode); resetState(); }} />
          
          {renderContent()}
        </div>
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Powered by Gemini. For informational purposes only.</p>
      </footer>
    </div>
  );
};

export default App;