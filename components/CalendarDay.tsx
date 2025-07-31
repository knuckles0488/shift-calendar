import React from 'react';
import type { DayInfo } from '../types';
import { ShiftType } from '../types';

interface CalendarDayProps {
  dayInfo: DayInfo;
  isToday: boolean;
  isStarred: boolean;
  hasNote: boolean;
  onClick: () => void;
}

const shiftBgColors = {
  [ShiftType.DAY]: 'bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-800/60',
  [ShiftType.NIGHT]: 'bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800/60',
  [ShiftType.OFF]: 'bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800/60',
};

const shiftTextColors = {
    [ShiftType.DAY]: 'text-green-800 dark:text-green-200',
    [ShiftType.NIGHT]: 'text-red-800 dark:text-red-200',
    [ShiftType.OFF]: 'text-blue-800 dark:text-blue-200',
}

const StarIcon = () => (
    <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
);

const NoteIcon = () => (
    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
);

const CalendarDay: React.FC<CalendarDayProps> = ({ dayInfo, isToday, isStarred, hasNote, onClick }) => {
  const { date, shift, holiday, specialEvent } = dayInfo;
  
  const baseClasses = "relative p-1.5 pb-5 flex flex-col h-full border-r border-b border-gray-200 dark:border-gray-700/50 cursor-pointer transition-colors duration-200";
  const todayRing = isToday ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 z-10' : '';
  
  return (
    <div className={`${baseClasses} ${shiftBgColors[shift]} ${todayRing}`} onClick={onClick} role="button" aria-label={`View details for ${date.toDateString()}`}>
        <div className="flex justify-between items-start">
            <span className={`text-xs font-bold ${isToday ? 'bg-indigo-600 text-white rounded-full flex items-center justify-center w-5 h-5' : 'text-gray-700 dark:text-gray-300'}`}>
                {date.getUTCDate()}
            </span>
            <div className="flex items-center space-x-1">
              {hasNote && <NoteIcon />}
              {isStarred && <StarIcon />}
            </div>
        </div>
        <div className="flex-grow flex flex-col justify-center items-center text-center mt-1">
            {specialEvent && <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">{specialEvent}</p>}
            <p className={`text-xs font-semibold ${shiftTextColors[shift]}`}>{shift}</p>
            {holiday && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate leading-tight" title={holiday}>{holiday}</p>}
        </div>
        {dayInfo.isCustomHoliday && (
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-yellow-400 text-black text-[10px] font-bold flex items-center justify-center pointer-events-none">
                Holidays
            </div>
        )}
    </div>
  );
};

export default CalendarDay;