import { useState, useMemo, useRef, useEffect } from 'react';
import { formatJalaliDate } from '../lib/dateJalali';
import type { Project, TeamMember, Task, TaskStatus } from '../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProjectGanttTimelineProps {
  project: Project;
  tasks: Task[];
  currentUser: TeamMember;
  allMembers: TeamMember[];
  onUpdateTaskDates: (taskId: string, date: string, startDate: string, endDate: string) => Promise<void>;
  onSelectTask?: (task: Task) => void;
  onCreateTaskForDate?: (date: string) => void;
}

type ViewMode = 'day' | 'week' | 'month';

// Helper functions
function getEffectiveDates(task: Task): { start: Date; end: Date } {
  const effectiveStart = task.start_date ?? task.date;
  const effectiveEnd = task.end_date ?? task.start_date ?? task.date;
  
  return {
    start: new Date(effectiveStart),
    end: new Date(effectiveEnd),
  };
}

function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'Completed':
      return 'bg-green-500';
    case 'In Progress':
      return 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400';
    case 'To Do':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getDaysBetween(start: Date, end: Date): number {
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function ProjectGanttTimeline({
  project,
  tasks,
  currentUser,
  allMembers,
  onUpdateTaskDates,
  onSelectTask,
  onCreateTaskForDate,
}: ProjectGanttTimelineProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [draggedTask, setDraggedTask] = useState<{ task: Task; startX: number; initialStart: Date } | null>(null);
  const [resizingTask, setResizingTask] = useState<{ task: Task; startX: number; initialEnd: Date; edge: 'start' | 'end' } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Get project tasks only
  const projectTasks = useMemo(
    () => tasks.filter(t => t.projectId === project.id),
    [tasks, project.id]
  );

  // Calculate date range based on view mode
  const { startDate, endDate, days } = useMemo(() => {
    const start = new Date(currentDate);
    let end = new Date(currentDate);
    let numDays = 7;

    if (viewMode === 'day') {
      numDays = 7;
      end = addDays(start, 6);
    } else if (viewMode === 'week') {
      numDays = 28;
      end = addDays(start, 27);
    } else if (viewMode === 'month') {
      numDays = 90;
      end = addDays(start, 89);
    }

    return { startDate: start, endDate: end, days: numDays };
  }, [currentDate, viewMode]);

  // Generate date columns
  const dateColumns = useMemo(() => {
    const columns: Date[] = [];
    for (let i = 0; i < days; i++) {
      columns.push(addDays(startDate, i));
    }
    return columns;
  }, [startDate, days]);

  // Navigate timeline
  const navigateTimeline = (direction: 'prev' | 'next') => {
    const daysToMove = viewMode === 'day' ? 7 : viewMode === 'week' ? 28 : 90;
    setCurrentDate(prev => addDays(prev, direction === 'next' ? daysToMove : -daysToMove));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Calculate task bar position and width
  const getTaskBarStyle = (task: Task) => {
    const { start, end } = getEffectiveDates(task);
    
    // Calculate position
    const daysSinceStart = getDaysBetween(startDate, start);
    const duration = getDaysBetween(start, end) + 1; // +1 to include end day
    
    // Each day column width
    const columnWidth = 100 / days;
    
    const left = daysSinceStart * columnWidth;
    const width = duration * columnWidth;
    
    // Only show if task overlaps with visible range
    if (end < startDate || start > endDate) {
      return null;
    }
    
    // Clamp to visible range
    const clampedLeft = Math.max(0, left);
    const clampedWidth = Math.min(100 - clampedLeft, width - (clampedLeft - left));
    
    return {
      left: `${clampedLeft}%`,
      width: `${clampedWidth}%`,
    };
  };

  // Handle task bar drag
  const handleTaskBarMouseDown = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    const { start } = getEffectiveDates(task);
    setDraggedTask({ task, startX: e.clientX, initialStart: start });
  };

  // Handle resize edge drag
  const handleResizeMouseDown = (e: React.MouseEvent, task: Task, edge: 'start' | 'end') => {
    e.stopPropagation();
    e.preventDefault();
    const { start, end } = getEffectiveDates(task);
    setResizingTask({ task, startX: e.clientX, initialEnd: end, edge });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggedTask && timelineRef.current) {
        const deltaX = e.clientX - draggedTask.startX;
        const timelineWidth = timelineRef.current.offsetWidth;
        const dayWidth = timelineWidth / days;
        const daysDelta = Math.round(deltaX / dayWidth);
        
        const { start, end } = getEffectiveDates(draggedTask.task);
        const duration = getDaysBetween(start, end);
        
        const newStart = addDays(draggedTask.initialStart, daysDelta);
        const newEnd = addDays(newStart, duration);
        
        // Visual feedback could be added here
      }
      
      if (resizingTask && timelineRef.current) {
        const deltaX = e.clientX - resizingTask.startX;
        const timelineWidth = timelineRef.current.offsetWidth;
        const dayWidth = timelineWidth / days;
        const daysDelta = Math.round(deltaX / dayWidth);
        
        // Visual feedback could be added here
      }
    };

    const handleMouseUp = async () => {
      if (draggedTask) {
        const deltaX = 0; // Calculate from last mouse position
        const timelineWidth = timelineRef.current?.offsetWidth || 1000;
        const dayWidth = timelineWidth / days;
        const daysDelta = Math.round(deltaX / dayWidth);
        
        const { start, end } = getEffectiveDates(draggedTask.task);
        const duration = getDaysBetween(start, end);
        
        const newStart = addDays(draggedTask.initialStart, daysDelta);
        const newEnd = addDays(newStart, duration);
        
        await onUpdateTaskDates(
          draggedTask.task.id,
          newStart.toISOString().split('T')[0],
          newStart.toISOString().split('T')[0],
          newEnd.toISOString().split('T')[0]
        );
        
        setDraggedTask(null);
      }
      
      if (resizingTask) {
        setResizingTask(null);
      }
    };

    if (draggedTask || resizingTask) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedTask, resizingTask, days, onUpdateTaskDates]);

  // Handle task click
  const handleTaskClick = (task: Task) => {
    const { start, end } = getEffectiveDates(task);
    setEditingTask(task);
    setEditStartDate(start.toISOString().split('T')[0]);
    setEditEndDate(end.toISOString().split('T')[0]);
  };

  const handleSaveDates = async () => {
    if (!editingTask) return;

    await onUpdateTaskDates(
      editingTask.id,
      editStartDate,
      editStartDate,
      editEndDate
    );

    setEditingTask(null);
    setEditStartDate('');
    setEditEndDate('');
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayPosition = useMemo(() => {
    const today = new Date(todayStr);
    const daysSinceStart = getDaysBetween(startDate, today);
    const columnWidth = 100 / days;
    return daysSinceStart * columnWidth;
  }, [startDate, days, todayStr]);

  return (
    <div className="h-full flex flex-col" dir="rtl">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('day')}
                className="text-xs"
              >
                روز
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
                className="text-xs"
              >
                هفته
              </Button>
              <Button
                variant={viewMode === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('month')}
                className="text-xs"
              >
                ماه
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateTimeline('prev')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday} className="min-w-[60px]">
                امروز
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateTimeline('next')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="text-sm font-medium text-gray-700">
              {formatJalaliDate(startDate.toISOString().split('T')[0])} - {formatJalaliDate(endDate.toISOString().split('T')[0])}
            </div>
          </div>
          
          {onCreateTaskForDate && (
            <Button
              onClick={() => onCreateTaskForDate(todayStr)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              افزودن وظیفه
            </Button>
          )}
        </div>
      </div>

      {/* Timeline Grid - Scrollable */}
      <div className="flex-1 overflow-auto bg-white" ref={timelineRef}>
        {/* Date headers - Sticky */}
        <div className="flex border-b-2 border-gray-300 bg-gray-50 sticky top-0 z-10">
          <div className="w-64 flex-shrink-0 p-3 border-l border-gray-300 text-sm font-semibold text-gray-800">
            وظایف ({projectTasks.length})
          </div>
          <div className="flex-1 flex overflow-x-auto">
            {dateColumns.map((date, idx) => {
              const dateStr = date.toISOString().split('T')[0];
              const isToday = dateStr === todayStr;
              const isWeekend = date.getDay() === 5 || date.getDay() === 6;
              
              return (
                <div
                  key={idx}
                  className={`flex-1 p-2 border-l border-gray-200 text-center transition-colors ${
                    isToday ? 'bg-purple-100 border-purple-300' : isWeekend ? 'bg-blue-50/50' : ''
                  }`}
                  style={{ minWidth: viewMode === 'month' ? '30px' : viewMode === 'week' ? '50px' : '80px' }}
                >
                  <div className={`text-xs font-medium ${isToday ? 'text-purple-600 font-bold' : 'text-gray-600'}`}>
                    {viewMode === 'month' 
                      ? date.getDate() 
                      : viewMode === 'week'
                      ? `${date.getDate()}/${date.getMonth() + 1}`
                      : formatJalaliDate(dateStr).split(' ')[0]
                    }
                  </div>
                  {viewMode === 'day' && (
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'][date.getDay()]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Task rows */}
        <div className="relative min-h-[500px]">
          {projectTasks.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">📋</div>
                <div className="text-sm">هیچ وظیفه‌ای در این پروژه وجود ندارد</div>
              </div>
            </div>
          ) : (
            projectTasks.map((task, idx) => {
              const barStyle = getTaskBarStyle(task);
              const member = allMembers.find(m => m.tasks.some(t => t.id === task.id));
              
              return (
                <div
                  key={task.id}
                  className="flex border-b border-gray-100 hover:bg-purple-50/30 transition-colors group"
                  style={{ minHeight: '70px' }}
                >
                  {/* Task name column */}
                  <div className="w-64 flex-shrink-0 p-3 border-l border-gray-200 flex items-center gap-3">
                    {member && (
                      <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                        {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-xs font-semibold">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                        {task.title}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <span>{member?.name}</span>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {task.status === 'Completed' ? '✓' : task.status === 'In Progress' ? '⟳' : '○'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Timeline bar */}
                  <div className="flex-1 relative p-3">
                    {barStyle && (
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 h-10 rounded-lg ${getStatusColor(task.status)} cursor-move shadow-md hover:shadow-xl transition-all flex items-center px-3 gap-2 group/bar`}
                        style={barStyle}
                        onMouseDown={(e) => handleTaskBarMouseDown(e, task)}
                        onClick={() => handleTaskClick(task)}
                        title={`${task.title}\n${formatJalaliDate(getEffectiveDates(task).start.toISOString().split('T')[0])} - ${formatJalaliDate(getEffectiveDates(task).end.toISOString().split('T')[0])}`}
                      >
                        {/* Resize handles */}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/30 rounded-r-lg transition-colors"
                          onMouseDown={(e) => handleResizeMouseDown(e, task, 'start')}
                        />
                        <div
                          className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/30 rounded-l-lg transition-colors"
                          onMouseDown={(e) => handleResizeMouseDown(e, task, 'end')}
                        />
                        
                        {member && (
                          <Avatar className="h-5 w-5 border border-white shadow-sm flex-shrink-0">
                            {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                            <AvatarFallback className="bg-white text-gray-700 text-[10px]">
                              {member.initials}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <span className="text-xs text-white font-medium truncate flex-1">
                          {task.title}
                        </span>
                        
                        <div className="text-[10px] text-white/80 flex-shrink-0 opacity-0 group-hover/bar:opacity-100 transition-opacity">
                          {getDaysBetween(getEffectiveDates(task).start, getEffectiveDates(task).end) + 1} روز
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          
          {/* Today indicator line */}
          {todayPosition >= 0 && todayPosition <= 100 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-purple-500 z-20 pointer-events-none"
              style={{ right: `calc(16rem + ${todayPosition}%)` }}
            >
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-500 rounded-full shadow-lg" />
            </div>
          )}
        </div>
      </div>

      {/* Edit Dates Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>ویرایش تاریخ‌های وظیفه</DialogTitle>
            <DialogDescription>{editingTask?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>تاریخ شروع</Label>
              <Input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="text-right"
              />
              <div className="text-xs text-gray-500">
                {editStartDate && formatJalaliDate(editStartDate)}
              </div>
            </div>
            <div className="space-y-2">
              <Label>تاریخ پایان</Label>
              <Input
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                className="text-right"
              />
              <div className="text-xs text-gray-500">
                {editEndDate && formatJalaliDate(editEndDate)}
              </div>
            </div>
            {editStartDate && editEndDate && (
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                مدت زمان: {getDaysBetween(new Date(editStartDate), new Date(editEndDate)) + 1} روز
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>
              انصراف
            </Button>
            <Button onClick={handleSaveDates} className="bg-gradient-to-r from-purple-600 to-blue-600">
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
