
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// ====== GLOBAL DECLARATIONS ======
declare global {
  interface Window {
    jspdf: any;
  }
}

// ====== TYPES (from types.ts) ======
enum ShiftType {
  DAY = 'Day',
  NIGHT = 'Night',
  OFF = 'Off'
}

interface DayInfo {
  date: Date;
  shift: ShiftType;
  shiftDetail: string;
  holiday: string | null;
  isCustomHoliday: boolean;
  specialEvent?: string;
}

interface Notes {
  [key: string]: string;
}

interface StarredDays {
    [key: string]: boolean;
}

interface CustomHoliday {
    start: string;
    end: string;
}

type GroupedDays = Record<string, DayInfo[]>;

// ====== UTILS (from utils/*.ts) ======

const formatDateKey = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthYear = (date: Date): string => {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
}

const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

const holidays: { [key: string]: string } = {
  '2025-01-01': "New Year's Day", '2025-02-17': 'Family Day', '2025-04-18': 'Good Friday',
  '2025-05-19': 'Victoria Day', '2025-07-01': 'Canada Day', '2025-08-04': 'BC Day',
  '2025-09-01': 'Labour Day', '2025-09-30': 'Truth & Rec.', '2025-10-13': 'Thanksgiving',
  '2025-11-11': 'Remembrance Day', '2025-12-25': 'Christmas Day',
  '2026-01-01': "New Year's Day", '2026-02-16': 'Family Day', '2026-04-03': 'Good Friday',
  '2026-05-18': 'Victoria Day', '2026-07-01': 'Canada Day', '2026-08-03': 'BC Day',
  '2026-09-07': 'Labour Day', '2026-09-30': 'Truth & Rec.', '2026-10-12': 'Thanksgiving',
  '2026-11-11': 'Remembrance Day', '2026-12-25': 'Christmas Day',
};

const getHolidayForDate = (date: Date): string | null => {
  const key = formatDateKey(date);
  return holidays[key] || null;
};

const REFERENCE_DATE = new Date('2025-07-01T00:00:00Z');
const CYCLE_LENGTH = 8;
const SHIFT_CYCLE: string[] = ['N2', 'O1', 'O2', 'O3', 'O4', 'D1', 'D2', 'N1'];

const diffInDays = (date1: Date, date2: Date): number => {
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

const getShiftForDate = (date: Date): Pick<DayInfo, 'shift' | 'shiftDetail' | 'holiday' | 'specialEvent'> => {
  const dayDifference = diffInDays(REFERENCE_DATE, date);
  const cycleIndex = (dayDifference % CYCLE_LENGTH + CYCLE_LENGTH) % CYCLE_LENGTH;
  const shiftDetail = SHIFT_CYCLE[cycleIndex];
  let shift: ShiftType;

  if (shiftDetail.startsWith('D')) shift = ShiftType.DAY;
  else if (shiftDetail.startsWith('N')) shift = ShiftType.NIGHT;
  else shift = ShiftType.OFF;

  const holiday = getHolidayForDate(date);
  let specialEvent: string | undefined;
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  
  if ((year === 2025 && month === 9 && day === 8) || (year === 2026 && month === 3 && day === 8)) {
    specialEvent = 'Floater';
  }

  return { shift, shiftDetail, holiday, specialEvent };
};

// ====== HOOKS (from hooks/useLocalStorage.ts) ======
type SetValue<T> = (value: T | ((val: T) => T)) => void;

function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue: SetValue<T> = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, storedValue]);
  
  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);

  return [storedValue, setValue];
}


// ====== COMPONENTS (from components/*.tsx) ======

const TrashIcon = () => (
    <svg className="w-4 h-4 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
);

const SettingsMenu: React.FC<{
  allDays: DayInfo[]; notes: Notes; customHolidays: CustomHoliday[];
  onAddCustomHoliday: (start: string, end: string) => void;
  onDeleteCustomHoliday: (holiday: CustomHoliday) => void;
}> = ({ allDays, notes, customHolidays, onAddCustomHoliday, onDeleteCustomHoliday }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddHoliday = () => {
      onAddCustomHoliday(startDate, endDate);
      setStartDate('');
      setEndDate('');
  };

  const groupedDays = useMemo(() => allDays.reduce((acc, day) => {
      const monthYearKey = getMonthYear(day.date);
      if (!acc[monthYearKey]) acc[monthYearKey] = [];
      acc[monthYearKey].push(day);
      return acc;
    }, {} as GroupedDays), [allDays]);
  
  const generatePdf = (monthYear: string, daysInMonth: DayInfo[]) => {
    if (typeof window.jspdf === 'undefined' || typeof (window.jspdf as any).jsPDF === 'undefined') {
        alert("PDF generation library is not loaded. Please try again.");
        return;
    }
    const { jsPDF } = window.jspdf as any;
    const doc = new jsPDF();
    const monthName = new Date(daysInMonth[0].date).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    doc.setFontSize(18);
    doc.text(`Notes Summary for ${monthName}`, 14, 22);

    const tableRows = daysInMonth
      .map(day => ({ day, note: notes[formatDateKey(day.date)] || '' }))
      .filter(({ note }) => note.trim() !== '')
      .map(({ day, note }) => [
        day.date.toLocaleDateString('en-US', { day: '2-digit', timeZone: 'UTC' }),
        day.date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
        day.shift,
        note
      ]);

    if (tableRows.length === 0) {
      alert(`No notes found for ${monthName} to generate a summary.`);
      return;
    }

    if (typeof (window.jspdf as any).autoTable !== 'function') {
        alert("PDF autoTable function not found. The jsPDF-autoTable plugin might not have loaded correctly.");
        return;
    }

    (window.jspdf as any).autoTable(doc, {
        head: [["Date", "Day", "Shift", "Notes"]], body: tableRows, startY: 30,
        headStyles: { fillColor: [22, 160, 133] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
    });
    doc.save(`notes-summary-${monthYear}.pdf`);
  };

  return (
    <div ref={menuRef} className="relative">
      <button onClick={() => setIsOpen(!isOpen)} aria-haspopup="true" aria-expanded={isOpen} aria-label="Open settings menu" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-30">
          <div className="py-1">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Download Monthly PDF</div>
            <div className="max-h-48 overflow-y-auto">{Object.keys(groupedDays).sort().map(monthYear => (<button key={monthYear} onClick={() => { generatePdf(monthYear, groupedDays[monthYear]); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">{new Date(groupedDays[monthYear][0].date).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</button>))}</div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700"></div>
          <div className="p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Manage Custom Holidays</p>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1">{customHolidays.length > 0 ? customHolidays.map((holiday, index) => (<div key={index} className="flex justify-between items-center text-xs bg-gray-100 dark:bg-gray-900/50 p-2 rounded-md"><span className="font-mono text-gray-700 dark:text-gray-300">{holiday.start} to {holiday.end}</span><button onClick={() => onDeleteCustomHoliday(holiday)} aria-label={`Delete holiday from ${holiday.start} to ${holiday.end}`} className="p-1"><TrashIcon /></button></div>)) : (<p className="text-xs text-center py-2 text-gray-500 dark:text-gray-400">No custom holidays added.</p>)}</div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Add Holiday Range</p>
              <div>
                <label htmlFor="start-date" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Start Date</label>
                <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-1.5 text-sm rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label htmlFor="end-date" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">End Date</label>
                <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-1.5 text-sm rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <button onClick={handleAddHoliday} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors text-sm font-semibold">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const shiftBgColors = { [ShiftType.DAY]: 'bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-800/60', [ShiftType.NIGHT]: 'bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800/60', [ShiftType.OFF]: 'bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800/60' };
const shiftTextColors = { [ShiftType.DAY]: 'text-green-800 dark:text-green-200', [ShiftType.NIGHT]: 'text-red-800 dark:text-red-200', [ShiftType.OFF]: 'text-blue-800 dark:text-blue-200' };
const StarIcon = () => (<svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>);
const NoteIcon = () => (<div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>);

const CalendarDay: React.FC<{ dayInfo: DayInfo; isToday: boolean; isStarred: boolean; hasNote: boolean; onClick: () => void; }> = ({ dayInfo, isToday, isStarred, hasNote, onClick }) => {
  const { date, shift, holiday, specialEvent, isCustomHoliday } = dayInfo;
  const baseClasses = "relative p-1.5 pb-5 flex flex-col h-full border-r border-b border-gray-400 dark:border-gray-500 cursor-pointer transition-colors duration-200 overflow-hidden";
  const todayRing = isToday ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 z-10' : '';
  
  return (
    <div className={`${baseClasses} ${shiftBgColors[shift]} ${todayRing}`} onClick={onClick} role="button" aria-label={`View details for ${date.toDateString()}`}>
        <div className="flex justify-between items-start">
            <span className={`text-xs font-bold ${isToday ? 'bg-indigo-600 text-white rounded-full flex items-center justify-center w-5 h-5' : 'text-gray-700 dark:text-gray-300'}`}>{date.getUTCDate()}</span>
            <div className="flex items-center space-x-1">{hasNote && <NoteIcon />}{isStarred && <StarIcon />}</div>
        </div>
        <div className="flex-grow flex flex-col justify-center items-center text-center mt-1">
            {specialEvent && <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">{specialEvent}</p>}
            <p className={`text-xs font-semibold ${shiftTextColors[shift]}`}>{shift}</p>
            {holiday && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate leading-tight" title={holiday}>{holiday}</p>}
        </div>
        {isCustomHoliday && (<div className="absolute bottom-0 left-0 right-0 h-4 bg-yellow-400 text-black text-[10px] font-bold flex items-center justify-center pointer-events-none">Holidays</div>)}
    </div>
  );
};

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const Calendar: React.FC<{ currentDate: Date; daysMap: Map<string, DayInfo>; starredDays: StarredDays; notes: Notes; onDayClick: (date: Date) => void; }> = ({ currentDate, daysMap, starredDays, notes, onDayClick }) => {
  const today = new Date();
  const month = currentDate.getUTCMonth();
  const year = currentDate.getUTCFullYear();
  const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const startingDayOfWeek = firstDayOfMonth.getUTCDay();
  const grid = [];
  
  for (let i = 0; i < startingDayOfWeek; i++) grid.push(<div key={`pad-prev-${i}`} className="border-r border-b border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-800/50"></div>);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month, day));
    const key = formatDateKey(date);
    const dayInfo = daysMap.get(key);
    if (dayInfo) grid.push(<CalendarDay key={key} dayInfo={dayInfo} isToday={isSameDay(date, today)} isStarred={!!starredDays[key]} hasNote={!!notes[key]} onClick={() => onDayClick(date)}/>);
    else grid.push(<div key={`pad-day-${day}`} className="border-r border-b border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-800/50"></div>);
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-full flex flex-col">
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">{WEEK_DAYS.map(day => (<div key={day} className="p-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{day}</div>))}</div>
        <div className="grid grid-cols-7 grid-rows-6 flex-grow border-t border-l border-gray-400 dark:border-gray-500">{grid}</div>
    </div>
  );
};

const shiftHeaderStyles = { [ShiftType.DAY]: 'bg-green-500 text-white', [ShiftType.NIGHT]: 'bg-red-500 text-white', [ShiftType.OFF]: 'bg-blue-500 text-white' };
const StarButton = ({ isStarred, onClick }: { isStarred: boolean, onClick: () => void }) => (<button onClick={onClick} className={`p-2 rounded-full transition-colors ${isStarred ? 'bg-yellow-400/20' : 'hover:bg-gray-500/20'}`} aria-label={isStarred ? "Unstar this day" : "Star this day"}><svg className={`w-6 h-6 ${isStarred ? 'text-yellow-400' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg></button>);

const DayDetailModal: React.FC<{ dayInfo: DayInfo; note: string; isStarred: boolean; onClose: () => void; onNoteChange: (date: Date, note: string) => void; onToggleStar: (date: Date) => void; }> = ({ dayInfo, note, isStarred, onClose, onNoteChange, onToggleStar }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    const handleClickOutside = (event: MouseEvent) => { if (modalRef.current && !modalRef.current.contains(event.target as Node)) onClose(); };
    document.addEventListener('keydown', handleEsc);
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('keydown', handleEsc); document.removeEventListener('mousedown', handleClickOutside); };
  }, [onClose]);

  const { date, shift, holiday, specialEvent } = dayInfo;
  const fullDateString = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const detailString = [shift, specialEvent, holiday].filter(Boolean).join(' • ');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        <div className={`p-4 flex justify-between items-center ${shiftHeaderStyles[shift]}`}>
            <div>
              <h2 className="text-xl font-bold">{fullDateString}</h2>
              <p className="text-sm font-semibold opacity-90">{detailString}</p>
            </div>
            <StarButton isStarred={isStarred} onClick={() => onToggleStar(date)} />
        </div>
        <div className="p-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
            <textarea id="notes" value={note} onChange={(e) => onNoteChange(date, e.target.value)} placeholder="Add your notes for the day..." className="w-full h-40 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm" autoFocus />
        </div>
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 flex justify-end">
             <button onClick={onClose} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors text-sm font-semibold">Close</button>
        </div>
      </div>
    </div>
  );
};

const StarredNotesList: React.FC<{ notes: DayInfo[]; allNotes: Notes }> = ({ notes, allNotes }) => {
    if (notes.length === 0) {
        return null;
    }

    return (
        <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Starred Notes for {notes[0].date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
            </h3>
            <ul className="space-y-3">
                {notes.map(dayInfo => {
                    const key = formatDateKey(dayInfo.date);
                    const noteContent = allNotes[key];
                    return (
                        <li key={key} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md transition hover:bg-gray-100 dark:hover:bg-gray-700">
                            <p className="font-bold text-sm text-gray-700 dark:text-gray-200 flex items-center">
                                <StarIcon />
                                <span className="ml-2">
                                    {dayInfo.date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', timeZone: 'UTC' })}
                                </span>
                            </p>
                            <p className="mt-1 pl-5 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                {noteContent}
                            </p>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};


const Header: React.FC<{
  currentDate: Date; onPrevMonth: () => void; onNextMonth: () => void;
  allDays: DayInfo[]; notes: Notes; customHolidays: CustomHoliday[];
  onAddCustomHoliday: (start: string, end: string) => void;
  onDeleteCustomHoliday: (holiday: CustomHoliday) => void;
}> = ({ currentDate, onPrevMonth, onNextMonth, allDays, notes, customHolidays, onAddCustomHoliday, onDeleteCustomHoliday }) => {
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="w-1/3"><h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white hidden sm:block">Shift Planner</h1></div>
          <div className="w-1/3 flex justify-center items-center space-x-2 md:space-x-4">
            <button onClick={onPrevMonth} aria-label="Previous month" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg></button>
            <h2 className="text-lg md:text-xl font-semibold text-center w-40 md:w-48">{monthName}</h2>
            <button onClick={onNextMonth} aria-label="Next month" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></button>
          </div>
          <div className="w-1/3 flex justify-end"><SettingsMenu {...{allDays, notes, customHolidays, onAddCustomHoliday, onDeleteCustomHoliday}} /></div>
        </div>
      </div>
    </header>
  );
};

// ====== APP COMPONENT (from App.tsx) ======
const App: React.FC = () => {
  const getInitialDate = () => {
    const today = new Date();
    const startDate = new Date('2025-07-01T00:00:00Z');
    const endDate = new Date('2026-06-30T00:00:00Z');
    if (today < startDate) return startDate;
    if (today > endDate) return endDate;
    return today;
  };

  const [currentDate, setCurrentDate] = useState(getInitialDate);
  const [notes, setNotes] = useLocalStorage<Notes>('daily-notes', {});
  const [starredDays, setStarredDays] = useLocalStorage<StarredDays>('starred-days', {});
  const [selectedDay, setSelectedDay] = useState<DayInfo | null>(null);
  const [customHolidays, setCustomHolidays] = useLocalStorage<CustomHoliday[]>('custom-holidays', []);

  const days = useMemo<DayInfo[]>(() => {
    const start = new Date('2025-07-01T00:00:00Z');
    const end = new Date('2026-06-30T00:00:00Z');
    const dayArray: DayInfo[] = [];
    let current = new Date(start);
    const isDateInRanges = (d: Date, ranges: CustomHoliday[]): boolean => {
        const dateKey = formatDateKey(d);
        return ranges.some(range => dateKey >= range.start && dateKey <= range.end);
    };
    while (current <= end) {
      dayArray.push({
        date: new Date(current),
        ...getShiftForDate(new Date(current)),
        isCustomHoliday: isDateInRanges(current, customHolidays),
      });
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return dayArray;
  }, [customHolidays]);
  
  const starredNotesForMonth = useMemo<DayInfo[]>(() => {
    const month = currentDate.getUTCMonth();
    const year = currentDate.getUTCFullYear();

    return days
      .filter(dayInfo => {
        const key = formatDateKey(dayInfo.date);
        return dayInfo.date.getUTCMonth() === month &&
               dayInfo.date.getUTCFullYear() === year &&
               starredDays[key] &&
               notes[key] &&
               notes[key].trim() !== '';
      });
  }, [days, starredDays, notes, currentDate]);

  const daysMap = useMemo(() => new Map(days.map(day => [formatDateKey(day.date), day])), [days]);
  const handleNoteChange = useCallback((date: Date, note: string) => setNotes(prev => ({ ...prev, [formatDateKey(date)]: note })), [setNotes]);
  const handleToggleStar = useCallback((date: Date) => setStarredDays(prev => ({ ...prev, [formatDateKey(date)]: !prev[formatDateKey(date)] })), [setStarredDays]);
  const handlePrevMonth = useCallback(() => setCurrentDate(prev => { const newDate = new Date(prev); newDate.setUTCMonth(newDate.getUTCMonth() - 1, 1); const scheduleStart = new Date('2025-07-01T00:00:00Z'); if (newDate.getUTCFullYear() < scheduleStart.getUTCFullYear() || (newDate.getUTCFullYear() === scheduleStart.getUTCFullYear() && newDate.getUTCMonth() < scheduleStart.getUTCMonth())) return prev; return newDate; }), []);
  const handleNextMonth = useCallback(() => setCurrentDate(prev => { const newDate = new Date(prev); newDate.setUTCMonth(newDate.getUTCMonth() + 1, 1); const scheduleEnd = new Date('2026-06-30T00:00:00Z'); if (newDate.getUTCFullYear() > scheduleEnd.getUTCFullYear() || (newDate.getUTCFullYear() === scheduleEnd.getUTCFullYear() && newDate.getUTCMonth() > scheduleEnd.getUTCMonth())) return prev; return newDate; }), []);
  const handleDayClick = useCallback((date: Date) => { const dayInfo = daysMap.get(formatDateKey(date)); if (dayInfo) setSelectedDay(dayInfo); }, [daysMap]);
  const handleAddCustomHoliday = useCallback((start: string, end: string) => { if (!start || !end || start > end) { alert("Please select a valid date range."); return; } setCustomHolidays(prev => [...prev, { start, end }]); }, [setCustomHolidays]);
  const handleDeleteCustomHoliday = useCallback((holidayToDelete: CustomHoliday) => setCustomHolidays(prev => prev.filter(h => h.start !== holidayToDelete.start || h.end !== holidayToDelete.end)), [setCustomHolidays]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200 flex flex-col">
      <Header 
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        allDays={days}
        notes={notes}
        customHolidays={customHolidays}
        onAddCustomHoliday={handleAddCustomHoliday}
        onDeleteCustomHoliday={handleDeleteCustomHoliday}
      />
      <main className="flex-grow container mx-auto p-2 sm:p-4">
        <div className="flex flex-col gap-4 sm:gap-6">
            <Calendar 
              currentDate={currentDate}
              daysMap={daysMap}
              starredDays={starredDays}
              onDayClick={handleDayClick}
              notes={notes}
            />
            <StarredNotesList notes={starredNotesForMonth} allNotes={notes} />
        </div>
      </main>
      {selectedDay && <DayDetailModal dayInfo={selectedDay} note={notes[formatDateKey(selectedDay.date)] || ''} isStarred={!!starredDays[formatDateKey(selectedDay.date)]} onClose={() => setSelectedDay(null)} onNoteChange={handleNoteChange} onToggleStar={handleToggleStar} />}
    </div>
  );
};

// ====== RENDER APP & SERVICE WORKER ======

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  const CACHE_VERSION = 'v12';
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`./service-worker.js?v=${CACHE_VERSION}`, { scope: './' })
      .then(registration => console.log('Service Worker registered: ', registration))
      .catch(registrationError => console.log('Service Worker registration failed: ', registrationError));
  });
}
