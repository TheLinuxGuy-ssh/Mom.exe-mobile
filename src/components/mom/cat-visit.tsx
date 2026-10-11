import { DotLottie } from "@lottiefiles/dotlottie-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { C, FONT, R } from "@/constants/mom";
import { useReduceMotion } from "@/hooks/use-reduce-motion";
import {
  AWAY_MS,
  catDate,
  pickCoreLine,
  pickIdea,
  remainingUntilArrival,
  rollGraceDelay,
  rollIdleDelay,
  touchCatDay,
  updateCatDay,
} from "@/lib/engine/cat-visit";

type Phase = "waiting" | "peek" | "talking" | "dipping" | "away" | "leaving" | "gone";

const TYPE_MS = 18;
const STAGE_H = 220;
const STAGE_W = (STAGE_H * 940) / 1625;

/**
 * A cat that visits once a day. It peeks in after you have been around a minute or two, looks
 * around while you read, dips out for a minute if ignored, and is gone for good once you read it.
 * The web drives the lottie in reverse; here the rise and sink are transforms, which is steadier
 * on a phone and lets reduced motion sit still.
 */
export function CatVisit() {
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const [phase, setPhase] = useState<Phase>("waiting");
  const [today] = useState(() => catDate());
  const core = pickCoreLine(today);
  const idea = pickIdea(today);
  const [typed, setTyped] = useState(0);
  const [rise] = useState(() => new Animated.Value(1));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const full = `${core} ${idea}`;
  const typedCount = reduce ? full.length : typed;
  const ideaShown = Math.max(0, typedCount - core.length - 1);
  const showPlayer = phase === "peek" || phase === "talking" || phase === "dipping";

  function dip() {
    if (reduce) {
      setPhase("away");
      timers.current.push(setTimeout(() => setPhase("peek"), AWAY_MS));
      return;
    }
    setPhase("dipping");
    Animated.timing(rise, {
      toValue: 0,
      duration: 600,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setPhase("away");
      timers.current.push(
        setTimeout(() => {
          rise.setValue(0);
          setPhase("peek");
          Animated.timing(rise, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }, AWAY_MS),
      );
    });
  }

  function toggle() {
    if (phase === "peek") {
      setTyped(0);
      setPhase("talking");
    } else if (phase === "talking") {
      updateCatDay({ dismissed: true });
      if (reduce) {
        setPhase("gone");
        return;
      }
      setPhase("leaving");
      Animated.timing(rise, {
        toValue: 0,
        duration: 600,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setPhase("gone"));
    }
  }

  useEffect(() => {
    const day = touchCatDay({ date: today });
    if (!day || day.dismissed) {
      const t = setTimeout(() => setPhase("gone"), 0);
      return () => clearTimeout(t);
    }

    const delay = day.appeared ? rollGraceDelay() : remainingUntilArrival(day);
    const t = setTimeout(() => {
      setPhase("peek");
      updateCatDay({ appeared: true });
    }, delay);
    const list = timers.current;
    return () => {
      clearTimeout(t);
      list.forEach(clearTimeout);
    };
  }, [today]);

  useEffect(() => {
    if (phase !== "peek") return;
    const t = setTimeout(() => dip(), rollIdleDelay());
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== "talking" || reduce) return;
    const timer = setInterval(() => {
      setTyped((n) => {
        if (n + 1 >= full.length) clearInterval(timer);
        return Math.min(full.length, n + 1);
      });
    }, TYPE_MS);
    return () => clearInterval(timer);
  }, [phase, full.length, reduce]);

  if (phase === "gone") return null;

  const translateY = rise.interpolate({ inputRange: [0, 1], outputRange: [STAGE_H, 0] });

  return (
    <View
      style={[styles.host, { bottom: insets.bottom + 84 }]}
      pointerEvents="box-none"
    >
      {phase === "talking" && (
        <View style={styles.bubbleWrap} pointerEvents="none">
          <View style={styles.bubble}>
            <View style={styles.tail} />
            <Text style={styles.psst}>psst</Text>
            <Text style={styles.core} maxFontSizeMultiplier={1.2}>
              {core.slice(0, typedCount)}
            </Text>
            {ideaShown > 0 && (
              <Text style={styles.idea} maxFontSizeMultiplier={1.2}>
                {idea.slice(0, ideaShown)}
              </Text>
            )}
          </View>
        </View>
      )}

      <Animated.View style={[styles.stage, { transform: [{ translateY }] }]}>
        {showPlayer && (
          <DotLottie
            source={require("@/assets/catpeeking.lottie")}
            style={styles.fill}
            loop={false}
            autoplay={!reduce}
          />
        )}
        {(phase === "peek" || phase === "talking") && (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={toggle}
            accessibilityRole="button"
            accessibilityLabel={phase === "talking" ? "close mum note" : "a cat wants to tell you something"}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    right: 0,
    bottom: 0,
    alignItems: "flex-end",
    zIndex: 40,
  },
  bubbleWrap: { marginBottom: 8, width: 240, marginRight: 12 },
  bubble: {
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: R.lg,
    backgroundColor: C.paper,
    paddingHorizontal: 14,
    paddingVertical: 12,
    transform: [{ rotate: "-0.8deg" }],
  },
  tail: {
    position: "absolute",
    bottom: -9,
    right: 20,
    width: 14,
    height: 14,
    backgroundColor: C.paper,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: C.ink,
    transform: [{ rotate: "45deg" }],
  },
  psst: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "rgba(122,79,53,0.6)",
    marginBottom: 4,
  },
  core: { fontFamily: FONT.hand, fontWeight: "700", fontSize: 16, lineHeight: 22, color: C.ink },
  idea: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: "rgba(33,23,19,0.15)",
    fontFamily: FONT.hand,
    fontWeight: "700",
    fontSize: 16,
    lineHeight: 22,
    color: "rgba(33,23,19,0.75)",
  },
  stage: { width: STAGE_W, height: STAGE_H, overflow: "hidden" },
  fill: { width: "100%", height: "100%" },
});
