import { Animated, StyleSheet, useWindowDimensions, View } from "react-native";

import { C } from "@/constants/mom";

type Blob = {
  color: string;
  size: number;
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

/**
 * One blob set per tab page. Keeping them here — in the shared tab shell rather than in each
 * screen — means they never get clipped at a page boundary mid-swipe, and each tab still gets its
 * own colour/layout.
 */
const PAGES: Blob[][] = [
  [
    { color: C.pink, size: 0.7, top: -0.2, right: -0.22 },
    { color: C.blue, size: 0.66, bottom: -0.18, left: -0.2 },
  ],
  [
    { color: C.blue, size: 0.72, top: -0.2, left: -0.22 },
    { color: C.lime, size: 0.6, bottom: -0.16, right: -0.2 },
  ],
  [
    { color: C.orange, size: 0.68, top: -0.22, right: -0.2 },
    { color: C.pink, size: 0.62, bottom: -0.2, left: -0.24 },
  ],
];

/**
 * The soft background behind the tab pager. It reads the pager's scroll position so the blob sets
 * cross-fade between pages instead of sliding/cutting with their own page.
 */
export function TabsBackground({ progress }: { progress: Animated.Value }) {
  const { width, height } = useWindowDimensions();
  const s = Math.min(width, height);

  return (
    <View pointerEvents="none" style={styles.host}>
      {PAGES.map((blobs, i) => {
        const opacity = progress.interpolate({
          inputRange: [i - 1, i, i + 1],
          outputRange: [0, 1, 0],
          extrapolate: "clamp",
        });
        return (
          <Animated.View key={i} style={[StyleSheet.absoluteFill, { opacity }]}>
            {blobs.map((blob, j) => (
              <View
                key={j}
                style={[
                  styles.blob,
                  {
                    width: s * blob.size,
                    height: s * blob.size,
                    borderRadius: 9999,
                    backgroundColor: blob.color,
                    top: blob.top != null ? s * blob.top : undefined,
                    right: blob.right != null ? s * blob.right : undefined,
                    bottom: blob.bottom != null ? s * blob.bottom : undefined,
                    left: blob.left != null ? s * blob.left : undefined,
                  },
                ]}
              />
            ))}
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.cream,
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    opacity: 0.16,
  },
});
