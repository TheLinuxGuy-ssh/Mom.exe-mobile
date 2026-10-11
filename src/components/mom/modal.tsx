import type { ReactNode } from "react";
import { Modal as RNModal, Pressable, StyleSheet, View } from "react-native";

/**
 * The single overlay every dialog shares. Owning the backdrop and the hardware-back behaviour in
 * one place is what stops one dialog dimming the whole page and another only half of it, which is
 * exactly the bug the web version had to hunt down. Fading is left to the native modal so there is
 * no animation state to keep in sync.
 */
export function Modal({
  open,
  onClose,
  dismissible = true,
  align = "center",
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** set false while something must finish first; the backdrop and back button both stop working */
  dismissible?: boolean;
  align?: "center" | "sheet";
  children: ReactNode;
}) {
  const dismiss = () => {
    if (dismissible) onClose();
  };

  return (
    <RNModal
      visible={open}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <View style={[styles.root, align === "sheet" ? styles.sheetRoot : styles.centerRoot]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <View style={styles.backdrop} />
        </Pressable>
        {children}
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centerRoot: {
    justifyContent: "center",
    padding: 20,
  },
  sheetRoot: {
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(33,23,19,0.55)",
  },
});
