import type { ReactNode } from "react";
import { StyleSheet, useWindowDimensions, View, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { C } from "@/constants/mom";

/**
 * The cream page shell. Every screen sits in one of these so the safe-area insets and the soft
 * background blobs are identical everywhere, and so no screen can accidentally draw under the
 * status bar or the home indicator.
 */
export function AppScreen({
  children,
  edges = ["top", "bottom"],
  blobs = true,
  background = C.cream,
  style,
}: {
  children: ReactNode;
  edges?: Edge[];
  blobs?: boolean;
  background?: string;
  style?: ViewStyle;
}) {
  const { width, height } = useWindowDimensions();

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: background }, style]}
      edges={edges}
    >
      {blobs && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View
            style={[
              styles.blob,
              {
                width: Math.min(width, height) * 0.7,
                height: Math.min(width, height) * 0.7,
                borderRadius: 9999,
                backgroundColor: C.pink,
                top: -Math.min(width, height) * 0.2,
                right: -Math.min(width, height) * 0.22,
              },
            ]}
          />
          <View
            style={[
              styles.blob,
              {
                width: Math.min(width, height) * 0.66,
                height: Math.min(width, height) * 0.66,
                borderRadius: 9999,
                backgroundColor: C.blue,
                bottom: -Math.min(width, height) * 0.18,
                left: -Math.min(width, height) * 0.2,
              },
            ]}
          />
        </View>
      )}
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.cream,
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    opacity: 0.16,
  },
});
