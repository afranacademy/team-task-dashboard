import { useState, useMemo } from 'react';
import { formatJalaliDate } from '../lib/dateJalali';
import type { Project, ProjectMember, TeamMember, Task, TaskStatus } from '../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getStatusLabelFa } from '../lib/statusLabels';
import { Plus, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface ProjectBoardTabProps {
  project: Project;
  currentUser: TeamMember;
  tasksWithMembers: { task: Task; member: TeamMember }[];
  allMembers: TeamMember[];
  projectMembers: ProjectMember[];
  today: string;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onAddProjectTask: () => void;
}

export function ProjectBoardTab({
  project,
  currentUser,
  tasksWithMembers,
  allMembers,
  projectMembers,
  today,
  onUpdateTask,
  onAddProjectTask,
}: ProjectBoardTabProps) {
  const [notes, setNotes] = useState('');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const isOwner = project.ownerId === currentUser.id;
  const canEditTask = (task: Task) => {
    const taskMember = tasksWithMembers.find(tm => tm.task.id === task.id)?.member;
    return isOwner || (taskMember && taskMember.id === currentUser.id);
  };

  // Get ALL project tasks
  const allProjectTasks = useMemo(
    () => tasksWithMembers.filter(tm => tm.task.projectId === project.id),
    [tasksWithMembers, project.id]
  );

  // Safe date checking helper
  const isTaskDateToday = (taskDate: string | undefined | null): boolean => {
    if (!taskDate) return false;
    try {
      const dueDate = new Date(taskDate);
      if (Number.isNaN(dueDate.getTime())) return false;
      return dueDate.toISOString().split('T')[0] === today;
    } catch {
      return false;
    }
  };

  // "وظایف امروز من" - only current user's tasks for today
  const todayTasks = useMemo(
    () => allProjectTasks
      .filter(tm => {
        const task = tm.task;
        return isTaskDateToday(task.date) && tm.member.id === currentUser.id;
      })
      .map(tm => tm.task),
    [allProjectTasks, today, currentUser.id]
  );

  // Other columns show ALL project tasks
  const todoTasks = useMemo(
    () => allProjectTasks
      .filter(tm => {
        const task = tm.task;
        return task.status === 'To Do' && !isTaskDateToday(task.date);
      })
      .map(tm => tm.task),
    [allProjectTasks, today]
  );

  const inProgressTasks = useMemo(
    () => allProjectTasks
      .filter(tm => {
        const task = tm.task;
        return task.status === 'In Progress' && !isTaskDateToday(task.date);
      })
      .map(tm => tm.task),
    [allProjectTasks, today]
  );

  const completedTasks = useMemo(
    () => allProjectTasks
      .filter(tm => {
        const task = tm.task;
        return task.status === 'Completed' && !isTaskDateToday(task.date);
      })
      .map(tm => tm.task),
    [allProjectTasks, today]
  );

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    if (!canEditTask(task)) {
      e.preventDefault();
      return;
    }
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (
    e: React.DragEvent,
    targetStatus: TaskStatus | 'today'
  ) => {
    e.preventDefault();
    if (!draggedTask || !onUpdateTask) return;

    const updates: Partial<Task> = {};
    if (targetStatus === 'today') {
      updates.date = today;
      updates.status = draggedTask.status; // Keep current status
    } else {
      updates.status = targetStatus;
      if (targetStatus === 'Completed') {
        updates.progress = 100;
      } else if (targetStatus === 'In Progress') {
        updates.progress = 50;
      } else if (targetStatus === 'To Do') {
        updates.progress = 0;
      }
    }

    await onUpdateTask(draggedTask.id, updates);
    setDraggedTask(null);
  };

  const getPriorityBadge = (task: Task) => {
    const priority = task.priority || 'medium';

    const priorityColors = {
      high: { bg: '#fce7f3', text: '#be185d', label: 'بالا' },
      medium: { bg: '#fef3c7', text: '#92400e', label: 'متوسط' },
      low: { bg: '#d1fae5', text: '#065f46', label: 'پایین' },
    };

    const color = priorityColors[priority];
    return (
      <Badge
        className="text-xs px-2 py-0.5"
        style={{ backgroundColor: color.bg, color: color.text, border: 'none' }}
      >
        {color.label}
      </Badge>
    );
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const member = allProjectTasks.find(tm => tm.task.id === task.id)?.member;
    const canDrag = canEditTask(task);

    return (
      <Card
        draggable={canDrag}
        onDragStart={(e) => canDrag && handleDragStart(e, task)}
        className={`p-3 mb-2 ${canDrag ? 'cursor-move hover:border-purple-300 hover:shadow-md' : 'cursor-not-allowed opacity-60'} transition-all bg-white border border-gray-200`}
      >
        <div className="text-right">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-sm font-semibold text-gray-900 flex-1">{task.title}</h4>
            {getPriorityBadge(task)}
          </div>

          {task.description && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-3">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {member && (
                <Avatar className="h-6 w-6 border border-gray-200">
                  {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-xs">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{formatJalaliDate(task.date)}</span>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const Column = ({
    title,
    tasks,
    status,
  }: {
    title: string;
    tasks: Task[];
    status: TaskStatus | 'today';
  }) => (
    <Card
      className="p-4 border-gray-200 min-h-[500px] bg-gray-50"
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, status)}
    >
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <Badge variant="secondary" className="text-xs font-medium">
          {tasks.length}
        </Badge>
      </div>
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground">
            <div className="text-gray-400 mb-2">خالی</div>
            <div className="text-gray-300 text-[10px]">کارها را اینجا بکشید</div>
          </div>
        ) : (
          tasks.map(task => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">برد کارها</h3>
        <Button
          onClick={onAddProjectTask}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          افزودن وظیفه
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Column title="وظایف امروز من" tasks={todayTasks} status="today" />
        <Column title="باید انجام بشه" tasks={todoTasks} status="To Do" />
        <Column title="در حال انجام" tasks={inProgressTasks} status="In Progress" />
        <Column title="انجام شده" tasks={completedTasks} status="Completed" />
      </div>

      <Card className="p-4 border-gray-200">
        <label className="text-sm font-medium text-gray-900 mb-2 block">یادداشت‌ها</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="یادداشت‌های خود را اینجا بنویسید..."
          className="min-h-[100px] text-right"
          dir="rtl"
        />
      </Card>
    </div>
  );
}
