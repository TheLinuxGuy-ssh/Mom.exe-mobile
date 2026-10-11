import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Chip } from "@/components/mom/primitives";
import { C } from "@/constants/mom";
import type { Checkin } from "@/lib/storage/types";

const SLOTS = [
  { k: "b", label: "breakfast" },
  { k: "l", label: "lunch" },
  { k: "s", label: "snack" },
  { k: "d", label: "dinner" },
] as const;

/**
 * "mom read:" — the chips that show what she understood from the last check-in. Tapping an eaten
 * or missed meal flips it, because she can get that wrong and the student should be able to fix it.
 */
export function MomRead({
  checkin,
  onFlip,
}: {
  checkin: Checkin;
  onFlip: (slot: "b" | "l" | "s" | "d") => void;
}) {
  const deadline = checkin.notes
    ? /\b(due|exam|submission|assignment|quiz|test|project)\b/i.test(checkin.notes)
    : false;

  const heard = Boolean(
    checkin.quick ||
      checkin.sleep_hours != null ||
      checkin.slept_at ||
      checkin.woke_at ||
      checkin.mood != null ||
      deadline ||
      SLOTS.some((s) => checkin.meals?.[s.k] != null),
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Feather name="edit-3" size={12} color={C.brown} />
        <Text style={styles.label} maxFontSizeMultiplier={1.2}>
          mom read:
        </Text>
      </View>

      {checkin.quick && <Chip label={`${checkin.quick} one`} background={C.yellow} offset={2} />}
      {checkin.sleep_hours != null && <Chip label={`${checkin.sleep_hours}h sleep`} offset={2} />}
      {checkin.slept_at && <Chip label={`slept ${checkin.slept_at}`} offset={2} />}
      {checkin.woke_at && <Chip label={`woke ${checkin.woke_at}`} offset={2} />}

      {SLOTS.map((s) => {
        const state = checkin.meals?.[s.k];
        if (state == null) return null;
        return (
          <Chip
            key={s.k}
            label={`${s.label} ${state ? "eaten" : "missed"}`}
            background={state ? C.lime : C.paper}
            onPress={() => onFlip(s.k)}
            offset={2}
            accessibilityLabel={`${s.label} ${state ? "eaten" : "missed"}, tap to correct`}
          />
        );
      })}

      {deadline && <Chip label="deadline today" background={C.blue} offset={2} />}
      {checkin.mood != null && <Chip label={`mood ${checkin.mood}/5`} offset={2} />}

      {!heard && (
        <Text style={styles.empty} maxFontSizeMultiplier={1.2}>
          nothing yet. write her a note.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: C.brown,
  },
  empty: {
    fontSize: 11,
    fontWeight: "600",
    fontStyle: "italic",
    color: C.mute,
  },
});
