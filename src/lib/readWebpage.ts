import * as cheerio from "cheerio";

export async function readWebpage(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
      },
      // Timeout to prevent hanging
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`Failed with status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove noisy elements
    $("script, style, noscript, iframe, img, svg, nav, footer, header, aside, .ad, .advertisement").remove();

    // Extract text specifically from paragraphs to get the article content
    const paragraphs: string[] = [];
    $("p, article, .content, main").each((_, el) => {
      const text = $(el).text().trim();
      // Filter out tiny snippets or nav-like links that accidentally made it through
      if (text.length > 30) {
        paragraphs.push(text);
      }
    });

    const fullText = paragraphs.join("\n\n");
    
    // Hard cap at ~3000 characters to save tokens and prevent context limit errors
    if (fullText.length > 3000) {
      return fullText.substring(0, 3000) + "\n\n...[Content Truncated]...";
    }

    if (fullText.trim().length === 0) {
       return "Could not extract readable text from this webpage. It might be a single-page app or blocked by captcha.";
    }

    return fullText;
  } catch (error: any) {
    console.error(`Read Webpage Error [${url}]:`, error);
    return `Failed to read webpage: ${error.message}`;
  }
}
