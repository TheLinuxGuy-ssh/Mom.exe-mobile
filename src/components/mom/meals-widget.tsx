import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/mom/primitives";
import { C, R } from "@/constants/mom";
import type { Checkin } from "@/lib/storage/types";

const SLOTS = [
  { key: "b", label: "bfast", icon: "weather-sunset-up" },
  { key: "l", label: "lunch", icon: "silverware-fork-knife" },
  { key: "s", label: "snack", icon: "cookie" },
  { key: "d", label: "dinner", icon: "weather-sunset-down" },
] as const;

const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];

function daysBack(today: string, n: number): string {
  const [y, m, d] = today.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10);
}

function dayLabel(date: string): string {
  return WEEKDAY[new Date(`${date}T12:00:00Z`).getUTCDay()];
}

/** The last 7 days as a meal grid: filled lime for eaten, paper for skipped, dashed for unknown. */
export function MealsWidget({ checkins = [], today }: { checkins?: Checkin[]; today: string }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = daysBack(today, 6 - i);
    const c = checkins.find((x) => x.local_date === d);
    return { date: d, meals: c?.meals ?? null, isToday: d === today };
  });

  return (
    <Card radius={R.lg} offset={4} bodyStyle={styles.body}>
      <Text style={styles.headText}>meals, last 7 days</Text>

      <View style={styles.keyRow}>
        <View style={styles.keySpacer} />
        {SLOTS.map((s) => (
          <View key={s.key} style={styles.keyCol}>
            <MaterialCommunityIcons name={s.icon} size={14} color={C.brown} />
            <Text style={styles.keyText} maxFontSizeMultiplier={1.1}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((d) => (
          <View key={d.date} style={styles.gridRow}>
            <Text style={styles.dayLabel} maxFontSizeMultiplier={1.1}>
              {dayLabel(d.date)}
            </Text>
            <View style={styles.cells}>
              {SLOTS.map((s) => {
                const v = d.meals?.[s.key];
                const cellStyle =
                  v === true ? styles.eaten : v === false ? styles.skipped : styles.unknown;
                return <View key={s.key} style={[styles.cell, cellStyle]} />;
              })}
            </View>
            {d.isToday && (
              <Text style={styles.todayTag} maxFontSizeMultiplier={1.1}>
                today
              </Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <View style={[styles.legendChip, { backgroundColor: C.lime }]}>
          <Text style={styles.legendText}>eaten</Text>
        </View>
        <View style={[styles.legendChip, { backgroundColor: C.paper }]}>
          <Text style={styles.legendText}>skipped</Text>
        </View>
        <View style={[styles.legendChip, styles.unknown, { borderWidth: 2 }]}>
          <Text style={[styles.legendText, { opacity: 0.7 }]}>unknown</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12 },
  headText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: C.brown,
  },
  keyRow: { flexDirection: "row", alignItems: "flex-end", gap: 6, paddingLeft: 36 },
  keySpacer: { width: 0 },
  keyCol: { flex: 1, alignItems: "center", gap: 2 },
  keyText: { fontSize: 9, fontWeight: "900", textTransform: "uppercase", color: C.mute },
  grid: { gap: 6 },
  gridRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dayLabel: { width: 28, fontSize: 10, fontWeight: "900", textTransform: "uppercase", color: C.mute },
  cells: { flex: 1, flexDirection: "row", gap: 6 },
  cell: { flex: 1, height: 20, borderRadius: 6, borderWidth: 2, borderColor: C.ink },
  eaten: { backgroundColor: C.lime },
  skipped: { backgroundColor: C.paper },
  unknown: { backgroundColor: "transparent", borderStyle: "dashed", borderColor: "rgba(33,23,19,0.35)" },
  todayTag: { fontSize: 10, fontWeight: "900", textTransform: "uppercase", color: C.brown },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingTop: 4 },
  legendChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: R.pill,
  },
  legendText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", color: C.ink },
});
