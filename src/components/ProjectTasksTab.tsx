import { useMemo } from 'react';
import { formatJalaliDate } from '../lib/dateJalali';
import type { Project, TeamMember, Task } from '../types';
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { getStatusLabelFa } from '../lib/statusLabels';

interface ProjectTasksTabProps {
  project: Project;
  currentUser: TeamMember;
  tasksWithMembers: { task: Task; member: TeamMember }[];
  allMembers: TeamMember[];
  onTaskClick: (task: Task) => void;
}

export function ProjectTasksTab({
  project,
  currentUser,
  tasksWithMembers,
  allMembers,
  onTaskClick,
}: ProjectTasksTabProps) {
  const allProjectTasks = useMemo(
    () => tasksWithMembers.filter(tm => tm.task.projectId === project.id),
    [tasksWithMembers, project.id]
  );

  const myProjectTasks = useMemo(
    () => allProjectTasks.filter(tm => tm.member.id === currentUser.id),
    [allProjectTasks, currentUser.id]
  );

  const TaskItem = ({ task, member }: { task: Task; member: TeamMember }) => (
    <Card
      key={task.id}
      className="p-4 bg-accent/50 border-gray-200 cursor-pointer hover:border-purple-300 transition-colors"
      onClick={() => onTaskClick(task)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {getStatusLabelFa(task.status)}
              </Badge>
            </div>
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {formatJalaliDate(task.date)}
            </span>
            {task.progress !== undefined && (
              <span className="text-xs text-muted-foreground">
                {task.progress}% پیشرفت
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 border border-gray-200">
            {member.avatarUrl && (
              <AvatarImage src={member.avatarUrl} alt={member.name} />
            )}
            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-xs">
              {member.initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-right">
            <p className="text-xs text-gray-900">{member.name}</p>
            <p className="text-xs text-gray-500">{member.role}</p>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* All Project Tasks */}
      <Card className="p-6 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">تمام کارهای پروژه</h3>
          <Badge variant="secondary">{allProjectTasks.length} مورد</Badge>
        </div>
        {allProjectTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            هیچ کاری در این پروژه ثبت نشده است
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allProjectTasks.map(({ task, member }) => (
              <TaskItem key={task.id} task={task} member={member} />
            ))}
          </div>
        )}
      </Card>

      {/* My Tasks in Project */}
      <Card className="p-6 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">وظایف من در این پروژه</h3>
          <Badge variant="secondary">{myProjectTasks.length} مورد</Badge>
        </div>
        {myProjectTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            هیچ وظیفه‌ای برای شما ثبت نشده است
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myProjectTasks.map(({ task, member }) => (
              <TaskItem key={task.id} task={task} member={member} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
