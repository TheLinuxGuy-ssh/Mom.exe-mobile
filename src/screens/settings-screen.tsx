import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";

import { ConfirmDialog } from "@/components/mom/confirm-dialog";
import { BrutalButton, Card, Eyebrow } from "@/components/mom/primitives";
import { AppScreen } from "@/components/mom/screen";
import { TimeSelect } from "@/components/mom/time-select";
import { TimezoneSelect } from "@/components/mom/timezone-select";
import { BORDER, C, R } from "@/constants/mom";
import { clearSession, getSession, type Session } from "@/lib/auth/session";
import { signOut as supabaseSignOut } from "@/lib/auth/supabase";
import { isValidTimezone } from "@/lib/engine/time";
import { getStorage } from "@/lib/storage";
import type { Profile } from "@/lib/storage/types";
import { toast } from "@/lib/ui/toast";

/**
 * Kitchen settings. The demo-data seeder from the web build is deliberately left out: it lives in
 * a dev fixture the app does not ship, and loading it would replace a real account's history.
 */
export default function SettingsScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [askWipe, setAskWipe] = useState(false);
  const [askSignOut, setAskSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getSession();
      if (!s) {
        router.replace("/login");
        return;
      }
      setSession(s);
      const p = await getStorage()
        .getProfile(s.userId)
        .catch(() => null);
      setProfile(p);
      if (!p) toast("could not load your profile. check your connection.", "warn");
    })();
  }, []);

  const patch = (p: Partial<Profile>) => setProfile((prev) => (prev ? { ...prev, ...p } : prev));

  async function save() {
    if (!session || !profile || saving) return;
    if (!isValidTimezone(profile.timezone)) {
      toast(`"${profile.timezone}" is not a timezone. try Asia/Kolkata.`, "warn");
      return;
    }
    setSaving(true);
    try {
      const { id: _id, created_at: _c, ...input } = profile;
      await getStorage().saveProfile(session.userId, input);
      toast("profile saved");
    } catch (err) {
      console.error(err);
      toast("could not save. try again.", "warn");
    } finally {
      setSaving(false);
    }
  }

  async function applyTimezone(timezone: string) {
    if (!session || !profile) return;
    const next = { ...profile, timezone };
    setProfile(next);
    try {
      const { id: _id, created_at: _c, ...input } = next;
      await getStorage().saveProfile(session.userId, input);
      toast(`timezone set to ${timezone}`);
    } catch (err) {
      console.error(err);
      toast("could not save timezone. try again.", "warn");
    }
  }

  async function exportData() {
    if (!session || exporting) return;
    setExporting(true);
    try {
      const storage = getStorage();
      const data = {
        profile: await storage.getProfile(session.userId),
        checkins: await storage.listCheckins(session.userId, "1970-01-01"),
        plans: await storage.listPlans(session.userId, 1000),
      };
      await Share.share({ message: JSON.stringify(data, null, 2), title: "mom-exe-export.json" });
      toast("exported");
    } catch (err) {
      console.error(err);
      toast("export failed. try again.", "warn");
    } finally {
      setExporting(false);
    }
  }

  async function signOut() {
    setAskSignOut(false);
    setSigningOut(true);
    try {
      await supabaseSignOut();
    } catch (err) {
      console.error(err);
    } finally {
      setSigningOut(false);
      await clearSession();
      router.replace("/");
    }
  }

  async function wipe() {
    if (!session) return;
    setWiping(true);
    try {
      await getStorage().deleteAll(session.userId);
      toast("wiped. fresh start.");
      router.replace("/onboarding");
    } catch (err) {
      console.error(err);
      toast("wipe failed, nothing changed");
      setWiping(false);
    }
  }

  return (
    <AppScreen edges={["top"]} blobs={false} background="transparent">
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Kitchen settings</Text>

        {profile ? (
          <Card radius={R.lg} offset={4} bodyStyle={styles.card}>
            <Text style={styles.sectionTitle}>profile</Text>
            <View style={styles.row}>
              <Field label="name" style={{ flex: 1 }}>
                <TextInput
                  value={profile.display_name}
                  onChangeText={(v) => patch({ display_name: v })}
                  style={styles.field}
                />
              </Field>
              <Field label="timezone" style={{ flex: 1 }}>
                <TimezoneSelect value={profile.timezone} onPick={(tz) => void applyTimezone(tz)} />
              </Field>
            </View>
            <View style={styles.row}>
              <Field label="target bed" style={{ flex: 1 }}>
                <TimeSelect value={profile.target_bed} onPick={(v) => patch({ target_bed: v })} />
              </Field>
              <Field label="target wake" style={{ flex: 1 }}>
                <TimeSelect value={profile.target_wake} onPick={(v) => patch({ target_wake: v })} />
              </Field>
              <Field label="class starts" style={{ flex: 1 }}>
                <TimeSelect value={profile.class_start} onPick={(v) => patch({ class_start: v })} />
              </Field>
            </View>
            <Field label="caffeine">
              <View style={styles.choiceWrap}>
                {(
                  [
                    ["none", "nope"],
                    ["low", "sometimes"],
                    ["high_late", "yes, after 8pm"],
                  ] as const
                ).map(([v, l]) => {
                  const active = profile.caffeine === v;
                  return (
                    <Pressable
                      key={v}
                      onPress={() => patch({ caffeine: v })}
                      style={[styles.choice, active ? styles.choiceActive : null]}
                    >
                      <Text style={[styles.choiceText, active ? { color: C.paper } : null]}>{l}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>
            <View style={styles.btnRow}>
              <BrutalButton size="sm" background={C.lime} disabled={saving} onPress={() => void save()}>
                {saving ? "saving..." : "save profile"}
              </BrutalButton>
              <BrutalButton size="sm" background={C.paper} onPress={() => router.replace("/onboarding")}>
                full setup again
              </BrutalButton>
            </View>
          </Card>
        ) : (
          <Text style={styles.loading}>loading profile...</Text>
        )}

        <Card radius={R.lg} offset={4} bodyStyle={styles.card}>
          <Text style={styles.sectionTitle}>your data</Text>
          <View style={styles.btnRow}>
            <BrutalButton
              size="sm"
              background={C.paper}
              disabled={exporting}
              onPress={() => void exportData()}
              icon={<Feather name="download" size={14} color={C.ink} />}
            >
              export json
            </BrutalButton>
            <BrutalButton
              size="sm"
              background={C.pink}
              textColor={C.paper}
              disabled={wiping}
              onPress={() => setAskWipe(true)}
              icon={<Feather name="trash-2" size={14} color={C.paper} />}
            >
              wipe everything
            </BrutalButton>
          </View>
        </Card>

        <Card radius={R.lg} offset={4} bodyStyle={styles.card}>
          <Text style={styles.sectionTitle}>account</Text>
          {session?.email ? (
            <Text style={styles.accountEmail} numberOfLines={1}>
              signed in as {session.email}
            </Text>
          ) : null}
          <View style={styles.btnRow}>
            <BrutalButton
              size="sm"
              background={C.ink}
              textColor={C.paper}
              disabled={signingOut}
              onPress={() => setAskSignOut(true)}
              icon={<Feather name="log-out" size={14} color={C.paper} />}
            >
              {signingOut ? "logging out..." : "log out"}
            </BrutalButton>
          </View>
        </Card>

        <Text style={styles.fine}>
          Mom.exe is a wellness coach, not medical advice. anonymized context (no name, email or birth
          date) is sent to an open-weight model. MIT licensed.
        </Text>

        <Eyebrow color="rgba(33,23,19,0.4)">wellness coach, not medical advice</Eyebrow>
      </ScrollView>

      <ConfirmDialog
        open={askWipe}
        title="wipe everything?"
        tone="danger"
        confirmLabel="wipe it all"
        busy={wiping}
        onConfirm={() => void wipe()}
        onCancel={() => setAskWipe(false)}
      >
        <Text style={styles.confirmText}>
          This deletes every check-in and plan on this account and sends you back to setup. There is no
          undo, so export your data first if you want a copy.
        </Text>
      </ConfirmDialog>

      <ConfirmDialog
        open={askSignOut}
        title="log out?"
        confirmLabel="log out"
        busy={signingOut}
        onConfirm={() => void signOut()}
        onCancel={() => setAskSignOut(false)}
      >
        <Text style={styles.confirmText}>Your check-ins and plans will be here when you return.</Text>
      </ConfirmDialog>
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

const styles = StyleSheet.create({
  scroll: { padding: 18, paddingBottom: 150, gap: 18 },
  title: { fontSize: 26, fontWeight: "900", textTransform: "uppercase", letterSpacing: -0.8, color: C.ink },
  accountEmail: { fontSize: 14, fontWeight: "700", color: C.mute },
  card: { padding: 20, gap: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: C.brown,
  },
  row: { flexDirection: "row", gap: 12 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: C.brown,
  },
  field: {
    borderWidth: BORDER,
    borderColor: C.ink,
    borderRadius: R.md,
    backgroundColor: C.paper,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: "600",
    color: C.ink,
  },
  choiceWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: BORDER,
    borderColor: C.ink,
    borderRadius: R.md,
    backgroundColor: C.paper,
  },
  choiceActive: { backgroundColor: C.orange },
  choiceText: { fontSize: 13, fontWeight: "800", color: C.ink },
  btnRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  loading: { fontSize: 14, fontWeight: "700", color: C.mute },
  fine: { fontSize: 11, fontWeight: "600", color: C.mute, textAlign: "center", lineHeight: 16 },
  confirmText: { fontSize: 15, fontWeight: "600", color: C.ink, lineHeight: 21 },
});
