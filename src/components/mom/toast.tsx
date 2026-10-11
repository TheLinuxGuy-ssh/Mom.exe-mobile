import { Feather } from "@expo/vector-icons";
import { useSyncExternalStore } from "react";
import { StyleSheet, Text, View } from "react-native";

import { getToastSnapshot, subscribeToast } from "@/lib/ui/toast";
import { BORDER, C, R } from "@/constants/mom";

/** The one place toasts render. Mounted once at the root, above every screen. */
export function ToastHost() {
  const state = useSyncExternalStore(subscribeToast, getToastSnapshot, getToastSnapshot);

  if (!state.show) return null;

  const ok = state.kind === "ok";

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={styles.shadow} />
      <View style={[styles.toast, { backgroundColor: ok ? C.lime : C.yellow }]}>
        <Feather name={ok ? "check-circle" : "alert-circle"} size={16} color={C.ink} />
        <Text style={styles.text} maxFontSizeMultiplier={1.3}>
          {state.msg}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 40,
    alignItems: "center",
    paddingHorizontal: 18,
    zIndex: 100,
  },
  shadow: {
    position: "absolute",
    bottom: -4,
    height: 48,
    alignSelf: "center",
    left: 4,
    right: 4,
    borderRadius: R.pill,
    backgroundColor: C.ink,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "100%",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: BORDER + 1,
    borderColor: C.ink,
    borderRadius: R.pill,
  },
  text: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "800",
    color: C.ink,
  },
});
