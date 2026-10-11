import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { C, R } from "@/constants/mom";
import { useReduceMotion } from "@/hooks/use-reduce-motion";

/**
 * The mug mascot, built from plain views so it needs no SVG dependency. Two dashed rings turn
 * slowly behind it, the cup wobbles, steam rises, and (optionally) the promise chips float around.
 */
export function Mascot({ size = 220, labels = true }: { size?: number; labels?: boolean }) {
  const reduce = useReduceMotion();
  const [wobble] = useState(() => new Animated.Value(0));
  const [spinA] = useState(() => new Animated.Value(0));
  const [spinB] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduce) return;
    const loops = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(wobble, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(wobble, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ),
      Animated.loop(
        Animated.timing(spinA, { toValue: 1, duration: 20000, easing: Easing.linear, useNativeDriver: true }),
      ),
      Animated.loop(
        Animated.timing(spinB, { toValue: 1, duration: 16000, easing: Easing.linear, useNativeDriver: true }),
      ),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [reduce, wobble, spinA, spinB]);

  const cup = size * 0.42;
  const rotate = wobble.interpolate({ inputRange: [0, 1], outputRange: ["-3deg", "3deg"] });
  const rotateA = spinA.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const rotateB = spinB.interpolate({ inputRange: [0, 1], outputRange: ["360deg", "0deg"] });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={[
          styles.ring,
          {
            width: size * 0.95,
            height: size * 0.95,
            borderRadius: size,
            borderColor: "rgba(33,23,19,0.45)",
            transform: [{ rotate: rotateA }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          {
            width: size * 0.68,
            height: size * 0.68,
            borderRadius: size,
            borderColor: "rgba(33,23,19,0.32)",
            transform: [{ rotate: rotateB }],
          },
        ]}
      />

      <Animated.View
        style={{
          width: cup,
          height: cup,
          alignItems: "center",
          transform: [{ rotate }],
        }}
      >
        {/* steam */}
        <View style={[styles.steam, { left: cup * 0.22, height: cup * 0.34, backgroundColor: C.blue }]} />
        <View style={[styles.steam, { left: cup * 0.42, height: cup * 0.42, backgroundColor: C.pink }]} />
        <View style={[styles.steam, { left: cup * 0.62, height: cup * 0.3, backgroundColor: C.lime }]} />

        {/* handle behind the body so only its right edge shows */}
        <View
          style={{
            position: "absolute",
            top: cup * 0.28,
            right: -cup * 0.18,
            width: cup * 0.42,
            height: cup * 0.44,
            borderWidth: 5,
            borderColor: C.ink,
            borderRadius: 9999,
          }}
        />

        <View
          style={[
            styles.mugBody,
            { width: cup * 0.82, height: cup * 0.72, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
          ]}
        >
          <View style={[styles.mugRim, { height: cup * 0.16 }]} />
        </View>
      </Animated.View>

      {labels && (
        <>
          <FloatyChip text="no streaks" bg={C.lime} style={styles.chipLeft} reduce={reduce} />
          <FloatyChip text="mom’s mind" bg={C.blue} style={styles.chipRight} reduce={reduce} />
          <FloatyChip text="plans anyway" bg={C.pink} textColor={C.paper} style={styles.chipBottom} reduce={reduce} />
        </>
      )}
    </View>
  );
}

function FloatyChip({
  text,
  bg,
  style,
  textColor = C.ink,
  reduce,
}: {
  text: string;
  bg: string;
  style: StyleProp<ViewStyle>;
  textColor?: string;
  reduce: boolean;
}) {
  const [float] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, float]);

  return (
    <Animated.View
      style={[
        styles.chip,
        { backgroundColor: bg, position: "absolute" },
        style,
        {
          transform: [
            { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
            { rotate: float.interpolate({ inputRange: [0, 1], outputRange: ["-3deg", "3deg"] }) },
          ],
        },
      ]}
    >
      <Text style={[styles.chipText, { color: textColor }]} maxFontSizeMultiplier={1.1}>
        {text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: "absolute",
    borderWidth: 2,
    borderStyle: "dashed",
  },
  steam: {
    position: "absolute",
    top: 0,
    width: 5,
    borderRadius: 9999,
    opacity: 0.85,
  },
  mugBody: {
    position: "absolute",
    bottom: 0,
    backgroundColor: C.orange,
    borderWidth: 4,
    borderColor: C.ink,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: "hidden",
  },
  mugRim: {
    backgroundColor: C.paper,
    borderBottomWidth: 4,
    borderColor: C.ink,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: R.pill,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipLeft: { left: -4, top: 18 },
  chipRight: { right: -6, top: "34%" },
  chipBottom: { left: 12, bottom: 12 },
});
