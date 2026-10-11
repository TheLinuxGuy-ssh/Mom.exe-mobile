import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Modal } from "@/components/mom/modal";
import { BrutalButton, Card } from "@/components/mom/primitives";
import { C } from "@/constants/mom";

/**
 * A yes/no gate in front of anything that throws work away. The dimmer, the backdrop and the
 * back button all come from `Modal`; this component is only the panel.
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
  return (
    <Modal open={open} onClose={onCancel} dismissible={!busy}>
      <Card style={styles.card} bodyStyle={styles.body} radius={RAD}>
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
      </Card>
    </Modal>
  );
}

const RAD = 20;

const styles = StyleSheet.create({
  card: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 420,
  },
  body: {
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 26,
    lineHeight: 28,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -0.5,
    color: C.ink,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    flexWrap: "wrap",
  },
});
