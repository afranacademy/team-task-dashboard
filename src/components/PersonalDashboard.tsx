import { useMemo } from 'react';
import { TeamMember, Task, Project, Mood } from '../types';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { StatsCards } from './StatsCards';
import { TimelineSection } from './TimelineSection';
import { ProjectTasks } from './ProjectTasks';
import { PrivateTasks } from './PrivateTasks';

interface PersonalDashboardProps {
  currentUser: TeamMember;
  allMembers: TeamMember[];
  projects: Project[];
  selectedDate: string;
  today: string;
  onSelectedDateChange: (date: string) => void;
  onLogout: () => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (date: string) => void;
  onManagePermissions: () => void;
  onViewOtherUser: (userId: string) => void;
  onEditProfile: () => void;
  onOpenProjects: () => void;
  onUpdateMood: (userId: string, mood: Mood) => void;
  onDeleteTask: (taskId: string) => void;
}

export function PersonalDashboard({
  currentUser,
  allMembers,
  projects,
  selectedDate,
  onSelectedDateChange,
  onLogout,
  onTaskClick,
  onAddTask,
  onManagePermissions,
  onViewOtherUser,
  onEditProfile,
  onOpenProjects,
  onUpdateMood,
  onDeleteTask,
}: PersonalDashboardProps) {
  const allTasks = currentUser.tasks ?? [];
  const personalTasks = useMemo(
    () => allTasks.filter(task => !task.projectId),
    [allTasks]
  );

  const accessibleMembers = useMemo(
    () =>
      allMembers.filter(
        m => m.id !== currentUser.id && m.accessPermissions.includes(currentUser.id)
      ),
    [allMembers, currentUser.id]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-purple-50" dir="rtl">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex gap-6 p-6">
          <DashboardSidebar
            currentUser={currentUser}
            accessibleMembers={accessibleMembers}
            onUpdateMood={onUpdateMood}
            onViewOtherUser={onViewOtherUser}
            onManagePermissions={onManagePermissions}
            onEditProfile={onEditProfile}
            onLogout={onLogout}
            onOpenProjects={onOpenProjects}
          />

          <main className="flex-1 min-w-0">
            <DashboardHeader
              userName={currentUser.name}
              selectedDate={selectedDate}
              onDateChange={onSelectedDateChange}
              onAddTask={onAddTask}
            />

            <StatsCards tasks={allTasks} selectedDate={selectedDate} />

            <TimelineSection
              tasks={personalTasks}
              selectedDate={selectedDate}
              onTaskClick={onTaskClick}
              onAddTaskForDate={onAddTask}
              onDeleteTask={onDeleteTask}
            />

            <ProjectTasks
              tasks={allTasks}
              projects={projects}
              selectedDate={selectedDate}
              onViewTask={onTaskClick}
            />

            <PrivateTasks
              tasks={allTasks}
              selectedDate={selectedDate}
              onViewTask={onTaskClick}
              onDeleteTask={onDeleteTask}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
