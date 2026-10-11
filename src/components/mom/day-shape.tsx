import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/mom/primitives";
import { C, R } from "@/constants/mom";
import { CATEGORY_LABEL, dayShape, formatDuration, type Category } from "@/lib/engine/shape";
import type { PlanBlock } from "@/lib/storage/types";

const TONE: Record<Category, string> = {
  work: C.blue,
  body: C.lime,
  people: C.pink,
  rest: C.yellow,
};

/** A stacked bar of where the day's minutes go, with a plain-language legend under it. */
export function DayShape({ blocks = [] }: { blocks?: PlanBlock[] }) {
  const shape = dayShape(blocks);
  if (shape.empty) return null;

  return (
    <Card radius={R.lg} offset={4} bodyStyle={styles.body}>
      <View style={styles.head}>
        <Text style={styles.headText} maxFontSizeMultiplier={1.2}>
          how today stacks up
        </Text>
        <Text style={styles.meta} maxFontSizeMultiplier={1.2}>
          {formatDuration(shape.totalMinutes)} planned
        </Text>
      </View>

      <View
        style={styles.bar}
        accessibilityRole="image"
        accessibilityLabel="planned time by category"
      >
        {shape.slices.map((s, i) => (
          <View
            key={s.category}
            style={{
              width: `${s.share * 100}%`,
              backgroundColor: TONE[s.category],
              borderRightWidth: i < shape.slices.length - 1 ? 2 : 0,
              borderColor: C.ink,
            }}
          />
        ))}
      </View>

      <View style={styles.legend}>
        {shape.slices.map((s) => (
          <View key={s.category} style={styles.legendRow}>
            <View style={[styles.swatch, { backgroundColor: TONE[s.category] }]} />
            <Text style={styles.legendLabel} maxFontSizeMultiplier={1.2}>
              {CATEGORY_LABEL[s.category]}
            </Text>
            <Text style={styles.legendValue} maxFontSizeMultiplier={1.2}>
              {formatDuration(s.minutes)}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12 },
  head: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 },
  headText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: C.brown,
  },
  meta: { fontSize: 11, fontWeight: "700", color: C.mute },
  bar: {
    flexDirection: "row",
    height: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: R.pill,
  },
  legend: { gap: 4 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  swatch: { width: 12, height: 12, borderWidth: 2, borderColor: C.ink, borderRadius: 4 },
  legendLabel: { fontSize: 11, fontWeight: "700", color: C.ink, opacity: 0.75 },
  legendValue: { marginLeft: "auto", fontSize: 11, fontWeight: "700", color: C.mute },
});
