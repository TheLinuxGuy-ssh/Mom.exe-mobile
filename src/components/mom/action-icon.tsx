import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type MCIcon = ComponentProps<typeof MaterialCommunityIcons>["name"];

/** Action id -> icon, mirroring the web's lucide mapping one-for-one. */
const MAP: Record<string, MCIcon> = {
  nap: "weather-night",
  eat_meal: "silverware-fork-knife",
  snack: "cookie",
  caffeine_cutoff: "coffee",
  wind_down: "lamp",
  light_exposure: "white-balance-sunny",
  exercise: "dumbbell",
  study_block: "book-open-variant",
  class: "school",
  social_time: "account-group",
  screen_off: "monitor-off",
  hydration: "water",
  me_time: "seat",
  sleep: "bed",
  free: "star-four-points",
};

export function ActionIcon({ action, size = 18, color = "#211713" }: { action: string; size?: number; color?: string }) {
  return <MaterialCommunityIcons name={MAP[action] ?? "coffee"} size={size} color={color} />;
}
