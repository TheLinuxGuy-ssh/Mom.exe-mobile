import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { C, FONT } from "@/constants/mom";
import { useReduceMotion } from "@/hooks/use-reduce-motion";

/**
 * The ink-and-lime ticker under the landing hero. The content is rendered twice and slid by half
 * its width so the loop is seamless; reduced motion simply parks it.
 */
export function Marquee({ items }: { items: string[] }) {
  const reduce = useReduceMotion();
  const [half, setHalf] = useState(0);
  const [x] = useState(() => new Animated.Value(0));
  const doubled = [...items, ...items];

  useEffect(() => {
    if (reduce || half === 0) return;
    x.setValue(0);
    const loop = Animated.loop(
      Animated.timing(x, {
        toValue: -half,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, half, x]);

  return (
    <View style={styles.bar} accessibilityElementsHidden>
      <Animated.View
        style={[styles.track, { transform: [{ translateX: x }] }]}
        onLayout={(e) => setHalf(e.nativeEvent.layout.width / 2)}
      >
        {doubled.map((item, i) => (
          <Text key={`${item}-${i}`} style={[styles.item, { color: i % 2 === 0 ? C.paper : C.lime }]}>
            {item}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderColor: C.ink,
    backgroundColor: C.ink,
    overflow: "hidden",
  },
  track: {
    flexDirection: "row",
    alignItems: "center",
  },
  item: {
    fontFamily: FONT.display,
    fontWeight: "900",
    fontSize: 22,
    textTransform: "uppercase",
    letterSpacing: -1,
    paddingHorizontal: 26,
    paddingVertical: 12,
    whiteSpace: "nowrap",
  } as object,
});
