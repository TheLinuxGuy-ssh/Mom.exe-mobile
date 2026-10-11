import { Stack } from "expo-router";

import { C } from "@/constants/mom";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: C.cream },
        animation: "slide_from_right",
      }}
    />
  );
}