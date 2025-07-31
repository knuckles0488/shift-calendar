
import React from 'react';
import SettingsMenu from './SettingsMenu';
import type { DayInfo, Notes, CustomHoliday } from '../types';

interface HeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  allDays: DayInfo[];
  notes: Notes;
  customHolidays: CustomHoliday[];
  onAddCustomHoliday: (start: string, end: string) => void;
  onDeleteCustomHoliday: (holiday: CustomHoliday) => void;
}

const Header: React.FC<HeaderProps> = ({ currentDate, onPrevMonth, onNextMonth, allDays, notes, customHolidays, onAddCustomHoliday, onDeleteCustomHoliday }) => {
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="w-1/3">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white hidden sm:block">
              Shift Planner
            </h1>
          </div>
          <div className="w-1/3 flex justify-center items-center space-x-2 md:space-x-4">
            <button onClick={onPrevMonth} aria-label="Previous month" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <h2 className="text-lg md:text-xl font-semibold text-center w-40 md:w-48">{monthName}</h2>
            <button onClick={onNextMonth} aria-label="Next month" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
          <div className="w-1/3 flex justify-end">
            <SettingsMenu allDays={allDays} notes={notes} customHolidays={customHolidays} onAddCustomHoliday={onAddCustomHoliday} onDeleteCustomHoliday={onDeleteCustomHoliday} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
