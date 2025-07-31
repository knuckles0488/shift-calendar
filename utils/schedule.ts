import { ShiftType } from '../types';
import type { DayInfo } from '../types';
import { getHolidayForDate } from './holidays';

const REFERENCE_DATE = new Date('2025-07-01T00:00:00Z');
const CYCLE_LENGTH = 8;
// The cycle starts with 'N2' on the reference date.
const SHIFT_CYCLE: string[] = ['N2', 'O1', 'O2', 'O3', 'O4', 'D1', 'D2', 'N1'];

// Calculates the difference in days between two dates, ignoring time.
const diffInDays = (date1: Date, date2: Date): number => {
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

export const getShiftForDate = (date: Date): Pick<DayInfo, 'shift' | 'shiftDetail' | 'holiday' | 'specialEvent'> => {
  const dayDifference = diffInDays(REFERENCE_DATE, date);
  
  // The modulo operator in JS can be negative, so this ensures a positive index.
  const cycleIndex = (dayDifference % CYCLE_LENGTH + CYCLE_LENGTH) % CYCLE_LENGTH;

  const shiftDetail = SHIFT_CYCLE[cycleIndex];
  let shift: ShiftType;

  if (shiftDetail.startsWith('D')) {
    shift = ShiftType.DAY;
  } else if (shiftDetail.startsWith('N')) {
    shift = ShiftType.NIGHT;
  } else {
    shift = ShiftType.OFF;
  }

  const holiday = getHolidayForDate(date);
  
  let specialEvent: string | undefined;
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // 0-indexed
  const day = date.getUTCDate();
  
  if ((year === 2025 && month === 9 && day === 8) || (year === 2026 && month === 3 && day === 8)) {
    specialEvent = 'Floater';
  }

  return { shift, shiftDetail, holiday, specialEvent };
};