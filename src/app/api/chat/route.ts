import { NextResponse } from "next/server";
import { generateChatResponse } from "@/lib/gemini";
import { Message } from "@/types/chat";

// App Router route segment config for large file upload payloads
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body as { messages: Message[] };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const replyText = await generateChatResponse(messages);

    return NextResponse.json({ reply: replyText });
  } catch (error: any) {
    console.error("Chat API Error:", error.message || error);
    return NextResponse.json(
      { error: error.message || "An error occurred while communicating with the AI model." },
      { status: 500 }
    );
  }
}

