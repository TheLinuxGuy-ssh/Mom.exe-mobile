import { Feather } from "@expo/vector-icons";
import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheet } from "@/components/mom/bottom-sheet";
import { C, R } from "@/constants/mom";

/** The ink frame drawn around the sheet. Kept as a solid shape rather than a border so the
 * rounded top corners stay perfectly smooth instead of showing a thin, broken line across the top. */
const FRAME = 3;

/**
 * The bottom sheet every selector shares. It owns the grab handle, the framed paper look and the
 * padding around the home indicator; the entrance, drag-to-dismiss and backdrop come from
 * `BottomSheet`, so the time and timezone pickers stay identical.
 */
export function Sheet({
  open,
  onClose,
  title,
  dismissible = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  dismissible?: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <BottomSheet open={open} onClose={onClose} dismissible={dismissible}>
      <View style={styles.frame}>
        <View style={[styles.inner, { paddingBottom: insets.bottom + 14 }]}>
          <View style={styles.grab}>
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
    </BottomSheet>
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
