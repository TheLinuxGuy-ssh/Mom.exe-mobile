import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TabsBackground } from "@/components/mom/tabs-background";
import { C, BORDER, R } from "@/constants/mom";
import type PagerViewInstance from "react-native-pager-view";
import HistoryScreen from "@/screens/history-screen";
import HomeScreen from "@/screens/home-screen";
import SettingsScreen from "@/screens/settings-screen";

const PagerView: typeof import("react-native-pager-view").default | null =
  Platform.OS === "web"
    ? null
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("react-native-pager-view").default;

const PAGES = [
  { key: "home", label: "home", icon: "home", Screen: HomeScreen },
  { key: "history", label: "history", icon: "clock", Screen: HistoryScreen },
  { key: "settings", label: "settings", icon: "settings", Screen: SettingsScreen },
] as const;

export default function HomeTabs() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const [innerWidth, setInnerWidth] = useState(0);
  const [scrollX] = useState(() => new Animated.Value(0));
  const [visited, setVisited] = useState<ReadonlySet<number>>(
    () => new Set([0]),
  );
  const pagerRef = useRef<PagerViewInstance>(null);

  function markVisited(index: number) {
    setVisited((prev) => (prev.has(index) ? prev : new Set(prev).add(index)));
  }

  const itemWidth = innerWidth > 0 ? innerWidth / PAGES.length : 0;

  const pillTranslateX = scrollX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, itemWidth],
    extrapolate: "extend",
  });

  const pillColor = scrollX.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [C.lime, C.blue, C.orange],
  });

  function goTo(index: number) {
    if (index === activeIndex) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    setActiveIndex(index);
    markVisited(index);
    if (!PagerView) scrollX.setValue(index);
    pagerRef.current?.setPage(index);
  }

  const pages = PAGES.map((page, index) => {
    const Screen = page.Screen;
    return (
      <View key={page.key} style={styles.page}>
        {visited.has(index) ? <Screen /> : null}
      </View>
    );
  });

  return (
    <View style={styles.root}>
      <TabsBackground progress={scrollX} />

      {PagerView ? (
        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={0}
          overdrag={false}
          offscreenPageLimit={PAGES.length - 1}
          onPageScroll={(e) => {
            const { position, offset } = e.nativeEvent;
            const scroll = position + offset;
            scrollX.setValue(scroll);
            markVisited(Math.round(scroll));
          }}
          onPageSelected={(e) => {
            const position = e.nativeEvent.position;
            setActiveIndex(position);
            markVisited(position);
            Haptics.selectionAsync().catch(() => undefined);
          }}
        >
          {pages}
        </PagerView>
      ) : (
        <View style={styles.pager}>{pages[activeIndex]}</View>
      )}

      <LinearGradient
        pointerEvents="none"
        colors={["rgba(255,244,220,0)", C.cream]}
        locations={[0, 0.85]}
        style={[styles.fade, { height: insets.bottom + 104 }]}
      />

      <View
        pointerEvents="box-none"
        style={[styles.navWrap, { bottom: insets.bottom + 12 }]}
      >
        <View style={styles.nav}>
          <View
            style={styles.inner}
            onLayout={(e: LayoutChangeEvent) =>
              setInnerWidth(e.nativeEvent.layout.width)
            }
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pill,
                {
                  width: itemWidth,
                  backgroundColor: pillColor,
                  transform: [{ translateX: pillTranslateX }],
                },
              ]}
            />
            {PAGES.map((page, index) => {
              const focused = index === activeIndex;
              return (
                <Pressable
                  key={page.key}
                  onPress={() => goTo(index)}
                  style={styles.item}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: focused }}
                  accessibilityLabel={page.label}
                >
                  <Feather
                    name={page.icon}
                    size={20}
                    color={focused ? C.ink : C.mute}
                  />
                  <Text
                    style={[styles.label, { color: focused ? C.ink : C.mute }]}
                  >
                    {page.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  pager: { flex: 1, backgroundColor: "transparent" },
  page: { flex: 1, backgroundColor: "transparent" },
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  navWrap: {
    position: "absolute",
    left: 18,
    right: 18,
    zIndex: 2,
  },
  nav: {
    borderWidth: 3,
    borderColor: C.ink,
    borderRadius: R.pill,
    backgroundColor: C.paper,
    padding: 5,
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  inner: {
    flexDirection: "row",
    borderRadius: R.pill,
  },
  pill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderWidth: BORDER,
    borderColor: C.ink,
    borderRadius: R.pill,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});