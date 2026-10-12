import Button from "@/components/ui/button";
import { getSession, setSession } from "@/lib/auth/session";
import {
    consumeUrlToken,
    getSessionUser,
    onAuthEvent,
    sendOtp,
    verifyOtpEmail,
} from "@/lib/auth/supabase";
import { getStorage } from "@/lib/storage";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import {
    AccessibilityInfo,
    Animated,
    BackHandler,
    Easing,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View,
    type StyleProp,
    type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Must match "Email OTP Length" in your Supabase auth settings. */
const OTP_LENGTH = 8;
const RESEND_SECONDS = 60;
const EMAIL_RE = /^\S+@\S+\.\S+$/;

const C = {
  cream: "#fff4dc",
  ink: "#211713",
  pink: "#ff4fa3",
  blue: "#5aa9ff",
  brown: "#8a5a3c",
  mute: "#5b4a40",
  white: "#ffffff",
  warn: "#d6342a",
};

/* --------------------------------- Hooks ---------------------------------- */

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(
      (v) => mounted && setReduce(v),
    );
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduce,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

/* ------------------------------- Primitives -------------------------------- */

function Enter({
  children,
  reduce,
  style,
}: {
  children: ReactNode;
  reduce: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;

  useEffect(() => {
    if (reduce) {
      v.setValue(1);
      return;
    }
    Animated.timing(v, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reduce, v]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [
            {
              translateY: v.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

function ShadowText({ children, size }: { children: string; size: number }) {
  const layers = [
    { x: 6, y: 6, color: C.blue },
    { x: 3, y: 3, color: C.pink },
  ];
  const textStyle = {
    fontSize: size,
    lineHeight: size * 0.95,
    letterSpacing: -size * 0.04,
    includeFontPadding: false,
    textTransform: "uppercase" as const,
  };

  return (
    <View
      style={{ paddingRight: 6, paddingBottom: 6, alignSelf: "flex-start" }}
    >
      {layers.map((l) => (
        <Text
          key={l.x}
          allowFontScaling={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="font-display font-bold"
          style={[
            textStyle,
            { position: "absolute", left: l.x, top: l.y, color: l.color },
          ]}
        >
          {children}
        </Text>
      ))}
      <Text
        allowFontScaling={false}
        accessibilityRole="header"
        className="font-display font-bold"
        style={[textStyle, { color: C.ink }]}
      >
        {children}
      </Text>
    </View>
  );
}

function BrutalField({
  focused,
  error,
  children,
}: {
  focused: boolean;
  error: boolean;
  children: ReactNode;
}) {
  return (
    <View style={{ marginRight: 4, marginBottom: 4 }}>
      <View
        style={{
          position: "absolute",
          top: 4,
          left: 4,
          right: -4,
          bottom: -4,
          borderRadius: 14,
          backgroundColor: error ? C.warn : focused ? C.pink : C.ink,
        }}
      />
      <View style={styles.field}>{children}</View>
    </View>
  );
}

/* ------------------------------- Code boxes -------------------------------- */

function CodeBoxes({
  value,
  length,
  focused,
  error,
  busy,
  shake,
  inputRef,
  onChange,
  onFocus,
  onBlur,
  onSubmit,
}: {
  value: string;
  length: number;
  focused: boolean;
  error: boolean;
  busy: boolean;
  shake: Animated.Value;
  inputRef: React.RefObject<TextInput | null>;
  onChange: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSubmit: () => void;
}) {
  return (
    <View>
      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          flexDirection: "row",
          gap: 8,
          justifyContent: "center",
          transform: [{ translateX: shake }],
        }}
      >
        {Array.from({ length }, (_, i) => {
          const active = focused && i === Math.min(value.length, length - 1);
          return (
            <View
              key={i}
              style={[
                styles.codeBox,
                active && styles.codeBoxActive,
                error && styles.codeBoxError,
              ]}
            >
              <Text allowFontScaling={false} style={styles.codeDigit}>
                {value[i] ?? ""}
              </Text>
            </View>
          );
        })}
      </Animated.View>

      {/* Invisible input over the boxes: tap anywhere, paste, and OS autofill all work. */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onSubmitEditing={onSubmit}
        editable={!busy}
        maxLength={length}
        keyboardType="number-pad"
        inputMode="numeric"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="done"
        caretHidden
        selectionColor="transparent"
        accessibilityLabel="Verification code"
        accessibilityHint={`Enter the ${length} digit code from your email`}
        style={styles.codeInput}
      />
    </View>
  );
}

/* ---------------------------------- Screen --------------------------------- */

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const reduce = useReduceMotion();
  const headlineSize = Math.min(Math.floor((width - 60) / 6.4), 64);

  const [stage, setStage] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [codeFocused, setCodeFocused] = useState(false);

  const finished = useRef(false);
  const busyRef = useRef(false);
  const emailRef = useRef("");
  const codeRef = useRef<TextInput>(null);
  const shake = useRef(new Animated.Value(0)).current;
  emailRef.current = email;

  const setWorking = (v: boolean) => {
    busyRef.current = v;
    setBusy(v);
  };

  const playShake = () => {
    if (reduce) return;
    shake.setValue(0);
    Animated.sequence(
      [10, -10, 8, -8, 4, 0].map((toValue) =>
        Animated.timing(shake, {
          toValue,
          duration: 50,
          useNativeDriver: true,
        }),
      ),
    ).start();
  };

  const fail = (message: string) => {
    setError(message);
    setNotice(null);
    playShake();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const finishLogin = useCallback(async (userId: string, userEmail: string) => {
    if (finished.current) return;
    finished.current = true;
    await setSession({
      userId,
      email: userEmail || emailRef.current,
      mode: "supabase",
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const profile = await getStorage().getProfile(userId);
      router.replace(profile ? "/home" : "/onboarding");
    } catch {
      router.replace("/onboarding");
    }
  }, []);

  /* Session check, auth events, and magic link deep links */
  useEffect(() => {
    let cancelled = false;
    let cleanupAuth: (() => void) | undefined;
    let linkSub: { remove: () => void } | undefined;

    const handleUrl = async (url: string | null) => {
      if (!url) return;
      try {
        const ok = await consumeUrlToken(url);
        if (!ok) return;
        const user = await getSessionUser();
        if (user) await finishLogin(user.id, user.email ?? emailRef.current);
      } catch {
        setError("That link did not work. Request a new one.");
      }
    };

    (async () => {
      if (await getSession()) {
        router.replace("/home");
        return;
      }
      if (cancelled) return;

      cleanupAuth = onAuthEvent((_event, session) => {
        if (!session) return;
        // Finish outside the callback. finishLogin reads the profile, which reads the auth
        // token, and calling back into the auth client from inside onAuthStateChange can
        // deadlock, leaving the user stuck on this screen with no error.
        const { id, email: userEmail } = session.user;
        queueMicrotask(
          () => void finishLogin(id, userEmail ?? emailRef.current),
        );
      });

      linkSub = Linking.addEventListener(
        "url",
        ({ url }) => void handleUrl(url),
      );
      void handleUrl(await Linking.getInitialURL());
    })();

    return () => {
      cancelled = true;
      cleanupAuth?.();
      linkSub?.remove();
    };
  }, [finishLogin]);

  /* Resend countdown: one timeout per tick, so nothing can stack or outlive the screen */
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  /* Focus the code field once the stage transition settles */
  useEffect(() => {
    if (stage !== "code") return;
    const t = setTimeout(() => codeRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [stage]);

  const goBackToEmail = useCallback(() => {
    setStage("email");
    setCode("");
    setError(null);
    setNotice(null);
  }, []);

  /* Android hardware back steps back through the flow instead of leaving it */
  useEffect(() => {
    if (stage !== "code") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      goBackToEmail();
      return true;
    });
    return () => sub.remove();
  }, [stage, goBackToEmail]);

  const sendCode = async () => {
    if (busyRef.current) return;
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      fail("That email looks off. Check for typos.");
      return;
    }
    setError(null);
    setWorking(true);
    try {
      await sendOtp(trimmed);
      setEmail(trimmed);
      setCode("");
      setStage("code");
      setResendIn(RESEND_SECONDS);
      setNotice("Sent. Check your inbox (and spam, honestly).");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      fail(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setWorking(false);
    }
  };

  const confirm = async (value: string) => {
    if (busyRef.current) return;
    const token = value.replace(/\D/g, "");
    if (token.length !== OTP_LENGTH) {
      fail(`Codes are ${OTP_LENGTH} digits.`);
      return;
    }
    setError(null);
    setWorking(true);
    try {
      const trimmed = email.trim().toLowerCase();
      const userId = await verifyOtpEmail(trimmed, token);
      await finishLogin(userId, trimmed);
    } catch (e) {
      fail(e instanceof Error ? e.message : "Wrong code? Try again.");
      setCode("");
      codeRef.current?.focus();
    } finally {
      setWorking(false);
    }
  };

  const onCodeChange = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setCode(digits);
    if (error) setError(null);
    if (digits.length === OTP_LENGTH) void confirm(digits);
  };

  const openMail = () => {
    void Linking.openURL("message://").catch(() => {});
  };

  const showBack = stage === "code" || router.canGoBack();
  const onBack = () => (stage === "code" ? goBackToEmail() : router.back());

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View pointerEvents="none" style={styles.blob} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            {showBack && (
              <Pressable
                onPress={onBack}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Back"
                style={({ pressed }) => [
                  styles.backBtn,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Feather name="arrow-left" size={24} color={C.ink} />
              </Pressable>
            )}
          </View>

          <Enter key={stage} reduce={reduce} style={styles.body}>
            {stage === "email" ? (
              <>
                <ShadowText size={headlineSize}>{"Welcome\nback?"}</ShadowText>
                <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
                  No passwords. We will email you a code and a one tap link.
                </Text>

                <Text style={styles.label} maxFontSizeMultiplier={1.2}>
                  email
                </Text>
                <Animated.View style={{ transform: [{ translateX: shake }] }}>
                  <BrutalField focused={emailFocused} error={!!error}>
                    <TextInput
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        if (error) setError(null);
                      }}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      onSubmitEditing={() => void sendCode()}
                      editable={!busy}
                      autoFocus
                      placeholder="you@hostel.life"
                      placeholderTextColor="rgba(33, 23, 19, 0.38)"
                      keyboardType="email-address"
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect={false}
                      spellCheck={false}
                      autoComplete="email"
                      textContentType="emailAddress"
                      returnKeyType="go"
                      enablesReturnKeyAutomatically
                      selectionColor={C.pink}
                      accessibilityLabel="Email address"
                      style={styles.input}
                    />
                  </BrutalField>
                </Animated.View>
                <Text
                  accessibilityLiveRegion="polite"
                  style={[styles.status, { color: C.warn }]}
                  maxFontSizeMultiplier={1.3}
                >
                  {error ?? ""}
                </Text>
              </>
            ) : (
              <>
                <ShadowText size={headlineSize}>
                  {"Check your\ninbox"}
                </ShadowText>
                <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
                  We sent a {OTP_LENGTH} digit code to{"\n"}
                  <Text style={{ fontWeight: "800", color: C.ink }}>
                    {email}
                  </Text>
                </Text>

                <View style={{ marginTop: 28 }}>
                  <CodeBoxes
                    value={code}
                    length={OTP_LENGTH}
                    focused={codeFocused}
                    error={!!error}
                    busy={busy}
                    shake={shake}
                    inputRef={codeRef}
                    onChange={onCodeChange}
                    onFocus={() => setCodeFocused(true)}
                    onBlur={() => setCodeFocused(false)}
                    onSubmit={() => void confirm(code)}
                  />
                </View>

                <Text
                  accessibilityLiveRegion="polite"
                  style={[styles.status, { color: error ? C.warn : C.mute }]}
                  maxFontSizeMultiplier={1.3}
                >
                  {error ?? notice ?? ""}
                </Text>

                <View style={styles.hint}>
                  <Feather
                    name="mail"
                    size={18}
                    color={C.brown}
                    style={{ marginTop: 2 }}
                  />
                  <Text style={styles.hintText} maxFontSizeMultiplier={1.3}>
                    Easiest: open the email on this phone and tap the button.
                    This screen picks you up automatically.
                  </Text>
                </View>

                {Platform.OS === "ios" && (
                  <Pressable
                    onPress={openMail}
                    accessibilityRole="button"
                    accessibilityLabel="Open the Mail app"
                    style={({ pressed }) => [
                      styles.mailPill,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Text
                      style={styles.mailPillText}
                      maxFontSizeMultiplier={1.2}
                    >
                      Open Mail
                    </Text>
                    <Feather name="external-link" size={14} color={C.ink} />
                  </Pressable>
                )}
              </>
            )}
          </Enter>

          <View style={styles.footer}>
            {stage === "email" ? (
              <>
                <Button className="w-full" onPress={() => void sendCode()}>
                  {busy ? "SENDING..." : "CHECK IN"}
                </Button>
                <Text style={styles.fine} maxFontSizeMultiplier={1.2}>
                  Mom.exe is a wellness coach, not medical advice. your nickname and
                  notes reach mom’s mind so she can plan your day.
                </Text>
              </>
            ) : (
              <>
                <Button className="w-full" onPress={() => void confirm(code)}>
                  {busy ? "CHECKING..." : "ENTER"}
                </Button>
                <View style={styles.linksRow}>
                  <Pressable
                    disabled={resendIn > 0 || busy}
                    onPress={() => void sendCode()}
                    accessibilityRole="button"
                    style={styles.linkBtn}
                  >
                    <Text
                      maxFontSizeMultiplier={1.2}
                      style={[
                        styles.link,
                        (resendIn > 0 || busy) && { opacity: 0.45 },
                      ]}
                    >
                      {resendIn > 0
                        ? `Resend in ${resendIn}s`
                        : "Send it again"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={goBackToEmail}
                    accessibilityRole="button"
                    style={styles.linkBtn}
                  >
                    <Text style={styles.link} maxFontSizeMultiplier={1.2}>
                      Wrong email?
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.cream,
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 9999,
    top: -120,
    right: -120,
    backgroundColor: C.pink,
    opacity: 0.18,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  topBar: {
    height: 48,
    justifyContent: "center",
  },
  backBtn: {
    width: 44,
    height: 44,
    marginLeft: -10,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    paddingTop: 8,
  },
  subtitle: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
    color: C.mute,
  },
  label: {
    marginTop: 28,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: C.brown,
  },
  field: {
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 14,
    backgroundColor: C.white,
  },
  input: {
    height: 56,
    paddingHorizontal: 16,
    paddingVertical: 0,
    fontSize: 17,
    fontWeight: "600",
    color: C.ink,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  status: {
    minHeight: 20,
    marginTop: 12,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  codeBox: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 52,
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 12,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  codeBoxActive: {
    borderColor: C.pink,
  },
  codeBoxError: {
    borderColor: C.warn,
  },
  codeDigit: {
    fontSize: 22,
    fontWeight: "800",
    color: C.ink,
    includeFontPadding: false,
  },
  codeInput: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: "transparent",
    backgroundColor: "transparent",
  },
  hint: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    paddingRight: 8,
  },
  hintText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: C.mute,
  },
  mailPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    minHeight: 44,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 9999,
    backgroundColor: C.white,
  },
  mailPillText: {
    fontSize: 13,
    fontWeight: "800",
    color: C.ink,
  },
  footer: {
    paddingTop: 16,
    gap: 6,
  },
  fine: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    textAlign: "center",
    color: "rgba(33, 23, 19, 0.62)",
  },
  linksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  linkBtn: {
    minHeight: 44,
    justifyContent: "center",
  },
  link: {
    fontSize: 14,
    fontWeight: "700",
    color: C.mute,
    textDecorationLine: "underline",
  },
});
