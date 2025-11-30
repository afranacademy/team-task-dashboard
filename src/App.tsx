import { useEffect, useRef, useState } from 'react';
import { TeamMember, Task, TaskStatus, Project, ProjectMember, Mood } from './types';
import { supabase } from './lib/supabaseClient';
import { UserLogin } from './components/UserLogin';
import { PersonalDashboard } from './components/PersonalDashboard';
import { OtherUserView } from './components/OtherUserView';
import { TaskDetailModal } from './components/TaskDetailModal';
import { AddTaskDialog } from './components/AddTaskDialog';
import { PermissionManager } from './components/PermissionManager';
import { EditProfileDialog } from './components/EditProfileDialog';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { ProjectDetailView } from './components/ProjectDetailView';
import { AddProjectTaskDialog } from './components/AddProjectTaskDialog';
import { CalendarView } from './components/CalendarView';
import { Button } from './components/ui/button';

const mapDbMemberToTeamMember = (member: any): TeamMember => ({
  id: String(member.id),
  name: member.name,
  role: member.role ?? 'عضو تیم',
  avatar: member.avatar ?? undefined,
  avatarUrl: member.avatar_url ?? undefined,
  initials: member.initials ?? '',
  password: member.password_hash ?? member.password,
  mood: member.mood ?? undefined,
  accessPermissions: (member.access_permissions ?? member.accessPermissions ?? []).map((id: any) => String(id)),
  tasks: member.tasks ?? [],
});

type View = 'login' | 'personal' | 'viewing-other' | 'projects-list' | 'project-detail' | 'calendar';

export default function App() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentView, setCurrentView] = useState<View>('login');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const getLocalToday = () => new Date().toLocaleDateString('en-CA');

  const [today, setToday] = useState(() => getLocalToday());
  const [selectedDate, setSelectedDate] = useState(today);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isPermissionManagerOpen, setIsPermissionManagerOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddProjectTaskDialogOpen, setIsAddProjectTaskDialogOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const prevTodayRef = useRef<string | null>(null);

  const currentUser = members.find((m: TeamMember) => m.id === currentUserId) || null;
  const viewingUser = members.find((m: TeamMember) => m.id === viewingUserId) || null;
  const taskOwner = currentView === 'viewing-other' ? viewingUser : currentUser;
  const selectedProject =
    selectedProjectId != null
      ? projects.find(p => p.id === selectedProjectId) ?? null
      : null;
  const projectTasksWithMembers =
    selectedProjectId == null
      ? []
      : members.flatMap(member =>
          (member.tasks || [])
            .filter(task => task.projectId === selectedProjectId)
            .map(task => ({ task, member }))
        );

  const loadTasksForMember = async (memberId: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('member_id', memberId)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[supabase] error loading tasks:', error);
      return;
    }

    const tasks: Task[] = (data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? '',
      status: row.status as TaskStatus,
      progress: row.progress ?? 0,
      expectedOutcome: row.expected_outcome ?? '',
      deadline: row.deadline ?? undefined,
      date: row.date,
      start_date: row.start_date ?? null,
      end_date: row.end_date ?? null,
      comments: row.comments ?? [],
      isPrivate: row.is_private ?? false,
      projectId: row.project_id ?? undefined,
      priority: row.priority ?? 'medium',
    }));

    setMembers((prev: TeamMember[]) =>
      prev.map((m: TeamMember) =>
        m.id === memberId ? { ...m, tasks } : m
      )
    );
  };

  useEffect(() => {
    const updateToday = () => {
      const now = getLocalToday();
      setToday(prev => (prev === now ? prev : now));
    };

    updateToday();
    const id = setInterval(updateToday, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (prevTodayRef.current == null) {
      prevTodayRef.current = today;
      return;
    }
    if (selectedDate === prevTodayRef.current) {
      setSelectedDate(today);
    }
    prevTodayRef.current = today;
  }, [today, selectedDate]);

  useEffect(() => {
    if (selectedDate < today) {
      setSelectedDate(today);
    }
  }, [today, selectedDate]);

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[supabase] error loading team_members', error);
        return;
      }

      if (!data) return;

      const mappedMembers = (data as any[]).map(mapDbMemberToTeamMember);
      setMembers(mappedMembers);

      const storedId = localStorage.getItem('currentUserId');
      if (storedId && mappedMembers.some((m: TeamMember) => m.id === storedId)) {
        setCurrentUserId(storedId);
        setCurrentView('personal');
        await loadTasksForMember(storedId);
      }
    };

    void init();
  }, []);

  useEffect(() => {
    const loadProjects = async () => {
      const { data: projData } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: true });

      if (projData) {
        setProjects(
          projData.map((p: any) => ({
            id: String(p.id),
            name: p.name,
            description: p.description ?? '',
            ownerId: p.owner_id ? String(p.owner_id) : undefined,
            createdAt: p.created_at,
          }))
        );
      }

      const { data: pmData } = await supabase
        .from('project_members')
        .select('*');

      if (pmData) {
        setProjectMembers(
          pmData.map((pm: any) => ({
            projectId: String(pm.project_id),
            memberId: String(pm.member_id),
            role: pm.role ?? '',
          }))
        );
      }
    };

    void loadProjects();
  }, []);

  const handleLoginWithCredentials = async (
    name: string,
    password: string,
    role?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedName = name.trim();

    if (!trimmedName || !password) {
      return { success: false, error: 'لطفا نام و رمز عبور را وارد کنید' };
    }

    const { data: existingUser, error: existingError } = await supabase
      .from('team_members')
      .select('*')
      .ilike('name', trimmedName)
      .maybeSingle();

    if (existingError) {
      return { success: false, error: existingError.message || 'خطایی رخ داده است' };
    }

    let userId: string | null = null;

    if (existingUser) {
      if (existingUser.password_hash !== undefined && existingUser.password_hash !== password) {
        return { success: false, error: 'رمز عبور اشتباه است' };
      }

      userId = String(existingUser.id);
      setCurrentUserId(userId);
      localStorage.setItem('currentUserId', userId);
    } else {
      const memberRole = role && role.trim() ? role.trim() : 'عضو تیم';

      const initials =
        trimmedName
          .split(/\s+/)
          .slice(0, 2)
          .map(word => (word[0] || '').toUpperCase())
          .join('') || 'TM';

      const { data: insertedData, error: insertError } = await supabase
        .from('team_members')
        .insert({
          name: trimmedName,
          role: memberRole,
          initials,
          password_hash: password,
        })
        .select()
        .single();

      if (insertError || !insertedData) {
        return { success: false, error: insertError?.message || 'خطایی رخ داده است' };
      }

      userId = String(insertedData.id);
      setCurrentUserId(userId);
      localStorage.setItem('currentUserId', userId);
    }

    const { data: allMembers, error: membersError } = await supabase
      .from('team_members')
      .select('*');

    if (membersError || !allMembers) {
      return { success: false, error: membersError?.message || 'خطایی رخ داده است' };
    }

    setMembers((allMembers as any[]).map(mapDbMemberToTeamMember));
    setViewingUserId(null);
    setCurrentView('personal');

    if (userId) {
      await loadTasksForMember(userId);
    }

    return { success: true };
  };
  const handleLogout = () => {
    setCurrentUserId(null);
    setViewingUserId(null);
    setCurrentView('login');
    localStorage.removeItem('currentUserId');
  };

  const handleDeleteAccount = async () => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', currentUserId);

      if (error) {
        console.error('[delete-account] supabase error:', error);
        alert('حذف حساب با خطا مواجه شد. لطفاً دوباره تلاش کنید.');
        return;
      }

      setMembers(prev =>
        prev.filter(m => m.id !== currentUserId)
      );

      setSelectedTask(null);
      setViewingUserId(null);
      setCurrentUserId(null);
      setCurrentView('login');

      localStorage.removeItem('currentUserId');
    } catch (err) {
      console.error('[delete-account] unexpected error:', err);
      alert('خطای غیرمنتظره‌ای رخ داد.');
    }
  };

  const handleDeleteCurrentUser = async (): Promise<void> => {
    if (!currentUserId) return;

    const confirmDelete = window.confirm(
      'آیا مطمئن هستید که می‌خواهید حساب کاربری و تمام داده‌های مربوط به خود را حذف کنید؟ این کار قابل بازگشت نیست.'
    );
    if (!confirmDelete) return;

    const userId = currentUserId;

    try {
      const { error: accessError } = await supabase
        .from('member_access')
        .delete()
        .or(`owner_id.eq.${userId},viewer_id.eq.${userId}`);

      if (accessError) {
        console.error('[supabase] error deleting member_access', accessError);
      }

      const { error: moodError } = await supabase
        .from('daily_mood')
        .delete()
        .eq('member_id', userId);

      if (moodError) {
        console.error('[supabase] error deleting daily_mood', moodError);
      }

      const { error: tasksError } = await supabase
        .from('tasks')
        .delete()
        .eq('member_id', userId);

      if (tasksError) {
        console.error('[supabase] error deleting tasks', tasksError);
      }

      const { error: projectsError } = await supabase
        .from('projects')
        .delete()
        .eq('owner_id', userId);

      if (projectsError) {
        console.error('[supabase] error deleting projects', projectsError);
      }

      const { error: memberError } = await supabase
        .from('team_members')
        .delete()
        .eq('id', userId);

      if (memberError) {
        console.error('[supabase] error deleting team_member', memberError);
      }

      setMembers((prev: TeamMember[]) =>
        prev.filter(m => m.id !== userId)
      );

      setCurrentUserId(null);
      setViewingUserId(null);
      setCurrentView('login');
      localStorage.removeItem('currentUserId');
    } catch (err) {
      console.error('[delete-current-user] unexpected error', err);
    }
  };

  const handleViewOtherUser = async (userId: string) => {
    const owner = members.find((m: TeamMember) => m.id === userId);
    if (!owner || !currentUserId) return;

    const canView = owner.id === currentUserId || owner.accessPermissions.includes(currentUserId);
    if (!canView) {
      console.warn("No permission to view this user's tasks");
      return;
    }

    await loadTasksForMember(userId);
    setViewingUserId(userId);
    setCurrentView('viewing-other');
  };

  const handleOpenProjects = () => {
    setCurrentView('projects-list');
    setSelectedProjectId(null);
  };

  const handleOpenCalendarView = () => {
    setCurrentView('calendar');
  };

  const handleOpenProjectDetail = async (projectId: string) => {
    setSelectedProjectId(projectId);

    const membersInProject = projectMembers
      .filter(pm => pm.projectId === projectId)
      .map(pm => pm.memberId);

    const uniqueMemberIds = Array.from(new Set(membersInProject));

    await Promise.all(uniqueMemberIds.map(id => loadTasksForMember(id)));

    setCurrentView('project-detail');
  };

  const handleBackToPersonalFromProjects = () => {
    setCurrentView('personal');
    setSelectedProjectId(null);
  };

  const handleBackToPersonal = () => {
    setViewingUserId(null);
    setCurrentView('personal');
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    setMembers((prevMembers: TeamMember[]) =>
      prevMembers.map((member: TeamMember) => ({
        ...member,
        tasks: member.tasks.map((task: Task) =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      }))
    );

    if (selectedTask?.id === taskId) {
      setSelectedTask((prev: Task | null) => prev ? { ...prev, ...updates } : null);
    }

    const updatePayload: Record<string, unknown> = {};
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.progress !== undefined) updatePayload.progress = updates.progress;
    if (updates.expectedOutcome !== undefined) updatePayload.expected_outcome = updates.expectedOutcome;
    if (updates.deadline !== undefined) updatePayload.deadline = updates.deadline ?? null;
    if (updates.date !== undefined) updatePayload.date = updates.date;
    if (updates.start_date !== undefined) updatePayload.start_date = updates.start_date ?? null;
    if (updates.end_date !== undefined) updatePayload.end_date = updates.end_date ?? null;
    if (updates.description !== undefined) updatePayload.description = updates.description;
    if (updates.isPrivate !== undefined) updatePayload.is_private = updates.isPrivate;
    if (updates.priority !== undefined) updatePayload.priority = updates.priority;

    if (Object.keys(updatePayload).length > 0) {
      await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', taskId);
    }
  };

  const handleAddTask = async (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
    expectedOutcome: string;
    deadline?: string;
    date?: string;
    isPrivate?: boolean;
  }) => {
    if (!currentUserId) return;

    const progress = taskData.status === 'Completed' ? 100 : taskData.status === 'In Progress' ? 50 : 0;
    
    // Build insert payload - omit date fields if not provided to let DB defaults + trigger handle them
    const insertPayload: any = {
      member_id: currentUserId,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      progress,
      expected_outcome: taskData.expectedOutcome,
      deadline: taskData.deadline ?? null,
      is_private: taskData.isPrivate ?? false,
    };
    
    // Only include date if explicitly provided
    if (taskData.date) {
      insertPayload.date = taskData.date;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error || !data) {
      console.error('[supabase] error inserting task', error);
      return;
    }

    const newTask: Task = {
      id: data.id,
      title: data.title,
      description: data.description ?? '',
      status: data.status as TaskStatus,
      progress: data.progress ?? progress,
      expectedOutcome: data.expected_outcome ?? '',
      deadline: data.deadline ?? undefined,
      date: data.date,
      start_date: data.start_date ?? null,
      end_date: data.end_date ?? null,
      comments: data.comments ?? [],
      isPrivate: data.is_private ?? false,
      priority: data.priority ?? 'medium',
    };

    setMembers((prevMembers: TeamMember[]) =>
      prevMembers.map((member: TeamMember) =>
        member.id === currentUserId
          ? { ...member, tasks: [...member.tasks, newTask] }
          : member
      )
    );

    // Reload tasks to ensure sync
    await loadTasksForMember(currentUserId);
  };

  const handleDeleteTask = async (taskId: string): Promise<void> => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('[delete-task] error:', error);
      return;
    }

    setMembers((prev: TeamMember[]) =>
      prev.map((member: TeamMember) => ({
        ...member,
        tasks: member.tasks.filter((t: Task) => t.id !== taskId)
      }))
    );

    setSelectedTask(null);
    setIsTaskModalOpen(false);

    if (currentUserId) {
      await loadTasksForMember(currentUserId);
    }
  };

  const handleOpenAddTaskDialog = (date: string) => {
    setSelectedDate(date);
    setIsAddTaskDialogOpen(true);
  };

  const handleUpdatePermissions = async (userIds: string[]) => {
    if (!currentUserId) return;

    const normalizedIds = userIds.map(id => String(id));

    setMembers((prevMembers: TeamMember[]) =>
      prevMembers.map((member: TeamMember) =>
        member.id === currentUserId
          ? { ...member, accessPermissions: normalizedIds }
          : member
      )
    );

    const { error } = await supabase
      .from('team_members')
      .update({ access_permissions: normalizedIds })
      .eq('id', currentUserId);

    if (error) {
      console.error('[supabase] error updating access_permissions', error);
    }
  };

  const handleUpdateMood = async (userId: string, mood: Mood) => {
    const { error } = await supabase
      .from('team_members')
      .update({ mood })
      .eq('id', userId);

    if (error) {
      console.error('[supabase] error updating mood', error);
      return;
    }

    setMembers((prev: TeamMember[]) =>
      prev.map((m: TeamMember) => (m.id === userId ? { ...m, mood } : m))
    );
  };

  const handleSaveProfile = async (data: { name: string; role: string; avatarUrl?: string }) => {
    if (!currentUserId) return;

    const { error } = await supabase
      .from('team_members')
      .update({
        name: data.name.trim(),
        role: data.role.trim(),
        avatar_url: data.avatarUrl ?? null,
      })
      .eq('id', currentUserId);

    if (error) {
      console.error('[supabase] error updating profile', error);
      return;
    }

    setMembers((prevMembers: TeamMember[]) =>
      prevMembers.map((member: TeamMember) =>
        member.id === currentUserId
          ? {
              ...member,
              name: data.name.trim(),
              role: data.role.trim(),
              avatarUrl: data.avatarUrl,
            }
          : member
      )
    );
  };

  const handleAddProjectTaskDialogOpen = () => {
    if (!selectedProjectId) return;
    setIsAddProjectTaskDialogOpen(true);
  };

  const handleAddProjectTask = async (data: {
    assigneeId: string;
    title: string;
    description: string;
    status: TaskStatus;
    expectedOutcome: string;
    deadline?: string;
    date?: string;
    start_date?: string;
    end_date?: string;
    isPrivate?: boolean;
    priority?: 'low' | 'medium' | 'high';
  }) => {
    if (!selectedProjectId) return;

    const progress =
      data.status === 'Completed'
        ? 100
        : data.status === 'In Progress'
        ? 50
        : 0;

    // Build insert payload - omit date fields if not provided to let DB defaults + trigger handle them
    const insertPayload: any = {
      member_id: data.assigneeId,
      project_id: selectedProjectId,
      title: data.title,
      description: data.description,
      status: data.status,
      progress,
      expected_outcome: data.expectedOutcome,
      deadline: data.deadline ?? null,
      is_private: data.isPrivate ?? false,
      priority: data.priority ?? 'medium',
    };
    
    // Only include date fields if explicitly provided
    if (data.date) insertPayload.date = data.date;
    if (data.start_date) insertPayload.start_date = data.start_date;
    if (data.end_date) insertPayload.end_date = data.end_date;

    console.log('[ADD TASK] Insert payload:', insertPayload);

    const { data: inserted, error } = await supabase
      .from('tasks')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error || !inserted) {
      console.error('[supabase] error inserting project task', error);
      alert('خطا در ایجاد وظیفه: ' + (error?.message || 'خطای ناشناخته'));
      return;
    }

    console.log('[ADD TASK] Inserted task:', inserted);

    const newTask: Task = {
      id: inserted.id,
      title: inserted.title,
      description: inserted.description ?? '',
      status: inserted.status as TaskStatus,
      progress: inserted.progress ?? progress,
      expectedOutcome: inserted.expected_outcome ?? '',
      deadline: inserted.deadline ?? undefined,
      date: inserted.date,
      start_date: inserted.start_date ?? null,
      end_date: inserted.end_date ?? null,
      comments: inserted.comments ?? [],
      isPrivate: inserted.is_private ?? false,
      projectId: inserted.project_id ?? undefined,
      priority: inserted.priority ?? 'medium',
    };

    console.log('[ADD TASK] New task object:', newTask);
    console.log('[ADD TASK] Adding to member:', data.assigneeId);

    setMembers((prevMembers: TeamMember[]) =>
      prevMembers.map((member: TeamMember) => {
        if (member.id === data.assigneeId) {
          console.log('[ADD TASK] Found member, current tasks:', member.tasks?.length || 0);
          return { ...member, tasks: [...(member.tasks || []), newTask] };
        }
        return member;
      })
    );

    console.log('[ADD TASK] Task added successfully!');

    // Reload tasks for the assignee to ensure UI is in sync
    await loadTasksForMember(data.assigneeId);
  };

  const handleCreateProject = async (data: {
    name: string;
    description?: string;
    memberIds: string[];
  }) => {
    if (!currentUserId) return;

    const trimmedName = data.name.trim();
    const trimmedDescription = (data.description ?? '').trim();

    if (!trimmedName) {
      console.warn('Project name is required');
      return;
    }

    const uniqueMemberIds = Array.from(new Set([...data.memberIds, currentUserId]));

    const { data: insertedProject, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: trimmedName,
        description: trimmedDescription || null,
        owner_id: currentUserId,
      })
      .select('*')
      .single();

    if (projectError || !insertedProject) {
      console.error('[supabase] error creating project', projectError);
      return;
    }

    const newProjectId = String(insertedProject.id);

    const projectMembersPayload = uniqueMemberIds.map(memberId => ({
      project_id: newProjectId,
      member_id: memberId,
    }));

    const { error: pmError } = await supabase
      .from('project_members')
      .insert(projectMembersPayload);

    if (pmError) {
      console.error('[supabase] error inserting project_members', pmError);
    }

    setProjects(prev => [
      ...prev,
      {
        id: newProjectId,
        name: insertedProject.name,
        description: insertedProject.description ?? '',
        ownerId: insertedProject.owner_id ? String(insertedProject.owner_id) : undefined,
        createdAt: insertedProject.created_at,
      },
    ]);

    setProjectMembers(prev => [
      ...prev,
      ...uniqueMemberIds.map(memberId => ({
        projectId: newProjectId,
        memberId,
        role: '',
      })),
    ]);
  };

  if (currentView === 'login') {
    return (
      <div dir="rtl">
        <UserLogin
          members={members}
          onLoginWithCredentials={handleLoginWithCredentials}
        />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  if (currentView === 'projects-list') {
    return (
      <div dir="rtl">
        <ProjectsDashboard
          currentUser={currentUser}
          projects={projects}
          projectMembers={projectMembers}
          allMembers={members}
          onBackToPersonal={handleBackToPersonalFromProjects}
          onOpenProject={projectId => { void handleOpenProjectDetail(projectId); }}
          onCreateProject={handleCreateProject}
        />
      </div>
    );
  }

  if (currentView === 'project-detail' && selectedProject && currentUser) {
    const projectMembersForSelected = projectMembers.filter(
      pm => pm.projectId === selectedProject.id
    );

    return (
      <div dir="rtl">
        <ProjectDetailView
          currentUser={currentUser}
          project={selectedProject}
          projectMembers={projectMembersForSelected}
          allMembers={members}
          tasksWithMembers={projectTasksWithMembers}
          selectedDate={selectedDate}
          onSelectedDateChange={setSelectedDate}
          onBack={handleBackToPersonalFromProjects}
          onTaskClick={handleTaskClick}
          onAddProjectTask={handleAddProjectTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
        />

        <TaskDetailModal
          task={selectedTask}
          member={taskOwner}
          open={isTaskModalOpen}
          onOpenChange={setIsTaskModalOpen}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
        />

        <AddProjectTaskDialog
          open={isAddProjectTaskDialogOpen}
          onOpenChange={setIsAddProjectTaskDialogOpen}
          projectName={selectedProject.name}
          projectMembers={members.filter(m =>
            projectMembersForSelected.some(pm => pm.memberId === m.id)
          )}
          selectedDate={selectedDate}
          onAddTask={handleAddProjectTask}
        />
      </div>
    );
  }

  if (currentView === 'calendar') {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-purple-50"
      >
        <div className="mx-auto w-full max-w-[1280px] px-4 py-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <Button variant="outline" onClick={() => setCurrentView('personal')}>
              بازگشت به داشبورد
            </Button>
            <p className="text-sm text-muted-foreground">نمای پنل تقویم</p>
          </div>
          <CalendarView currentUser={currentUser} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" dir="rtl">
      {currentView === 'personal' ? (
        <PersonalDashboard
          currentUser={currentUser}
          allMembers={members}
          projects={projects}
          today={today}
          selectedDate={selectedDate}
          onSelectedDateChange={setSelectedDate}
          onLogout={handleLogout}
          onTaskClick={handleTaskClick}
          onAddTask={handleOpenAddTaskDialog}
          onManagePermissions={() => setIsPermissionManagerOpen(true)}
          onViewOtherUser={userId => { void handleViewOtherUser(userId); }}
          onEditProfile={() => setIsEditProfileOpen(true)}
          onOpenProjects={handleOpenProjects}
          onOpenCalendar={handleOpenCalendarView}
          onUpdateMood={handleUpdateMood}
          onDeleteTask={handleDeleteTask}
        />
      ) : viewingUser ? (
        <OtherUserView
          viewedUser={viewingUser}
          currentUser={currentUser}
          selectedDate={selectedDate}
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
        onDeleteTask={handleDeleteTask}
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

      <EditProfileDialog
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        currentUser={currentUser}
        onSave={handleSaveProfile}
        onDeleteAccount={handleDeleteAccount}
      />
    </div>
  );
}
