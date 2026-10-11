import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ActionIcon } from "@/components/mom/action-icon";
import { Card, Chip, Eyebrow } from "@/components/mom/primitives";
import { AppScreen } from "@/components/mom/screen";
import { BORDER, C, R } from "@/constants/mom";
import { getSession } from "@/lib/auth/session";
import { ACTION_LABEL, type Action } from "@/lib/engine/actions";
import { splitBubbles } from "@/lib/engine/bubbles";
import { buildHistory, chatPreview, type ChatEntry, type HistoryEntry, type HistoryTab } from "@/lib/engine/history";
import { getStorage } from "@/lib/storage";
import type { Message, Plan } from "@/lib/storage/types";

const TABS: { value: HistoryTab; label: string }[] = [
  { value: "all", label: "everything" },
  { value: "plans", label: "plans" },
  { value: "chats", label: "chats" },
];

function entryKey(e: HistoryEntry): string {
  return e.kind === "plan" ? `plan-${e.plan.id}` : `chat-${e.sessionId ?? `${e.date}-${e.messages[0]?.id ?? "x"}`}`;
}

function sessionTime(e: ChatEntry): string {
  const t = new Date(e.at);
  if (Number.isNaN(t.getTime())) return "";
  return `at ${t.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

export default function HistoryScreen() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [tab, setTab] = useState<HistoryTab>("all");

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      try {
        const storage = getStorage();
        setPlans(await storage.listPlans(session.userId, 50).catch(() => []));
        setMessages(await storage.listMessages(session.userId, 300).catch(() => []));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const view = buildHistory(plans, messages, tab);

  return (
    <AppScreen edges={["top"]} blobs={false} background="transparent">
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>The fridge door</Text>

        <View style={styles.tabs}>
          {TABS.map((t) => (
            <Chip
              key={t.value}
              label={t.label}
              background={tab === t.value ? C.lime : C.paper}
              onPress={() => setTab(t.value)}
              offset={2}
              accessibilityLabel={t.label}
            />
          ))}
        </View>

        <Text style={styles.blurb}>
          {tab === "chats"
            ? "everything the two of you have said, newest day first."
            : tab === "plans"
              ? "every plan mom ever pinned, newest first."
              : "plans and conversations together, newest first."}
        </Text>

        {loading ? (
          <Text style={styles.loading}>loading...</Text>
        ) : view.entries.length === 0 ? (
          <Card radius={R.lg} offset={4} bodyStyle={styles.empty}>
            <Text style={styles.emptyTitle}>{tab === "chats" ? "no talking yet." : "nothing yet."}</Text>
            <Text style={styles.emptyBody}>
              {tab === "chats"
                ? "write to her on the dashboard and she will answer back."
                : "ask for your first plan on the dashboard."}
            </Text>
          </Card>
        ) : (
          <View style={{ gap: 12 }}>
            {view.entries.map((e) => {
              const ref = entryKey(e);
              const isOpen = open === ref;
              return e.kind === "plan" ? (
                <Pressable key={ref} onPress={() => setOpen(isOpen ? null : ref)}>
                  <Card radius={R.lg} offset={4} bodyStyle={styles.entry}>
                    <View style={styles.entryHead}>
                      <View style={{ flexShrink: 1 }}>
                        <View style={styles.entryTitleRow}>
                          <Feather name="calendar" size={14} color={C.brown} />
                          <Text style={styles.entryTitle}>plan</Text>
                          <Text style={styles.entryMeta}>
                            {e.plan.basis} data, {e.plan.model_id}
                          </Text>
                        </View>
                        <Text style={styles.entrySummary} numberOfLines={1}>
                          {e.plan.output.summary}
                        </Text>
                      </View>
                      <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={C.mute} />
                    </View>

                    {isOpen && (
                      <View style={styles.entryBody}>
                        {e.plan.output.blocks.map((b) => (
                          <View key={`${b.start}-${b.end}`} style={styles.blockRow}>
                            <View style={styles.blockIcon}>
                              <ActionIcon action={b.action} size={13} />
                            </View>
                            <Text style={styles.blockStart}>{b.start}</Text>
                            <Text style={styles.blockLabel} numberOfLines={1}>
                              {ACTION_LABEL[b.action as Action] ?? b.action}
                            </Text>
                          </View>
                        ))}
                        {e.plan.output.flags.length > 0 && (
                          <Text style={styles.flags}>flags: {e.plan.output.flags.join(", ")}</Text>
                        )}
                      </View>
                    )}
                  </Card>
                </Pressable>
              ) : (
                <Pressable key={ref} onPress={() => setOpen(isOpen ? null : ref)}>
                  <Card radius={R.lg} offset={4} bodyStyle={styles.entry}>
                    <View style={styles.entryHead}>
                      <View style={{ flexShrink: 1 }}>
                        <View style={styles.entryTitleRow}>
                          <Feather name={e.isPlan ? "calendar" : "message-square"} size={14} color={C.brown} />
                          <Text style={styles.entryTitle}>{e.isPlan ? "replan" : "conversation"}</Text>
                          <Text style={styles.entryMeta}>
                            {e.sessionId ? `${sessionTime(e)} ` : ""}
                            {e.messages.length} messages
                          </Text>
                        </View>
                        <Text style={styles.entrySummary} numberOfLines={1}>
                          {chatPreview(e.messages)}
                        </Text>
                      </View>
                      <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={C.mute} />
                    </View>

                    {isOpen && (
                      <View style={styles.entryBody}>
                        {e.messages.map((m) =>
                          m.role === "user" ? (
                            <View key={m.id} style={[styles.msgRow, styles.msgRight]}>
                              <View style={styles.userBubble}>
                                <Text style={styles.userText}>{m.content}</Text>
                              </View>
                            </View>
                          ) : (
                            splitBubbles(m.content).map((part, i) => (
                              <View key={`${m.id}-${i}`} style={[styles.msgRow, styles.msgLeft]}>
                                <View style={styles.momBubble}>
                                  <Text style={styles.momText}>{part}</Text>
                                </View>
                              </View>
                            ))
                          ),
                        )}
                      </View>
                    )}
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}

        <Eyebrow color="rgba(33,23,19,0.4)">wellness coach, not medical advice</Eyebrow>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 18, paddingBottom: 150, gap: 16 },
  title: { fontSize: 26, fontWeight: "900", textTransform: "uppercase", letterSpacing: -0.8, color: C.ink },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  blurb: { fontSize: 14, fontWeight: "600", color: C.mute },
  loading: { fontSize: 14, fontWeight: "700", color: C.mute },
  empty: { padding: 32, alignItems: "center" },
  emptyTitle: { fontSize: 22, fontWeight: "900", textTransform: "uppercase", color: C.ink },
  emptyBody: { fontSize: 14, fontWeight: "600", color: C.mute, marginTop: 4, textAlign: "center" },
  entry: { padding: 16 },
  entryHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  entryTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  entryTitle: { fontSize: 14, fontWeight: "900", color: C.ink },
  entryMeta: { fontSize: 12, fontWeight: "700", color: C.mute, marginLeft: 6 },
  entrySummary: { fontSize: 14, fontWeight: "600", color: C.mute, marginTop: 4 },
  entryBody: { marginTop: 14, paddingTop: 12, borderTopWidth: 2, borderColor: "rgba(33,23,19,0.1)", gap: 8 },
  blockRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  blockIcon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: R.md,
    backgroundColor: C.paper,
  },
  blockStart: { fontSize: 12, fontWeight: "700", color: C.mute, width: 44 },
  blockLabel: { fontSize: 14, fontWeight: "600", color: C.ink, flexShrink: 1 },
  flags: { fontSize: 12, fontWeight: "700", color: C.brown, paddingTop: 4 },
  msgRow: { flexDirection: "row" },
  msgLeft: { justifyContent: "flex-start" },
  msgRight: { justifyContent: "flex-end" },
  userBubble: {
    maxWidth: "85%",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: BORDER,
    borderColor: C.ink,
    backgroundColor: "rgba(108,196,222,0.4)",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 2,
  },
  userText: { fontSize: 14, fontWeight: "600", lineHeight: 19, color: C.ink },
  momBubble: {
    maxWidth: "85%",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: C.yellow,
    borderWidth: BORDER,
    borderColor: C.ink,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 12,
  },
  momText: { fontSize: 15, fontWeight: "700", lineHeight: 20, color: C.brown },
});
