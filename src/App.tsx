import { useState } from 'react';
import { TeamMember, Task, TaskStatus } from './types';
import { mockTeamMembers } from './lib/mockData';
import { UserLogin } from './components/UserLogin';
import { PersonalDashboard } from './components/PersonalDashboard';
import { OtherUserView } from './components/OtherUserView';
import { TaskDetailModal } from './components/TaskDetailModal';
import { AddTaskDialog } from './components/AddTaskDialog';
import { PermissionManager } from './components/PermissionManager';

type View = 'login' | 'personal' | 'viewing-other';

export default function App() {
  const [members, setMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [currentView, setCurrentView] = useState<View>('login');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isPermissionManagerOpen, setIsPermissionManagerOpen] = useState(false);

  const currentUser = members.find(m => m.id === currentUserId) || null;
  const viewingUser = members.find(m => m.id === viewingUserId) || null;
  const taskOwner = currentView === 'viewing-other' ? viewingUser : currentUser;

  const handleLogin = (userId: string) => {
    setCurrentUserId(userId);
    setCurrentView('personal');
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    setViewingUserId(null);
    setCurrentView('login');
  };

  const handleViewOtherUser = (userId: string) => {
    setViewingUserId(userId);
    setCurrentView('viewing-other');
  };

  const handleBackToPersonal = () => {
    setViewingUserId(null);
    setCurrentView('personal');
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setMembers(prevMembers =>
      prevMembers.map(member => ({
        ...member,
        tasks: member.tasks.map(task =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      }))
    );

    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleAddTask = (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
    expectedOutcome: string;
    deadline?: string;
    date: string;
  }) => {
    if (!currentUserId) return;

    const newTask: Task = {
      id: Date.now().toString(),
      ...taskData,
      progress: taskData.status === 'Completed' ? 100 : taskData.status === 'In Progress' ? 50 : 0,
      startDate: new Date().toISOString().split('T')[0],
    };

    setMembers(prevMembers =>
      prevMembers.map(member =>
        member.id === currentUserId
          ? { ...member, tasks: [...member.tasks, newTask] }
          : member
      )
    );
  };

  const handleOpenAddTaskDialog = (date: string) => {
    setSelectedDate(date);
    setIsAddTaskDialogOpen(true);
  };

  const handleUpdatePermissions = (userIds: string[]) => {
    if (!currentUserId) return;

    setMembers(prevMembers =>
      prevMembers.map(member =>
        member.id === currentUserId
          ? { ...member, accessPermissions: userIds }
          : member
      )
    );
  };

  if (currentView === 'login') {
    return <UserLogin members={members} onLogin={handleLogin} />;
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {currentView === 'personal' ? (
        <PersonalDashboard
          currentUser={currentUser}
          allMembers={members}
          onLogout={handleLogout}
          onTaskClick={handleTaskClick}
          onAddTask={handleOpenAddTaskDialog}
          onManagePermissions={() => setIsPermissionManagerOpen(true)}
          onViewOtherUser={handleViewOtherUser}
        />
      ) : viewingUser ? (
        <OtherUserView
          viewedUser={viewingUser}
          currentUser={currentUser}
          onBack={handleBackToPersonal}
          onTaskClick={handleTaskClick}
        />
      ) : null}

      <TaskDetailModal
        task={selectedTask}
        member={taskOwner}
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        onUpdateTask={handleUpdateTask}
      />

      <AddTaskDialog
        open={isAddTaskDialogOpen}
        onOpenChange={setIsAddTaskDialogOpen}
        selectedDate={selectedDate}
        onAddTask={handleAddTask}
      />

      <PermissionManager
        open={isPermissionManagerOpen}
        onOpenChange={setIsPermissionManagerOpen}
        currentUser={currentUser}
        allMembers={members}
        onUpdatePermissions={handleUpdatePermissions}
      />
    </div>
  );
}