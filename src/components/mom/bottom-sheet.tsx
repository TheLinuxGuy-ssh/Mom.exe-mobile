import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal as RNModal,
  PanResponder,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

const DISMISS_FRACTION = 0.35;
const DISMISS_VELOCITY = 0.8;
const EXIT_MS = 220;

/**
 * The animated overlay every sheet shares. It owns the backdrop, the spring-up entrance, the
 * follow-the-finger drag and the timing exit, so each card only has to describe its own content.
 *
 * The drag lives on the surface itself rather than a small grab bar: a downward pull anywhere the
 * card is not scrollable dismisses it, while an inner ScrollView still wins vertical moves inside
 * its own bounds. That is what makes it feel like one piece of paper rather than a dialog with a
 * handle bolted on.
 */
export function BottomSheet({
  open,
  onClose,
  dismissible = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** while false the backdrop, the back button and the drag all stop working */
  dismissible?: boolean;
  children: ReactNode;
}) {
  const { height: screenH } = useWindowDimensions();
  const [mounted, setMounted] = useState(open);
  const [sheetH, setSheetH] = useState(0);
  const [translateY] = useState(() => new Animated.Value(screenH));

  const travel = sheetH > 0 ? sheetH : screenH;

  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);
  const travelRef = useRef(travel);
  useEffect(() => {
    onCloseRef.current = onClose;
    dismissibleRef.current = dismissible;
    travelRef.current = travel;
  });

  const settleBack = useCallback(() => {
    Animated.spring(translateY, {
      toValue: 0,
      damping: 24,
      stiffness: 240,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  const close = useCallback(() => {
    Animated.timing(translateY, {
      toValue: travelRef.current || screenH,
      duration: EXIT_MS,
      useNativeDriver: true,
    }).start(() => {
      setMounted(false);
      onCloseRef.current();
    });
  }, [translateY, screenH]);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!mounted || !open) return;
    translateY.setValue(screenH);
    settleBack();
  }, [mounted, open, screenH, translateY, settleBack]);

  useEffect(() => {
    if (open || !mounted) return;
    Animated.timing(translateY, {
      toValue: travelRef.current || screenH,
      duration: EXIT_MS,
      useNativeDriver: true,
    }).start(() => setMounted(false));
  }, [open, mounted, screenH, translateY]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_e, g) =>
          dismissible && g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx) * 1.2,
        onPanResponderMove: (_e, g) => {
          if (g.dy > 0) translateY.setValue(g.dy);
        },
        onPanResponderRelease: (_e, g) => {
          if (g.dy > travel * DISMISS_FRACTION || g.vy > DISMISS_VELOCITY) {
            Animated.timing(translateY, {
              toValue: travel,
              duration: EXIT_MS,
              useNativeDriver: true,
            }).start(() => {
              setMounted(false);
              onClose();
            });
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              damping: 24,
              stiffness: 240,
              mass: 0.9,
              useNativeDriver: true,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateY, {
            toValue: 0,
            damping: 24,
            stiffness: 240,
            mass: 0.9,
            useNativeDriver: true,
          }).start();
        },
      }),
    [translateY, travel, dismissible, onClose]
  );

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, Math.max(travel, 1)],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  if (!mounted) return null;

  return (
    <RNModal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {
        if (dismissibleRef.current) close();
      }}
    >
      <View style={styles.root}>
        <Animated.View pointerEvents="none" style={[styles.backdrop, { opacity: backdropOpacity }]} />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            if (dismissibleRef.current) close();
          }}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <Animated.View
          onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}
          style={[styles.surface, { transform: [{ translateY }] }]}
          {...pan.panHandlers}
        >
          {children}
        </Animated.View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(33,23,19,0.55)",
  },
  surface: { width: "100%" },
});
