import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

export type DateFilterType = 'All' | 'Today' | 'This week' | 'This Month' | 'This Year' | 'Custom Date' | 'Custom Range';

export interface DateFilterResult {
  type: DateFilterType;
  startDate: Date | null;
  endDate: Date | null;
}

interface DateFilterBarProps {
  onFilterChange: (filter: DateFilterResult) => void;
  defaultFilter?: DateFilterType;
}

export const DateFilterBar: React.FC<DateFilterBarProps> = ({ onFilterChange, defaultFilter = 'All' }) => {
  const [filterType, setFilterType] = useState<DateFilterType>(defaultFilter);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (filterType === 'Today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (filterType === 'This week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      startDate = new Date(now.getFullYear(), now.getMonth(), diff);
      endDate = new Date(now.getFullYear(), now.getMonth(), diff + 6, 23, 59, 59, 999);
    } else if (filterType === 'This Month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (filterType === 'This Year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (filterType === 'Custom Date' && customStart) {
      startDate = new Date(customStart);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customStart);
      endDate.setHours(23, 59, 59, 999);
    } else if (filterType === 'Custom Range') {
      if (customStart) {
        startDate = new Date(customStart);
        startDate.setHours(0, 0, 0, 0);
      }
      if (customEnd) {
        endDate = new Date(customEnd);
        endDate.setHours(23, 59, 59, 999);
      }
    }

    onFilterChange({ type: filterType, startDate, endDate });
  }, [filterType, customStart, customEnd]);

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border shadow-sm w-full sm:w-auto">
      <div className="flex items-center gap-2 pl-2 border-r pr-3">
        <Calendar size={16} className="text-gray-400" />
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest hidden sm:inline">Filter by</span>
      </div>
      <select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value as DateFilterType)}
        className="bg-gray-50 border-none outline-none text-sm font-bold px-3 py-1.5 rounded-lg cursor-pointer flex-1 sm:flex-initial"
      >
        <option value="All">All Time</option>
        <option value="Today">Today</option>
        <option value="This week">This Week</option>
        <option value="This Month">This Month</option>
        <option value="This Year">This Year</option>
        <option value="Custom Date">Custom Date</option>
        <option value="Custom Range">Custom Range</option>
      </select>

      {filterType === 'Custom Date' && (
        <input
          type="date"
          value={customStart}
          onChange={(e) => setCustomStart(e.target.value)}
          className="text-sm font-bold bg-gray-50 px-3 py-1.5 rounded-lg outline-none flex-1 sm:flex-initial"
        />
      )}

      {filterType === 'Custom Range' && (
        <div className="flex items-center gap-2 flex-1 sm:flex-initial">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="text-sm font-bold bg-gray-50 px-3 py-1.5 rounded-lg outline-none w-full sm:w-auto"
          />
          <span className="text-xs text-gray-400 font-bold">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="text-sm font-bold bg-gray-50 px-3 py-1.5 rounded-lg outline-none w-full sm:w-auto"
          />
        </div>
      )}
    </div>
  );
};
