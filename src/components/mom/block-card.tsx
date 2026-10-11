import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { ActionIcon } from "@/components/mom/action-icon";
import { BrutalButton, Card, Chip } from "@/components/mom/primitives";
import { C, R } from "@/constants/mom";
import { ACTION_LABEL, type Action } from "@/lib/engine/actions";
import type { PlanBlock } from "@/lib/storage/types";

/** One block in the "full day" list. Current block gets the orange treatment and a countdown. */
export function BlockCard({
  block,
  phase,
  minutesLeft = 0,
  mark = null,
  onMark,
}: {
  block: PlanBlock;
  phase: "current" | "next";
  minutesLeft?: number;
  mark?: "yes" | "no" | null;
  onMark?: (followed: "yes" | "no") => void;
}) {
  const label = ACTION_LABEL[block.action as Action] ?? block.action;
  const faded = mark === "yes" ? 0.65 : mark === "no" ? 0.5 : phase === "current" ? 1 : 0.85;

  return (
    <Card offset={4} radius={R.lg} style={{ opacity: faded }}>
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.left}>
            <View style={[styles.badge, { backgroundColor: phase === "current" ? C.orange : C.paper }]}>
              <ActionIcon action={block.action} color={phase === "current" ? C.paper : C.ink} />
            </View>
            <View style={styles.titleWrap}>
              <Text style={styles.title} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                {label}
              </Text>
              <Text style={styles.time} maxFontSizeMultiplier={1.2}>
                {block.start} - {block.end}
              </Text>
            </View>
          </View>
          {phase === "current" ? (
            <Chip label={minutesLeft > 0 ? `${minutesLeft} min left` : "wrapping up"} background={C.yellow} />
          ) : mark === "yes" ? (
            <Chip label="done" icon={<Feather name="check" size={12} color={C.ink} />} background={C.lime} />
          ) : null}
        </View>

        <Text style={styles.detail} maxFontSizeMultiplier={1.3}>
          {block.detail}
        </Text>
        {block.why ? (
          <Text style={styles.why} maxFontSizeMultiplier={1.3}>
            because {block.why}
          </Text>
        ) : null}

        {onMark && mark === null ? (
          <View style={styles.actions}>
            <BrutalButton
              size="sm"
              background={phase === "current" ? C.lime : C.paper}
              icon={<Feather name="check" size={14} color={C.ink} />}
              onPress={() => onMark("yes")}
            >
              done
            </BrutalButton>
            <BrutalButton
              size="sm"
              background={C.paper}
              icon={<Feather name="x" size={14} color={C.ink} />}
              onPress={() => onMark("no")}
            >
              skip
            </BrutalButton>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: 16,
  },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  badge: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: R.md,
  },
  titleWrap: { flexShrink: 1 },
  title: {
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -0.2,
    color: C.ink,
  },
  time: {
    fontSize: 12,
    fontWeight: "700",
    color: C.mute,
    marginTop: 1,
  },
  detail: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 21,
    color: C.ink,
  },
  why: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: C.brown,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
});
