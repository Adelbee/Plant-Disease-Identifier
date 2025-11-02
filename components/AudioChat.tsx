import React, { useState, useRef, useEffect } from 'react';
import { LiveServerMessage, LiveSession } from '@google/genai';
import { startAudioChatSession } from '../services/geminiService';
import { createBlob, decode, decodeAudioData } from '../utils/audioUtils';
import { MicrophoneIcon } from './icons/MicrophoneIcon';

type ChatStatus = 'IDLE' | 'CONNECTING' | 'LISTENING' | 'SPEAKING' | 'ERROR';
type Language = 'english' | 'pidgin';

interface TranscriptEntry {
  speaker: 'You' | 'Botanist';
  text: string;
}

const languageInstructions: Record<Language, string> = {
    english: 'You are a friendly and knowledgeable AI botanist. You can answer questions about plant care, diseases, and gardening. Keep your answers concise and helpful.',
    pidgin: 'You are a friendly and knowledgeable AI botanist who speaks fluent Nigerian Pidgin. You can answer questions about plant care, diseases, and gardening. Respond only in Nigerian Pidgin. Keep your answers concise and helpful.'
};

const AudioChat: React.FC = () => {
  const [status, setStatus] = useState<ChatStatus>('IDLE');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('english');

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  useEffect(() => {
    if (transcriptContainerRef.current) {
        transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [transcript]);

  const stopSession = () => {
    sessionPromiseRef.current?.then(session => session.close());
    sessionPromiseRef.current = null;

    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;

    scriptProcessorRef.current?.disconnect();
    scriptProcessorRef.current = null;

    inputAudioContextRef.current?.close();
    inputAudioContextRef.current = null;
    outputAudioContextRef.current?.close();
    outputAudioContextRef.current = null;
    
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    setStatus('IDLE');
  };
  
  const startSession = async () => {
    setStatus('CONNECTING');
    setError(null);
    setTranscript([]);
    currentInputTranscriptionRef.current = '';
    currentOutputTranscriptionRef.current = '';

    try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

        // FIX: Cast window to any to support webkitAudioContext for older browsers without TypeScript errors.
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        const systemInstruction = languageInstructions[language];

        sessionPromiseRef.current = startAudioChatSession({
            onopen: () => {
                setStatus('LISTENING');
                const source = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current!);
                scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                
                scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const pcmBlob = createBlob(inputData);
                    sessionPromiseRef.current?.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };

                source.connect(scriptProcessorRef.current);
                scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
                // Handle transcriptions
                if (message.serverContent?.outputTranscription) {
                    currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                }
                if (message.serverContent?.inputTranscription) {
                    currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                }
                if (message.serverContent?.turnComplete) {
                    if(currentInputTranscriptionRef.current.trim()) {
                       setTranscript(prev => [...prev, { speaker: 'You', text: currentInputTranscriptionRef.current.trim() }]);
                    }
                    if(currentOutputTranscriptionRef.current.trim()) {
                       setTranscript(prev => [...prev, { speaker: 'Botanist', text: currentOutputTranscriptionRef.current.trim() }]);
                    }
                    currentInputTranscriptionRef.current = '';
                    currentOutputTranscriptionRef.current = '';
                }

                // Handle audio playback
                const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                if (base64Audio) {
                    setStatus('SPEAKING');
                    const outputCtx = outputAudioContextRef.current!;
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                    
                    const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                    const source = outputCtx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outputCtx.destination);
                    
                    source.addEventListener('ended', () => {
                        sourcesRef.current.delete(source);
                        if (sourcesRef.current.size === 0) {
                            setStatus('LISTENING');
                        }
                    });

                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    sourcesRef.current.add(source);
                }

                if (message.serverContent?.interrupted) {
                    sourcesRef.current.forEach(source => source.stop());
                    sourcesRef.current.clear();
                    nextStartTimeRef.current = 0;
                    setStatus('LISTENING');
                }
            },
            onerror: (e: ErrorEvent) => {
                console.error("Session error:", e);
                setError('A connection error occurred. Please try again.');
                setStatus('ERROR');
                stopSession();
            },
            onclose: (e: CloseEvent) => {
                stopSession();
            },
        }, systemInstruction);
    } catch (err) {
        console.error("Failed to start session:", err);
        if (err instanceof DOMException && err.name === 'NotAllowedError') {
             setError('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else {
             setError('Could not access the microphone.');
        }
        setStatus('ERROR');
    }
  };

  const handleToggleSession = () => {
    if (status === 'IDLE' || status === 'ERROR') {
      startSession();
    } else {
      stopSession();
    }
  };
  
  useEffect(() => {
    // Cleanup on unmount
    return () => stopSession();
  }, []);

  const getButtonState = () => {
    switch(status) {
        case 'IDLE':
            return { text: 'Start Chat', iconClass: 'text-green-600', bgClass: 'bg-green-100 hover:bg-green-200' };
        case 'CONNECTING':
            return { text: 'Connecting...', iconClass: 'text-yellow-600 animate-pulse', bgClass: 'bg-yellow-100 cursor-not-allowed' };
        case 'LISTENING':
            return { text: 'Listening...', iconClass: 'text-red-600 animate-pulse', bgClass: 'bg-red-100 hover:bg-red-200' };
        case 'SPEAKING':
            return { text: 'Speaking...', iconClass: 'text-blue-600', bgClass: 'bg-blue-100 hover:bg-blue-200' };
        case 'ERROR':
            return { text: 'Try Again', iconClass: 'text-red-600', bgClass: 'bg-red-100 hover:bg-red-200' };
        default:
             return { text: 'Start Chat', iconClass: 'text-gray-600', bgClass: 'bg-gray-100 hover:bg-gray-200' };
    }
  }

  const { text, iconClass, bgClass } = getButtonState();

  return (
    <div className="w-full space-y-4 flex flex-col items-center">
       <div className="w-full flex justify-end">
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                disabled={status !== 'IDLE' && status !== 'ERROR'}
                className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
                <option value="english">English</option>
                <option value="pidgin">Nigerian Pidgin</option>
            </select>
       </div>
       <div ref={transcriptContainerRef} className="w-full h-64 bg-gray-50 rounded-lg p-4 border overflow-y-auto space-y-4">
            {transcript.length === 0 && !error && (
                 <div className="flex items-center justify-center h-full text-gray-500">
                    <p>Tap the microphone to start chatting with the AI Botanist.</p>
                </div>
            )}
            {transcript.map((entry, index) => (
                <div key={index} className={`flex ${entry.speaker === 'You' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs md:max-w-md rounded-xl px-4 py-2 ${entry.speaker === 'You' ? 'bg-green-100 text-green-900' : 'bg-gray-200 text-gray-800'}`}>
                        <p className="font-bold text-sm">{entry.speaker}</p>
                        <p>{entry.text}</p>
                    </div>
                </div>
            ))}
       </div>
       {error && <p className="text-red-600 text-sm text-center">{error}</p>}
       <div className="flex flex-col items-center space-y-2">
            <button
                onClick={handleToggleSession}
                disabled={status === 'CONNECTING'}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${bgClass}`}
                aria-label={text}
            >
                <MicrophoneIcon className={`w-10 h-10 ${iconClass}`} />
            </button>
            <p className="text-sm font-medium text-gray-600">{text}</p>
       </div>
    </div>
  );
};

export default AudioChat;