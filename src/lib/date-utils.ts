/**
 * Open-Meteo's `daily.time` entries are date-only strings ("YYYY-MM-DD")
 * representing a calendar date in the location's own timezone (the API
 * was requested with timezone=auto). `new Date("YYYY-MM-DD")` parses that
 * as UTC midnight per the ES spec -- once formatted with the browser's
 * local timezone (e.g. via `toLocaleDateString`), a timezone behind UTC
 * (like US Pacific) rolls it back to the previous calendar day, so "today"
 * can show up labeled as the wrong weekday.
 *
 * This parses the same string as local calendar-date components instead,
 * so the weekday/day-of-month always match the date the API actually meant.
 */
export function parseLocalDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** User-selectable long-date display preference for the 7-day forecast detail view. */
export type LongDateFormat = 'mdy' | 'dmy';

export const LONG_DATE_FORMAT_OPTIONS: { value: LongDateFormat; label: string; example: string }[] = [
  { value: 'mdy', label: 'Month, Day, Year', example: 'Tuesday, July 14, 2026' },
  { value: 'dmy', label: 'Day, Month, Year', example: 'Tuesday, 14 July 2026' },
];

/** Formats a Date as a full weekday + calendar date string, in either
 * "Weekday, Month Day, Year" (US-style) or "Weekday, Day Month Year"
 * (international-style) order, per the user's saved preference. */
export function formatLongDate(date: Date, format: LongDateFormat): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const day = date.getDate();
  const year = date.getFullYear();
  return format === 'mdy' ? `${weekday}, ${month} ${day}, ${year}` : `${weekday}, ${day} ${month} ${year}`;
}
