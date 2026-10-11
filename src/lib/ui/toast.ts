type Kind = "ok" | "warn";

type ToastState = { show: boolean; msg: string; kind: Kind };

let state: ToastState = { show: false, msg: "", kind: "ok" };
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;

function emit(): void {
  listeners.forEach((l) => l());
}

/** Shows a short status line at the bottom of the screen, replacing whatever was there. */
export function toast(msg: string, kind: Kind = "ok"): void {
  state = { show: true, msg, kind };
  emit();
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    state = { show: false, msg: "", kind: "ok" };
    emit();
  }, 2600);
}

export function subscribeToast(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToastSnapshot(): ToastState {
  return state;
}
