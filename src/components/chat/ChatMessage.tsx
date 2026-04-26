import { useState } from "react";
import { Message } from "@/types/chat";
import { User, Snowflake, FileText, Globe, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

// ─── Custom Image Component with Loading State ──────────────────
function AnimatedImage({ src, alt, ...props }: any) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-w-[250px] sm:min-w-[300px] bg-black/40 border border-white/10 rounded-2xl overflow-hidden my-4 min-h-[250px] shadow-2xl group">
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/80 backdrop-blur-md z-10">
          <div className="relative flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-zinc-500" />
            <Sparkles size={12} className="absolute text-zinc-300 animate-pulse" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-white tracking-widest uppercase">Generating</span>
            <span className="text-[10px] text-zinc-500 max-w-[200px] text-center mt-1 truncate">
              {alt || "Synthesizing visual..."}
            </span>
          </div>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-red-950/20 backdrop-blur-md z-10 p-6 text-center">
          <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20">
            <Globe size={24} className="text-red-400" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-red-400 tracking-widest uppercase mb-1">Generation Failed</span>
            <span className="text-xs text-red-400/70">The image generation server timed out.</span>
            <span className="text-[10px] text-zinc-500 max-w-[250px] mt-2 break-all line-clamp-3">
              URL: {src}
            </span>
          </div>
        </div>
      )}

      {!hasError && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-auto object-cover transition-opacity duration-1000 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          {...props}
        />
      )}
    </div>
  );
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-6`}
    >
      <div
        className={`flex max-w-[85%] sm:max-w-[75%] gap-4 p-5 sm:p-6 rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl text-zinc-100 ${
          isUser ? "ml-auto rounded-br-xl" : "mr-auto rounded-bl-xl"
        }`}
      >
        
        <div className="relative z-10 flex-shrink-0 mt-1">
          {isUser ? (
            <div className="bg-white/10 p-2 rounded-full border border-white/20">
              <User size={18} className="text-zinc-300" />
            </div>
          ) : (
            <div className="bg-white/10 p-2 rounded-full border border-white/10">
              <Snowflake size={18} className="text-zinc-400" />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="text-sm font-medium mb-1 text-zinc-400">
            {isUser ? "You" : "Eve"}
          </div>

          {/* Render Sources */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {message.sources.map((source, i) => (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-black/20 hover:bg-white/5 border border-white/10 rounded-full px-3 py-1 transition-colors group text-xs text-zinc-400 hover:text-zinc-200"
                  title={source.url}
                >
                  <Globe size={10} className="text-zinc-500 group-hover:text-blue-400" />
                  <span className="truncate max-w-[150px] font-medium">{source.title}</span>
                </a>
              ))}
            </div>
          )}

          <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 text-sm sm:text-base">
            <ReactMarkdown 
              components={{
                img: ({ node, ...props }) => <AnimatedImage {...props} />,
                p: ({ node, ...props }) => <div className="mb-4 last:mb-0 leading-relaxed" {...props} />
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Render Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/5">
              {message.attachments.map((file, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-2 bg-black/20 border border-white/5 rounded-xl px-2.5 py-1.5"
                >
                  {file.mimeType.startsWith("image/") ? (
                    <div className="relative group">
                      <img 
                        src={`data:${file.mimeType};base64,${file.data}`} 
                        alt={file.name} 
                        className="w-12 h-12 object-cover rounded-lg border border-white/10"
                      />
                    </div>
                  ) : (
                    <div className="p-1 px-2 flex items-center gap-2">
                       <FileText size={14} className="text-zinc-500" />
                       <span className="text-[10px] text-zinc-400 max-w-[100px] truncate">{file.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
