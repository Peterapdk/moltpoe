import { GoogleGenAI, Chat } from "@google/genai";

// Initialize the client with the API key from environment variables
// Note: In a production environment for "TheRaven", this might proxy through the local Moltbot instance,
// but for this dashboard frontend we connect directly or mock the connection.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// We use the 'gemini-3-flash-preview' model for responsive chat interactions
const MODEL_NAME = 'gemini-3-flash-preview';

export const createChatSession = (): Chat => {
  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: "You are Moltbot, a sophisticated AI assistant managing the Raven dashboard. You are concise, technical, and helpful. You speak in a terminal-like, efficient manner.",
    },
  });
};

export const sendMessageStream = async (chat: Chat, message: string) => {
  try {
    return await chat.sendMessageStream({ message });
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw error;
  }
};

export const generateAgentSummary = async (agentName: string, role: string) => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate a short, 1-sentence technical status report for an agent named ${agentName} with role ${role}.`,
    });
    return response.text;
  } catch (error) {
    return "Status unknown.";
  }
};