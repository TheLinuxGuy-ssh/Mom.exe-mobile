import { Platform } from "react-native";

/**
 * Mom.exe brand tokens, lifted from the web app's `app.css` @theme block so the phone build
 * reads as the same product: cream paper, thick ink borders and hard offset shadows.
 */
export const C = {
  ink: "#211713",
  cream: "#fff4dc",
  paper: "#fffaf0",
  orange: "#ff7a1a",
  pink: "#ff4fa3",
  lime: "#c7ff4d",
  blue: "#60d7ff",
  yellow: "#ffcc5c",
  brown: "#8f5730",
  mute: "#7c6456",
  warn: "#d63031",
  white: "#ffffff",
} as const;

/**
 * No custom fonts are bundled, so the display face falls back to the system's heaviest weight and
 * the "hand" face to the platform's built-in handwriting font. Both are chosen because the design
 * leans on them for tone, not metrics.
 */
export const FONT = {
  display: Platform.select({ ios: "System", android: "sans-serif", default: undefined }),
  hand: Platform.select({ ios: "Marker Felt", android: "cursive", default: undefined }),
  mono: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
};

export const R = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 9999,
} as const;

export const GAP = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

/** Minimum tapped target, so every control clears the platform's accessibility floor. */
export const TAP = 44;

/** The hard, unblurred border all interactive labels share. */
export const BORDER = 2;

/** Opaque layers used to fake a hard drop shadow (`x y 0 color`) without a blur. */
export const SHADOW = {
  color: C.ink,
  hero: 10,
  card: 6,
  chip: 3,
} as const;
