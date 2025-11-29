import { useMemo } from 'react';
import type { Task } from '../types';
import { getMonthDays, getPersianWeekDays, isToday } from '../lib/calendarUtils';
import { cn } from './ui/utils';

interface CalendarMonthGridProps {
  currentMonth: Date;
  tasks: Task[];
  loading: boolean;
  onSelectDate: (date: Date) => void;
  onTaskClick?: (task: Task) => void;
}

export function CalendarMonthGrid({
  currentMonth,
  tasks,
  loading,
  onSelectDate,
  onTaskClick,
}: CalendarMonthGridProps) {
  const days = getMonthDays(currentMonth);
  const weekDays = getPersianWeekDays();

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach(task => {
      const dateKey = task.date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(task);
    });
    return map;
  }, [tasks]);

  const getTaskColor = (task: Task): string => {
    if (task.projectId && !task.isPrivate) {
      return 'bg-purple-200 text-purple-700';
    }
    return 'bg-blue-200 text-blue-700';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">در حال بارگذاری...</div>
      </div>
    );
  }

  // Create 6 rows of 7 days
  const calendarRows = [];
  for (let i = 0; i < 42; i += 7) {
    calendarRows.push(days.slice(i, i + 7));
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" dir="rtl">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {weekDays.map((day) => (
          <div key={day} className="py-3 text-center text-sm text-gray-600 border-l border-gray-200 first:border-l-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid - 6 rows */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6">
        {days.slice(0, 42).map((day) => {
          const dayTasks = tasksByDate.get(day.iso) ?? [];
          const isTodayDate = isToday(day.date);

          return (
            <div
              key={day.iso}
              className="border-l border-b border-gray-200 first:border-l-0 p-2 bg-white hover:bg-gray-50 cursor-pointer overflow-hidden"
              onClick={() => onSelectDate(day.date)}
            >
              {day.dayNumber && (
                <>
                  <div
                    className={cn(
                      'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm mb-1',
                      isTodayDate ? 'bg-blue-500 text-white font-medium' : day.isCurrentMonth ? 'text-gray-700' : 'text-gray-300'
                    )}
                  >
                    {day.dayNumber}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          getTaskColor(task),
                          'px-2 py-1 rounded text-xs truncate cursor-pointer hover:opacity-80'
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick?.(task);
                        }}
                        title={task.title}
                        dir="rtl"
                      >
                        {task.title}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
