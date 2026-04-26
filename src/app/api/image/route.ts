import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";

export const maxDuration = 9; // Vercel hobby limit

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const prompt = searchParams.get("prompt");

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    if (!process.env.HUGGINGFACE_API_KEY) {
      return NextResponse.json({ error: "Missing HF API Key" }, { status: 500 });
    }

    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

    // Use FLUX.1-schnell for fast, high-quality image generation
    const blob = await hf.textToImage({
      inputs: prompt,
      model: "black-forest-labs/FLUX.1-schnell",
    }) as unknown as Blob;

    return new Response(blob, {
      headers: {
        "Content-Type": blob.type,
        "Cache-Control": "public, max-age=86400", // Cache generated images locally for 24h
      },
    });
  } catch (error: any) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
