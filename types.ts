export enum ShiftType {
  DAY = 'Day',
  NIGHT = 'Night',
  OFF = 'Off'
}

export interface DayInfo {
  date: Date;
  shift: ShiftType;
  shiftDetail: string; // e.g., 'Day 1', 'Night 2', 'Off 3'
  holiday: string | null;
  isCustomHoliday: boolean;
  specialEvent?: string;
}

export interface Notes {
  [key: string]: string; // key is 'YYYY-MM-DD'
}

export interface StarredDays {
    [key: string]: boolean; // key is 'YYYY-MM-DD'
}

export interface CustomHoliday {
    start: string; // 'YYYY-MM-DD'
    end: string; // 'YYYY-MM-DD'
}

export type GroupedDays = Record<string, DayInfo[]>; // key is 'YYYY-MM'