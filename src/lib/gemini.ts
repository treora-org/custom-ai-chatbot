import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message } from "@/types/chat";

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function generateChatResponse(messages: Message[]): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in the environment variables.");
  }

  // Use the extremely fast flash model
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Gemini expects history in a specific format.
  // Last message is the current prompt, everything before is history.
  const history = messages.slice(0, -1).map((msg) => {
    const parts: any[] = [{ text: msg.content }];
    if (msg.attachments && msg.attachments.length > 0) {
      msg.attachments.forEach((att) => {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data,
          },
        });
      });
    }
    return {
      role: msg.role === "assistant" ? "model" : "user",
      parts,
    };
  });

  const lastMsg = messages[messages.length - 1];
  const currentParts: any[] = [{ text: lastMsg.content }];
  if (lastMsg.attachments && lastMsg.attachments.length > 0) {
    lastMsg.attachments.forEach((att) => {
      currentParts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data,
        },
      });
    });
  }

  try {
    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const result = await chat.sendMessage(currentParts);
    const response = await result.response;
    return response.text();

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate response from Gemini");
  }
}
