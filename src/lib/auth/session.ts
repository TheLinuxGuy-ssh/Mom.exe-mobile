import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Session {
  userId: string;
  email: string | null;
  mode: "local" | "supabase";
}

const STORAGE_KEY = "momexe:session";

let cache: Session | null | undefined;

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSessionSnapshot(): Session | null | undefined {
  return cache;
}

function isSession(value: unknown): value is Session {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.userId === "string" &&
    v.userId.length > 0 &&
    (v.email === null || typeof v.email === "string") &&
    (v.mode === "local" || v.mode === "supabase")
  );
}

export async function getSession(): Promise<Session | null> {
  if (cache !== undefined) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    cache = isSession(parsed) ? parsed : null;
    emit();
    return cache;
  } catch {
    cache = null;
    emit();
    return null;
  }
}

export async function setSession(s: Session): Promise<void> {
  cache = s;
  emit();
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (e) {
    console.warn("[session] could not persist session", e);
  }
}

export async function clearSession(): Promise<void> {
  cache = null;
  emit();
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("[session] could not clear session", e);
  }
}

export function getCachedSession(): Session | null {
  return cache ?? null;
}

export function isHosted(): boolean {
  return Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function localEmailId(email: string): string {
  const hash = Array.from(email).reduce(
    (a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0,
    7,
  );
  return "local-" + hash.toString(36);
}
