import { Feather } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Modal } from "@/components/mom/modal";
import { BrutalButton } from "@/components/mom/primitives";
import { BORDER, C, FONT, R } from "@/constants/mom";
import { bubbleDelay, splitBubbles } from "@/lib/engine/bubbles";
import { chatReady } from "@/lib/engine/prompt-rules";
import type { Message } from "@/lib/storage/types";

type Row = { key: string; role: Message["role"]; text: string };

/**
 * The chat with mom. Her replies land in beats rather than one wall of text: a short burst with a
 * typing dot between each part, and the student cannot talk over her while it is still arriving.
 */
export function ConversationDialog({
  open,
  messages = [],
  pending = null,
  busy = false,
  waited = 0,
  onsubmit,
  onclose,
}: {
  open: boolean;
  messages?: Message[];
  pending?: Message | null;
  busy?: boolean;
  waited?: number;
  onsubmit: (text: string) => Promise<boolean>;
  onclose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [deliveryId, setDeliveryId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [parts, setParts] = useState<string[]>([]);
  const scroller = useRef<ScrollView>(null);

  const shown = useMemo(() => {
    const echoed =
      pending &&
      !messages.some(
        (m) => m.role === "user" && m.content === pending.content && m.created_at >= pending.created_at,
      )
        ? pending
        : null;
    return (echoed ? [echoed, ...messages] : messages).slice().reverse();
  }, [pending, messages]);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    const repeats = new Map<string, number>();
    for (const m of shown) {
      if (m.role === "user") {
        const seen = (repeats.get(m.content) ?? 0) + 1;
        repeats.set(m.content, seen);
        out.push({ key: seen === 1 ? `u:${m.content}` : `u:${m.content}#${seen}`, role: "user", text: m.content });
        continue;
      }
      if (m.id === deliveryId) {
        parts.slice(0, revealed).forEach((part, i) => out.push({ key: `${m.id}-${i}`, role: "mom", text: part }));
      } else {
        splitBubbles(m.content).forEach((part, i) => out.push({ key: `${m.id}-${i}`, role: "mom", text: part }));
      }
    }
    return out;
  }, [shown, deliveryId, parts, revealed]);

  const latestMomId = useMemo(() => {
    for (let i = shown.length - 1; i >= 0; i--) if (shown[i].role === "mom") return shown[i].id;
    return null;
  }, [shown]);

  const [deliveredId, setDeliveredId] = useState<string | null>(null);
  if (latestMomId && latestMomId !== deliveredId && !busy) {
    setDeliveredId(latestMomId);
    const content = messages.find((m) => m.id === latestMomId)?.content ?? "";
    const next = splitBubbles(content);
    setParts(next);
    setDeliveryId(latestMomId);
    setRevealed(next.length === 0 ? 0 : 1);
  }

  useEffect(() => {
    if (!deliveryId || revealed >= parts.length) return;
    const t = setTimeout(() => setRevealed((r) => r + 1), bubbleDelay(revealed));
    return () => clearTimeout(t);
  }, [deliveryId, revealed, parts.length]);

  const settling = deliveryId !== null && revealed < parts.length;

  useEffect(() => {
    if (open) scroller.current?.scrollToEnd({ animated: true });
  }, [open, rows.length, busy, settling]);

  async function send() {
    const text = draft.trim();
    if (!chatReady(text) || busy) return;
    setDraft("");
    const sent = await onsubmit(text);
    if (!sent) setDraft(text);
  }

  return (
    <Modal open={open} onClose={onclose} dismissible={!busy && !settling} align="sheet">
      <View style={styles.sheet} accessibilityViewIsModal>
        <View style={styles.header}>
          <Text style={styles.headerText}>talking to mom</Text>
          <Pressable onPress={onclose} hitSlop={10} style={styles.closeBtn} accessibilityLabel="close conversation">
            <Feather name="x" size={16} color={C.ink} />
          </Pressable>
        </View>

        <ScrollView
          ref={scroller}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {shown.length === 0 && (
            <Text style={styles.empty}>tell her how the day is actually going.</Text>
          )}

          {rows.map((r) => (
            <View key={r.key} style={[styles.row, r.role === "mom" ? styles.rowLeft : styles.rowRight]}>
              {r.role === "mom" ? (
                <View style={styles.momBubble}>
                  <Text style={styles.momText} maxFontSizeMultiplier={1.3}>
                    {r.text}
                  </Text>
                </View>
              ) : (
                <View style={styles.userBubble}>
                  <Text style={styles.userText} maxFontSizeMultiplier={1.3}>
                    {r.text}
                  </Text>
                </View>
              )}
            </View>
          ))}

          {(busy || settling) && (
            <View style={[styles.row, styles.rowLeft]}>
              <View style={styles.typing}>
                <Feather name="loader" size={15} color={C.brown} />
                <Text style={styles.typingText}>
                  {busy ? `reading it${waited > 2 ? `, ${waited}s` : ""}...` : "typing..."}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="say it how you'd say it."
            placeholderTextColor="rgba(33,23,19,0.35)"
            multiline
            maxLength={500}
            style={styles.input}
            maxFontSizeMultiplier={1.3}
          />
          <BrutalButton
            background={C.orange}
            textColor={C.paper}
            disabled={busy || settling || draft.trim().length === 0}
            onPress={() => void send()}
            accessibilityLabel="send to mom"
            icon={
              <Feather name={busy ? "loader" : "send"} size={16} color={C.paper} />
            }
          >
            {""}
          </BrutalButton>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    maxHeight: "90%",
    width: "100%",
    backgroundColor: C.paper,
    borderTopWidth: BORDER,
    borderLeftWidth: BORDER,
    borderRightWidth: BORDER,
    borderColor: C.ink,
    borderTopLeftRadius: R.xl,
    borderTopRightRadius: R.xl,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: BORDER,
    borderColor: C.ink,
  },
  headerText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: C.brown,
  },
  closeBtn: {
    padding: 8,
    borderWidth: BORDER,
    borderColor: C.ink,
    borderRadius: R.pill,
  },
  scroll: { maxHeight: 460 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  empty: { paddingVertical: 24, textAlign: "center", fontSize: 14, fontWeight: "600", color: C.mute },
  row: { flexDirection: "row" },
  rowLeft: { justifyContent: "flex-start" },
  rowRight: { justifyContent: "flex-end" },
  momBubble: {
    maxWidth: "85%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.yellow,
    borderWidth: BORDER,
    borderColor: C.ink,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 14,
    transform: [{ rotate: "-1deg" }],
  },
  momText: { fontFamily: FONT.hand, fontWeight: "700", fontSize: 16, lineHeight: 22, color: C.brown },
  userBubble: {
    maxWidth: "85%",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(108,196,222,0.4)",
    borderWidth: BORDER,
    borderColor: C.ink,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 2,
  },
  userText: { fontSize: 15, fontWeight: "600", lineHeight: 20, color: C.ink },
  typing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: BORDER,
    borderColor: C.ink,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 16,
  },
  typingText: { fontSize: 14, fontWeight: "600", color: C.mute },
  footer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 12,
    borderTopWidth: BORDER,
    borderColor: C.ink,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: BORDER,
    borderColor: C.ink,
    borderRadius: R.md,
    fontFamily: FONT.hand,
    fontWeight: "700",
    fontSize: 18,
    color: C.ink,
    includeFontPadding: false,
    textAlignVertical: "top",
  },
});
