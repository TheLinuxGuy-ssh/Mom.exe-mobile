/**
 * IANA timezone identifiers offered by the settings picker. Prefer the runtime's own list when the
 * engine exposes one (V8/JSC via `Intl.supportedValuesOf`); Hermes does not, so fall back to a
 * curated set of the zones a student is actually likely to be in.
 */
const FALLBACK_TIMEZONES: string[] = [
  "UTC",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Nairobi",
  "America/Anchorage",
  "America/Argentina/Buenos_Aires",
  "America/Bogota",
  "America/Chicago",
  "America/Denver",
  "America/Halifax",
  "America/Lima",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/New_York",
  "America/Phoenix",
  "America/Sao_Paulo",
  "America/Toronto",
  "America/Vancouver",
  "Asia/Almaty",
  "Asia/Bangkok",
  "Asia/Dhaka",
  "Asia/Dubai",
  "Asia/Ho_Chi_Minh",
  "Asia/Hong_Kong",
  "Asia/Jakarta",
  "Asia/Jerusalem",
  "Asia/Karachi",
  "Asia/Kathmandu",
  "Asia/Kolkata",
  "Asia/Kuala_Lumpur",
  "Asia/Manila",
  "Asia/Riyadh",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Taipei",
  "Asia/Tehran",
  "Asia/Tokyo",
  "Atlantic/Reykjavik",
  "Australia/Adelaide",
  "Australia/Brisbane",
  "Australia/Melbourne",
  "Australia/Perth",
  "Australia/Sydney",
  "Europe/Amsterdam",
  "Europe/Athens",
  "Europe/Berlin",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Moscow",
  "Europe/Paris",
  "Europe/Rome",
  "Europe/Stockholm",
  "Europe/Warsaw",
  "Europe/Zurich",
  "Pacific/Auckland",
  "Pacific/Fiji",
  "Pacific/Honolulu",
];

function detectTimezones(): string[] {
  try {
    const supported = (
      Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
    ).supportedValuesOf;
    if (typeof supported === "function") {
      const zones = supported("timeZone");
      if (Array.isArray(zones) && zones.length > 0) {
        return zones.includes("UTC") ? zones : ["UTC", ...zones];
      }
    }
  } catch {
    // fall through to the curated list
  }
  return FALLBACK_TIMEZONES;
}

export const TIMEZONES: string[] = detectTimezones();

/** The offered zones, guaranteed to include the currently selected one. */
export function timezoneOptions(current: string): string[] {
  if (current && !TIMEZONES.includes(current)) return [current, ...TIMEZONES];
  return TIMEZONES;
}
