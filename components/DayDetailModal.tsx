import React, { useEffect, useRef } from 'react';
import type { DayInfo } from '../types';
import { ShiftType } from '../types';

interface DayDetailModalProps {
  dayInfo: DayInfo;
  note: string;
  isStarred: boolean;
  onClose: () => void;
  onNoteChange: (date: Date, note: string) => void;
  onToggleStar: (date: Date) => void;
}

const shiftHeaderStyles = {
  [ShiftType.DAY]: 'bg-green-500 text-white',
  [ShiftType.NIGHT]: 'bg-red-500 text-white',
  [ShiftType.OFF]: 'bg-blue-500 text-white',
};

const StarButton = ({ isStarred, onClick }: { isStarred: boolean, onClick: () => void }) => (
    <button onClick={onClick} className={`p-2 rounded-full transition-colors ${isStarred ? 'bg-yellow-400/20' : 'hover:bg-gray-500/20'}`} aria-label={isStarred ? "Unstar this day" : "Star this day"}>
        <svg className={`w-6 h-6 ${isStarred ? 'text-yellow-400' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
    </button>
)

const DayDetailModal: React.FC<DayDetailModalProps> = ({ dayInfo, note, isStarred, onClose, onNoteChange, onToggleStar }) => {
  const { date, shift, holiday, specialEvent } = dayInfo;
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const fullDateString = date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
  });

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
            <textarea
                id="notes"
                value={note}
                onChange={(e) => onNoteChange(date, e.target.value)}
                placeholder="Add your notes for the day..."
                className="w-full h-40 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                autoFocus
            />
        </div>
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 flex justify-end">
             <button onClick={onClose} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors text-sm font-semibold">
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default DayDetailModal;