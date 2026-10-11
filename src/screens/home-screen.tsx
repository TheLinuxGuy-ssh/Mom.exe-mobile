import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { CatVisit } from "@/components/mom/cat-visit";
import { Composer } from "@/components/mom/composer";
import { ConversationDialog } from "@/components/mom/conversation-dialog";
import { DashboardSkeleton } from "@/components/mom/dashboard-skeleton";
import { DayShape } from "@/components/mom/day-shape";
import { Mascot } from "@/components/mom/mascot";
import { MealStrip } from "@/components/mom/meal-strip";
import { MealsWidget } from "@/components/mom/meals-widget";
import { MomRead } from "@/components/mom/mom-read";
import { PlanSkeleton } from "@/components/mom/plan-skeleton";
import { AppScreen } from "@/components/mom/screen";
import { SleepStrip } from "@/components/mom/sleep-strip";
import { SleepWidget } from "@/components/mom/sleep-widget";
import { Timeline } from "@/components/mom/timeline";
import { C, R } from "@/constants/mom";
import { getSession, type Session } from "@/lib/auth/session";
import { getAuthToken, getSessionUser } from "@/lib/auth/supabase";
import {
  buildContext,
  buildPriorPlan,
  buildTodayInfo,
} from "@/lib/engine/context";
import {
  hasAnySignal,
  heuristicExtract,
  mergeCheckinRow,
  mergeUnderstanding,
  type NotePatch,
} from "@/lib/engine/extract";
import {
  DIGEST_BATCH,
  DIGEST_WEEKS,
  MEMORY_WINDOW,
  selectDigestBatches,
  toContextWindow,
} from "@/lib/engine/memory";
import {
  emptyNoteMessage,
  hasSomethingToSend,
  shouldDismissChat,
} from "@/lib/engine/prompt-rules";
import { scrubText } from "@/lib/engine/scrub";
import { computeStats } from "@/lib/engine/stats";
import { daysAgoLocalDate, localDateInTz } from "@/lib/engine/time";
import { generateFromNote } from "@/lib/llm/generate";
import { getStorage } from "@/lib/storage";
import type {
  Checkin,
  Message,
  Plan,
  PlanBlock,
  Profile,
} from "@/lib/storage/types";
import { toast } from "@/lib/ui/toast";
import { newVisitId } from "@/lib/visit";

export default function HomeScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [marks, setMarks] = useState<Record<string, "yes" | "no">>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState(() => newVisitId());
  const [chatOpen, setChatOpen] = useState(false);
  const [pendingChat, setPendingChat] = useState<Message | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [waited, setWaited] = useState(0);
  const [busySeen, setBusySeen] = useState(busy);

  const lastDay = useRef("");
  const sessionRef = useRef<Session | null>(null);
  const profileRef = useRef<Profile | null>(null);
  const planRef = useRef<Plan | null>(null);
  const marksRef = useRef<Record<string, "yes" | "no">>({});
  const checkinsRef = useRef<Checkin[]>([]);
  const chatOpenRef = useRef(false);
  const sessionIdRef = useRef(sessionId);
  const busyRef = useRef(false);

  if (busy !== busySeen) {
    setBusySeen(busy);
    if (busy) setWaited(0);
  }

  useEffect(() => {
    sessionRef.current = session;
    profileRef.current = profile;
    planRef.current = plan;
    marksRef.current = marks;
    checkinsRef.current = checkins;
    chatOpenRef.current = chatOpen;
    sessionIdRef.current = sessionId;
    busyRef.current = busy;
  }, [session, profile, plan, marks, checkins, chatOpen, sessionId, busy]);

  const today = profile ? localDateInTz(profile.timezone, now) : "";
  const todayCheckin = checkins.find((c) => c.local_date === today) ?? null;
  const sessionMessages = messages.filter((m) => m.session_id === sessionId);

  const loadMarks = useCallback(async (planId: string, sess: Session) => {
    const rows = await getStorage()
      .listFollowups(sess.userId, [planId])
      .catch(() => []);
    const map: Record<string, "yes" | "no"> = {};
    for (const r of rows) {
      if (r.followed === "na") continue;
      if (map[r.block_ref] === undefined) map[r.block_ref] = r.followed;
    }
    setMarks(map);
  }, []);

  const refresh = useCallback(
    async (sess?: Session | null, prof?: Profile | null) => {
      const s = sess ?? sessionRef.current;
      const p = prof ?? profileRef.current;
      if (!s || !p) return;
      const storage = getStorage();
      const tz = p.timezone;
      const todayStr = localDateInTz(tz);
      setCheckins(
        await storage
          .listCheckins(s.userId, daysAgoLocalDate(tz, 14))
          .catch(() => []),
      );
      const active = await storage
        .getActivePlan(s.userId, todayStr)
        .catch(() => null);
      setPlan(active);
      if (active) await loadMarks(active.id, s);
      setMessages(await storage.listMessages(s.userId, 200).catch(() => []));
    },
    [loadMarks],
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(() => setWaited((w) => w + 1), 1000);
    return () => clearInterval(timer);
  }, [busy]);

  useEffect(() => {
    (async () => {
      const s = await getSession();
      if (!s) {
        router.replace("/login");
        return;
      }
      setSession(s);
      try {
        if (s.mode === "supabase") {
          await getSessionUser();
        }
        const storage = getStorage();
        const p = await storage.getProfile(s.userId).catch(() => null);
        if (!p) {
          router.replace("/onboarding");
          return;
        }
        setProfile(p);
        await refresh(s, p);
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  useEffect(() => {
    if (!today || !profile) return;
    if (lastDay.current === "") {
      lastDay.current = today;
      return;
    }
    if (today === lastDay.current) return;
    lastDay.current = today;
    setSessionId(newVisitId());
    void refresh();
  }, [today, profile, refresh]);

  function applyRemoved(patch: NotePatch, removedKeys: string[]): NotePatch {
    for (const key of removedKeys) {
      if (key.startsWith("meals.")) {
        const slot = key.split(".")[1] as "b" | "l" | "s" | "d";
        if (patch.meals) patch.meals[slot] = null;
      } else if (key.startsWith("disturbance.")) {
        const d = key.split(".")[1];
        patch.disturbances = patch.disturbances.filter((x) => x !== d);
      } else {
        (patch as unknown as Record<string, unknown>)[key] = null;
      }
    }
    return patch;
  }

  async function runOneShot(
    note: string | null,
    quick: string | null,
    removedKeys: string[],
  ): Promise<boolean> {
    if (!sessionRef.current || !profileRef.current || busyRef.current)
      return false;
    setBusy(true);
    try {
      return await planOnce(note, quick, removedKeys);
    } finally {
      setBusy(false);
    }
  }

  async function planOnce(
    note: string | null,
    quick: string | null,
    removedKeys: string[],
    fromHandoff = false,
  ): Promise<boolean> {
    const sess = sessionRef.current;
    const prof = profileRef.current;
    if (!sess || !prof) return false;
    try {
      const storage = getStorage();
      const tz = prof.timezone;
      const todayStr = localDateInTz(tz);

      const allCheckins = await storage.listCheckins(
        sess.userId,
        daysAgoLocalDate(tz, 14),
      );
      const todayCheck =
        allCheckins.find((c) => c.local_date === todayStr) ?? null;
      const todayInfo = buildTodayInfo(prof, todayCheck, tz);
      const followups = await storage.listFollowups(
        sess.userId,
        await storage
          .listPlans(sess.userId, 10)
          .then((ps) => ps.map((p) => p.id)),
      );
      const stats = computeStats(allCheckins, followups, tz, todayStr);
      const priorPlan = buildPriorPlan(
        planRef.current,
        marksRef.current,
        new Date(),
        tz,
      );

      const stored = await storage.listMessages(sess.userId, 200);
      const digests = await storage.listWeekDigests(sess.userId, DIGEST_WEEKS);
      const knownDigestWeeks = await storage.listWeekDigests(sess.userId, 52);
      const conversation = {
        recent: toContextWindow(stored, MEMORY_WINDOW),
        older_digests: digests.map((d) => ({
          week_start: d.week_start,
          text: d.content,
        })),
        to_digest: selectDigestBatches(
          stored,
          knownDigestWeeks,
          MEMORY_WINDOW,
          DIGEST_BATCH,
          todayStr,
        ),
      };

      const { payload: ctxPayload, basis } = buildContext(
        prof,
        allCheckins,
        followups,
        todayInfo,
        new Date(),
        priorPlan,
        conversation,
      );

      const authToken = await getAuthToken();
      const result = await generateFromNote({
        note,
        context: ctxPayload,
        profile: prof,
        stats,
        today: todayInfo,
        authToken,
      });

      const heur = applyRemoved(heuristicExtract(note ?? ""), removedKeys);
      if (quick) heur.quick = quick as "rough" | "okay" | "great";
      const merged = mergeUnderstanding(heur, result.understanding, quick);
      const hasNewFacts = hasAnySignal(merged);

      if ((note || quick || hasNewFacts) && result.intent === "plan") {
        const row = mergeCheckinRow(
          todayCheck,
          merged,
          note ?? "",
          todayStr,
          removedKeys,
        );
        await storage.upsertCheckin(sess.userId, row);
      } else if (hasNewFacts && note) {
        const row = mergeCheckinRow(
          todayCheck,
          merged,
          "",
          todayStr,
          removedKeys,
        );
        await storage.upsertCheckin(sess.userId, row);
      }

      await persistDigest(storage, result.digest, sess);

      if (result.intent === "chat") {
        await logExchange(
          storage,
          { date: todayStr, role: "user", kind: "chat", content: note ?? "" },
          sess,
        );
        if (result.handoff === "replan") {
          setChatOpen(false);
          await planOnce(null, null, [], true);
          return true;
        }
        if (result.advice) {
          await logExchange(
            storage,
            {
              date: todayStr,
              role: "mom",
              kind: "chat",
              content: result.advice,
            },
            sess,
          );
        }
        await refresh(sess, prof);
        if (!result.advice) {
          toast(
            result.fallbackReason
              ? "mom could not reach the model, try again"
              : "mom had nothing to say",
            "warn",
          );
          return false;
        }
        setChatOpen(true);
        return true;
      }

      if (!result.output) {
        toast(result.fallbackReason ?? "could not plan right now", "warn");
        return false;
      }

      if (note || quick || hasNewFacts) {
        const row = mergeCheckinRow(
          todayCheck,
          merged,
          note ?? "",
          todayStr,
          removedKeys,
        );
        await storage.upsertCheckin(sess.userId, row);
      }

      const saved = await storage.savePlan(sess.userId, {
        local_date: todayStr,
        as_of: new Date().toISOString(),
        context_snapshot: {
          ...ctxPayload,
          note_understanding: result.understanding,
        },
        output: { ...result.output, advice: result.advice ?? undefined },
        basis,
        model_id: result.model_id,
        fallback_reason: result.fallbackReason ?? null,
        supersedes_plan_id: planRef.current?.id ?? null,
      });

      if (!fromHandoff) {
        await logExchange(
          storage,
          {
            date: todayStr,
            role: "user",
            kind: note ? "note" : "replan",
            content: note ?? "(asked for a fresh plan)",
          },
          sess,
        );
      }

      const replyInChat = result.advice?.trim() || saved.output.summary.trim();
      if (replyInChat) {
        await logExchange(
          storage,
          { date: todayStr, role: "mom", kind: "replan", content: replyInChat },
          sess,
        );
      }

      setPlan(saved);
      setMarks({});
      await refresh(sess, prof);

      if (shouldDismissChat({ chatOpen: chatOpenRef.current, planSaved: true }))
        setChatOpen(false);

      if (result.usedTemplate)
        toast("planned in code. the model was unreachable", "warn");
      else toast("noted. planned.");
      return true;
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "could not reach mom, try again",
        "warn",
      );
      return false;
    }
  }

  async function submitNote(payload: {
    text: string;
    quick: string | null;
    removedKeys: string[];
  }): Promise<boolean> {
    const raw = payload.text.trim();
    if (!hasSomethingToSend(raw, payload.quick)) {
      toast(emptyNoteMessage(), "warn");
      return false;
    }
    return runOneShot(
      scrubText(raw) || null,
      payload.quick,
      payload.removedKeys,
    );
  }

  async function submitChat(text: string): Promise<boolean> {
    const trimmed = text.trim();
    if (
      trimmed === "" ||
      /^[.!?…\s]+$/.test(trimmed) ||
      /^(idk|idc|lol|hmm+|huh)\b/i.test(trimmed)
    ) {
      return false;
    }
    const prof = profileRef.current;
    setPendingChat({
      id: `pending-${Date.now()}`,
      user_id: sessionRef.current?.userId ?? "",
      local_date: prof ? localDateInTz(prof.timezone, now) : "",
      role: "user",
      kind: "chat",
      content: scrubText(trimmed),
      created_at: new Date().toISOString(),
      session_id: sessionIdRef.current,
    });
    try {
      return await runOneShot(scrubText(trimmed), null, []);
    } finally {
      setPendingChat(null);
    }
  }

  async function flipMeal(slot: "b" | "l" | "s" | "d"): Promise<void> {
    if (!sessionRef.current || !profileRef.current || !todayCheckin || flipping)
      return;
    const meals = {
      ...(todayCheckin.meals ?? { b: null, l: null, s: null, d: null }),
    };
    meals[slot] = meals[slot] === true ? false : true;
    const { id: _id, user_id: _u, created_at: _c, ...rest } = todayCheckin;
    const previous = todayCheckin;
    const shown = { ...previous, meals };
    setCheckins((cs) => cs.map((c) => (c.local_date === today ? shown : c)));
    setFlipping(true);
    try {
      await getStorage().upsertCheckin(sessionRef.current.userId, {
        ...rest,
        meals,
        source: "note",
      });
    } catch (err) {
      console.error(err);
      setCheckins((cs) =>
        cs.map((c) => (c.local_date === today ? previous : c)),
      );
      toast("could not save that. check your connection.", "warn");
      return;
    } finally {
      setFlipping(false);
    }
    await refresh();
  }

  async function markBlock(
    block: PlanBlock,
    followed: "yes" | "no",
  ): Promise<void> {
    const sess = sessionRef.current;
    const currentPlan = planRef.current;
    if (!sess || !currentPlan) return;
    const ref = `${block.start}-${block.end}`;
    const previous = marksRef.current[ref];
    setMarks((m) => ({ ...m, [ref]: followed }));
    try {
      await getStorage().saveFollowups(sess.userId, currentPlan.id, [
        { action: block.action, block_ref: ref, followed },
      ]);
    } catch {
      setMarks((m) => {
        const rolled = { ...m };
        if (previous === undefined) delete rolled[ref];
        else rolled[ref] = previous;
        return rolled;
      });
      toast("could not save that", "warn");
    }
  }

  async function persistDigest(
    storage: ReturnType<typeof getStorage>,
    digest: { week: string; text: string }[],
    sess: Session,
  ): Promise<void> {
    if (digest.length === 0) return;
    for (const d of digest) {
      try {
        await storage.saveWeekDigest(sess.userId, {
          week_start: d.week,
          content: d.text,
        });
      } catch {
        continue;
      }
    }
  }

  async function logExchange(
    storage: ReturnType<typeof getStorage>,
    row: {
      date: string;
      role: "user" | "mom";
      kind: Message["kind"];
      content: string;
    },
    sess: Session,
  ): Promise<void> {
    const content = row.content.trim();
    if (!content) return;
    try {
      await storage.appendMessages(sess.userId, [
        {
          local_date: row.date,
          role: row.role,
          kind: row.kind,
          content: content.slice(0, 2000),
          session_id: sessionIdRef.current,
        },
      ]);
    } catch {
      /* the conversation log is a convenience, never a blocker for the plan */
    }
  }

  if (loading) {
    return (
      <AppScreen edges={["top"]} blobs={false} background="transparent">
        <ScrollView contentContainerStyle={styles.scroll}>
          <DashboardSkeleton />
        </ScrollView>
      </AppScreen>
    );
  }

  if (!profile) return <AppScreen background="transparent">{null}</AppScreen>;

  return (
    <AppScreen edges={["top"]} blobs={false} background="transparent">
      <CatVisit />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.brand}>Mom.exe</Text>
          <Text style={styles.hi}>hi {profile.display_name || "beta"}</Text>
        </View>

        <Composer busy={busy} onsubmit={submitNote} />

        {todayCheckin &&
          (todayCheckin.quick ||
            todayCheckin.notes ||
            todayCheckin.sleep_hours != null ||
            todayCheckin.meals) && (
            <View style={{ opacity: busy ? 0.25 : 1 }}>
              <MomRead
                checkin={todayCheckin}
                onFlip={(slot) => void flipMeal(slot)}
              />
            </View>
          )}

        {busy && !plan ? (
          <PlanSkeleton
            counter={waited}
            note="open-weight models think for 10-25s before answering. if it takes too long, i plan in code instead and you still get a real plan."
          />
        ) : plan ? (
          <Timeline
            plan={plan}
            now={now}
            tz={profile.timezone}
            marks={marks}
            busy={busy}
            onMark={markBlock}
          />
        ) : (
          <View style={styles.emptyWrap}>
            <Mascot size={200} labels={false} />
            <View style={styles.emptyText}>
              <Text style={styles.emptyTitle}>NO PLAN YET.</Text>
              <Text style={styles.emptyBody}>
                You do not need to log anything first. Write a note above, or
                just hit the button and mom plans around your setup answers.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.strips}>
          <MealStrip meals={todayCheckin?.meals ?? null} />
          <SleepStrip checkins={checkins} today={today} />
        </View>

        <DayShape blocks={plan?.output.blocks ?? []} />

        <View style={{ gap: 16 }}>
          <SleepWidget checkins={checkins} today={today} target={7.5} />
          <MealsWidget checkins={checkins} today={today} />
        </View>

        <Text style={styles.fine}>
          wellness coach, not medical advice. missing days are unknown, never
          zero.
        </Text>
      </ScrollView>

      <ConversationDialog
        open={chatOpen}
        messages={sessionMessages}
        pending={pendingChat}
        busy={busy}
        waited={waited}
        onsubmit={submitChat}
        onclose={() => setChatOpen(false)}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 18, paddingBottom: 150, gap: 20 },
  header: { gap: 2 },
  brand: {
    fontSize: 20,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -0.5,
    color: C.ink,
  },
  hi: { fontSize: 11, fontWeight: "700", color: C.mute },
  emptyWrap: { alignItems: "center", gap: 16, paddingVertical: 24 },
  emptyText: { maxWidth: 320, alignItems: "center" },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -0.5,
    color: C.ink,
  },
  emptyBody: {
    fontSize: 14,
    fontWeight: "600",
    color: C.mute,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 20,
  },
  strips: {
    borderWidth: 3,
    borderColor: C.ink,
    borderRadius: R.lg,
    backgroundColor: C.paper,
    padding: 16,
    gap: 14,
  },
  fine: { fontSize: 11, fontWeight: "600", color: C.mute, textAlign: "center" },
});
