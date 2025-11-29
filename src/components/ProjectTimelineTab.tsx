import { useState, useMemo } from 'react';
import type { Project, TeamMember, Task, TaskStatus } from '../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ChevronLeft, ChevronRight, ArrowUpDown, Filter, MoreVertical } from 'lucide-react';
import { cn } from './ui/utils';

interface ProjectTimelineTabProps {
  project: Project;
  tasks: Task[];
  members: TeamMember[];
  currentUser: TeamMember;
  onTaskClick?: (task: Task) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

type ViewMode = 'day' | 'week' | 'month';

// Helper functions
function getEffectiveDates(task: Task): { start: Date; end: Date } {
  const taskDate = new Date(task.date);
  
  let start: Date;
  let end: Date;
  
  if (task.start_date) {
    start = new Date(task.start_date);
  } else {
    start = new Date(taskDate);
    start.setDate(start.getDate() - 1);
  }
  
  if (task.end_date) {
    end = new Date(task.end_date);
  } else {
    end = new Date(taskDate);
  }
  
  if (end < start) {
    end = new Date(start);
    end.setDate(end.getDate() + 1);
  }
  
  return { start, end };
}

function getDaysBetween(start: Date, end: Date): number {
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'Completed':
      return 'bg-white border-r-4 border-green-500';
    case 'In Progress':
      return 'bg-gradient-to-l from-blue-400 via-purple-300 to-orange-300 text-white';
    case 'To Do':
      return 'bg-white border-r-4 border-gray-300';
    default:
      return 'bg-white border-r-4 border-gray-400';
  }
}

function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'Completed':
      return 'انجام شده';
    case 'In Progress':
      return 'در حال انجام';
    case 'To Do':
      return 'باید انجام بشه';
    default:
      return status;
  }
}

function getPriorityColor(priority?: 'low' | 'medium' | 'high'): string {
  switch (priority) {
    case 'high':
      return 'border-red-500';
    case 'medium':
      return 'border-purple-500';
    case 'low':
      return 'border-orange-400';
    default:
      return 'border-gray-300';
  }
}

function formatMonthYear(date: Date): string {
  const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  return `${persianMonths[date.getMonth() % 12]} ${date.getFullYear()}`;
}

export function ProjectTimelineTab({
  project,
  tasks,
  members,
  currentUser,
  onTaskClick,
  onUpdateTask,
}: ProjectTimelineTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [showCompleted, setShowCompleted] = useState(true);
  const [timelineStart, setTimelineStart] = useState<Date>(() => {
    const today = new Date();
    today.setDate(today.getDate() - 3); // Start a few days before today
    return today;
  });
  const [draggedTask, setDraggedTask] = useState<{ task: Task; startX: number; initialStart: Date } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(t => t.projectId === project.id);
    if (!showCompleted) {
      filtered = filtered.filter(t => t.status !== 'Completed');
    }
    console.log('Timeline - Total tasks:', tasks.length);
    console.log('Timeline - Project tasks:', filtered.length);
    console.log('Timeline - Project ID:', project.id);
    return filtered;
  }, [tasks, project.id, showCompleted]);

  // Calculate timeline window
  const { windowStart, windowEnd, totalDays } = useMemo(() => {
    const daysInView = viewMode === 'day' ? 17 : viewMode === 'week' ? 21 : 30;
    const start = new Date(timelineStart);
    const end = addDays(start, daysInView - 1);
    return {
      windowStart: start,
      windowEnd: end,
      totalDays: daysInView,
    };
  }, [timelineStart, viewMode]);

  // Generate days array
  const days = useMemo(() => {
    const result: Date[] = [];
    for (let i = 0; i < totalDays; i++) {
      result.push(addDays(windowStart, i));
    }
    return result;
  }, [windowStart, totalDays]);

  // Group days by month for headers
  const monthGroups = useMemo(() => {
    const groups: { month: string; startIdx: number; count: number }[] = [];
    let currentMonth = '';
    let startIdx = 0;
    let count = 0;

    days.forEach((day, idx) => {
      const monthKey = `${day.getFullYear()}-${day.getMonth()}`;
      if (monthKey !== currentMonth) {
        if (count > 0) {
          groups.push({ month: formatMonthYear(days[startIdx]), startIdx, count });
        }
        currentMonth = monthKey;
        startIdx = idx;
        count = 1;
      } else {
        count++;
      }
    });

    if (count > 0) {
      groups.push({ month: formatMonthYear(days[startIdx]), startIdx, count });
    }

    return groups;
  }, [days]);

  // Calculate task positions
  const taskPositions = useMemo(() => {
    return filteredTasks.map((task, index) => {
      const { start, end } = getEffectiveDates(task);
      
      const startDiff = getDaysBetween(windowStart, start);
      const duration = getDaysBetween(start, end) + 1;
      
      const right = Math.max(0, (startDiff / totalDays) * 100);
      const width = Math.max(10, (duration / totalDays) * 100);
      
      const isVisible = end >= windowStart && start <= windowEnd;
      
      return {
        task,
        right,
        width,
        top: index * 80,
        isVisible,
      };
    });
  }, [filteredTasks, windowStart, windowEnd, totalDays]);

  // Get team members for a task
  const getTaskMembers = (task: Task) => {
    const member = members.find(m => m.tasks?.some(t => t.id === task.id));
    return member ? [member] : [];
  };

  // Navigation
  const handlePrevPeriod = () => {
    const daysToMove = viewMode === 'day' ? 7 : viewMode === 'week' ? 14 : 30;
    setTimelineStart(prev => addDays(prev, -daysToMove));
  };

  const handleNextPeriod = () => {
    const daysToMove = viewMode === 'day' ? 7 : viewMode === 'week' ? 14 : 30;
    setTimelineStart(prev => addDays(prev, daysToMove));
  };

  // Format date range
  const dateRangeText = useMemo(() => {
    const startDay = windowStart.getDate();
    const endDay = windowEnd.getDate();
    const startMonth = windowStart.toLocaleDateString('fa-IR', { month: 'short' });
    const endMonth = windowEnd.toLocaleDateString('fa-IR', { month: 'short' });
    
    if (startMonth === endMonth) {
      return `${startDay} - ${endDay} ${startMonth}`;
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  }, [windowStart, windowEnd]);

  // Drag & Drop handlers
  const handleDragStart = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    const { start } = getEffectiveDates(task);
    setDraggedTask({ task, startX: e.clientX, initialStart: start });
    setIsDragging(true);
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!draggedTask || !isDragging) return;
    // Cursor changes to grabbing during drag
    document.body.style.cursor = 'grabbing';
  };

  const handleDragEnd = async (e: React.MouseEvent) => {
    if (!draggedTask || !onUpdateTask) {
      setDraggedTask(null);
      setIsDragging(false);
      return;
    }

    const deltaX = e.clientX - draggedTask.startX;
    const timelineWidth = e.currentTarget.getBoundingClientRect().width;
    const dayWidth = timelineWidth / totalDays;
    const daysDelta = Math.round(deltaX / dayWidth);

    if (daysDelta === 0) {
      setDraggedTask(null);
      setIsDragging(false);
      return;
    }

    const { start, end } = getEffectiveDates(draggedTask.task);
    const duration = getDaysBetween(start, end);

    const newStart = addDays(draggedTask.initialStart, daysDelta);
    const newEnd = addDays(newStart, duration);

    const newStartStr = newStart.toISOString().split('T')[0];
    const newEndStr = newEnd.toISOString().split('T')[0];

    try {
      await onUpdateTask(draggedTask.task.id, {
        date: newStartStr,
        start_date: newStartStr,
        end_date: newEndStr,
      });
    } catch (error) {
      console.error('Error updating task dates:', error);
    }

    setDraggedTask(null);
    setIsDragging(false);
    document.body.style.cursor = 'default';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <Card className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">تایم‌لاین</h1>
            <p className="text-gray-500">
              نمای دقیق و بصری از مسیر پروژه، با برجسته‌سازی نقاط عطف کلیدی،
              <br />
              به‌روزرسانی‌های پیشرفت و وظایف آینده.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {members.slice(0, 4).map((member) => (
                <Avatar key={member.id} className="w-8 h-8 border-2 border-white">
                  {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-xs">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
              ))}
              {members.length > 4 && (
                <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                  +{members.length - 4}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {/* View mode */}
            <div className="inline-flex rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setViewMode('day')}
                className={cn(
                  'px-4 py-1.5 text-sm rounded-md transition-colors',
                  viewMode === 'day' ? 'bg-gray-100' : 'hover:bg-gray-50'
                )}
              >
                روز
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={cn(
                  'px-4 py-1.5 text-sm rounded-md transition-colors',
                  viewMode === 'week' ? 'bg-gray-100' : 'hover:bg-gray-50'
                )}
              >
                هفته
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={cn(
                  'px-4 py-1.5 text-sm rounded-md transition-colors',
                  viewMode === 'month' ? 'bg-gray-100' : 'hover:bg-gray-50'
                )}
              >
                ماه
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg">
              <ChevronRight className="w-4 h-4 text-gray-600 cursor-pointer" onClick={handlePrevPeriod} />
              <span className="text-sm">{dateRangeText}</span>
              <ChevronLeft className="w-4 h-4 text-gray-600 cursor-pointer" onClick={handleNextPeriod} />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">نمایش انجام شده</span>
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors',
                  showCompleted ? 'bg-gray-900' : 'bg-gray-200'
                )}
              >
                <div
                  className={cn(
                    'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                    showCompleted ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <ArrowUpDown className="w-4 h-4" />
              <span className="text-sm">مرتب‌سازی</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span className="text-sm">فیلتر</span>
            </button>
          </div>
        </div>

        {/* Timeline Grid */}
        <div className="relative">
          {/* Month headers */}
          <div className="flex mb-4 text-sm text-gray-500">
            {monthGroups.map((group, idx) => (
              <div
                key={idx}
                style={{ width: `${(group.count / totalDays) * 100}%` }}
                className={cn(
                  idx === 0 && 'text-right',
                  idx === monthGroups.length - 1 && 'text-left',
                  idx > 0 && idx < monthGroups.length - 1 && 'text-center'
                )}
              >
                {group.month}
              </div>
            ))}
          </div>

          {/* Day headers */}
          <div className="flex border-b border-gray-200 pb-4 mb-6">
            {days.map((day, index) => {
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div key={index} className="flex-1 text-center">
                  <div className="text-xs text-gray-400 mb-1">
                    {['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'][day.getDay()]}
                  </div>
                  <div className={cn('text-sm', isToday && 'text-purple-600 font-bold')}>
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline area */}
          <div 
            className="relative" 
            style={{ minHeight: `${Math.max(600, taskPositions.length * 80)}px` }}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
          >
            {/* Vertical grid lines */}
            {days.map((day, index) => {
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div
                  key={`line-${index}`}
                  className={cn(
                    'absolute top-0 bottom-0 border-r border-gray-100',
                    isToday && 'border-r-2 border-purple-500 z-10'
                  )}
                  style={{ right: `${(index / totalDays) * 100}%` }}
                >
                  {isToday && (
                    <div className="absolute -top-1 -right-1.5 w-3 h-3 bg-purple-500 rounded-full" />
                  )}
                </div>
              );
            })}

            {/* Empty state */}
            {filteredTasks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <div className="text-lg text-gray-600 mb-2">هیچ وظیفه‌ای در این پروژه وجود ندارد</div>
                  <div className="text-sm text-gray-400">
                    وظایف جدید اضافه کنید تا در تایم‌لاین نمایش داده شوند
                  </div>
                </div>
              </div>
            )}

            {/* Task cards */}
            {taskPositions.map(({ task, right, width, top, isVisible }) => {
              if (!isVisible) return null;

              const taskMembers = getTaskMembers(task);
              const isInProgress = task.status === 'In Progress';
              const isBeingDragged = draggedTask?.task.id === task.id;

              return (
                <div
                  key={task.id}
                  className="absolute"
                  style={{
                    right: `${right}%`,
                    width: `${width}%`,
                    top: `${top}px`,
                    minWidth: '180px',
                  }}
                >
                  <div
                    className={cn(
                      'rounded-lg px-4 py-3 shadow-sm flex items-center justify-between cursor-move hover:shadow-md transition-shadow select-none',
                      getStatusColor(task.status),
                      !isInProgress && getPriorityColor(task.priority),
                      isInProgress && 'text-white',
                      isBeingDragged && 'opacity-50 scale-105'
                    )}
                    onMouseDown={(e) => handleDragStart(e, task)}
                    onClick={(e) => {
                      if (!isDragging) {
                        onTaskClick?.(task);
                      }
                    }}
                  >
                    <div className="flex-1 min-w-0 pointer-events-none">
                      <div className="text-sm truncate font-medium">{task.title}</div>
                      <div className={cn('text-xs truncate', isInProgress ? 'text-white/80' : 'text-gray-500')}>
                        {getStatusLabel(task.status)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mr-3 pointer-events-none">
                      <div className="flex -space-x-1">
                        {taskMembers.slice(0, 2).map((member) => (
                          <Avatar key={member.id} className="w-6 h-6 border-2 border-white">
                            {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-xs">
                              {member.initials}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <button className="text-gray-400 hover:text-gray-600 pointer-events-auto">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
