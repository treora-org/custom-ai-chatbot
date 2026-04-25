import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    if (!audioFile) return NextResponse.json({ error: "No audio" }, { status: 400 });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3-turbo",
      language: "en",
      response_format: "json",
    });

    return NextResponse.json({ text: transcription.text || "" });
  } catch (error: any) {
    console.error("Transcription error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
