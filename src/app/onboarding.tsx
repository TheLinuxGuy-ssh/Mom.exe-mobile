import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Mascot } from "@/components/mom/mascot";
import { BrutalButton, Card } from "@/components/mom/primitives";
import { AppScreen } from "@/components/mom/screen";
import { TimeSelect } from "@/components/mom/time-select";
import { TimezoneSelect } from "@/components/mom/timezone-select";
import { BORDER, C, R } from "@/constants/mom";
import { getSession } from "@/lib/auth/session";
import { getStorage } from "@/lib/storage";
import type { Chrono, ProfileInput, Roommates } from "@/lib/storage/types";
import { toast } from "@/lib/ui/toast";

const STEPS = ["you", "age", "body", "class", "sleep", "people", "food", "caffeine"] as const;

const STEP_LABELS: Record<(typeof STEPS)[number], { title: string; hint: string }> = {
  you: { title: "FIRST, A NAME (OR NOT)", hint: "what should mom call you? any nickname works." },
  age: { title: "WHICH BATCH ARE YOU?", hint: "birth year is enough. the AI only ever sees your age band." },
  body: { title: "OPTIONAL STUFF", hint: "height and weight, only if you want. no calorie talk, ever." },
  class: { title: "WHEN IS CLASS?", hint: "usual first class start time." },
  sleep: { title: "BED TIME. YES, AN ACTUAL TIME.", hint: "targets, not demands." },
  people: { title: "ROOM SITUATION", hint: "be honest, this changes the advice." },
  food: { title: "MESS + FOOD", hint: "mess windows shape the meal blocks." },
  caffeine: { title: "LAST ONE. CAFFEINE?", hint: "mom is judging, gently." },
};

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<ProfileInput>({
    display_name: "",
    birth_year: null,
    height_cm: null,
    weight_kg: null,
    class_start: "09:00",
    target_bed: "23:30",
    target_wake: "07:00",
    chronotype: "night",
    roommates: "shared_noisy",
    mess: { breakfast: "07:30-09:30", lunch: "12:30-14:30", dinner: "19:30-21:30" },
    diet_pref: "veg",
    allergies: [],
    caffeine: "low",
    timezone: "Asia/Kolkata",
  });
  const [allergiesText, setAllergiesText] = useState("");
  const [birthYearText, setBirthYearText] = useState("");
  const [heightText, setHeightText] = useState("");
  const [weightText, setWeightText] = useState("");

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      try {
        setDraft((d) => ({ ...d, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
      } catch {
        /* keep the default timezone */
      }
    })();
  }, []);

  const patch = (p: Partial<ProfileInput>) => setDraft((d) => ({ ...d, ...p }));

  function next() {
    if (step === 0 && !draft.display_name.trim()) patch({ display_name: "beta" });
    if (step === 1) patch({ birth_year: birthYearText ? Number(birthYearText) : null });
    if (step === 2) patch({ height_cm: heightText ? Number(heightText) : null, weight_kg: weightText ? Number(weightText) : null });
    if (step === 6) patch({ allergies: allergiesText.split(",").map((s) => s.trim()).filter(Boolean) });
    if (step < STEPS.length - 1) setStep(step + 1);
  }

  async function finish() {
    const allergies = allergiesText.split(",").map((s) => s.trim()).filter(Boolean);
    const session = await getSession();
    if (!session) return;
    setSaving(true);
    try {
      await getStorage().saveProfile(session.userId, { ...draft, allergies });
      toast("all set. she remembers now.");
      router.replace("/home");
    } catch (e) {
      toast(e instanceof Error ? e.message : "could not save", "warn");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.dots}>
          {STEPS.map((s, i) => (
            <Pressable
              key={s}
              onPress={() => setStep(i)}
              accessibilityLabel={s}
              style={[
                styles.dot,
                i === step ? styles.dotActive : i < step ? styles.dotPast : styles.dotFuture,
              ]}
            />
          ))}
        </View>

        <Card radius={R.lg} offset={5} bodyStyle={styles.card}>
          <View>
            <Text style={styles.eyebrow}>
              setup, {step + 1} of {STEPS.length}
            </Text>
            <Text style={styles.title}>{STEP_LABELS[STEPS[step]].title}</Text>
            <Text style={styles.hint}>{STEP_LABELS[STEPS[step]].hint}</Text>
          </View>

          {step === 0 && (
            <TextInput
              value={draft.display_name}
              onChangeText={(v) => patch({ display_name: v })}
              placeholder="what should mom call you?"
              placeholderTextColor="rgba(33,23,19,0.35)"
              style={styles.field}
            />
          )}

          {step === 1 && (
            <TextInput
              value={birthYearText}
              onChangeText={setBirthYearText}
              keyboardType="number-pad"
              placeholder="e.g. 2004"
              placeholderTextColor="rgba(33,23,19,0.35)"
              style={styles.field}
            />
          )}

          {step === 2 && (
            <View style={styles.row}>
              <TextInput
                value={heightText}
                onChangeText={setHeightText}
                keyboardType="number-pad"
                placeholder="height cm (optional)"
                placeholderTextColor="rgba(33,23,19,0.35)"
                style={[styles.field, { flex: 1 }]}
              />
              <TextInput
                value={weightText}
                onChangeText={setWeightText}
                keyboardType="number-pad"
                placeholder="weight kg (optional)"
                placeholderTextColor="rgba(33,23,19,0.35)"
                style={[styles.field, { flex: 1 }]}
              />
            </View>
          )}

          {step === 3 && (
            <Field label="first class starts">
              <TimeSelect value={draft.class_start} onPick={(v) => patch({ class_start: v })} />
            </Field>
          )}

          {step === 4 && (
            <View style={styles.row}>
              <Field label="target bed" style={{ flex: 1 }}>
                <TimeSelect value={draft.target_bed} onPick={(v) => patch({ target_bed: v })} />
              </Field>
              <Field label="target wake" style={{ flex: 1 }}>
                <TimeSelect value={draft.target_wake} onPick={(v) => patch({ target_wake: v })} />
              </Field>
            </View>
          )}

          {step === 5 && (
            <View style={{ gap: 16 }}>
              <Choice
                label="you are a..."
                options={[
                  ["morning", "morning person"],
                  ["neutral", "depends"],
                  ["night", "night owl"],
                ]}
                value={draft.chronotype}
                onPick={(v) => patch({ chronotype: v as Chrono })}
              />
              <Choice
                label="room situation"
                options={[
                  ["own_room", "own room"],
                  ["shared_quiet", "shared, quiet"],
                  ["shared_noisy", "shared, loud"],
                ]}
                value={draft.roommates}
                onPick={(v) => patch({ roommates: v as Roommates })}
              />
            </View>
          )}

          {step === 6 && (
            <View style={{ gap: 12 }}>
              {(["breakfast", "lunch", "dinner"] as const).map((k) => (
                <Field key={k} label={`${k} window`}>
                  <TextInput
                    value={draft.mess[k]}
                    onChangeText={(v) => patch({ mess: { ...draft.mess, [k]: v } })}
                    placeholder="07:30-09:30"
                    placeholderTextColor="rgba(33,23,19,0.35)"
                    style={styles.field}
                  />
                </Field>
              ))}
              <View style={styles.row}>
                <Field label="diet" style={{ flex: 1 }}>
                  <Choice
                    options={[
                      ["veg", "veg"],
                      ["non-veg", "non-veg"],
                      ["eggetarian", "egg"],
                      ["anything", "any"],
                    ]}
                    value={draft.diet_pref}
                    onPick={(v) => patch({ diet_pref: v })}
                  />
                </Field>
                <Field label="allergies" style={{ flex: 1 }}>
                  <TextInput
                    value={allergiesText}
                    onChangeText={setAllergiesText}
                    placeholder="peanuts, none..."
                    placeholderTextColor="rgba(33,23,19,0.35)"
                    style={styles.field}
                  />
                </Field>
              </View>
            </View>
          )}

          {step === 7 && (
            <View style={{ gap: 12 }}>
              <Choice
                label="coffee / chai at night?"
                options={[
                  ["none", "nope"],
                  ["low", "sometimes"],
                  ["high_late", "yes, after 8pm"],
                ]}
                value={draft.caffeine}
                onPick={(v) => patch({ caffeine: v as ProfileInput["caffeine"] })}
              />
              <Field label="timezone">
                <TimezoneSelect value={draft.timezone} onPick={(v) => patch({ timezone: v })} />
              </Field>
            </View>
          )}

          <View style={styles.nav}>
            <View style={{ opacity: step === 0 ? 0 : 1 }}>
              <BrutalButton
                background={C.paper}
                size="sm"
                disabled={step === 0}
                onPress={() => setStep(Math.max(0, step - 1))}
                icon={<Feather name="arrow-left" size={14} color={C.ink} />}
              >
                back
              </BrutalButton>
            </View>
            {step < STEPS.length - 1 ? (
              <BrutalButton
                background={C.lime}
                size="sm"
                onPress={next}
                icon={<Feather name="arrow-right" size={14} color={C.ink} />}
              >
                next
              </BrutalButton>
            ) : (
              <BrutalButton
                background={C.orange}
                textColor={C.paper}
                size="sm"
                disabled={saving}
                onPress={() => void finish()}
              >
                {saving ? "saving..." : "let her in"}
              </BrutalButton>
            )}
          </View>
        </Card>

        <Text style={styles.fine}>
          You do not need to log anything to start. Mom.exe plans from your setup answers alone. It
          is a wellness coach, not medical advice.
        </Text>

        {step === 0 && (
          <View style={{ alignItems: "center" }}>
            <Mascot size={160} labels={false} />
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Choice({
  label,
  options,
  value,
  onPick,
}: {
  label?: string;
  options: [string, string][];
  value: string;
  onPick: (v: string) => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={styles.fieldLabel}>{label}</Text>}
      <View style={styles.choiceWrap}>
        {options.map(([v, l]) => {
          const active = value === v;
          return (
            <Pressable
              key={v}
              onPress={() => onPick(v)}
              style={[styles.choice, active ? styles.choiceActive : null]}
            >
              <Text style={[styles.choiceText, active ? { color: C.paper } : null]}>{l}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 18, paddingBottom: 60, gap: 20 },
  dots: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: BORDER, borderColor: C.ink },
  dotActive: { backgroundColor: C.orange, transform: [{ scale: 1.25 }] },
  dotPast: { backgroundColor: C.ink },
  dotFuture: { backgroundColor: C.paper },
  card: { padding: 24, gap: 18 },
  eyebrow: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: C.brown,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -1,
    lineHeight: 32,
    marginTop: 8,
    color: C.ink,
  },
  hint: { fontSize: 14, fontWeight: "600", color: C.mute, marginTop: 8 },
  field: {
    borderWidth: BORDER,
    borderColor: C.ink,
    borderRadius: R.md,
    backgroundColor: C.paper,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "600",
    color: C.ink,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: C.brown,
  },
  row: { flexDirection: "row", gap: 12 },
  choiceWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: BORDER,
    borderColor: C.ink,
    borderRadius: R.md,
    backgroundColor: C.paper,
  },
  choiceActive: { backgroundColor: C.orange },
  choiceText: { fontSize: 13, fontWeight: "800", textTransform: "lowercase", color: C.ink },
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 4 },
  fine: { fontSize: 11, fontWeight: "600", color: C.mute, textAlign: "center", paddingHorizontal: 12 },
});
