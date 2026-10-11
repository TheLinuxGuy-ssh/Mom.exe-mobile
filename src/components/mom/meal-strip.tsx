import { StyleSheet, Text, View } from "react-native";

import { Chip } from "@/components/mom/primitives";
import { C } from "@/constants/mom";
import type { Meals } from "@/lib/storage/types";

const SLOTS = [
  { key: "b", label: "bfast" },
  { key: "l", label: "lunch" },
  { key: "s", label: "snack" },
  { key: "d", label: "dinner" },
] as const;

/** Today's meals as chips: eaten, missed, or a dashed "?" when nobody said. */
export function MealStrip({ meals = null }: { meals?: Meals | null }) {
  return (
    <View style={styles.wrap} accessibilityLabel="meals today">
      <Text style={styles.label} maxFontSizeMultiplier={1.2}>
        meals
      </Text>
      {SLOTS.map((s) => {
        const v = meals?.[s.key];
        if (v === true) return <Chip key={s.key} label={`${s.label} ok`} background={C.lime} />;
        if (v === false)
          return <Chip key={s.key} label={`${s.label} missed`} background={C.paper} style={{ opacity: 0.6 }} />;
        return (
          <View key={s.key} style={styles.unknown}>
            <Text style={styles.unknownText}>{s.label} ?</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  label: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: C.brown,
    marginRight: 2,
  },
  unknown: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(33,23,19,0.4)",
    borderRadius: 9999,
  },
  unknownText: { fontSize: 11, fontWeight: "800", color: C.ink, opacity: 0.7 },
});
