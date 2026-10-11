import { StyleSheet, Text, View } from "react-native";

import { C } from "@/constants/mom";
import type { Checkin } from "@/lib/storage/types";

function daysBack(today: string, n: number): string {
  const [y, m, d] = today.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10);
}

/** Seven sleep stubs for the dashboard rail. Height is hours scaled to 28px. */
export function SleepStrip({ checkins = [], today }: { checkins?: Checkin[]; today: string }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = daysBack(today, 6 - i);
    const c = checkins.find((x) => x.local_date === d);
    return { date: d, hours: c?.sleep_hours ?? null, isToday: d === today };
  });

  return (
    <View style={styles.wrap} accessibilityLabel="sleep last 7 days">
      <Text style={styles.label} maxFontSizeMultiplier={1.2}>
        sleep
      </Text>
      {days.map((day) => (
        <View key={day.date} style={styles.col}>
          {day.hours != null ? (
            <View
              style={[
                styles.bar,
                {
                  height: Math.max(4, Math.min(28, (day.hours / 10) * 28)),
                  backgroundColor: day.isToday ? C.orange : C.blue,
                },
              ]}
            />
          ) : (
            <View style={styles.stub} />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  label: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: C.brown,
    marginRight: 2,
  },
  col: { alignItems: "center" },
  bar: { width: 14, borderWidth: 2, borderColor: C.ink, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  stub: {
    width: 14,
    height: 8,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(33,23,19,0.4)",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
});
