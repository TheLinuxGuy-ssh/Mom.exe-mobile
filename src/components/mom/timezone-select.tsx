import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
} from "react-native";

import { ConfirmDialog } from "@/components/mom/confirm-dialog";
import { Sheet } from "@/components/mom/sheet";
import { BORDER, C, R } from "@/constants/mom";
import { timezoneOptions } from "@/lib/engine/timezones";

/**
 * The timezone field. It reads as a bordered field but opens a searchable sheet instead of a
 * keyboard, and every pick has to clear a confirm because the whole plan engine keys off this
 * value — a stray tap should never silently move someone's day.
 */
export function TimezoneSelect({
  value,
  onPick,
}: {
  value: string;
  onPick: (timezone: string) => void;
}) {
  const { height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [candidate, setCandidate] = useState<string | null>(null);

  const options = useMemo(() => {
    const all = timezoneOptions(value);
    const q = query.trim().toLowerCase();
    return q ? all.filter((tz) => tz.toLowerCase().includes(q)) : all;
  }, [value, query]);

  function choose(timezone: string) {
    setOpen(false);
    setQuery("");
    if (timezone !== value) setCandidate(timezone);
  }

  return (
    <>
      <Pressable
        onPress={() => {
          setQuery("");
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`timezone: ${value}. tap to change`}
        style={({ pressed }) => [styles.field, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.fieldText} numberOfLines={1} maxFontSizeMultiplier={1.2}>
          {value}
        </Text>
        <Feather name="chevron-down" size={16} color={C.ink} />
      </Pressable>

      <Sheet open={open} onClose={() => setOpen(false)} title="pick timezone">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="search a city"
          placeholderTextColor="rgba(33,23,19,0.35)"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.search}
        />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={{ maxHeight: height * 0.5 }}
        >
          {options.map((tz) => {
            const active = tz === value;
            return (
              <Pressable
                key={tz}
                onPress={() => choose(tz)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.option,
                  active && styles.optionActive,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[styles.optionText, active && styles.optionTextActive]}
                  maxFontSizeMultiplier={1.2}
                >
                  {tz}
                </Text>
                {active ? <Feather name="check" size={16} color={C.ink} /> : null}
              </Pressable>
            );
          })}
          {options.length === 0 ? <Text style={styles.empty}>no match</Text> : null}
        </ScrollView>
      </Sheet>

      <ConfirmDialog
        open={candidate !== null}
        title="change timezone?"
        confirmLabel="change it"
        onConfirm={() => {
          if (candidate) onPick(candidate);
          setCandidate(null);
        }}
        onCancel={() => setCandidate(null)}
      >
        <Text style={styles.confirmText}>
          New check-ins and plans will follow {candidate} instead of {value}.
        </Text>
      </ConfirmDialog>
    </>
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
  search: {
    borderWidth: BORDER,
    borderColor: C.ink,
    borderRadius: R.md,
    backgroundColor: C.cream,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: "600",
    color: C.ink,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(33,23,19,0.12)",
  },
  optionActive: { backgroundColor: C.orange, borderRadius: R.md },
  optionText: { fontSize: 15, fontWeight: "700", color: C.ink },
  optionTextActive: { color: C.paper },
  empty: { fontSize: 13, fontWeight: "700", color: C.mute, paddingVertical: 16, textAlign: "center" },
  confirmText: { fontSize: 15, fontWeight: "600", color: C.ink, lineHeight: 21 },
});
