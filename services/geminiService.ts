import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob, Chat } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const imageAnalysisModel = 'gemini-2.5-flash';
const audioChatModel = 'gemini-2.5-flash-native-audio-preview-09-2025';
const textChatModel = 'gemini-2.5-flash';


export const analyzePlantImage = async (base64ImageData: string, mimeType: string): Promise<string> => {
  
  const imagePart = {
    inlineData: {
      data: base64ImageData,
      mimeType: mimeType,
    },
  };

  const textPart = {
    text: `You are an expert botanist and plant pathologist. Analyze the provided image of a plant.
Please provide the following information in a clear, structured format using Markdown:
1.  **Plant Identification**: Identify the species of the plant. If you are not certain, provide your best guess and mention the uncertainty.
2.  **Disease Analysis**: Examine the plant for any signs of disease or pests. If any are found, identify them and describe the aymptoms. If the plant appears healthy, state that clearly.
3.  **Treatment and Care Plan**: Based on your analysis, provide a detailed, step-by-step plan.
    - If a disease is present, detail the treatment steps (e.g., pruning, specific treatments, organic and chemical options).
    - Provide general care instructions for this plant species, including watering schedule, sunlight requirements, and ideal soil type.`
  };

  try {
    const response = await ai.models.generateContent({
      model: imageAnalysisModel,
      contents: { parts: [imagePart, textPart] },
    });
    
    if (!response.text) {
        throw new Error("The API returned an empty response.");
    }
    
    return response.text;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get a response from the AI model.");
  }
};

export const startAudioChatSession = (callbacks: {
    onopen: () => void;
    onmessage: (message: LiveServerMessage) => Promise<void>;
    onerror: (e: ErrorEvent) => void;
    onclose: (e: CloseEvent) => void;
}, systemInstruction: string): Promise<LiveSession> => {
    return ai.live.connect({
        model: audioChatModel,
        callbacks: callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: systemInstruction,
            outputAudioTranscription: {},
            inputAudioTranscription: {},
        },
    });
};

export const startTextChat = (systemInstruction: string): {
    sendMessage: (message: string) => Promise<string>;
} => {
    const chat: Chat = ai.chats.create({
        model: textChatModel,
        config: {
            systemInstruction: systemInstruction,
        },
    });

    return {
        sendMessage: async (message: string) => {
            try {
                const response = await chat.sendMessage({ message });
                if (!response.text) {
                    throw new Error("The API returned an empty text response.");
                }
                return response.text;
            } catch (error) {
                console.error("Error sending chat message:", error);
                throw new Error("Failed to get a response from the chat model.");
            }
        },
    };
};