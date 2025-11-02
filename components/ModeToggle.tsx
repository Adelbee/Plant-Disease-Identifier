import React from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { CameraIcon } from './icons/CameraIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { ChatIcon } from './icons/ChatIcon';

interface ModeToggleProps {
    mode: 'upload' | 'camera' | 'audio' | 'text';
    onModeChange: (mode: 'upload' | 'camera' | 'audio' | 'text') => void;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onModeChange }) => {
    const activeClasses = "bg-green-600 text-white";
    const inactiveClasses = "bg-gray-200 text-gray-700 hover:bg-gray-300";

    const buttonStyle = "flex-1 px-3 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ease-in-out flex items-center justify-center space-x-2";

    return (
        <div className="flex justify-center p-1 bg-gray-100 rounded-full">
            <button
                onClick={() => onModeChange('upload')}
                className={`${buttonStyle} ${mode === 'upload' ? activeClasses : inactiveClasses}`}
                aria-pressed={mode === 'upload'}
            >
                <UploadIcon className="w-5 h-5" />
                <span>Upload</span>
            </button>
            <button
                onClick={() => onModeChange('camera')}
                className={`${buttonStyle} ${mode === 'camera' ? activeClasses : inactiveClasses}`}
                aria-pressed={mode === 'camera'}
            >
                <CameraIcon className="w-5 h-5" />
                <span>Camera</span>
            </button>
            <button
                onClick={() => onModeChange('audio')}
                className={`${buttonStyle} ${mode === 'audio' ? activeClasses : inactiveClasses}`}
                aria-pressed={mode === 'audio'}
            >
                <MicrophoneIcon className="w-5 h-5" />
                <span>Audio</span>
            </button>
             <button
                onClick={() => onModeChange('text')}
                className={`${buttonStyle} ${mode === 'text' ? activeClasses : inactiveClasses}`}
                aria-pressed={mode === 'text'}
            >
                <ChatIcon className="w-5 h-5" />
                <span>Text</span>
            </button>
        </div>
    );
};

export default ModeToggle;