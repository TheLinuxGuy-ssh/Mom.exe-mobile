import { useSyncExternalStore } from "react";

import {
  getSession,
  getSessionSnapshot,
  subscribeSession,
  type Session,
} from "@/lib/auth/session";

/**
 * Returns the current session.
 * `undefined` while the initial load is in flight, then `Session | null`.
 */
export function useSession(): Session | null | undefined {
  return useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    getSessionSnapshot,
  );
}

/** Kick off the initial session load (call once from the root layout). */
export async function loadSession(): Promise<void> {
  await getSession();
}
