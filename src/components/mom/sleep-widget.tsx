import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/mom/primitives";
import { C, R } from "@/constants/mom";
import { formatDuration } from "@/lib/engine/shape";
import type { Checkin } from "@/lib/storage/types";

function daysBack(today: string, n: number): string {
  const [y, m, d] = today.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10);
}

/** Sleep, two weeks. Missing days draw as a hollow stub so unknown never looks like zero. */
export function SleepWidget({
  checkins = [],
  today,
  target = 7.5,
}: {
  checkins?: Checkin[];
  today: string;
  target?: number;
}) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = daysBack(today, 13 - i);
    const c = checkins.find((x) => x.local_date === d);
    return { date: d, hours: c?.sleep_hours ?? null, isToday: d === today };
  });

  const known = days.map((d) => d.hours).filter((h): h is number => h != null);
  const avg = known.length ? known.reduce((s, h) => s + h, 0) / known.length : null;

  return (
    <Card radius={R.lg} offset={4} bodyStyle={styles.body}>
      <View style={styles.head}>
        <Text style={styles.headText}>sleep, 2 weeks</Text>
        {avg != null && <Text style={styles.meta}>{avg.toFixed(1)}h avg</Text>}
      </View>

      <View style={styles.chart} accessibilityRole="image" accessibilityLabel="sleep hours for the last 14 days">
        {days.map((d) =>
          d.hours != null ? (
            <View
              key={d.date}
              style={[
                styles.bar,
                {
                  height: Math.max(6, Math.min(52, (d.hours / 10) * 52)),
                  backgroundColor: d.hours < 5 ? C.pink : d.isToday ? C.orange : C.blue,
                },
              ]}
            />
          ) : (
            <View key={d.date} style={styles.stub} />
          ),
        )}
      </View>

      <View style={styles.footRow}>
        <Text style={styles.foot}>14 days ago</Text>
        <Text style={styles.foot}>target {formatDuration(target * 60)}</Text>
        <Text style={styles.foot}>today</Text>
      </View>

      {avg == null ? (
        <Text style={styles.note}>nothing logged yet. unknown is not zero.</Text>
      ) : avg < target - 1 ? (
        <Text style={[styles.note, { color: C.brown }]}>
          running under target, which is worth a look tonight.
        </Text>
      ) : null}
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
  chart: { flexDirection: "row", alignItems: "flex-end", gap: 4, height: 54 },
  bar: {
    flex: 1,
    borderWidth: 2,
    borderColor: C.ink,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  stub: {
    flex: 1,
    height: 8,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(33,23,19,0.35)",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  footRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  foot: { fontSize: 10, fontWeight: "700", color: C.mute },
  note: { fontSize: 11, fontWeight: "600", color: C.mute },
});
