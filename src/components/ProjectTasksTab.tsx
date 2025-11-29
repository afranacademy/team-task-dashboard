import { useMemo, useState } from 'react';
import { formatJalaliDate } from '../lib/dateJalali';
import type { Project, TeamMember, Task } from '../types';
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import { getStatusLabelFa } from '../lib/statusLabels';
import { AddProjectTaskDialog } from './AddProjectTaskDialog';

interface ProjectTasksTabProps {
  project: Project;
  currentUser: TeamMember;
  tasksWithMembers: { task: Task; member: TeamMember }[];
  allMembers: TeamMember[];
  onTaskClick: (task: Task) => void;
  onAddTask?: (data: {
    assigneeId: string;
    title: string;
    description: string;
    status: import('../types').TaskStatus;
    expectedOutcome: string;
    deadline?: string;
    date?: string;
    start_date?: string;
    end_date?: string;
    isPrivate?: boolean;
    priority?: 'low' | 'medium' | 'high';
  }) => void | Promise<void>;
}

export function ProjectTasksTab({
  project,
  currentUser,
  tasksWithMembers,
  allMembers,
  onTaskClick,
  onAddTask,
}: ProjectTasksTabProps) {
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const getLocalToday = () => new Date().toLocaleDateString('en-CA');

  const allProjectTasks = useMemo(
    () => tasksWithMembers.filter(tm => tm.task.projectId === project.id),
    [tasksWithMembers, project.id]
  );

  const myProjectTasks = useMemo(
    () => allProjectTasks.filter(tm => tm.member.id === currentUser.id),
    [allProjectTasks, currentUser.id]
  );

  // Get project members from tasksWithMembers
  const projectMembers = useMemo(() => {
    const memberIds = new Set(allProjectTasks.map(tm => tm.member.id));
    return allMembers.filter(m => memberIds.has(m.id));
  }, [allProjectTasks, allMembers]);

  const handleAddTask = async (data: {
    assigneeId: string;
    title: string;
    description: string;
    status: import('../types').TaskStatus;
    expectedOutcome: string;
    deadline?: string;
    date?: string;
    start_date?: string;
    end_date?: string;
    isPrivate?: boolean;
    priority?: 'low' | 'medium' | 'high';
  }) => {
    if (onAddTask) {
      await onAddTask(data);
    }
  };

  // Helper function to get priority badge styling
  const getPriorityBadge = (priority?: 'low' | 'medium' | 'high') => {
    if (!priority) return null;
    
    const styles = {
      high: 'bg-red-100 text-red-700 border-red-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-green-100 text-green-700 border-green-200',
    };

    const labels = {
      high: 'بالا',
      medium: 'متوسط',
      low: 'پایین',
    };

    return (
      <Badge variant="outline" className={`text-xs ${styles[priority]}`}>
        {labels[priority]}
      </Badge>
    );
  };

  // Helper function to get status badge styling
  const getStatusBadge = (status: import('../types').TaskStatus) => {
    const styles = {
      'To Do': 'bg-blue-100 text-blue-700 border-blue-200',
      'In Progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Completed': 'bg-green-100 text-green-700 border-green-200',
    };

    return (
      <Badge variant="outline" className={`text-xs ${styles[status]}`}>
        {getStatusLabelFa(status)}
      </Badge>
    );
  };

  const TaskItem = ({ task, member }: { task: Task; member: TeamMember }) => (
    <Card
      key={task.id}
      className="p-4 bg-white border-gray-200 cursor-pointer hover:border-purple-300 hover:shadow-md transition-all"
      onClick={() => onTaskClick(task)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 mb-2">{task.title}</h4>
          
          {task.description && (
            <p className="text-xs text-gray-600 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {getStatusBadge(task.status)}
            {getPriorityBadge(task.priority)}
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>📅 {formatJalaliDate(task.date)}</span>
            {task.progress !== undefined && (
              <span>📊 {task.progress}%</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-medium text-gray-900">{member.name}</p>
              <p className="text-xs text-gray-500">{member.role}</p>
            </div>
            <Avatar className="h-9 w-9 border-2 border-gray-200">
              {member.avatarUrl && (
                <AvatarImage src={member.avatarUrl} alt={member.name} />
              )}
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-xs">
                {member.initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All Project Tasks */}
        <Card className="p-6 border-gray-200 bg-gradient-to-br from-white to-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">تمام کارهای پروژه</h3>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {allProjectTasks.length} مورد
              </Badge>
            </div>
            {onAddTask && (
              <Button
                size="sm"
                onClick={() => setIsAddTaskDialogOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
              >
                <Plus className="w-4 h-4 ml-1" />
                افزودن وظیفه
              </Button>
            )}
          </div>
          
          {allProjectTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-sm">هیچ کاری در این پروژه ثبت نشده است</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {allProjectTasks.map(({ task, member }) => (
                <TaskItem key={task.id} task={task} member={member} />
              ))}
            </div>
          )}
        </Card>

        {/* My Tasks in Project */}
        <Card className="p-6 border-gray-200 bg-gradient-to-br from-white to-blue-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">وظایف من در این پروژه</h3>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {myProjectTasks.length} مورد
              </Badge>
            </div>
          </div>
          
          {myProjectTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">✨</div>
              <p className="text-sm">هنوز وظیفه‌ای برای شما در این پروژه ثبت نشده است</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {myProjectTasks.map(({ task, member }) => (
                <TaskItem key={task.id} task={task} member={member} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Add Task Dialog */}
      {onAddTask && projectMembers.length > 0 && (
        <AddProjectTaskDialog
          open={isAddTaskDialogOpen}
          onOpenChange={setIsAddTaskDialogOpen}
          projectName={project.name}
          projectMembers={projectMembers}
          selectedDate={getLocalToday()}
          onAddTask={handleAddTask}
        />
      )}
    </div>
  );
}
