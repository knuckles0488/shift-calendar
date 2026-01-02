
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// ====== TYPES ======
enum ShiftType {
  DAY = 'Day',
  NIGHT = 'Night',
  OFF = 'Off'
}

enum Crew {
  A = 'A',
  B = 'B',
  C = 'C'
}

interface CustomScheduleConfig {
    startDate: string;
    days: string[];
}

interface DayInfo {
  date: Date;
  shift: ShiftType;
  shiftDetail: string;
  holiday: string | null;
  isCustomHoliday: boolean;
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

// ====== UTILS ======

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
    return date1.getUTCFullYear() === date2.getUTCFullYear() &&
           date1.getUTCMonth() === date2.getUTCMonth() &&
           date1.getUTCDate() === date2.getUTCDate();
}

const holidays: { [key: string]: string } = {
  '2025-01-01': "New Year's",
  '2025-02-02': 'Groundhog Day',
  '2025-02-17': 'Family Day',
  '2025-04-18': 'Good Friday',
  '2025-04-20': 'Easter',
  '2025-04-21': 'Easter Monday',
  '2025-05-19': 'Victoria Day',
  '2025-07-01': 'Canada Day',
  '2025-08-04': 'BC Day',
  '2025-09-01': 'Labour Day',
  '2025-09-30': 'Truth & Rec.',
  '2025-10-13': 'Thanksgiving',
  '2025-10-31': 'Halloween',
  '2025-11-11': 'Remembrance',
  '2025-12-24': 'Christmas Eve',
  '2025-12-25': 'Christmas',
  '2025-12-26': 'Boxing Day',
  '2025-12-31': "New Year's Eve",
  '2026-01-01': "New Year's",
  '2026-02-02': 'Groundhog Day',
  '2026-02-16': 'Family Day',
  '2026-04-03': 'Good Friday',
  '2026-04-05': 'Easter',
  '2026-04-06': 'Easter Monday',
  '2026-05-18': 'Victoria Day',
  '2026-07-01': 'Canada Day',
  '2026-08-03': 'BC Day',
  '2026-09-07': 'Labour Day',
  '2026-09-30': 'Truth & Rec.',
  '2026-10-12': 'Thanksgiving',
  '2026-10-31': 'Halloween',
  '2026-11-11': 'Remembrance',
  '2026-12-24': 'Christmas Eve',
  '2026-12-25': 'Christmas',
  '2026-12-26': 'Boxing Day',
  '2026-12-31': "New Year's Eve",
};

const getHolidayForDate = (date: Date): string | null => {
  const key = formatDateKey(date);
  return holidays[key] || null;
};

// Default Schedule Definitions
const DEFAULT_REFERENCE_DATE = new Date('2025-12-22T00:00:00Z'); // Monday

const DEFAULT_PATTERNS: Record<Crew, string[]> = {
    [Crew.C]: ['8-4:30', '8-4:30', '8-4:30', '8-4:30', '8-4:30', 'Off', 'Off'],
    [Crew.A]: [
        'Off', 'Off', 'Off', 'Off', '7:30-3', '7:30-3', '7:30-3',
        'Off', 'Off', 'Off', 'Off', '7-3:30', '7-3:30', '7-3:30',
        'Off', 'Off', '7:30-2', '7:30-2', '7:30-3', 'Off', 'Off',
        'Off', 'Off', '7:30-2', '7:30-2', '7:30-3', 'Off', 'Off'
    ],
    [Crew.B]: [
        'Off', 'Off', '7:30-2', '7:30-2', '7:30-3', 'Off', 'Off',
        'Off', 'Off', '7:30-2', '7:30-2', '7:30-3', 'Off', 'Off',
        'Off', 'Off', 'Off', 'Off', '7:30-3', '7:30-3', '7:30-3'
    ]
};

const diffInDays = (date1: Date, date2: Date): number => {
    const utc1 = Date.UTC(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate());
    const utc2 = Date.UTC(date2.getUTCFullYear(), date2.getUTCMonth(), date2.getUTCDate());
    return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

const getShiftTypeFromDetail = (detail: string): ShiftType => {
    const lower = detail.toLowerCase();
    if (lower === 'off' || lower === '') return ShiftType.OFF;
    if (lower.includes('night') || lower.includes('n1') || lower.includes('n2')) return ShiftType.NIGHT;
    return ShiftType.DAY;
}

const getShiftForDate = (
    date: Date, 
    crew: Crew, 
    customConfigs: Record<Crew, CustomScheduleConfig | null>
): Pick<DayInfo, 'shift' | 'shiftDetail' | 'holiday'> => {
  
  let shiftDetail = 'Off';
  let shift: ShiftType = ShiftType.OFF;

  const customConfig = customConfigs[crew];

  if (customConfig && customConfig.days.some(d => d.trim() !== '')) {
      const anchor = new Date(customConfig.startDate + 'T00:00:00Z');
      const lastNonEmptyIndex = [...customConfig.days].reverse().findIndex(val => val.trim() !== '');
      const activeDaysLength = customConfig.days.length - lastNonEmptyIndex;
      const activeDays = customConfig.days.slice(0, activeDaysLength);

      const dayDiff = diffInDays(anchor, date);
      const cycleIndex = ((dayDiff % activeDaysLength) + activeDaysLength) % activeDaysLength;
      shiftDetail = activeDays[cycleIndex] || 'Off';
      shift = getShiftTypeFromDetail(shiftDetail);
  } else {
      const pattern = DEFAULT_PATTERNS[crew];
      const dayDifference = diffInDays(DEFAULT_REFERENCE_DATE, date);
      const cycleIndex = ((dayDifference % pattern.length) + pattern.length) % pattern.length;
      shiftDetail = pattern[cycleIndex] || 'Off';
      shift = getShiftTypeFromDetail(shiftDetail);
  }

  const holiday = getHolidayForDate(date);
  return { shift, shiftDetail, holiday };
};

// ====== HOOKS ======
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
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

  const setValue = useCallback((value: T | ((val: T) => T)) => {
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

// ====== COMPONENTS ======

const CustomSchedulePage: React.FC<{
    crewName: string;
    config: CustomScheduleConfig;
    onSave: (config: CustomScheduleConfig) => void;
    onClose: () => void;
}> = ({ crewName, config, onSave, onClose }) => {
    const [localConfig, setLocalConfig] = useState(config);

    const handleDayChange = (index: number, value: string) => {
        const newDays = [...localConfig.days];
        newDays[index] = value;
        setLocalConfig({ ...localConfig, days: newDays });
    };

    const cycleLength = useMemo(() => {
        const lastIndex = [...localConfig.days].reverse().findIndex(d => d.trim() !== '');
        return lastIndex === -1 ? 0 : localConfig.days.length - lastIndex;
    }, [localConfig.days]);

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col animate-in fade-in slide-in-from-right duration-300">
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center sticky top-0 z-40 shadow-lg">
                <div className="flex items-center space-x-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <div>
                        <h2 className="text-xl font-black">Pattern for {crewName}</h2>
                        <p className="text-xs opacity-80">Cycle Length: {cycleLength || '...'} days</p>
                    </div>
                </div>
            </div>
            
            <div className="flex-grow container mx-auto max-w-2xl p-6 py-10 space-y-10">
                <section className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">1</div>
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Select Start Date</h3>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Cycle Anchor (Day 1)</label>
                        <input 
                            type="date" 
                            value={localConfig.startDate} 
                            onChange={(e) => setLocalConfig({...localConfig, startDate: e.target.value})}
                            className="w-full p-4 rounded-2xl bg-white dark:bg-gray-900 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-indigo-500 transition shadow-sm"
                        />
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">2</div>
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Define Repeating Pattern</h3>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-end mb-6">
                            <span className="text-[10px] text-gray-400 font-bold italic">Type "Day" or "Night" for color coding. Empty fields mark the end of your cycle.</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {localConfig.days.map((day, i) => (
                                <div key={i} className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-gray-400 block ml-1 uppercase">Day {i + 1}</span>
                                    <input 
                                        type="text" 
                                        value={day} 
                                        placeholder="Off"
                                        onChange={(e) => handleDayChange(i, e.target.value)}
                                        className={`w-full p-3 text-sm rounded-xl bg-white dark:bg-gray-900 border-none ring-1 transition shadow-sm ${day.trim() !== '' ? 'ring-indigo-400 dark:ring-indigo-600' : 'ring-gray-200 dark:ring-gray-700'}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 sticky bottom-0 z-40">
                <div className="container mx-auto max-w-2xl flex space-x-4">
                    <button onClick={onClose} className="flex-1 py-4 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition">Cancel</button>
                    <button onClick={() => onSave(localConfig)} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-base font-black shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition">Save Pattern</button>
                </div>
            </div>
        </div>
    );
};

const SettingsMenu: React.FC<{
  allDays: DayInfo[]; notes: Notes; customHolidays: CustomHoliday[];
  selectedCrew: Crew;
  crewNames: Record<Crew, string>;
  starredDays: StarredDays;
  customConfigs: Record<Crew, CustomScheduleConfig | null>;
  onAddCustomHoliday: (start: string, end: string) => void;
  onDeleteCustomHoliday: (holiday: CustomHoliday) => void;
  onCrewChange: (crew: Crew) => void;
  onCrewNameChange: (crew: Crew, name: string) => void;
  onUpdateCustomConfig: (crew: Crew, config: CustomScheduleConfig | null) => void;
  onOpenPatternConfig: () => void;
}> = ({ allDays, notes, customHolidays, selectedCrew, crewNames, starredDays, customConfigs, onAddCustomHoliday, onDeleteCustomHoliday, onCrewChange, onCrewNameChange, onUpdateCustomConfig, onOpenPatternConfig }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingCrew, setEditingCrew] = useState<Crew | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setEditingCrew(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdateApp = async () => {
    const confirmed = window.confirm('Check for updates? Your data is safe.');
    if (confirmed) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) await reg.unregister();
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
        window.location.reload();
    }
  };

  const groupedDays = useMemo(() => allDays.reduce((acc, day) => {
      const monthYearKey = getMonthYear(day.date);
      if (!acc[monthYearKey]) acc[monthYearKey] = [];
      acc[monthYearKey].push(day);
      return acc;
    }, {} as GroupedDays), [allDays]);
  
  const generateCsv = (monthYear: string, daysInMonth: DayInfo[]) => {
    const rows = daysInMonth
      .map(day => ({ 
          day, 
          note: notes[formatDateKey(day.date)] || '',
          isStarred: !!starredDays[formatDateKey(day.date)] 
        }))
      .filter(({ note }) => note.trim() !== '');

    if (rows.length === 0) return alert(`No notes found for ${monthYear}.`);
    
    const headers = ["Date", "Weekday", "Shift", "Starred", "Notes"];
    const csvContent = [headers.join(','), ...rows.map(({ day, note, isStarred }) => [formatDateKey(day.date), day.date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }), day.shiftDetail, isStarred ? '★' : '', `"${note.replace(/"/g, '""')}"`].join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `notes-summary-${monthYear}.csv`;
    link.click();
  };

  const isCurrentlyCustom = customConfigs[selectedCrew] && customConfigs[selectedCrew]!.days.some(d => d.trim() !== '');

  return (
    <div ref={menuRef} className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-xl ring-1 ring-black/10 z-50 max-h-[85vh] overflow-y-auto border border-gray-100 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-bold text-gray-500 uppercase mb-3">Schedules</p>
              <div className="space-y-2">
                  {Object.values(Crew).map(crew => (
                      <div key={crew} className="flex items-center space-x-2">
                        <button 
                            onClick={() => onCrewChange(crew)} 
                            className={`flex-grow px-3 py-2 rounded-md text-sm font-semibold transition text-left ${selectedCrew === crew ? 'bg-indigo-600 text-white shadow' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'}`}
                        >
                            {crewNames[crew]}
                        </button>
                        <button 
                            onClick={() => setEditingCrew(editingCrew === crew ? null : crew)} 
                            className={`p-2 rounded-md transition ${editingCrew === crew ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                      </div>
                  ))}
              </div>
              {editingCrew && (
                  <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-md">
                      <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase mb-1">Rename Schedule</p>
                      <input 
                        autoFocus
                        type="text" 
                        value={crewNames[editingCrew]} 
                        onChange={(e) => onCrewNameChange(editingCrew, e.target.value)}
                        onBlur={() => setEditingCrew(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingCrew(null)}
                        className="w-full p-2 text-sm rounded bg-white dark:bg-gray-800 border-none ring-1 ring-indigo-200 dark:ring-indigo-700"
                      />
                  </div>
              )}

              <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                  <p className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase mb-2 tracking-widest">Adjust Pattern for {crewNames[selectedCrew]}</p>
                  <button 
                    onClick={() => {
                        onOpenPatternConfig();
                        setIsOpen(false);
                    }}
                    className="w-full py-3 bg-white dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 text-xs font-black uppercase rounded-lg border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 hover:text-indigo-500 transition shadow-sm"
                  >
                    {isCurrentlyCustom ? 'Edit Pattern' : 'Create Custom Pattern'}
                  </button>
                  {isCurrentlyCustom && (
                      <button 
                        onClick={() => {
                            if(confirm(`Reset ${crewNames[selectedCrew]} to the default rotation?`)) {
                                onUpdateCustomConfig(selectedCrew, null);
                            }
                        }}
                        className="w-full mt-2 py-1 text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase transition"
                      >
                        Reset to Default
                      </button>
                  )}
              </div>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Download Summary</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                    {Object.keys(groupedDays).sort().map(my => (<button key={my} onClick={() => generateCsv(my, groupedDays[my])} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition">{new Date(groupedDays[my][0].date).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })}</button>))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Holidays & Vacations</p>
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-1.5 text-xs rounded-md bg-gray-50 dark:bg-gray-700 border-none ring-1 ring-gray-300 dark:ring-gray-600" />
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-1.5 text-xs rounded-md bg-gray-50 dark:bg-gray-700 border-none ring-1 ring-gray-300 dark:ring-gray-600" />
                    </div>
                    <button onClick={() => { onAddCustomHoliday(startDate, endDate); setStartDate(''); setEndDate(''); }} className="w-full py-2 bg-indigo-600 text-white rounded-md text-xs font-bold shadow hover:bg-indigo-700 transition">Add Range</button>
                    <div className="max-h-24 overflow-y-auto space-y-1 mt-2">
                        {customHolidays.map((h, i) => (
                            <div key={i} className="flex justify-between items-center p-1.5 bg-gray-50 dark:bg-gray-700 rounded text-[10px]">
                                <span>{h.start} to {h.end}</span>
                                <button onClick={() => onDeleteCustomHoliday(h)} className="text-red-500 hover:text-red-700">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
          </div>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={handleUpdateApp} className="w-full flex items-center justify-center py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md text-xs font-bold hover:bg-gray-200 transition">Update App</button>
          </div>
        </div>
      )}
    </div>
  );
};

const shiftBgColors = { [ShiftType.DAY]: 'bg-green-100 dark:bg-green-900/40 hover:bg-green-200 dark:hover:bg-green-800/50', [ShiftType.NIGHT]: 'bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-800/50', [ShiftType.OFF]: 'bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-800/50' };
const shiftTextColors = { [ShiftType.DAY]: 'text-green-700 dark:text-green-200', [ShiftType.NIGHT]: 'text-red-700 dark:text-red-200', [ShiftType.OFF]: 'text-blue-700 dark:text-blue-200' };
const StarIcon = () => (<svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>);

const CalendarDay: React.FC<{
    dayInfo: DayInfo;
    isToday: boolean;
    isStarred: boolean;
    hasNote: boolean;
    onDayClick: (date: Date) => void;
}> = React.memo(({ dayInfo, isToday, isStarred, hasNote, onDayClick }) => {
    const { date, shift, shiftDetail, holiday, isCustomHoliday } = dayInfo;
    const isOT = isStarred && shift === ShiftType.OFF && hasNote;
    
    return (
        <div className={`relative p-1.5 pb-6 flex flex-col min-h-[100px] sm:min-h-[120px] h-full border-r border-b border-gray-300 dark:border-gray-600 cursor-pointer transition-colors duration-200 overflow-hidden ${shiftBgColors[shift]} ${isToday ? 'ring-2 ring-indigo-500 z-10' : ''}`} onClick={() => onDayClick(date)} role="button">
            <div className="flex justify-between items-start">
                <span className={`text-[10px] font-black ${isToday ? 'bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center' : 'text-gray-700 dark:text-gray-300'}`}>{date.getUTCDate()}</span>
                <div className="flex items-center space-x-1">{hasNote && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>}{isStarred && <StarIcon />}</div>
            </div>
            <div className="flex-grow flex flex-col justify-center items-center text-center mt-1">
                {isOT && <span className="text-[8px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-tighter mb-0.5">Overtime</span>}
                <p className={`text-[11px] font-bold ${shiftTextColors[shift]} leading-tight break-words max-w-full px-0.5`}>{shiftDetail}</p>
                {holiday && <p className="text-[8px] text-gray-500 truncate w-full" title={holiday}>{holiday}</p>}
            </div>
            {isCustomHoliday && (<div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400"></div>)}
        </div>
    );
});

const Calendar: React.FC<{ currentDate: Date; daysMap: Map<string, DayInfo>; starredDays: StarredDays; notes: Notes; onDayClick: (date: Date) => void; }> = ({ currentDate, daysMap, starredDays, notes, onDayClick }) => {
  const month = currentDate.getUTCMonth();
  const year = currentDate.getUTCFullYear();
  const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const grid = [];
  
  for (let i = 0; i < firstDay; i++) grid.push(<div key={`p-${i}`} className="border-r border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30"></div>);
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(Date.UTC(year, month, day));
    const k = formatDateKey(d);
    const info = daysMap.get(k);
    if (info) grid.push(<CalendarDay key={k} dayInfo={info} isToday={isSameDay(d, new Date())} isStarred={!!starredDays[k]} hasNote={!!notes[k]} onDayClick={onDayClick}/>);
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (<div key={i} className="p-2 text-center text-[10px] font-bold text-gray-400 uppercase">{day}</div>))}
        </div>
        <div className="grid grid-cols-7 flex-grow border-l border-t border-gray-200 dark:border-gray-700">{grid}</div>
    </div>
  );
};

const DayDetailModal: React.FC<{ dayInfo: DayInfo; note: string; isStarred: boolean; onClose: () => void; onNoteChange: (date: Date, note: string) => void; onToggleStar: (date: Date) => void; }> = ({ dayInfo, note, isStarred, onClose, onNoteChange, onToggleStar }) => {
  const { date, shift, shiftDetail, holiday } = dayInfo;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-sm overflow-hidden animate-in zoom-in duration-200">
        <div className={`p-6 ${shift === ShiftType.DAY ? 'bg-green-500' : shift === ShiftType.NIGHT ? 'bg-red-500' : 'bg-blue-500'} text-white`}>
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold">{date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' })}</h2>
                    <p className="text-sm opacity-90 font-medium">{[shiftDetail, holiday].filter(Boolean).join(' • ')}</p>
                </div>
                <button onClick={() => onToggleStar(date)} className={`p-2 rounded-full transition ${isStarred ? 'bg-white/20' : 'hover:bg-black/10'}`}>
                    <svg className={`w-6 h-6 ${isStarred ? 'text-yellow-300' : 'text-white/60'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                </button>
            </div>
        </div>
        <div className="p-6">
            <textarea value={note} onChange={(e) => onNoteChange(date, e.target.value)} placeholder="Notes for today..." className="w-full h-40 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-indigo-500 transition text-sm text-gray-800 dark:text-gray-100" />
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
             <button onClick={onClose} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition">Close</button>
        </div>
      </div>
    </div>
  );
};

const Header: React.FC<{
  currentDate: Date; onPrevMonth: () => void; onNextMonth: () => void; onGoToToday: () => void;
  allDays: DayInfo[]; notes: Notes; customHolidays: CustomHoliday[];
  selectedCrew: Crew;
  crewNames: Record<Crew, string>;
  starredDays: StarredDays;
  customConfigs: Record<Crew, CustomScheduleConfig | null>;
  onAddCustomHoliday: (start: string, end: string) => void;
  onDeleteCustomHoliday: (holiday: CustomHoliday) => void;
  onCrewChange: (crew: Crew) => void;
  onCrewNameChange: (crew: Crew, name: string) => void;
  onUpdateCustomConfig: (crew: Crew, config: CustomScheduleConfig | null) => void;
  onOpenPatternConfig: () => void;
}> = (props) => {
  const monthName = props.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-gray-800/80">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex-1">
            <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight sm:block hidden">Shift Planner</h1>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-3 py-0.5 rounded-full uppercase truncate max-w-[120px] inline-block">
                {props.crewNames[props.selectedCrew]}
            </span>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
            <button onClick={props.onPrevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
            <div className="flex flex-col items-center">
                <h2 className="text-sm sm:text-base font-bold text-center min-w-[120px]">{monthName}</h2>
                <button onClick={props.onGoToToday} className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 hover:underline">Today</button>
            </div>
            <button onClick={props.onNextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        </div>
        <div className="flex-1 flex justify-end">
            <SettingsMenu {...props} />
        </div>
      </div>
    </header>
  );
};

// ====== APP COMPONENT ======
const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'calendar' | 'pattern-config'>('calendar');
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1));
  });

  const [notes, setNotes] = useLocalStorage<Notes>('daily-notes', {});
  const [starredDays, setStarredDays] = useLocalStorage<StarredDays>('starred-days', {});
  const [selectedDay, setSelectedDay] = useState<DayInfo | null>(null);
  const [customHolidays, setCustomHolidays] = useLocalStorage<CustomHoliday[]>('custom-holidays', []);
  const [selectedCrew, setSelectedCrew] = useLocalStorage<Crew>('selected-crew', Crew.C);
  const [crewNames, setCrewNames] = useLocalStorage<Record<Crew, string>>('crew-names', {
      [Crew.A]: 'Roger',
      [Crew.B]: 'Ted',
      [Crew.C]: 'Steve',
  });
  const [customConfigs, setCustomConfigs] = useLocalStorage<Record<Crew, CustomScheduleConfig | null>>('custom-crew-configs', {
      [Crew.A]: null,
      [Crew.B]: null,
      [Crew.C]: null,
  });

  const days = useMemo<DayInfo[]>(() => {
    const year = currentDate.getUTCFullYear();
    const month = currentDate.getUTCMonth();
    
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 0));
    
    const dayArray: DayInfo[] = [];
    let current = new Date(start);
    
    const isDateInRanges = (d: Date, ranges: CustomHoliday[]): boolean => {
        const dk = formatDateKey(d);
        return ranges.some(r => dk >= r.start && dk <= r.end);
    };

    while (current <= end) {
      dayArray.push({
        date: new Date(current),
        ...getShiftForDate(new Date(current), selectedCrew, customConfigs),
        isCustomHoliday: isDateInRanges(current, customHolidays),
      });
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return dayArray;
  }, [currentDate, customHolidays, selectedCrew, customConfigs]);

  const daysMap = useMemo(() => new Map(days.map(d => [formatDateKey(d.date), d])), [days]);

  const monthOTCount = useMemo(() => {
    const my = getMonthYear(currentDate);
    return days.filter(d => 
        getMonthYear(d.date) === my && 
        d.shift === ShiftType.OFF && 
        starredDays[formatDateKey(d.date)]
    ).length;
  }, [currentDate, days, starredDays]);

  const handleUpdateCustomConfig = (crew: Crew, config: CustomScheduleConfig | null) => {
      setCustomConfigs(prev => ({...prev, [crew]: config}));
  };

  const currentCustomConfig = customConfigs[selectedCrew] || { startDate: formatDateKey(new Date()), days: Array(28).fill('') };

  if (activeView === 'pattern-config') {
      return (
          <CustomSchedulePage 
            crewName={crewNames[selectedCrew]}
            config={currentCustomConfig} 
            onSave={(config) => { 
                handleUpdateCustomConfig(selectedCrew, config); 
                setActiveView('calendar'); 
            }} 
            onClose={() => setActiveView('calendar')} 
          />
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col font-sans selection:bg-indigo-100 overflow-x-hidden">
      <Header 
        currentDate={currentDate}
        onPrevMonth={() => setCurrentDate(prev => { const d = new Date(prev); d.setUTCMonth(d.getUTCMonth() - 1, 1); return d; })}
        onNextMonth={() => setCurrentDate(prev => { const d = new Date(prev); d.setUTCMonth(d.getUTCMonth() + 1, 1); return d; })}
        onGoToToday={() => {
            const t = new Date();
            setCurrentDate(new Date(Date.UTC(t.getFullYear(), t.getMonth(), 1)));
        }}
        allDays={days}
        notes={notes}
        customHolidays={customHolidays}
        selectedCrew={selectedCrew}
        crewNames={crewNames}
        starredDays={starredDays}
        customConfigs={customConfigs}
        onAddCustomHoliday={(s, e) => setCustomHolidays(prev => [...prev, { start: s, end: e }])}
        onDeleteCustomHoliday={h => setCustomHolidays(prev => prev.filter(p => p.start !== h.start))}
        onCrewChange={setSelectedCrew}
        onCrewNameChange={(crew, name) => setCrewNames(prev => ({...prev, [crew]: name}))}
        onUpdateCustomConfig={handleUpdateCustomConfig}
        onOpenPatternConfig={() => setActiveView('pattern-config')}
      />
      <main className="flex-grow container mx-auto p-4 sm:p-6 max-w-4xl space-y-6">
        <div className="flex justify-between items-center mb-2 px-2">
            <div className="flex flex-col">
                <span className="text-2xl font-black text-gray-900 dark:text-white">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Monthly Shift Schedule</span>
            </div>
            {monthOTCount > 0 && (
                <div className="flex flex-col items-end">
                    <span className="text-orange-600 dark:text-orange-400 font-black text-xl">{monthOTCount}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">OT Days</span>
                </div>
            )}
        </div>
        <Calendar currentDate={currentDate} daysMap={daysMap} starredDays={starredDays} notes={notes} onDayClick={d => setSelectedDay(daysMap.get(formatDateKey(d)) || null)}/>
        
        {/* Monthly Summary Section */}
        <div className="pb-10">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4 border-b pb-2 dark:border-gray-700">Starred Notes</h3>
                <ul className="space-y-4">
                    {days.filter(d => getMonthYear(d.date) === getMonthYear(currentDate) && starredDays[formatDateKey(d.date)] && notes[formatDateKey(d.date)]).length > 0 ? (
                        days.filter(d => getMonthYear(d.date) === getMonthYear(currentDate) && starredDays[formatDateKey(d.date)] && notes[formatDateKey(d.date)]).map(d => (
                            <li key={formatDateKey(d.date)} className="group flex space-x-3 items-start">
                                <div className="mt-1"><StarIcon /></div>
                                <div>
                                    <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{d.date.toLocaleDateString('en-US', { day: 'numeric', weekday: 'short', timeZone: 'UTC' })}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{notes[formatDateKey(d.date)]}</p>
                                </div>
                            </li>
                        ))
                    ) : (
                        <li className="text-xs text-gray-400 italic">No starred notes this month.</li>
                    )}
                </ul>
            </div>
        </div>
      </main>
      {selectedDay && <DayDetailModal dayInfo={selectedDay} note={notes[formatDateKey(selectedDay.date)] || ''} isStarred={!!starredDays[formatDateKey(selectedDay.date)]} onClose={() => setSelectedDay(null)} onNoteChange={(d, n) => setNotes(p => ({...p, [formatDateKey(d)]: n}))} onToggleStar={d => setStarredDays(p => ({...p, [formatDateKey(d)]: !p[formatDateKey(d)]}))} />}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);
