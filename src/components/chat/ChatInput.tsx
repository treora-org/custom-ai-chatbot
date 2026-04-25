import { useState, KeyboardEvent, useRef, useEffect, ChangeEvent } from "react";
import { SendHorizonal, Loader2, Paperclip, X, FileText, Image as ImageIcon } from "lucide-react";
import { Attachment } from "@/types/chat";
import { SpotlightCard } from "@/components/reactbits/SpotlightCard";

interface ChatInputProps {
  onSendMessage: (message: string, attachments?: Attachment[]) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSendMessage(input.trim(), attachments);
      setInput("");
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 20 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Max size is 20MB.`);
        continue;
      }

      // Validate supported formats for Gemini
      const supportedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      const supportedDocTypes = ["application/pdf", "text/plain", "text/markdown"];
      const isImage = file.type.startsWith("image/");
      const isDoc = supportedDocTypes.includes(file.type);

      if (isImage && !supportedImageTypes.includes(file.type)) {
        alert(`${file.name}: Format not supported. Please use JPG, PNG, WebP, or GIF.\n\nHEIC (iPhone photos) are not supported by the AI model.`);
        continue;
      }
      if (!isImage && !isDoc && file.type) {
        alert(`${file.name}: This file type is not supported.`);
        continue;
      }

      const reader = new FileReader();
      const promise = new Promise<Attachment>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve({
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            data: base64,
          });
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);

      try {
        const att = await promise;
        newAttachments.push(att);
      } catch (err) {
        console.error("File read error:", err);
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    // Reset input value so same file can be selected again if removed
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className="relative w-full max-w-4xl mx-auto mt-4 mb-2 px-2">
      {/* File Previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 ml-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="group relative flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 pr-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              {file.mimeType.startsWith("image/") ? (
                <ImageIcon size={14} className="text-zinc-400" />
              ) : (
                <FileText size={14} className="text-zinc-400" />
              )}
              <span className="text-xs text-zinc-300 max-w-[120px] truncate">{file.name}</span>
              <button
                onClick={() => removeAttachment(index)}
                className="absolute right-1.5 p-1 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <SpotlightCard className="relative w-full rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-1.5 transition-all">
        <div className="flex flex-row items-end w-full relative z-10">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            multiple 
            hidden 
            accept="image/jpeg,image/png,image/webp,image/gif,.pdf,.txt,.md,.js,.ts,.py,.json,.csv"
          />
          
          <button
            onClick={handleFileClick}
            className="flex-shrink-0 p-2 ml-1 rounded-full text-zinc-500 hover:text-zinc-200 transition-colors h-[36px] w-[36px] flex items-center justify-center"
            title="Attach files (Images, PDFs, Text)"
          >
            <Paperclip size={20} />
          </button>

          <textarea
            ref={textareaRef}
            className="w-full bg-transparent text-[#E2E8F0] placeholder-zinc-500 resize-none outline-none py-1.5 px-3 max-h-[200px] min-h-[36px] scrollbar-hide text-base leading-relaxed flex-1 self-center"
            placeholder="Message Eve..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
          />

          <div className="flex items-center gap-1">
            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={(!input.trim() && attachments.length === 0) || isLoading}
              className={`flex-shrink-0 p-2 mr-1 rounded-full transition-all duration-300 z-10 relative h-[36px] w-[36px] flex items-center justify-center ${(input.trim() || attachments.length > 0) && !isLoading
                  ? "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  : "bg-transparent text-zinc-600 border border-transparent cursor-not-allowed"
                }`}
            >
              {isLoading ? <Loader2 size={20} className="animate-spin text-zinc-300" /> : <SendHorizonal size={20} />}
            </button>
          </div>
        </div>
      </SpotlightCard>
      <div className="text-center mt-3 text-xs text-zinc-600">
        Eve can see images and read documents. Max 20MB per file.
      </div>
    </div>
  );
}

