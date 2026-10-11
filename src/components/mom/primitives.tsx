import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { BORDER, C, FONT, GAP, R, SHADOW, TAP } from "@/constants/mom";

/* ------------------------------- Card shell -------------------------------- */

/**
 * The paper card every panel sits in. The shadow is a real offset layer rather than a blurred
 * `elevation`, because the brand's look is a screen-printed block with a hard edge.
 */
export function Card({
  children,
  style,
  bodyStyle,
  radius = R.lg,
  offset = SHADOW.card,
  background = C.paper,
  borderColor = C.ink,
  borderWidth = 3,
  shadowColor = C.ink,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
  radius?: number;
  offset?: number;
  background?: string;
  borderColor?: string;
  borderWidth?: number;
  shadowColor?: string;
}) {
  return (
    <View style={[{ marginRight: offset, marginBottom: offset }, style]}>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: offset,
          left: offset,
          right: -offset,
          bottom: -offset,
          borderRadius: radius,
          backgroundColor: shadowColor,
        }}
      />
      <View
        style={[
          { borderWidth, borderColor, borderRadius: radius, backgroundColor: background },
          bodyStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

/* --------------------------------- Chip ------------------------------------ */

export function Chip({
  label,
  icon,
  background = C.paper,
  textColor = C.ink,
  borderColor = C.ink,
  style,
  onPress,
  offset = 0,
  disabled,
  accessibilityLabel,
}: {
  label: string;
  icon?: ReactNode;
  background?: string;
  textColor?: string;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  offset?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const content = (
    <View
      style={[
        styles.chip,
        { backgroundColor: background, borderColor },
        style,
      ]}
    >
      {icon}
      <Text style={[styles.chipText, { color: textColor }]} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </View>
  );

  if (!onPress) {
    return (
      <View style={{ marginRight: offset, marginBottom: offset }}>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: offset,
            left: offset,
            right: -offset,
            bottom: -offset,
            borderRadius: R.pill,
            backgroundColor: borderColor,
          }}
        />
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : disabled ? 0.5 : 1 }]}
    >
      {content}
    </Pressable>
  );
}

/* --------------------------------- Pill label ------------------------------ */

/** The tiny uppercase label the web scatters above sections and cards. */
export function Eyebrow({
  children,
  color = C.brown,
  style,
}: {
  children: ReactNode;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text style={[styles.eyebrow, { color }, style]} maxFontSizeMultiplier={1.3}>
      {children}
    </Text>
  );
}

/* ------------------------------- ShadowText -------------------------------- */

export type ShadowLayer = { x: number; y: number; color: string };

/**
 * The blue-and-pink offset headline. RN has no text-shadow, so the layers are stacked as absolute
 * copies behind the ink one. The wrapper pads for the furthest layer so nothing is clipped.
 */
export function ShadowText({
  children,
  size,
  layers = [
    { x: 8, y: 8, color: C.blue },
    { x: 4, y: 4, color: C.pink },
  ],
  color = C.ink,
  style,
}: {
  children: string;
  size: number;
  layers?: ShadowLayer[];
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const padX = Math.max(...layers.map((l) => l.x), 0);
  const padY = Math.max(...layers.map((l) => l.y), 0);

  const textStyle: TextStyle = {
    fontSize: size,
    lineHeight: size * 0.92,
    letterSpacing: -size * 0.04,
    fontWeight: "900",
    fontFamily: FONT.display,
    textTransform: "uppercase",
    includeFontPadding: false,
  };

  return (
    <View style={[{ paddingRight: padX, paddingBottom: padY, alignSelf: "flex-start" }, style]}>
      {layers.map((l) => (
        <Text
          key={`${l.x}-${l.y}-${l.color}`}
          allowFontScaling={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[textStyle, { position: "absolute", left: l.x, top: l.y, color: l.color }]}
        >
          {children}
        </Text>
      ))}
      <Text accessibilityRole="header" style={[textStyle, { color }]}>
        {children}
      </Text>
    </View>
  );
}

/* ------------------------------- BrutalButton ------------------------------ */

export function BrutalButton({
  children,
  onPress,
  disabled,
  background = C.lime,
  textColor = C.ink,
  icon,
  size = "md",
  fullWidth,
  style,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  background?: string;
  textColor?: string;
  icon?: ReactNode;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const pad =
    size === "sm"
      ? { paddingHorizontal: 16, paddingVertical: 9 }
      : size === "lg"
        ? { paddingHorizontal: 26, paddingVertical: 15 }
        : { paddingHorizontal: 20, paddingVertical: 12 };
  const fontSize = size === "sm" ? 12 : size === "lg" ? 15 : 13;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.btnShell,
        fullWidth && { alignSelf: "stretch" },
        { opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      {({ pressed }) => (
        <>
          <View
            pointerEvents="none"
            style={[
              styles.btnShadow,
              { top: pressed ? 1 : 4, left: pressed ? 1 : 4, opacity: pressed ? 0.5 : 1 },
            ]}
          />
          <View
            style={[
              styles.btnBody,
              pad,
              {
                backgroundColor: background,
                transform: [{ translateX: pressed ? 3 : 0 }, { translateY: pressed ? 3 : 0 }],
              },
            ]}
          >
            {icon}
            <Text
              style={[styles.btnText, { color: textColor, fontSize }]}
              maxFontSizeMultiplier={1.2}
            >
              {children}
            </Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

/* ------------------------------- StickyNote -------------------------------- */

type Segment = { text: string; tone: "none" | "blue" | "lime" };

const HL_RULES: [RegExp, "blue" | "lime"][] = [
  [/\d{1,2}:\d{2}/g, "blue"],
  [/\d+(?:\.\d+)?\s*(?:h|hrs?|hours?)\b/gi, "lime"],
];

/** Splits a line into runs so times and durations can be highlighted like a marker pen. */
function highlight(text: string): Segment[] {
  const marks: { start: number; end: number; tone: "blue" | "lime" }[] = [];
  for (const [re, tone] of HL_RULES) {
    for (const m of text.matchAll(re)) {
      if (m.index == null) continue;
      marks.push({ start: m.index, end: m.index + m[0].length, tone });
    }
  }
  marks.sort((a, b) => a.start - b.start);

  const out: Segment[] = [];
  let cursor = 0;
  for (const mark of marks) {
    if (mark.start < cursor) continue;
    if (mark.start > cursor) out.push({ text: text.slice(cursor, mark.start), tone: "none" });
    out.push({ text: text.slice(mark.start, mark.end), tone: mark.tone });
    cursor = mark.end;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), tone: "none" });
  return out;
}

/**
 * The yellow pinned note mom answers on. A small translucent "tape" strip sits at the top right,
 * matching the web's `::after`.
 */
export function StickyNote({
  text,
  rotate = -1.5,
  style,
}: {
  text: string;
  rotate?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.sticky,
        { transform: [{ rotate: `${rotate}deg` }] },
        style,
      ]}
    >
      <View pointerEvents="none" style={styles.tape} />
      <Text style={styles.stickyText}>
        {highlight(text).map((seg, i) => (
          <Text
            key={i}
            style={
              seg.tone === "none"
                ? undefined
                : { backgroundColor: seg.tone === "blue" ? C.blue : C.lime }
            }
          >
            {seg.text}
          </Text>
        ))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: GAP.xs,
    alignSelf: "flex-start",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderWidth: BORDER,
    borderRadius: R.pill,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "800",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  btnShell: {
    position: "relative",
    alignSelf: "flex-start",
  },
  btnShadow: {
    position: "absolute",
    left: 4,
    top: 4,
    right: -4,
    bottom: -4,
    backgroundColor: C.ink,
    borderRadius: R.pill,
  },
  btnBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: GAP.sm,
    borderWidth: BORDER,
    borderColor: C.ink,
    borderRadius: R.pill,
    minHeight: TAP,
  },
  btnText: {
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sticky: {
    alignSelf: "stretch",
    backgroundColor: C.yellow,
    borderWidth: BORDER,
    borderColor: C.ink,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 5,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  tape: {
    position: "absolute",
    top: -6,
    right: 18,
    width: 38,
    height: 18,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.45)",
    transform: [{ rotate: "4deg" }],
  },
  stickyText: {
    fontFamily: FONT.hand,
    fontWeight: "700",
    fontSize: 20,
    lineHeight: 28,
    color: C.brown,
  },
});
