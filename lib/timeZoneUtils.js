import { DateTime } from "luxon";

//Create a date in a specific timezone, defaulting to 9:00 AM local time
export function createDateInTimezone(
  timezone,
  daysToAdd = 0,
  hour = 9,
  minute = 0
) {
  return DateTime.now()
    .setZone(timezone)
    .plus({ days: daysToAdd })
    .set({ hour, minute, second: 0, millisecond: 0 })
    .toJSDate();
}

// Validate if a timezone is valid timezone
export function isValidTimezone(timezone) {
  if (!timezone) return false;

  try {
    DateTime.now().setZone(timezone);
    return true;
  } catch (error) {
    return false;
  }
}
