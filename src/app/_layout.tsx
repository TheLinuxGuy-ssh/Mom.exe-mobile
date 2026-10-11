import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ToastHost } from "@/components/mom/toast";
import { C } from "@/constants/mom";
import { loadSession, useSession } from "@/lib/auth/use-session";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const session = useSession();
  const segments = useSegments();

  useEffect(() => {
    void loadSession();
  }, []);

  useEffect(() => {
    if (session === undefined) return;

    SplashScreen.hide();

    const inAuth = segments[0] === "(auth)";
    if (session && inAuth) {
      router.replace("/home");
    } else if (!session && !inAuth) {
      router.replace("/");
    }
  }, [session, segments]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <View style={styles.root}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: C.cream },
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="home" options={{ animation: "fade" }} />
          </Stack>
          <ToastHost />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
});