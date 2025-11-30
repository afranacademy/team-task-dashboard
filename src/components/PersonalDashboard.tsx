import { useMemo, useState } from 'react';
import { TeamMember, Task, Project, Mood } from '../types';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { StatsCards } from './StatsCards';
import { TimelineSection } from './TimelineSection';
import { ProjectTasks } from './ProjectTasks';
import { PrivateTasks } from './PrivateTasks';
import { CalendarView } from './CalendarView';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

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
  onOpenCalendar: () => void;
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
  onOpenCalendar,
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

  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar'>('dashboard');

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'dashboard' | 'calendar')} className="h-screen flex flex-col" dir="rtl">
      {activeTab === 'dashboard' && (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-purple-50">
          <div className="max-w-[1280px] mx-auto">
            <div className="flex gap-6 p-6 flex-1">
                  <DashboardSidebar
                    currentUser={currentUser}
                    accessibleMembers={accessibleMembers}
                    onUpdateMood={onUpdateMood}
                    onViewOtherUser={onViewOtherUser}
                    onManagePermissions={onManagePermissions}
                    onEditProfile={onEditProfile}
                    onLogout={onLogout}
                    onOpenProjects={onOpenProjects}
                    onOpenCalendar={onOpenCalendar}
                  />

              <main className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-6">
                  <DashboardHeader
                    userName={currentUser.name}
                    selectedDate={selectedDate}
                    onDateChange={onSelectedDateChange}
                    onAddTask={onAddTask}
                  />
                  <TabsList>
                    <TabsTrigger value="dashboard">داشبورد</TabsTrigger>
                    <TabsTrigger value="calendar">تقویم</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="dashboard" className="mt-0">
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
                </TabsContent>
              </main>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <TabsContent value="calendar" className="flex-1 mt-0 h-screen">
          <CalendarView
            currentUser={currentUser}
            projects={projects}
            onTaskClick={onTaskClick}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
