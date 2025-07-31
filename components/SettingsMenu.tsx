
import React, { useState, useRef, useEffect } from 'react';
import type { DayInfo, Notes, GroupedDays, CustomHoliday } from '../types';
import { getMonthYear, formatDateKey } from '../utils/date';

declare global {
  interface Window {
    jspdf: any;
  }
}

interface SettingsMenuProps {
  allDays: DayInfo[];
  notes: Notes;
  customHolidays: CustomHoliday[];
  onAddCustomHoliday: (start: string, end: string) => void;
  onDeleteCustomHoliday: (holiday: CustomHoliday) => void;
}

const TrashIcon = () => (
    <svg className="w-4 h-4 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
);

const SettingsMenu: React.FC<SettingsMenuProps> = ({ allDays, notes, customHolidays, onAddCustomHoliday, onDeleteCustomHoliday }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddHoliday = () => {
      onAddCustomHoliday(startDate, endDate);
      setStartDate('');
      setEndDate('');
      // Don't close menu on add, user might want to add more.
  };

  const groupedDays = React.useMemo(() => {
    return allDays.reduce((acc, day) => {
      const monthYearKey = getMonthYear(day.date);
      if (!acc[monthYearKey]) {
        acc[monthYearKey] = [];
      }
      acc[monthYearKey].push(day);
      return acc;
    }, {} as GroupedDays);
  }, [allDays]);
  
  const generatePdf = (monthYear: string, daysInMonth: DayInfo[]) => {
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        alert("PDF generation library is not loaded. Please try again.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const monthName = new Date(daysInMonth[0].date).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    doc.setFontSize(18);
    doc.text(`Notes Summary for ${monthName}`, 14, 22);

    const tableColumn = ["Date", "Day", "Shift", "Notes"];
    const tableRows: (string|number)[][] = [];
    daysInMonth.forEach(day => {
      const note = notes[formatDateKey(day.date)] || '';
      if (note.trim() !== '') {
        const dateString = day.date.toLocaleDateString('en-US', { day: '2-digit', timeZone: 'UTC' });
        const dayOfWeek = day.date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
        tableRows.push([dateString, dayOfWeek, day.shift, note]);
      }
    });

    if (tableRows.length === 0) {
      alert(`No notes found for ${monthName} to generate a summary.`);
      return;
    }

    doc.autoTable({
        head: [tableColumn], body: tableRows, startY: 30,
        headStyles: { fillColor: [22, 160, 133] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
    });
    doc.save(`notes-summary-${monthYear}.pdf`);
  };

  return (
    <div ref={menuRef} className="relative">
      <button onClick={() => setIsOpen(!isOpen)} aria-haspopup="true" aria-expanded={isOpen} aria-label="Open settings menu" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-30">
          <div className="py-1">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Download Monthly PDF</div>
            <div className="max-h-48 overflow-y-auto">
                {Object.keys(groupedDays).sort().map(monthYear => (
                <button
                    key={monthYear}
                    onClick={() => {
                        generatePdf(monthYear, groupedDays[monthYear]);
                        setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    {new Date(groupedDays[monthYear][0].date).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                </button>
                ))}
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700"></div>
           <div className="p-4 space-y-4">
               <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Manage Custom Holidays</p>
                    <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                        {customHolidays.length > 0 ? customHolidays.map((holiday, index) => (
                            <div key={index} className="flex justify-between items-center text-xs bg-gray-100 dark:bg-gray-900/50 p-2 rounded-md">
                                <span className="font-mono text-gray-700 dark:text-gray-300">{holiday.start} to {holiday.end}</span>
                                <button onClick={() => onDeleteCustomHoliday(holiday)} aria-label={`Delete holiday from ${holiday.start} to ${holiday.end}`} className="p-1">
                                    <TrashIcon />
                                </button>
                            </div>
                        )) : (
                            <p className="text-xs text-center py-2 text-gray-500 dark:text-gray-400">No custom holidays added.</p>
                        )}
                    </div>
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
                    <button onClick={handleAddHoliday} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors text-sm font-semibold">
                        Add
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SettingsMenu;
