export type Role = "user" | "assistant" | "system";

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // base64
}

export interface Source {
  url: string;
  title: string;
}

export interface Message {
  role: Role;
  content: string;
  attachments?: Attachment[];
  sources?: Source[];
}

export interface ChatRequest {
  model: string;
  messages: Message[];
  stream?: boolean;
}

export interface ChatResponse {
  reply: string;
  sources?: Source[];
}

