
import React, { useState, useMemo, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getShiftForDate } from './utils/schedule';
import { formatDateKey } from './utils/date';
import type { DayInfo, Notes, StarredDays, CustomHoliday } from './types';
import Header from './components/Header';
import Calendar from './components/Calendar';
import DayDetailModal from './components/DayDetailModal';

const App: React.FC = () => {
  const getInitialDate = () => {
    const today = new Date();
    const startDate = new Date('2025-07-01T00:00:00Z');
    const endDate = new Date('2026-06-30T00:00:00Z');
    // Clamp today's date to be within the schedule range
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

  const daysMap = useMemo(() => {
    return new Map(days.map(day => [formatDateKey(day.date), day]));
  }, [days]);

  const handleNoteChange = useCallback((date: Date, note: string) => {
    const key = formatDateKey(date);
    setNotes(prev => ({ ...prev, [key]: note }));
  }, [setNotes]);

  const handleToggleStar = useCallback((date: Date) => {
    const key = formatDateKey(date);
    setStarredDays(prev => ({ ...prev, [key]: !prev[key] }));
    }, [setStarredDays]);

  const handlePrevMonth = useCallback(() => {
    setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setUTCMonth(newDate.getUTCMonth() - 1, 1);
        const scheduleStart = new Date('2025-07-01T00:00:00Z');

        if (newDate.getUTCFullYear() < scheduleStart.getUTCFullYear() || 
           (newDate.getUTCFullYear() === scheduleStart.getUTCFullYear() && newDate.getUTCMonth() < scheduleStart.getUTCMonth())) {
            return prev;
        }
        return newDate;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setUTCMonth(newDate.getUTCMonth() + 1, 1);
        const scheduleEnd = new Date('2026-06-30T00:00:00Z');

        if (newDate.getUTCFullYear() > scheduleEnd.getUTCFullYear() ||
           (newDate.getUTCFullYear() === scheduleEnd.getUTCFullYear() && newDate.getUTCMonth() > scheduleEnd.getUTCMonth())) {
            return prev;
        }
        return newDate;
    });
  }, []);
  
  const handleDayClick = useCallback((date: Date) => {
    const key = formatDateKey(date);
    const dayInfo = daysMap.get(key);
    if (dayInfo) {
      setSelectedDay(dayInfo);
    }
  }, [daysMap]);

  const handleAddCustomHoliday = useCallback((start: string, end: string) => {
    if (!start || !end || start > end) {
        alert("Please select a valid date range, ensuring the start date is not after the end date.");
        return;
    }
    setCustomHolidays(prev => [...prev, { start, end }]);
  }, [setCustomHolidays]);

  const handleDeleteCustomHoliday = useCallback((holidayToDelete: CustomHoliday) => {
    setCustomHolidays(prev => prev.filter(h => h.start !== holidayToDelete.start || h.end !== holidayToDelete.end));
  }, [setCustomHolidays]);


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
        <Calendar 
          currentDate={currentDate}
          daysMap={daysMap}
          starredDays={starredDays}
          onDayClick={handleDayClick}
          notes={notes}
        />
      </main>
      {selectedDay && (
         <DayDetailModal
            dayInfo={selectedDay}
            note={notes[formatDateKey(selectedDay.date)] || ''}
            isStarred={!!starredDays[formatDateKey(selectedDay.date)]}
            onClose={() => setSelectedDay(null)}
            onNoteChange={handleNoteChange}
            onToggleStar={handleToggleStar}
        />
      )}
    </div>
  );
};

export default App;
