import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/mom/primitives";
import { C, R } from "@/constants/mom";

/** The ghost the dashboard shows while the model is reading a fresh note. */
export function PlanSkeleton({ counter = null, note = "" }: { counter?: number | null; note?: string }) {
  return (
    <View style={styles.wrap}>
      {counter !== null && (
        <View style={styles.counterRow}>
          <Feather name="loader" size={18} color={C.brown} />
          <Text style={styles.counter} maxFontSizeMultiplier={1.2}>
            mom is reading your note... {counter}s
          </Text>
        </View>
      )}

      <View style={styles.note} />

      <Card radius={R.xl} offset={5} bodyStyle={styles.cardBody}>
        <View style={styles.cardHead}>
          <View style={[styles.bar, { width: 48, height: 20, borderRadius: R.md }]} />
          <View style={[styles.bar, { width: 64, height: 20, borderRadius: R.pill }]} />
        </View>
        <View style={styles.nowRow}>
          <View style={[styles.bar, { width: 48, height: 48, borderRadius: R.md }]} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={[styles.bar, { width: 160, height: 24 }]} />
            <View style={[styles.bar, { width: 96, height: 12 }]} />
          </View>
        </View>
        <View style={{ gap: 8, paddingTop: 4 }}>
          <View style={[styles.bar, { width: "100%", height: 16 }]} />
          <View style={[styles.bar, { width: "80%", height: 16 }]} />
        </View>
        <View style={styles.actions}>
          <View style={[styles.bar, { width: 96, height: 40, borderRadius: R.md }]} />
          <View style={[styles.bar, { width: 80, height: 40, borderRadius: R.md }]} />
        </View>
      </Card>

      {note ? <Text style={styles.footNote}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16, width: "100%" },
  bar: { backgroundColor: "rgba(33,23,19,0.12)", borderRadius: 6 },
  counterRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  counter: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: C.brown,
  },
  note: {
    height: 90,
    borderRadius: 12,
    backgroundColor: "rgba(220,196,120,0.4)",
    transform: [{ rotate: "-1.5deg" }],
  },
  cardBody: { padding: 20, gap: 16 },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nowRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  actions: { flexDirection: "row", gap: 10, paddingTop: 4 },
  footNote: { fontSize: 11, fontWeight: "700", color: C.mute, textAlign: "center", lineHeight: 16 },
});
