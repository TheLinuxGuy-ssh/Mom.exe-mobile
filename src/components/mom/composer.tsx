import { Feather } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { BrutalButton, Card, Chip } from "@/components/mom/primitives";
import { C, FONT, R } from "@/constants/mom";
import { DISTURBANCE_LABEL, heuristicExtract } from "@/lib/engine/extract";
import {
  emptyNoteMessage,
  hasSomethingToSend,
  idleLabel,
  noteReady,
  noteShortfall,
  readyLabel,
} from "@/lib/engine/prompt-rules";
import { toast } from "@/lib/ui/toast";
import type { QuickBand } from "@/lib/storage/types";

const PLACEHOLDERS = [
  "how did you sleep?",
  "what does today look like?",
  "anything to plan around? just tell me.",
  "no log needed, but I am listening.",
];

const SUGGESTIONS = ["rough night", "skipped breakfast", "deadline tomorrow", "roommates were loud"];

/**
 * The note box. The chips under it describe what mom heard, following the typing a beat behind.
 * A removal holds until the note is sent or the words change enough to be a different note, so
 * tapping an x does not get undone by the next keystroke.
 */
export function Composer({
  busy = false,
  onsubmit,
}: {
  busy?: boolean;
  onsubmit: (payload: { text: string; quick: QuickBand | null; removedKeys: string[] }) => Promise<boolean>;
}) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [removed, setRemoved] = useState<string[]>([]);
  const [debounced, setDebounced] = useState("");
  const [waited, setWaited] = useState(0);
  const [phIndex, setPhIndex] = useState(0);
  const [hour, setHour] = useState(new Date().getHours());
  const inputRef = useRef<TextInput>(null);
  const removedFor = useRef("");
  const [busySeen, setBusySeen] = useState(busy);

  if (busy !== busySeen) {
    setBusySeen(busy);
    if (busy) setWaited(0);
  }

  useEffect(() => {
    const timer = setInterval(() => setPhIndex((i) => (i + 1) % PLACEHOLDERS.length), 8000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setHour(new Date().getHours()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (text !== removedFor.current && removed.length > 0) setRemoved([]);
    removedFor.current = text;
    const timer = setTimeout(() => setDebounced(text), 500);
    return () => clearTimeout(timer);
  }, [text, removed]);

  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(() => setWaited((w) => w + 1), 1000);
    return () => clearInterval(timer);
  }, [busy]);

  const tooShort = text.trim().length > 0 && !noteReady(text);
  const shortfall = noteShortfall(text);

  const patch = heuristicExtract(debounced);
  const chips: { key: string; label: string }[] = [];
  if (patch.sleep_hours != null) chips.push({ key: "sleep_hours", label: `~${patch.sleep_hours}h sleep` });
  if (patch.slept_at) chips.push({ key: "slept_at", label: `slept at ${patch.slept_at}` });
  if (patch.woke_at) chips.push({ key: "woke_at", label: `woke at ${patch.woke_at}` });
  const m = patch.meals;
  if (m) {
    for (const [k, word] of [["b", "breakfast"], ["l", "lunch"], ["d", "dinner"]] as const) {
      if (m[k] === false) chips.push({ key: `meals.${k}`, label: `skipped ${word}` });
      else if (m[k] === true) chips.push({ key: `meals.${k}`, label: `had ${word}` });
    }
    if (m.s === true) chips.push({ key: "meals.s", label: "snacked" });
  }
  if (patch.deadline_notes)
    chips.push({ key: "deadline_notes", label: `deadline: ${patch.deadline_notes.slice(0, 24)}` });
  for (const d of patch.disturbances)
    chips.push({ key: `disturbance.${d}`, label: DISTURBANCE_LABEL[d] ?? d });
  const visible = chips.filter((c) => !removed.includes(c.key));

  async function submit() {
    if (busy) return;
    if (!hasSomethingToSend(text, null)) {
      toast(emptyNoteMessage(), "warn");
      inputRef.current?.focus();
      return;
    }
    if (text.trim().length > 0 && !noteReady(text)) return;
    const ok = await onsubmit({ text, quick: null, removedKeys: removed });
    if (ok) {
      setText("");
      setDebounced("");
      setRemoved([]);
    }
  }

  return (
    <View style={[styles.wrap, { transform: [{ rotate: focused ? "0deg" : "-1.2deg" }] }]}>
      <Card radius={R.lg} offset={5} bodyStyle={styles.cardBody}>
        <View style={styles.head}>
          <View style={styles.headLeft}>
            <Feather name="edit-3" size={15} color={C.brown} />
            <Text style={styles.headText} maxFontSizeMultiplier={1.2}>
              Write mom a note
            </Text>
          </View>
        </View>

        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={PLACEHOLDERS[phIndex]}
          placeholderTextColor="rgba(33,23,19,0.35)"
          multiline
          maxLength={500}
          style={styles.input}
          maxFontSizeMultiplier={1.3}
        />

        {visible.length > 0 && (
          <View style={styles.chipRow}>
            {visible.map((chip) => (
              <Chip
                key={chip.key}
                label={chip.label}
                background="rgba(108,196,222,0.6)"
                icon={<Feather name="x" size={12} color={C.ink} />}
                onPress={() => setRemoved((r) => [...r, chip.key])}
                accessibilityLabel={`remove ${chip.label}`}
              />
            ))}
          </View>
        )}

        <View style={styles.chipRow}>
          {SUGGESTIONS.map((s) => (
            <Chip
              key={s}
              label={s}
              onPress={() => setText((t) => (t ? t.trimEnd() + ", " + s : s))}
            />
          ))}
        </View>
      </Card>

      <View style={styles.submitWrap}>
        <BrutalButton
          size="lg"
          background={C.orange}
          textColor={C.paper}
          disabled={busy || tooShort}
          onPress={() => void submit()}
          icon={
            busy ? (
              <Feather name="loader" size={16} color={C.paper} />
            ) : (
              <Feather name="send" size={16} color={C.paper} />
            )
          }
        >
          {busy ? `reading it${waited > 2 ? `, ${waited}s` : ""}...` : noteReady(text) ? readyLabel(hour) : idleLabel(hour)}
        </BrutalButton>

        {tooShort && (
          <Text style={styles.shortText}>
            {shortfall} more character{shortfall === 1 ? "" : "s"} and mom is listening.
          </Text>
        )}
        {busy && (
          <Text style={styles.busyText}>
            hosted open-weight models think for 10-25s before answering. if it takes too long, i plan
            in code instead and you still get a real plan.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  cardBody: { padding: 16 },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  headLeft: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  headText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: C.brown,
  },
  input: {
    minHeight: 64,
    paddingVertical: 6,
    fontFamily: FONT.hand,
    fontWeight: "700",
    fontSize: 20,
    lineHeight: 30,
    color: C.ink,
    textAlignVertical: "top",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  submitWrap: { alignItems: "center", marginTop: 16, gap: 8 },
  shortText: { fontSize: 11, fontWeight: "700", color: C.brown, textAlign: "center" },
  busyText: {
    fontSize: 11,
    fontWeight: "600",
    color: C.mute,
    textAlign: "center",
    maxWidth: 300,
    lineHeight: 16,
  },
});
