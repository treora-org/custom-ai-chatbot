export type Role = "user" | "assistant" | "system";

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // base64
}

export interface Message {
  role: Role;
  content: string;
  attachments?: Attachment[];
}

export interface ChatRequest {
  model: string;
  messages: Message[];
  stream?: boolean;
}

export interface ChatResponse {
  reply: string;
}

