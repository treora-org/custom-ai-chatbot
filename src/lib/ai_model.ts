import Groq from "groq-sdk";
import { Message, Source } from "@/types/chat";
import { searchWeb } from "./search";
import { readWebpage } from "./readWebpage";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateChatResponse(messages: Message[]): Promise<{ reply: string; sources: Source[] }> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set.");
  }

  const systemPrompt = {
    role: "system" as const,
    content: "You are Eve, an autonomous AI assistant. You have three tools: 'search_web', 'read_webpage', and 'generate_image'. CRITICAL: Rely on your internal knowledge FIRST. ONLY use 'search_web' if you do not know the answer or if the user asks for real-time/recent information. If the user asks to generate, create, or draw an image, use the 'generate_image' tool with a highly detailed visual prompt. Be concise in your text responses."
  };

  const groqMessages: any[] = [
    systemPrompt,
    ...messages.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    }))
  ];

  const tools = [
    {
      type: "function",
      function: {
        name: "search_web",
        description: "Search the web for real-time information or facts.",
        parameters: {
          type: "object",
          properties: { query: { type: "string", description: "Search query." } },
          required: ["query"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "read_webpage",
        description: "Scrape and read the full paragraph text from a specific URL.",
        parameters: {
          type: "object",
          properties: { url: { type: "string", description: "The URL to read." } },
          required: ["url"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "generate_image",
        description: "Generate an image based on a text prompt.",
        parameters: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "A highly detailed, comma-separated visual description of the image to generate. Include lighting, style, subject, and atmosphere."
            }
          },
          required: ["prompt"],
        },
      },
    }
  ];

  const sources: Source[] = [];
  let iterations = 0;
  const maxIterations = 2; // Kept low for Vercel free-tier 10s timeout

  while (iterations < maxIterations) {
    iterations++;

    let completion;
    try {
      completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: groqMessages,
        max_tokens: 768,
        temperature: 0.7,
        tools: tools as any,
        tool_choice: "auto",
      });
    } catch (error: any) {
      console.error("[Agent] Groq completion error in tool loop:", error.message || error);
      break; // Exit the tool loop and fall back to a standard response
    }

    const responseMessage = completion.choices[0]?.message;
    let finalContent = responseMessage?.content ?? "";

    // Intercept Llama 3.1 XML tool hallucinations (catches <function=, function=, unction=, etc)
    const toolRegex = /function=generate_image>([\s\S]*?)<\/?function>/gi;
    const match = toolRegex.exec(finalContent);
    if (match) {
      try {
        const jsonArgs = JSON.parse(match[1]);
        const prompt = jsonArgs.prompt;
        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `/api/image?prompt=${encodedPrompt}`;

        finalContent = finalContent.replace(match[0], `\n\n![${prompt}](${imageUrl})\n\n`);
      } catch (e) {
        console.error("Failed to parse hallucinated JSON:", e);
      }
    }

    if (!responseMessage?.tool_calls || responseMessage.tool_calls.length === 0) {
      // AI finished researching and gave a final answer
      return {
        reply: finalContent,
        sources
      };
    }

    // AI decided to use tools
    groqMessages.push(responseMessage);

    for (const toolCall of responseMessage.tool_calls) {
      let args: any = {};
      try {
        args = JSON.parse(toolCall.function.arguments || "{}");
      } catch (parseError) {
        console.error("[Agent] JSON parse error for tool arguments:", toolCall.function.arguments);
        continue; // Skip this malformed tool call
      }
      let toolResult = "";

      if (toolCall.function.name === "search_web") {
        console.log("[Agent] Searching:", args.query);
        toolResult = await searchWeb(args.query);
      } else if (toolCall.function.name === "read_webpage") {
        console.log("[Agent] Reading:", args.url);
        toolResult = await readWebpage(args.url);

        if (args.url && !sources.find((s) => s.url === args.url)) {
          sources.push({
            url: args.url,
            title: new URL(args.url).hostname.replace("www.", "")
          });
        }
      } else if (toolCall.function.name === "generate_image") {
        console.log("[Agent] Generating image for:", args.prompt);
        // We use Pollinations.ai which returns the image directly via URL.
        // We just need to give the AI the markdown image string so it outputs it.
        const encodedPrompt = encodeURIComponent(args.prompt);
        const imageUrl = `/api/image?prompt=${encodedPrompt}`;
        toolResult = `Image generated successfully. Include this exact markdown in your final response: ![${args.prompt}](${imageUrl})`;
      }

      groqMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: toolResult,
        name: toolCall.function.name,
      });
    }
  }

  // Fallback if max iterations reached or if tool loop broke due to error
  try {
    const finalCompletion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: groqMessages.filter(m => m.role !== "tool" && !m.tool_calls), // Strip tool stuff to ensure safe fallback
      max_tokens: 768,
    });
    return {
      reply: finalCompletion.choices[0]?.message?.content ?? "I encountered an error while researching. Could you rephrase your question?",
      sources
    };
  } catch (fallbackError: any) {
    console.error("[Agent] Fallback completion error:", fallbackError.message || fallbackError);
    return {
      reply: "I'm sorry, I ran into a severe processing error. Please try asking again.",
      sources
    };
  }
}
