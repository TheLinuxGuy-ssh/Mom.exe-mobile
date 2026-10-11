import { DotLottie } from "@lottiefiles/dotlottie-react-native";
import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { C, FONT } from "@/constants/mom";
import { useReduceMotion } from "@/hooks/use-reduce-motion";

type Phase = "night" | "day";

const SWAP_MS = 560;
const SAD_MS = 6500;
const HAPPY_MS = 9000;

const SCENES: Record<
  Phase,
  { sky: number; body: number; lines: string[] }
> = {
  night: {
    sky: require("@/assets/sadballs.lottie"),
    body: require("@/assets/catsleeping.lottie"),
    lines: [
      "slept at 4am? missed breakfast? mom has a plan.",
      "the moon stole your night. mom plans the morning.",
    ],
  },
  day: {
    sky: require("@/assets/smilingsun.lottie"),
    body: require("@/assets/palmdancing.lottie"),
    lines: [
      "schedule fixed. sun's back. go dance.",
      "eat, move, sleep on time. that is the whole trick.",
    ],
  },
};

type Tone = "lime" | "blue" | "pink";

const HL_RULES: [RegExp, Tone][] = [
  [/\b4am\b/gi, "lime"],
  [/\bbreakfast\b/gi, "pink"],
  [/\bmoon\b/gi, "blue"],
  [/\bmorning\b/gi, "lime"],
  [/\bschedule fixed\b/gi, "lime"],
  [/\bdance\b/gi, "pink"],
  [/\bsleep on time\b/gi, "lime"],
  [/\bwhole trick\b/gi, "blue"],
];

function highlight(text: string) {
  const marks: { start: number; end: number; tone: Tone }[] = [];
  for (const [re, tone] of HL_RULES) {
    for (const m of text.matchAll(re)) {
      if (m.index == null) continue;
      marks.push({ start: m.index, end: m.index + m[0].length, tone });
    }
  }
  marks.sort((a, b) => a.start - b.start);
  const out: { text: string; tone: Tone | "none" }[] = [];
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

const TONE_BG: Record<Tone, string> = { lime: C.lime, blue: C.blue, pink: C.pink };

/**
 * The landing hero: a sleeping cat by night and a dancing palm by day, swapping on a timer with a
 * caption written on a sticky note. Reduced motion pins it to daytime and drops the swap entirely.
 */
export function LandingScene() {
  const reduce = useReduceMotion();
  const { height } = useWindowDimensions();
  const [phase, setPhase] = useState<Phase>("night");
  const [turn, setTurn] = useState(0);
  const [fade] = useState(() => new Animated.Value(1));
  const [wasReduce, setWasReduce] = useState(reduce);

  if (reduce && !wasReduce) {
    setWasReduce(true);
    setPhase("day");
  }

  useEffect(() => {
    if (reduce) return;
    const timer = setTimeout(() => {
      setPhase((p) => (p === "night" ? "day" : "night"));
      setTurn((t) => t + 1);
    }, phase === "night" ? SAD_MS : HAPPY_MS);
    return () => clearTimeout(timer);
  }, [phase, reduce]);

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: SWAP_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [phase, fade]);

  const scene = SCENES[phase];
  const caption = scene.lines[turn % scene.lines.length];
  const stageHeight = Math.max(220, Math.min(height * 0.42, 340));

  return (
    <View style={{ width: "100%", height: stageHeight }}>
      <View style={styles.sky}>
        <DotLottie source={scene.sky} style={styles.fill} loop autoplay={!reduce} />
      </View>

      <Animated.View style={[styles.bodyWrap, { opacity: fade }]}>
        <DotLottie source={scene.body} style={styles.fill} loop autoplay={!reduce} />
      </Animated.View>

      <View style={styles.captionWrap}>
        <View style={styles.caption}>
          <Text style={styles.captionText} numberOfLines={2} maxFontSizeMultiplier={1.15}>
            {highlight(caption).map((seg, i) => (
              <Text key={i} style={seg.tone === "none" ? undefined : { backgroundColor: TONE_BG[seg.tone] }}>
                {seg.text}
              </Text>
            ))}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },
  sky: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "52%",
    height: "40%",
  },
  bodyWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 40,
  },
  captionWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  caption: {
    backgroundColor: C.yellow,
    borderWidth: 2,
    borderColor: C.ink,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "96%",
  },
  captionText: {
    fontFamily: FONT.hand,
    fontWeight: "700",
    fontSize: 17,
    lineHeight: 22,
    textAlign: "center",
    color: C.brown,
  },
});
