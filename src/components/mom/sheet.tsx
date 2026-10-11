import { Feather } from "@expo/vector-icons";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Modal } from "@/components/mom/modal";
import { C, R } from "@/constants/mom";

/** The ink frame drawn around the sheet. Kept as a solid shape rather than a border so the
 * rounded top corners stay perfectly smooth instead of showing a thin, broken line across the top. */
const FRAME = 3;

/**
 * The bottom sheet every selector shares. It owns the grab handle, the dismiss-on-swipe-down
 * gesture and the framed paper look, so the time and timezone pickers stay identical.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const [translateY] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (open) translateY.setValue(0);
  }, [open, translateY]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_e, g) => {
          if (g.dy > 0) translateY.setValue(g.dy);
        },
        onPanResponderRelease: (_e, g) => {
          if (g.dy > 110 || g.vy > 0.7) {
            Animated.timing(translateY, {
              toValue: 600,
              duration: 180,
              useNativeDriver: true,
            }).start(() => onClose());
          } else {
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        },
      }),
    [translateY, onClose]
  );

  return (
    <Modal open={open} onClose={onClose} align="sheet">
      <Animated.View style={{ transform: [{ translateY }] }}>
        <View style={styles.frame}>
          <View style={[styles.inner, { paddingBottom: insets.bottom + 14 }]}>
            <View style={styles.grab} {...pan.panHandlers}>
              <View style={styles.handle} />
              <View style={styles.head}>
                <Text style={styles.title}>{title}</Text>
                <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="close">
                  <Feather name="x" size={20} color={C.ink} />
                </Pressable>
              </View>
            </View>
            <View style={styles.body}>{children}</View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: C.ink,
    borderTopLeftRadius: R.xxl,
    borderTopRightRadius: R.xxl,
    paddingTop: FRAME,
    paddingLeft: FRAME,
    paddingRight: FRAME,
  },
  inner: {
    backgroundColor: C.paper,
    borderTopLeftRadius: R.xxl - FRAME,
    borderTopRightRadius: R.xxl - FRAME,
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  grab: { paddingTop: 4 },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 9999,
    backgroundColor: "rgba(33,23,19,0.28)",
    marginBottom: 8,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: C.brown,
  },
  body: { gap: 12, paddingTop: 12 },
});
