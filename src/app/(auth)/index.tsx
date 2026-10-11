import Button from "@/components/ui/button";
import { DotLottie as DotLottieNative } from "@lottiefiles/dotlottie-react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  cream: "#fff4dc",
  ink: "#211713",
  pink: "#ff4fa3",
  blue: "#5aa9ff",
  brown: "#8a5a3c",
  mute: "#5b4a40",
  white: "#ffffff",
};

const MOM_LINES = [
  "Eat something. Please.",
  "Sleep by 11:30.",
  "Mess closes at 9:30.",
  "Did you drink water?",
  "Call home sometimes.",
  "Deadline tomorrow, beta.",
];

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

function Reveal({
  children,
  delay = 0,
  reduce,
  style,
}: {
  children: ReactNode;
  delay?: number;
  reduce: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce) {
      v.setValue(1);
      return;
    }
    Animated.timing(v, {
      toValue: 1,
      duration: 480,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reduce, delay, v]);

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
                outputRange: [16, 0],
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

type ShadowLayer = { x: number; y: number; color: string };

function ShadowText({
  children,
  size,
  layers,
}: {
  children: string;
  size: number;
  layers: ShadowLayer[]; // farthest first
}) {
  const padX = Math.max(...layers.map((l) => l.x));
  const padY = Math.max(...layers.map((l) => l.y));

  const textStyle = {
    fontSize: size,
    lineHeight: size * 0.92,
    letterSpacing: -size * 0.04,
    includeFontPadding: false,
    textTransform: "uppercase" as const,
  };

  return (
    <View
      style={{
        paddingRight: padX,
        paddingBottom: padY,
        alignSelf: "flex-start",
      }}
    >
      {layers.map((l) => (
        <Text
          key={`${l.x}-${l.y}`}
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

function MomBubble({ lines, reduce }: { lines: string[]; reduce: boolean }) {
  const [index, setIndex] = useState(0);
  const v = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const id = setInterval(() => {
      if (reduce) {
        setIndex((p) => (p + 1) % lines.length);
        return;
      }
      Animated.timing(v, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        setIndex((p) => (p + 1) % lines.length);
        Animated.timing(v, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.back(1.6)),
          useNativeDriver: true,
        }).start();
      });
    }, 3200);
    return () => clearInterval(id);
  }, [lines.length, reduce, v]);

  return (
    <View
      pointerEvents="none"
      style={styles.bubbleWrap}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.bubbleShadow} />
      <Animated.View
        style={[
          styles.bubble,
          {
            opacity: v,
            transform: [
              {
                scale: v.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.94, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Text
          style={styles.bubbleText}
          numberOfLines={2}
          maxFontSizeMultiplier={1.2}
        >
          {lines[index]}
        </Text>
        <View style={styles.bubbleTail} />
      </Animated.View>
    </View>
  );
}

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const reduce = useReduceMotion();

  // Headline scales with both width and height so short phones never overflow.
  const headlineSize = Math.round(Math.min(width * 0.25, height * 0.105, 108));

  const handleCheckIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/login");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: width * 1.15,
          height: width * 1.15,
          borderRadius: 9999,
          left: -width * 0.075,
          bottom: height * 0.1,

          opacity: 0.18,
        }}
      />

      <View style={styles.screen}>
        <Reveal reduce={reduce}>
          <View style={styles.topBar}>
            <View style={styles.brand}>
              <Text
                className="font-display uppercase"
                style={styles.brandText}
                maxFontSizeMultiplier={1.2}
              >
                Mom.exe
              </Text>
            </View>
            <View style={styles.beta}>
              <Text style={styles.betaText} maxFontSizeMultiplier={1.2}>
                beta
              </Text>
            </View>
          </View>
        </Reveal>

        <Reveal reduce={reduce} delay={120} style={{ marginTop: 20 }}>
          <Text style={styles.eyebrow} maxFontSizeMultiplier={1.2}>
            for everyone who
          </Text>
          <ShadowText
            size={headlineSize}
            layers={[
              { x: 8, y: 8, color: C.blue },
              { x: 4, y: 4, color: C.pink },
            ]}
          >
            {"Moved\nout"}
          </ShadowText>
          <Text style={styles.tagline} maxFontSizeMultiplier={1.2}>
            Mom.exe plans your day around your classes, mess timings and sleep.
            Even if you never check in.
          </Text>
        </Reveal>

        <Reveal reduce={reduce} delay={320} style={styles.stage}>
          <DotLottieNative
            source={require("../../../assets/palmdancing.lottie")}
            style={styles.lottie}
            loop={true}
            autoplay={!reduce}
          />
          <MomBubble lines={MOM_LINES} reduce={reduce} />
        </Reveal>

        <Reveal reduce={reduce} delay={500} style={styles.thumbZone}>
          <View style={{ width: "100%" }}>
            <Button className="w-full" onPress={handleCheckIn}>
              CHECK IN!
            </Button>
          </View>
          <Text style={styles.fine} maxFontSizeMultiplier={1.2}>
            No streaks. No guilt. Wellness coach, not medical advice.
          </Text>
        </Reveal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.cream,
    overflow: "hidden",
  },
  screen: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 9999,
    backgroundColor: C.white,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  brandText: {
    fontSize: 13,
    color: C.ink,
    letterSpacing: -0.2,
  },
  beta: {
    borderWidth: 1.5,
    borderColor: C.ink,
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  betaText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: C.ink,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: C.brown,
    marginBottom: 8,
  },
  tagline: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
    color: C.mute,
  },
  stage: {
    flex: 1,
    minHeight: 0,
    marginTop: 4,
    marginBottom: -20,
  },
  lottie: {
    width: "100%",
    height: "100%",
  },
  bubbleWrap: {
    position: "absolute",
    bottom: 275,
    right: 0,
    width: 176,
    marginRight: 4,
    marginBottom: 4,
  },
  bubbleShadow: {
    position: "absolute",
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    borderRadius: 18,
    backgroundColor: C.ink,
  },
  bubble: {
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 18,
    backgroundColor: C.white,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: C.ink,
  },
  bubbleTail: {
    position: "absolute",
    left: 22,
    bottom: -8,
    width: 14,
    height: 14,
    backgroundColor: C.white,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: C.ink,
    transform: [{ rotate: "45deg" }],
  },
  thumbZone: {
    alignItems: "center",
    gap: 12,
    paddingTop: 8,
  },
  fine: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    textAlign: "center",
    color: "rgba(33, 23, 19, 0.62)",
  },
});
