import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheet } from "@/components/mom/bottom-sheet";
import { BrutalButton } from "@/components/mom/primitives";
import { C, R } from "@/constants/mom";

/** The ink frame drawn around the sheet. Kept as a solid shape so the rounded top corners stay smooth. */
const FRAME = 3;

/**
 * A yes/no gate in front of anything that throws work away. It lives on the same animated sheet as
 * the rest of the cards: slide up to arrive, drag down or tap the backdrop to dismiss.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = "confirm",
  cancelLabel = "cancel",
  tone = "default",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <BottomSheet open={open} onClose={onCancel} dismissible={!busy}>
      <View style={styles.frame}>
        <View style={[styles.inner, { paddingBottom: insets.bottom + 18 }]}>
          <View style={styles.grab}>
            <View style={styles.handle} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <View>{children}</View>
          <View style={styles.actions}>
            <BrutalButton
              size="sm"
              background={C.paper}
              disabled={busy}
              onPress={onCancel}
              accessibilityLabel={cancelLabel}
            >
              {cancelLabel}
            </BrutalButton>
            <BrutalButton
              size="sm"
              background={tone === "danger" ? C.pink : C.lime}
              textColor={tone === "danger" ? C.paper : C.ink}
              disabled={busy}
              onPress={onConfirm}
              accessibilityLabel={confirmLabel}
            >
              {busy ? "working..." : confirmLabel}
            </BrutalButton>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: C.ink,
    borderTopLeftRadius: R.xl,
    borderTopRightRadius: R.xl,
    paddingTop: FRAME,
    paddingLeft: FRAME,
    paddingRight: FRAME,
  },
  inner: {
    backgroundColor: C.paper,
    borderTopLeftRadius: R.xl - FRAME,
    borderTopRightRadius: R.xl - FRAME,
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 14,
  },
  grab: {
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 2,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 9999,
    backgroundColor: "rgba(33,23,19,0.28)",
  },
  title: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -0.4,
    color: C.ink,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 2,
  },
});