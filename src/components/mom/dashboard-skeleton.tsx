import { StyleSheet, View } from "react-native";

import { Card } from "@/components/mom/primitives";
import { R } from "@/constants/mom";

function Bar({ w, h = 12, style }: { w: number | `${number}%`; h?: number; style?: object }) {
  return <View style={[styles.bar, { width: w, height: h }, style]} />;
}

/** The dashboard's loading ghost: header, composer, note, timeline and the strips. */
export function DashboardSkeleton() {
  const heights = [0.62, 0.85, 0.4, 0.72, 0.55, 0.9, 0.68];

  return (
    <View style={styles.wrap} accessibilityElementsHidden>
      <View style={styles.header}>
        <View style={{ gap: 6 }}>
          <Bar w={96} h={24} />
          <Bar w={80} h={12} />
        </View>
        <View style={styles.headerRight}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.avatar} />
          ))}
        </View>
      </View>

      <Card radius={R.lg} offset={4} bodyStyle={styles.cardBody}>
        <View style={styles.cardHead}>
          <Bar w={128} h={16} />
          <Bar w={150} h={34} style={{ borderRadius: R.pill }} />
        </View>
        <View style={{ gap: 10, paddingVertical: 6 }}>
          <Bar w="92%" h={16} />
          <Bar w="60%" h={16} />
        </View>
        <View style={styles.chipRow}>
          <Bar w={96} h={24} style={{ borderRadius: R.pill }} />
          <Bar w={112} h={24} style={{ borderRadius: R.pill }} />
          <Bar w={80} h={24} style={{ borderRadius: R.pill }} />
        </View>
      </Card>

      <View style={styles.note} />

      <Card radius={R.xl} offset={5} bodyStyle={styles.cardBody}>
        <View style={styles.cardHead}>
          <Bar w={48} h={20} style={{ borderRadius: R.md }} />
          <Bar w={64} h={20} style={{ borderRadius: R.pill }} />
        </View>
        <View style={styles.nowRow}>
          <Bar w={48} h={48} style={{ borderRadius: R.md }} />
          <View style={{ flex: 1, gap: 8 }}>
            <Bar w={160} h={24} />
            <Bar w={96} h={12} />
          </View>
        </View>
        <View style={{ gap: 8, paddingTop: 4 }}>
          <Bar w="100%" h={16} />
          <Bar w="80%" h={16} />
        </View>
      </Card>

      <Card radius={R.lg} offset={4} bodyStyle={styles.cardBody}>
        <View style={styles.stripsRow}>
          <View style={{ flex: 1, gap: 8 }}>
            <Bar w={48} h={12} />
            <View style={styles.miniRow}>
              {[0, 1, 2, 3].map((i) => (
                <Bar key={i} w={56} h={20} style={{ borderRadius: R.pill }} />
              ))}
            </View>
          </View>
        </View>
        <View style={[styles.miniRow, { alignItems: "flex-end", height: 36 }]}>
          {heights.map((h, i) => (
            <Bar key={i} w={12} h={Math.round(h * 28)} style={{ borderRadius: 4 }} />
          ))}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 24, width: "100%" },
  bar: { backgroundColor: "rgba(33,23,19,0.12)", borderRadius: 6 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerRight: { flexDirection: "row", gap: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(33,23,19,0.12)" },
  cardBody: { padding: 16, gap: 12 },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  note: {
    height: 90,
    borderRadius: 12,
    backgroundColor: "rgba(220,196,120,0.4)",
    transform: [{ rotate: "-1.5deg" }],
  },
  nowRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stripsRow: { flexDirection: "row", justifyContent: "space-between" },
  miniRow: { flexDirection: "row", gap: 6 },
});
