import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ActionIcon } from "@/components/mom/action-icon";
import { BlockCard } from "@/components/mom/block-card";
import { GooeyToggle } from "@/components/mom/gooey-toggle";
import { BrutalButton, Card, Chip, Eyebrow, StickyNote } from "@/components/mom/primitives";
import { C, FONT, R } from "@/constants/mom";
import { ACTION_LABEL, FLAG_LABEL, type Action, type Flag } from "@/lib/engine/actions";
import { fmtCountdown, hhmmToMin, isCurrentMinute, localDateInTz, nowMinutesInTz } from "@/lib/engine/time";
import type { Plan, PlanBlock } from "@/lib/storage/types";

interface Classified {
  block: PlanBlock;
  phase: "past" | "current" | "next";
  minutesLeft: number;
}

/**
 * The day's plan. The phone never shows the desktop's three-column layout, so this is the whole
 * main column: the pinned note, flags, the current block with its countdown, the "then" line, and
 * an optional full-day list or a mom.js view.
 */
export function Timeline({
  plan,
  now,
  tz,
  marks = {},
  busy = false,
  onMark,
}: {
  plan: Plan;
  now: Date;
  tz: string;
  marks: Record<string, "yes" | "no">;
  busy?: boolean;
  onMark: (block: PlanBlock, followed: "yes" | "no") => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [view, setView] = useState<"plain" | "code">("plain");

  const minutes = nowMinutesInTz(tz, now);
  const planDayOver = Boolean(plan.local_date) && localDateInTz(tz, now) !== plan.local_date;

  const classified: Classified[] = plan.output.blocks.map((b) => {
    const s = hhmmToMin(b.start);
    const e = hhmmToMin(b.end);
    const overnight = e <= s;
    const isNow = isCurrentMinute(minutes, b.start, b.end);
    const ended = overnight ? planDayOver || minutes >= e : minutes >= e;
    let minutesLeft = 0;
    if (isNow) {
      const effEnd = overnight ? e + 1440 : e;
      minutesLeft = Math.max(0, effEnd - minutes);
    }
    return { block: b, phase: ended ? "past" : isNow ? "current" : "next", minutesLeft };
  });

  const current = classified.find((c) => c.phase === "current") ?? null;
  const nexts = classified.filter((c) => c.phase === "next");
  const past = classified.filter((c) => c.phase === "past");
  const doneCount = past.filter((c) => marks[refOf(c.block)] === "yes").length;
  const finished = !current && nexts.length === 0;
  const currentMark = current ? (marks[refOf(current.block)] ?? null) : null;

  const snapshot = (plan.context_snapshot as { data_quality?: { days_since_last_checkin?: number } }) ?? {};
  const daysSince = snapshot.data_quality?.days_since_last_checkin ?? null;

  const basisText =
    plan.basis === "priors"
      ? "based on your setup answers, not history yet"
      : plan.basis === "partial"
        ? daysSince != null && daysSince >= 2
          ? `based on your usual pattern, last check-in ${daysSince} days ago`
          : "based on your recent check-ins"
        : "based on your full recent history";

  const replyText = plan.output.advice
    ? `${plan.output.advice} ${plan.output.summary}`
    : plan.output.summary;

  const otherFlags = plan.output.flags.filter((f) => f !== "suggest_professional_help");
  const helpFlag = plan.output.flags.includes("suggest_professional_help");

  const labelOf = (action: string) => ACTION_LABEL[action as Action] ?? action;

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <Eyebrow style={{ flexShrink: 1 }}>{basisText}</Eyebrow>
        <Pressable onPress={() => setExpanded((v) => !v)} style={styles.fullDayBtn} hitSlop={8}>
          <Feather name="list" size={13} color={C.mute} />
          <Text style={styles.fullDayText}>{expanded ? "less" : "full day"}</Text>
        </Pressable>
      </View>

      <StickyNote text={replyText + (plan.output.data_note ? " " + plan.output.data_note : "")} />

      {plan.model_id === "template" && (
        <View style={styles.noteRow}>
          <Feather name="wifi-off" size={14} color={C.brown} />
          <Text style={styles.noteText}>
            planned in code, not by the model. {plan.fallback_reason ?? "the model was unreachable"}
          </Text>
        </View>
      )}

      {helpFlag && (
        <Card offset={4} radius={R.lg} borderColor={C.warn}>
          <View style={styles.helpBody}>
            <Feather name="alert-triangle" size={20} color={C.warn} />
            <View style={{ flex: 1 }}>
              <Text style={styles.helpTitle}>Worth talking to someone</Text>
              <Text style={styles.helpText}>
                Sleep and meals have been rough for a while and that is a lot to carry alone. A campus
                counselor or doctor can actually help. Wellness app, not a medical one.
              </Text>
            </View>
          </View>
        </Card>
      )}

      {otherFlags.length > 0 && (
        <View style={styles.flagsRow}>
          {otherFlags.map((f) => (
            <Chip key={f} label={FLAG_LABEL[f as Flag] ?? f} background={C.yellow} offset={2} />
          ))}
        </View>
      )}

      {busy && (
        <Card offset={4} radius={R.lg}>
          <View style={styles.busyBody}>
            <ActivityDots />
            <Text style={styles.busyText}>mom is replanning from now...</Text>
          </View>
        </Card>
      )}

      <View style={{ opacity: busy ? 0.25 : 1 }}>
        {finished && current === null && (
          <Card offset={5} radius={R.xl}>
            <View style={styles.doneBody}>
              <Text style={styles.doneTitle}>DAY DONE.</Text>
              <Text style={styles.doneText}>
                {doneCount} of {past.length} done. Tomorrow we go again.
              </Text>
            </View>
          </Card>
        )}

        {current && (
          <Card
            offset={6}
            radius={R.xl}
            style={{ opacity: currentMark === "yes" ? 0.72 : currentMark === "no" ? 0.6 : 1 }}
          >
            <View style={styles.nowBody}>
              <View style={styles.nowTop}>
                <Chip label="NOW" background={C.orange} textColor={C.paper} />
                {currentMark === "yes" ? (
                  <Chip label="did it" icon={<Feather name="check" size={12} color={C.ink} />} background={C.lime} />
                ) : currentMark === "no" ? (
                  <Chip label="skipped" icon={<Feather name="x" size={12} color={C.ink} />} />
                ) : (
                  <Chip label={fmtCountdown(current.minutesLeft)} background={C.yellow} />
                )}
              </View>

              <View style={styles.nowMiddle}>
                <View style={styles.nowBadge}>
                  <ActionIcon action={current.block.action} size={24} color={C.paper} />
                </View>
                <View style={{ flexShrink: 1 }}>
                  <Text style={styles.nowTitle} numberOfLines={1}>
                    {labelOf(current.block.action)}
                  </Text>
                  <Text style={styles.nowTime}>
                    {current.block.start} – {current.block.end}
                  </Text>
                </View>
              </View>

              <Text style={styles.nowDetail}>{current.block.detail}</Text>
              {showWhy && current.block.why ? (
                <Text style={styles.nowWhy}>because {current.block.why}</Text>
              ) : null}

              <View style={styles.nowActions}>
                {currentMark === null && (
                  <>
                    <BrutalButton
                      size="sm"
                      background={C.lime}
                      icon={<Feather name="check" size={14} color={C.ink} />}
                      onPress={() => onMark(current.block, "yes")}
                    >
                      did it
                    </BrutalButton>
                    <BrutalButton
                      size="sm"
                      background={C.paper}
                      icon={<Feather name="x" size={14} color={C.ink} />}
                      onPress={() => onMark(current.block, "no")}
                    >
                      skip
                    </BrutalButton>
                  </>
                )}
                {current.block.why ? (
                  <Pressable onPress={() => setShowWhy((v) => !v)} hitSlop={8}>
                    <Text style={styles.whyToggle}>{showWhy ? "hide why" : "why?"}</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </Card>
        )}

        {nexts.length > 0 && (
          <View style={styles.thenRow}>
            <Text style={styles.thenLabel}>then</Text>
            {nexts.slice(0, 5).map((n, i) => (
              <Text key={`${n.block.start}-${n.block.end}`} style={styles.thenItem}>
                <Text style={styles.thenTime}>{n.block.start} </Text>
                {labelOf(n.block.action)}
                {marks[refOf(n.block)] === "yes" ? " ✓" : ""}
                {i < Math.min(nexts.length, 5) - 1 ? "  ·  " : ""}
              </Text>
            ))}
            {nexts.length > 5 ? <Text style={styles.thenMore}>+{nexts.length - 5} more</Text> : null}
          </View>
        )}

        {expanded && (
          <View style={styles.expanded}>
            <View style={styles.expandedHead}>
              <Eyebrow color="rgba(33,23,19,0.5)">the whole day</Eyebrow>
              <View style={styles.viewToggle}>
                <GooeyToggle
                  options={[
                    { value: "plain", label: "plain" },
                    { value: "code", label: "mom.js" },
                  ]}
                  value={view}
                  onChange={(v) => setView((v as "plain" | "code") ?? "plain")}
                />
              </View>
            </View>

            {view === "plain" ? (
              <View style={{ gap: 14 }}>
                {classified.map((c) => (
                  <BlockCard
                    key={`${c.block.start}-${c.block.end}`}
                    block={c.block}
                    phase={c.phase === "current" ? "current" : "next"}
                    minutesLeft={c.minutesLeft}
                    mark={marks[refOf(c.block)] ?? null}
                    onMark={(f) => onMark(c.block, f)}
                  />
                ))}
                {past.length > 0 && (
                  <Pressable
                    onPress={() => setShowPast((v) => !v)}
                    style={styles.earlierBtn}
                    hitSlop={6}
                  >
                    <Text style={styles.earlierText}>
                      earlier today ({past.length}, {doneCount} done)
                    </Text>
                    <Feather name={showPast ? "chevron-up" : "chevron-down"} size={14} color={C.mute} />
                  </Pressable>
                )}
                {showPast &&
                  past.map((c) => (
                    <BlockCard
                      key={`past-${c.block.start}-${c.block.end}`}
                      block={c.block}
                      phase="next"
                      mark={marks[refOf(c.block)] ?? null}
                      onMark={(f) => onMark(c.block, f)}
                    />
                  ))}
              </View>
            ) : (
              <Card offset={4} radius={R.lg} bodyStyle={styles.codeBody}>
                <Text style={styles.codeComment}>{"// mom.js, " + plan.local_date}</Text>
                {plan.output.blocks.map((b) => (
                  <Text key={`${b.start}-${b.end}`} style={styles.codeLine}>
                    <Text style={styles.codeMute}>at {b.start}</Text> → {b.action}
                    {b.detail ? `("${b.detail}")` : ""}
                    {b.why ? <Text style={styles.codeWhy}>{` // ${b.why}`}</Text> : null}
                  </Text>
                ))}
                {plan.output.flags.length > 0 && (
                  <Text style={styles.codeFlag}>flags: {plan.output.flags.join(", ")}</Text>
                )}
              </Card>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function refOf(b: PlanBlock): string {
  return `${b.start}-${b.end}`;
}

function ActivityDots() {
  return <Feather name="loader" size={18} color={C.brown} />;
}

const styles = StyleSheet.create({
  wrap: { gap: 14, width: "100%" },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  fullDayBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  fullDayText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: C.mute,
  },
  noteRow: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
  noteText: { flex: 1, fontSize: 12, fontWeight: "700", color: C.brown, lineHeight: 17 },
  helpBody: { flexDirection: "row", gap: 10, padding: 16 },
  helpTitle: { fontSize: 14, fontWeight: "900", color: C.ink },
  helpText: { fontSize: 14, fontWeight: "600", marginTop: 4, lineHeight: 19, color: C.ink },
  flagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  busyBody: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16 },
  busyText: {
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: C.brown,
  },
  doneBody: { padding: 24, alignItems: "center" },
  doneTitle: { fontSize: 24, fontWeight: "900", color: C.ink },
  doneText: { fontSize: 14, fontWeight: "600", color: C.mute, marginTop: 4, textAlign: "center" },
  nowBody: { padding: 18 },
  nowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nowMiddle: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16 },
  nowBadge: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: R.md,
    backgroundColor: C.orange,
  },
  nowTitle: {
    fontSize: 26,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -0.8,
    color: C.ink,
  },
  nowTime: { fontSize: 12, fontWeight: "700", color: C.mute, marginTop: 2 },
  nowDetail: { marginTop: 12, fontSize: 15, fontWeight: "600", lineHeight: 21, color: C.ink },
  nowWhy: { marginTop: 6, fontSize: 12, fontWeight: "600", color: C.brown },
  nowActions: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" },
  whyToggle: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: C.mute,
  },
  thenRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 2,
    marginTop: 14,
  },
  thenLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: C.brown,
  },
  thenItem: { fontSize: 14, fontWeight: "700", color: C.ink },
  thenTime: { fontSize: 12, color: C.mute },
  thenMore: { fontSize: 12, fontWeight: "700", color: C.mute },
  expanded: { marginTop: 18, gap: 12 },
  expandedHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  viewToggle: { width: 176 },
  earlierBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  earlierText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: C.mute,
  },
  codeBody: { padding: 16 },
  codeComment: { fontFamily: FONT.mono, fontSize: 12, color: "rgba(33,23,19,0.4)", marginBottom: 6 },
  codeLine: { fontFamily: FONT.mono, fontSize: 13, lineHeight: 20, color: C.ink },
  codeMute: { color: C.mute },
  codeWhy: { color: C.brown },
  codeFlag: { fontFamily: FONT.mono, fontSize: 13, color: C.warn, marginTop: 8 },
});
