import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Sheet } from "@/components/mom/sheet";
import { BrutalButton } from "@/components/mom/primitives";
import { BORDER, C, R } from "@/constants/mom";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

/** Splits an "HH:MM" string into a valid hour and minute, falling back to midnight. */
function parseTime(value: string): { hour: string; minute: string } {
  const [rawHour = "00", rawMinute = "00"] = value.split(":");
  const hour = HOURS.includes(rawHour) ? rawHour : "00";
  const minute = /^\d{1,2}$/.test(rawMinute) ? rawMinute.padStart(2, "0") : "00";
  return { hour, minute };
}

/**
 * A tap-to-pick time control. The engine reads "HH:MM", so the sheet offers a 24-hour grid of
 * chips rather than a free-text field where a typo silently breaks the whole day's plan.
 */
export function TimeSelect({
  value,
  onPick,
  accessibilityLabel,
}: {
  value: string;
  onPick: (time: string) => void;
  accessibilityLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const { hour: valueHour, minute: valueMinute } = parseTime(value);
  const [hour, setHour] = useState(valueHour);
  const [minute, setMinute] = useState(valueMinute);

  const minuteOptions = useMemo(() => {
    const minutes = new Set(MINUTES);
    minutes.add(valueMinute);
    return Array.from(minutes).sort((a, b) => Number(a) - Number(b));
  }, [valueMinute]);

  function openSheet() {
    const parsed = parseTime(value);
    setHour(parsed.hour);
    setMinute(parsed.minute);
    setOpen(true);
  }

  function done() {
    setOpen(false);
    const next = `${hour}:${minute}`;
    if (next !== value) onPick(next);
  }

  return (
    <>
      <Pressable
        onPress={openSheet}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? `time: ${value}. tap to change`}
        style={({ pressed }) => [styles.field, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.fieldText} numberOfLines={1} maxFontSizeMultiplier={1.2}>
          {value}
        </Text>
        <Feather name="chevron-down" size={16} color={C.ink} />
      </Pressable>

      <Sheet open={open} onClose={() => setOpen(false)} title="pick a time">
        <View style={styles.preview}>
          <Text style={styles.previewText}>
            {hour}
            <Text style={styles.previewColon}>:</Text>
            {minute}
          </Text>
        </View>

        <Text style={styles.groupLabel}>hour</Text>
        <View style={styles.grid}>
          {HOURS.map((h) => (
            <Chip key={h} label={h} active={h === hour} onPress={() => setHour(h)} />
          ))}
        </View>

        <Text style={styles.groupLabel}>minute</Text>
        <View style={styles.grid}>
          {minuteOptions.map((m) => (
            <Chip key={m} label={m} active={m === minute} onPress={() => setMinute(m)} />
          ))}
        </View>

        <View style={styles.actions}>
          <BrutalButton size="sm" background={C.paper} onPress={() => setOpen(false)}>
            cancel
          </BrutalButton>
          <BrutalButton size="sm" background={C.lime} onPress={done}>
            set time
          </BrutalButton>
        </View>
      </Sheet>
    </>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderWidth: BORDER,
    borderColor: C.ink,
    borderRadius: R.md,
    backgroundColor: C.paper,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fieldText: { flexShrink: 1, fontSize: 15, fontWeight: "600", color: C.ink },
  preview: { alignItems: "center", paddingVertical: 4 },
  previewText: {
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -1,
    color: C.ink,
  },
  previewColon: { color: C.orange },
  groupLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: C.brown,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minWidth: 46,
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: BORDER,
    borderColor: C.ink,
    borderRadius: R.sm,
    backgroundColor: C.cream,
  },
  chipActive: { backgroundColor: C.orange },
  chipText: { fontSize: 14, fontWeight: "800", color: C.ink },
  chipTextActive: { color: C.paper },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 4 },
});
