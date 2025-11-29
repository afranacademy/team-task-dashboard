import { useMemo, useState, useEffect } from 'react';
import { Task } from '../types';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DailyDocument } from './DailyDocument';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import { formatJalaliFull } from '../lib/jalaliDate';

interface TimelineSectionProps {
  tasks: Task[];
  selectedDate: string;
  onTaskClick: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onAddTaskForDate: (date: string) => void;
  readOnly?: boolean;
}

export function TimelineSection({
  tasks,
  selectedDate,
  onTaskClick,
  onDeleteTask,
  onAddTaskForDate,
  readOnly = false,
}: TimelineSectionProps) {
  const tasksByDate = useMemo(() => {
    return tasks.reduce((acc, task) => {
      if (!acc[task.date]) acc[task.date] = [];
      acc[task.date].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
  }, [tasks]);

  const sortedDates = useMemo(
    () =>
      Object.keys(tasksByDate).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
      ),
    [tasksByDate]
  );

  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set(sortedDates.slice(0, 1)));

  useEffect(() => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (sortedDates.length > 0 && !next.size) {
        next.add(sortedDates[0]);
      }
      return next;
    });
  }, [sortedDates]);

  const today = new Date();
  const upcomingDates: string[] = [];
  for (let i = 1; i <= 7; i++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + i);
    const iso = nextDate.toISOString().split('T')[0];
    if (!tasksByDate[iso]) {
      upcomingDates.push(iso);
    }
  }

  const toggleDateExpand = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  return (
    <Card className="p-6 mb-6">
      <Tabs defaultValue="timeline" dir="rtl">
        <TabsList className="mb-4">
          <TabsTrigger value="timeline">تایم‌لاین روزانه</TabsTrigger>
          <TabsTrigger value="upcoming">روزهای آینده</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          {sortedDates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              هنوز وظیفه‌ای ثبت نشده است
            </div>
          ) : (
            sortedDates.map(date => (
              <DailyDocument
                key={date}
                date={date}
                tasks={tasksByDate[date]}
                onTaskClick={onTaskClick}
                onAddTask={readOnly ? undefined : onAddTaskForDate}
                isExpanded={expandedDates.has(date)}
                onToggleExpand={() => toggleDateExpand(date)}
                onDeleteTask={onDeleteTask}
                readOnly={readOnly}
                actionSlot={
                  !readOnly ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddTaskForDate(date);
                      }}
                    >
                      افزودن وظیفه برای این روز
                    </Button>
                  ) : null
                }
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-3">
          {upcomingDates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              تمام روزهای آینده دارای وظیفه هستند
            </div>
          ) : (
            upcomingDates.map(date => (
              <Card key={date} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">{formatJalaliFull(date)}</p>
                    <p className="text-xs text-muted-foreground">
                      هنوز وظیفه‌ای برای این روز ثبت نشده
                    </p>
                  </div>
                  {!readOnly && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAddTaskForDate(date)}
                    >
                      <Plus className="w-4 h-4 ml-2" />
                      افزودن وظیفه
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
