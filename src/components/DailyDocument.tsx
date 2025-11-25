import { useState } from 'react';
import { Task } from '../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { TaskCard } from './TaskCard';
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface DailyDocumentProps {
  date: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (date: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function DailyDocument({ 
  date, 
  tasks, 
  onTaskClick, 
  onAddTask,
  isExpanded = false,
  onToggleExpand
}: DailyDocumentProps) {
  const completedTasks = tasks.filter(t => t.status === 'Completed');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
  const todoTasks = tasks.filter(t => t.status === 'To Do');
  
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  
  const overdueTasks = tasks.filter(t => 
    t.deadline && new Date(t.deadline) < new Date() && t.status !== 'Completed'
  );

  const formatDatePersian = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dateStr === today) return { label: 'امروز', color: 'blue' };
    if (dateStr === tomorrow) return { label: 'فردا', color: 'purple' };
    if (dateStr === yesterday) return { label: 'دیروز', color: 'gray' };

    return { 
      label: date.toLocaleDateString('fa-IR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      color: 'gray'
    };
  };

  const getStatusColor = () => {
    if (totalTasks === 0) return 'gray';
    if (progress === 100) return 'green';
    if (progress >= 50) return 'blue';
    if (overdueTasks.length > 0) return 'red';
    return 'yellow';
  };

  const dateInfo = formatDatePersian(date);
  const statusColor = getStatusColor();

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    gray: 'bg-gray-50 border-gray-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    yellow: 'bg-yellow-50 border-yellow-200',
  };

  const badgeClasses = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  };

  return (
    <Card className={`overflow-hidden transition-all duration-300 ${colorClasses[statusColor]}`}>
      {/* Header - Always Visible */}
      <div 
        className="p-6 cursor-pointer hover:bg-white/50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              statusColor === 'green' ? 'bg-green-500' :
              statusColor === 'blue' ? 'bg-blue-500' :
              statusColor === 'purple' ? 'bg-purple-500' :
              statusColor === 'red' ? 'bg-red-500' :
              statusColor === 'yellow' ? 'bg-yellow-500' :
              'bg-gray-400'
            }`}>
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={badgeClasses[dateInfo.color]}>
                  {dateInfo.label}
                </Badge>
                {totalTasks === 0 && (
                  <Badge variant="outline" className="bg-gray-100 text-gray-600">
                    بدون وظیفه
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {new Date(date).toLocaleDateString('fa-IR', { 
                  year: 'numeric', 
                  month: '2-digit', 
                  day: '2-digit' 
                })}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
        </div>

        {/* Quick Stats */}
        {totalTasks > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Progress value={progress} className="flex-1 h-2" />
              <span className="text-sm font-medium text-gray-700 min-w-[45px] text-left">
                {progress}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">{completedTasks.length} انجام شده</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-700">{inProgressTasks.length} در حال انجام</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-gray-700">{todoTasks.length} باقی‌مانده</span>
              </div>
            </div>

            {overdueTasks.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-red-100 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">
                  {overdueTasks.length} وظیفه دارای تاخیر
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4 border-t border-gray-200/50">
          <div className="flex items-center justify-between pt-4">
            <h3 className="text-gray-900 text-right">وظایف روز</h3>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddTask(date);
              }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2"
            >
              <Plus className="w-4 h-4" />
              افزودن وظیفه
            </Button>
          </div>

          {totalTasks === 0 ? (
            <div className="text-center py-8 bg-white/50 rounded-lg border-2 border-dashed border-gray-200">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-3">هنوز وظیفه‌ای برای این روز ثبت نشده</p>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddTask(date);
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                افزودن اولین وظیفه
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
