import { ChevronLeft, ChevronRight, HelpCircle, Settings } from 'lucide-react';
import { formatJalaliDate } from '../lib/dateJalali';
import { addMonths } from '../lib/calendarUtils';
import { cn } from './ui/utils';

interface CalendarHeaderProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  viewMode: 'month' | 'week' | 'day';
  onViewModeChange: (mode: 'month' | 'week' | 'day') => void;
}

export function CalendarHeader({
  currentMonth,
  onMonthChange,
  viewMode,
  onViewModeChange,
}: CalendarHeaderProps) {
  const handlePrevMonth = () => {
    onMonthChange(addMonths(currentMonth, -1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    onMonthChange(new Date());
  };

  const monthYear = formatJalaliDate(currentMonth.toISOString().split('T')[0]);

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long' });
  const year = currentMonth.getFullYear();

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200" dir="rtl">
      {/* Right side: Month name + Today button + Navigation */}
      <div className="flex items-center gap-4">
        <h2 className="text-xl">
          {monthYear.split(' ')[0]} <span className="text-gray-600">{monthYear.split(' ')[1]}</span>
        </h2>
        <button
          onClick={handleToday}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
        >
          امروز
        </button>
        <div className="flex items-center gap-1">
          <button onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-100 rounded">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={handleNextMonth} className="p-1.5 hover:bg-gray-100 rounded">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Left side: Settings + View mode */}
      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <HelpCircle className="w-5 h-5 text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center border border-gray-300 rounded-lg">
          <button
            onClick={() => onViewModeChange('day')}
            className={cn(
              'px-3 py-1.5 text-sm',
              viewMode === 'day' && 'bg-gray-100'
            )}
          >
            روز
          </button>
          <button
            onClick={() => onViewModeChange('week')}
            className={cn(
              'px-3 py-1.5 text-sm',
              viewMode === 'week' && 'bg-gray-100'
            )}
          >
            هفته
          </button>
          <button
            onClick={() => onViewModeChange('month')}
            className={cn(
              'px-3 py-1.5 text-sm',
              viewMode === 'month' && 'bg-gray-100'
            )}
          >
            ماه
          </button>
        </div>
      </div>
    </div>
  );
}
