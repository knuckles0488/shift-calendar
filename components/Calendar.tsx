
import React from 'react';
import type { DayInfo, StarredDays, Notes } from '../types';
import { formatDateKey, isSameDay } from '../utils/date';
import CalendarDay from './CalendarDay';

interface CalendarProps {
  currentDate: Date;
  daysMap: Map<string, DayInfo>;
  starredDays: StarredDays;
  notes: Notes;
  onDayClick: (date: Date) => void;
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Calendar: React.FC<CalendarProps> = ({ currentDate, daysMap, starredDays, notes, onDayClick }) => {
  const today = new Date();

  const renderCalendarGrid = () => {
    const month = currentDate.getUTCMonth();
    const year = currentDate.getUTCFullYear();

    const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const startingDayOfWeek = firstDayOfMonth.getUTCDay();

    const grid = [];
    
    // Add padding days from previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
        grid.push(<div key={`pad-prev-${i}`} className="border-r border-b border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50"></div>);
    }
    
    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(Date.UTC(year, month, day));
        const key = formatDateKey(date);
        const dayInfo = daysMap.get(key);
        
        if (dayInfo) {
            grid.push(
                <CalendarDay 
                    key={key}
                    dayInfo={dayInfo}
                    isToday={isSameDay(date, today)}
                    isStarred={!!starredDays[key]}
                    hasNote={!!notes[key]}
                    onClick={() => onDayClick(date)}
                />
            );
        } else {
             grid.push(<div key={`pad-day-${day}`} className="border-r border-b border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50"></div>);
        }
    }
    
    return grid;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-full flex flex-col">
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
            {WEEK_DAYS.map(day => (
                <div key={day} className="p-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {day}
                </div>
            ))}
        </div>
        <div className="grid grid-cols-7 grid-rows-6 flex-grow">
            {renderCalendarGrid()}
        </div>
    </div>
  );
};

export default Calendar;
