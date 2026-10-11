import { useEffect, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

import { BORDER, C, TAP } from "@/constants/mom";

/**
 * The little segmented control the web calls GooeyToggle. One sliding pill sits under the chosen
 * label; tapping the active option clears it, which is a real state for the "how was today" band.
 */
export function GooeyToggle({
  options,
  value,
  onChange,
  indicator = C.orange,
  activeText = C.paper,
}: {
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (v: string | null) => void;
  indicator?: string;
  activeText?: string;
}) {
  const [width, setWidth] = useState(0);
  const index = options.findIndex((o) => o.value === value);
  const [slide] = useState(() => new Animated.Value(index < 0 ? 0 : index));
  const [opacity] = useState(() => new Animated.Value(index < 0 ? 0 : 1));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: index < 0 ? 0 : index,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: index < 0 ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, slide, opacity]);

  const seg = width / options.length;

  return (
    <View
      style={styles.container}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="tablist"
    >
      {index >= 0 && width > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              width: seg,
              backgroundColor: indicator,
              opacity,
              transform: [
                {
                  translateX: slide.interpolate({
                    inputRange: [0, options.length - 1 || 1],
                    outputRange: [0, seg * Math.max(1, options.length - 1)],
                  }),
                },
              ],
            },
          ]}
        />
      )}
      <View style={styles.row}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              style={styles.segment}
              onPress={() => onChange(active ? null : opt.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[styles.label, { color: active ? activeText : "rgba(33,23,19,0.75)" }]}
                numberOfLines={1}
                maxFontSizeMultiplier={1.2}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: BORDER,
    borderColor: C.ink,
    borderRadius: 9999,
    backgroundColor: C.paper,
    overflow: "hidden",
  },
  indicator: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 9999,
  },
  row: {
    flexDirection: "row",
  },
  segment: {
    flex: 1,
    minHeight: TAP - 6,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "lowercase",
  },
});
