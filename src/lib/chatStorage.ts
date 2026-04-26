import { Message } from "@/types/chat";
import { supabase } from "@/lib/supabase";

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface SessionMeta {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

// ── Helpers ───────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function deriveTitle(messages: Message[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New conversation";
  return first.content.slice(0, 50) + (first.content.length > 50 ? "…" : "");
}

function toMeta(s: ChatSession): SessionMeta {
  return { id: s.id, title: s.title, createdAt: s.createdAt, updatedAt: s.updatedAt, messageCount: s.messages.length };
}

// ── localStorage (namespaced per user) ───────────────────────

let _activeUserId: string | null = null;

/** Call this once when the authenticated user is known. */
export function setActiveUserId(id: string | null) {
  _activeUserId = id;
}

const LS_INDEX = () => _activeUserId ? `eve_sessions_index_${_activeUserId}` : "eve_sessions_index_anon";
const lsKey = (id: string) => `eve_session_${_activeUserId ?? "anon"}_${id}`;

function lsGetIndex(): SessionMeta[] {
  try { return JSON.parse(localStorage.getItem(LS_INDEX()) || "[]"); } catch { return []; }
}
function lsSetIndex(index: SessionMeta[]) {
  localStorage.setItem(LS_INDEX(), JSON.stringify(index));
}
function lsCacheSession(session: ChatSession) {
  try { localStorage.setItem(lsKey(session.id), JSON.stringify(session)); } catch {}
  const index = lsGetIndex().filter((s) => s.id !== session.id);
  index.unshift(toMeta(session));
  lsSetIndex(index);
}
function lsGetSession(id: string): ChatSession | null {
  try { const r = localStorage.getItem(lsKey(id)); return r ? JSON.parse(r) : null; } catch { return null; }
}
function lsRemoveSession(id: string) {
  localStorage.removeItem(lsKey(id));
  lsSetIndex(lsGetIndex().filter((s) => s.id !== id));
}

// ── Supabase available? ───────────────────────────────────────

function isSupabaseReady(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// ── Public API ────────────────────────────────────────────────

export async function getIndex(): Promise<SessionMeta[]> {
  if (!isSupabaseReady() || !_activeUserId) return lsGetIndex();
  try {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("id, title, created_at, updated_at, messages")
      .eq("user_id", _activeUserId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    const sessions = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      messageCount: (row.messages || []).length,
    }));
    lsSetIndex(sessions);
    return sessions;
  } catch (e) {
    console.warn("[ChatStorage] Supabase getIndex failed, using cache:", e);
    return lsGetIndex();
  }
}

export function createSession(messages: Message[] = []): ChatSession {
  return {
    id: generateId(),
    title: deriveTitle(messages),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages,
  };
}

export async function saveSession(session: ChatSession): Promise<void> {
  const updated: ChatSession = {
    ...session,
    title: deriveTitle(session.messages),
    updatedAt: new Date().toISOString(),
  };

  lsCacheSession(updated);

  if (!isSupabaseReady() || !_activeUserId) return;

  try {
    const { error } = await supabase.from("chat_sessions").upsert({
      id: updated.id,
      user_id: _activeUserId,
      title: updated.title,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
      messages: updated.messages,
    });
    if (error) throw error;
  } catch (e) {
    console.warn("[ChatStorage] Supabase save failed (local cache still saved):", e);
  }
}

export async function loadSession(id: string): Promise<ChatSession | null> {
  if (!isSupabaseReady() || !_activeUserId) return lsGetSession(id);
  try {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", _activeUserId)
      .single();
    if (error) throw error;
    const session: ChatSession = {
      id: data.id,
      title: data.title,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      messages: data.messages || [],
    };
    lsCacheSession(session);
    return session;
  } catch (e) {
    console.warn("[ChatStorage] Supabase load failed, trying cache:", e);
    return lsGetSession(id);
  }
}

export async function deleteSession(id: string): Promise<void> {
  lsRemoveSession(id);
  if (!isSupabaseReady() || !_activeUserId) return;
  try {
    const { error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", id)
      .eq("user_id", _activeUserId);
    if (error) throw error;
  } catch (e) {
    console.warn("[ChatStorage] Supabase delete failed:", e);
  }
}

export async function syncFromCloud(): Promise<void> {
  if (!isSupabaseReady() || !_activeUserId) return;
  try {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", _activeUserId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    (data || []).forEach((row: any) => {
      lsCacheSession({
        id: row.id, title: row.title,
        createdAt: row.created_at, updatedAt: row.updated_at,
        messages: row.messages || [],
      });
    });
    console.log(`[ChatStorage] Synced ${data?.length ?? 0} sessions from Supabase`);
  } catch (e) {
    console.warn("[ChatStorage] Sync failed:", e);
  }
}
