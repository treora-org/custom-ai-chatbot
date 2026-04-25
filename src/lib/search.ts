import * as cheerio from "cheerio";

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

export async function searchWeb(query: string): Promise<string> {
  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`Search failed with status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const results: SearchResult[] = [];

    $(".result").each((_, element) => {
      if (results.length >= 4) return; // Top 4 results

      const title = $(element).find(".result__title").text().trim();
      const snippet = $(element).find(".result__snippet").text().trim();
      const rawUrl = $(element).find(".result__url").attr("href") || "";
      
      // DuckDuckGo prefixes URLs with "/l/?uddg=" and URL-encodes them.
      let url = rawUrl;
      if (rawUrl.includes("uddg=")) {
        const urlParam = new URLSearchParams(rawUrl.split("?")[1]).get("uddg");
        if (urlParam) url = decodeURIComponent(urlParam);
      } else if (rawUrl && !rawUrl.startsWith("http")) {
        url = `https://${rawUrl.trim()}`;
      }

      if (title && snippet && url) {
        results.push({ title, snippet, url });
      }
    });

    if (results.length === 0) {
      return "No results found on the web.";
    }

    return results.map((r, i) => `[Result ${i + 1}]\nTitle: ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}`).join("\n\n");
  } catch (error) {
    console.error("Web Search Error:", error);
    return "Failed to search the web due to a network error.";
  }
}
