import React, { useState, useRef, useEffect } from 'react';
import { startTextChat } from '../services/geminiService';

// Fix: Declare marked to inform TypeScript that it's a global variable.
declare const marked: any;

type Language = 'english' | 'pidgin';

interface Message {
  speaker: 'You' | 'Botanist';
  text: string;
}

const languageInstructions: Record<Language, string> = {
    english: 'You are a friendly and knowledgeable AI botanist. You can answer questions about plant care, diseases, and gardening. Keep your answers concise and helpful. Use Markdown for formatting.',
    pidgin: 'You are a friendly and knowledgeable AI botanist who speaks fluent Nigerian Pidgin. You can answer questions about plant care, diseases, and gardening. Respond only in Nigerian Pidgin. Keep your answers concise and helpful. Use Markdown for formatting.'
};

const TextChat: React.FC = () => {
  const [language, setLanguage] = useState<Language>('english');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatSessionRef = useRef<{ sendMessage: (message: string) => Promise<string> } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  useEffect(() => {
    // Reset chat when language changes
    setMessages([]);
    chatSessionRef.current = startTextChat(languageInstructions[language]);
  }, [language]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = userInput.trim();
    if (!trimmedInput || isLoading) return;

    setError(null);
    setMessages(prev => [...prev, { speaker: 'You', text: trimmedInput }]);
    setUserInput('');
    setIsLoading(true);

    try {
        if (!chatSessionRef.current) {
             chatSessionRef.current = startTextChat(languageInstructions[language]);
        }
        const botResponse = await chatSessionRef.current.sendMessage(trimmedInput);
        setMessages(prev => [...prev, { speaker: 'Botanist', text: botResponse }]);
    } catch (err) {
        setError('Sorry, something went wrong. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      <div className="w-full flex justify-end">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          disabled={isLoading || messages.length > 0}
          className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="english">English</option>
          <option value="pidgin">Nigerian Pidgin</option>
        </select>
      </div>

      <div className="w-full h-80 bg-gray-50 rounded-lg p-4 border overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Ask the AI Botanist anything about your plants!</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.speaker === 'You' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md rounded-xl px-4 py-2 ${msg.speaker === 'You' ? 'bg-green-100 text-green-900' : 'bg-gray-200 text-gray-800'}`}>
              <p className="font-bold text-sm">{msg.speaker}</p>
              <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: typeof marked !== 'undefined' ? marked.parse(msg.text) : msg.text.replace(/\n/g, '<br />') }} />
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="max-w-xs md:max-w-md rounded-xl px-4 py-2 bg-gray-200 text-gray-800">
                    <p className="font-bold text-sm">Botanist</p>
                    <div className="flex items-center space-x-1">
                        <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></span>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}

      <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !userInput.trim()}
          className="px-6 py-2 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default TextChat;