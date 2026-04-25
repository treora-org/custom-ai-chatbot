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
    content: "You are Eve, an autonomous AI research assistant. You have access to tools: 'search_web' and 'read_webpage'. If you need facts, use 'search_web'. If a search returns a promising URL, you can use 'read_webpage' to read its full content. You can chain these tools before finally answering the user. Be concise."
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
    }
  ];

  const sources: Source[] = [];
  let iterations = 0;
  const maxIterations = 4;

  while (iterations < maxIterations) {
    iterations++;

    let completion;
    try {
      completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: groqMessages,
        max_tokens: 1024,
        temperature: 0.7,
        tools: tools as any,
        tool_choice: "auto",
      });
    } catch (error: any) {
      console.error("[Agent] Groq completion error in tool loop:", error.message || error);
      break; // Exit the tool loop and fall back to a standard response
    }

    const responseMessage = completion.choices[0]?.message;

    if (!responseMessage?.tool_calls || responseMessage.tool_calls.length === 0) {
      // AI finished researching and gave a final answer
      return {
        reply: responseMessage?.content ?? "",
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
        
        // Save the source for the UI if we successfully read it
        if (args.url && !sources.find((s) => s.url === args.url)) {
          sources.push({
            url: args.url,
            title: new URL(args.url).hostname.replace("www.", "") // Fallback title
          });
        }
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
      max_tokens: 1024,
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
