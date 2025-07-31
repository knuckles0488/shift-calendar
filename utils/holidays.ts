
import { formatDateKey } from './date';

const holidays: { [key: string]: string } = {
  // 2025 BC Holidays
  '2025-01-01': "New Year's Day",
  '2025-02-17': 'Family Day',
  '2025-04-18': 'Good Friday',
  '2025-05-19': 'Victoria Day',
  '2025-07-01': 'Canada Day',
  '2025-08-04': 'BC Day',
  '2025-09-01': 'Labour Day',
  '2025-09-30': 'Truth & Rec.',
  '2025-10-13': 'Thanksgiving',
  '2025-11-11': 'Remembrance Day',
  '2025-12-25': 'Christmas Day',

  // 2026 BC Holidays
  '2026-01-01': "New Year's Day",
  '2026-02-16': 'Family Day',
  '2026-04-03': 'Good Friday',
  '2026-05-18': 'Victoria Day',
  '2026-07-01': 'Canada Day',
  '2026-08-03': 'BC Day',
  '2026-09-07': 'Labour Day',
  '2026-09-30': 'Truth & Rec.',
  '2026-10-12': 'Thanksgiving',
  '2026-11-11': 'Remembrance Day',
  '2026-12-25': 'Christmas Day',
};

export const getHolidayForDate = (date: Date): string | null => {
  const key = formatDateKey(date);
  return holidays[key] || null;
};
