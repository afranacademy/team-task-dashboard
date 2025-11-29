import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, ChevronLeft, ChevronRight, Plus, X, MoreVertical } from 'lucide-react';
import { getMonthDays, isToday, isSameDay, addMonths } from '../lib/calendarUtils';
import { formatJalaliDate } from '../lib/dateJalali';
import { cn } from './ui/utils';

interface CalendarItem {
  id: string;
  name: string;
  color: string;
  checked: boolean;
}

interface CalendarSidebarProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  showPersonal: boolean;
  onShowPersonalChange: (show: boolean) => void;
  showProject: boolean;
  onShowProjectChange: (show: boolean) => void;
}

export function CalendarSidebar({
  currentMonth,
  onMonthChange,
  selectedDate,
  onSelectDate,
  showPersonal,
  onShowPersonalChange,
  showProject,
  onShowProjectChange,
}: CalendarSidebarProps) {
  const days = getMonthDays(currentMonth);
  
  const [calendars, setCalendars] = useState<CalendarItem[]>([
    { id: '1', name: 'وظایف شخصی', color: '#3b82f6', checked: showPersonal },
    { id: '2', name: 'وظایف پروژه', color: '#22c55e', checked: showProject },
    { id: '3', name: 'تولدها', color: '#10b981', checked: true },
  ]);
  
  const [isAddingCalendar, setIsAddingCalendar] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState('');

  const handleDayClick = (date: Date) => {
    onSelectDate(date);
    if (date.getMonth() !== currentMonth.getMonth()) {
      onMonthChange(date);
    }
  };

  const handlePrevMonth = () => {
    onMonthChange(addMonths(currentMonth, -1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  const handleToggleCalendar = (id: string, checked: boolean) => {
    setCalendars(calendars.map(cal => 
      cal.id === id ? { ...cal, checked } : cal
    ));
    
    // Update parent state for built-in calendars
    if (id === '1') onShowPersonalChange(checked);
    if (id === '2') onShowProjectChange(checked);
  };

  const handleRemoveCalendar = (id: string) => {
    // Don't allow removing built-in calendars
    if (id === '1' || id === '2') return;
    setCalendars(calendars.filter(cal => cal.id !== id));
  };

  const handleAddCalendar = () => {
    if (!newCalendarName.trim()) return;
    
    const colors = ['#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    setCalendars([...calendars, {
      id: Date.now().toString(),
      name: newCalendarName,
      color: randomColor,
      checked: true,
    }]);
    
    setNewCalendarName('');
    setIsAddingCalendar(false);
  };

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col p-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl">تقویم</h1>
        <button className="p-1 hover:bg-gray-100 rounded">
          <div className="w-5 h-5 border border-gray-400 rounded"></div>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="جستجوی رویداد..."
          className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          dir="rtl"
        />
      </div>

      {/* Mini Calendar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm">
            {formatJalaliDate(currentMonth.toISOString().split('T')[0]).split(' ')[0]}
          </span>
          <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
          {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((day, i) => (
            <div key={i} className="text-gray-500 py-1">{day}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 text-xs text-center">
          {days.slice(0, 42).map((day) => {
            const isSelected = selectedDate && isSameDay(day.date, selectedDate);
            const isTodayDate = isToday(day.date);

            return (
              <button
                key={day.iso}
                onClick={() => handleDayClick(day.date)}
                className={cn(
                  'py-1 rounded transition-colors',
                  !day.isCurrentMonth && 'text-gray-300',
                  day.isCurrentMonth && 'text-gray-700 hover:bg-gray-100 cursor-pointer',
                  isTodayDate && 'bg-blue-500 text-white font-medium',
                  isSelected && !isTodayDate && 'bg-gray-200'
                )}
              >
                {day.dayNumber || ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* My Calendars */}
      <div className="mb-6 flex-1 overflow-auto">
        <h3 className="text-sm mb-3">تقویم‌های من</h3>
        <div className="space-y-1">
          {calendars.map((calendar) => (
            <div
              key={calendar.id}
              className="flex items-center gap-2 py-1 px-1 rounded hover:bg-gray-50 group"
            >
              <input
                type="checkbox"
                checked={calendar.checked}
                onChange={(e) => handleToggleCalendar(calendar.id, e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer"
                style={{ accentColor: calendar.color }}
              />
              <span className="text-sm flex-1">{calendar.name}</span>
              {calendar.id !== '1' && calendar.id !== '2' && (
                <button
                  onClick={() => handleRemoveCalendar(calendar.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                  title="Remove calendar"
                >
                  <X className="w-3 h-3 text-gray-600" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Calendar Input */}
        {isAddingCalendar && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newCalendarName}
              onChange={(e) => setNewCalendarName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCalendar();
                if (e.key === 'Escape') {
                  setIsAddingCalendar(false);
                  setNewCalendarName('');
                }
              }}
              placeholder="نام تقویم..."
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              dir="rtl"
            />
            <button
              onClick={handleAddCalendar}
              className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              افزودن
            </button>
          </div>
        )}
      </div>

      {/* Add Calendar Button */}
      <button
        onClick={() => setIsAddingCalendar(true)}
        className="w-full bg-blue-500 text-white py-2.5 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm">افزودن تقویم</span>
      </button>
    </div>
  );
}
