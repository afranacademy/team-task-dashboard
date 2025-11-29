import { useMemo, useState } from 'react';
import { formatJalaliDate } from '../lib/dateJalali';
import type { Project, ProjectMember, TeamMember, Task, TaskStatus } from '../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getStatusLabelFa } from '../lib/statusLabels';
import { ArrowLeft, Crown, Plus, Calendar, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Safe date handling helper
type TimedTask = Omit<Task, 'startDate'> & {
  startDate: Date;
  endDate: Date;
};

function getTaskDateRange(task: Task): TimedTask | null {
  // Get date from task.date (required field, but may be missing in old data)
  const due = task.date ? new Date(task.date) : null;
  
  // Validate due date
  if (due && Number.isNaN(due.getTime())) {
    return null;
  }

  // Get start date: use startDate if available, otherwise date - 1 day, otherwise null
  let start: Date | null = null;
  if (task.startDate) {
    start = new Date(task.startDate);
    if (Number.isNaN(start.getTime())) {
      start = null;
    }
  }
  
  if (!start && due) {
    start = new Date(due);
    start.setDate(start.getDate() - 1); // date - 1 day as per requirements
  }

  // Get end date: use deadline if available, otherwise use date
  let end: Date | null = null;
  if (task.deadline) {
    end = new Date(task.deadline);
    if (Number.isNaN(end.getTime())) {
      end = null;
    }
  }
  
  if (!end && due) {
    end = new Date(due); // end_date = date as per requirements
  }

  // Both start and end must be valid
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  // Ensure end is after or equal to start
  if (end.getTime() < start.getTime()) {
    end = new Date(start);
    end.setDate(end.getDate() + 1); // At least 1 day duration
  }

  return { ...task, startDate: start, endDate: end };
}

interface ProjectDetailViewProps {
  currentUser: TeamMember;
  project: Project;
  projectMembers: ProjectMember[];
  allMembers: TeamMember[];
  tasksWithMembers: { task: Task; member: TeamMember }[];
  selectedDate: string;
  onSelectedDateChange: (date: string) => void;
  onBack: () => void;
  onTaskClick: (task: Task) => void;
  onAddProjectTask: () => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

// ProjectHeader Component
function ProjectHeader({
  project,
  currentUser,
  allMembers,
  onBack,
}: {
  project: Project;
  currentUser: TeamMember;
  allMembers: TeamMember[];
  onBack: () => void;
}) {
  const isOwner = project.ownerId === currentUser.id;
  const owner = useMemo(() => {
    if (!project.ownerId) return null;
    return allMembers.find(m => m.id === project.ownerId) || null;
  }, [project.ownerId, allMembers]);

  // Derive project status from dates (optional - if project has dates)
  const projectStatus = useMemo(() => {
    // Since Project type doesn't have status, we'll default to "active"
    // In a real implementation, this would come from the database
    return 'active';
  }, []);

  const getStatusBadge = () => {
    switch (projectStatus) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 border-green-200">فعال</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">تکمیل شده</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">بایگانی شده</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-700 border-green-200">فعال</Badge>;
    }
  };

  return (
    <div className="mb-6" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              بازگشت به پروژه‌ها
            </Button>
      </div>
      <Card className="p-6 border-gray-200">
        <div className="flex items-start justify-between gap-4">
          <div className="text-right flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              {getStatusBadge()}
              {isOwner && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Crown className="w-3 h-3 ml-1" />
                  مالک پروژه
                </Badge>
              )}
            </div>
            {project.description ? (
              <p className="text-sm text-gray-600 mt-2">{project.description}</p>
            ) : (
              <p className="text-sm text-gray-400 italic mt-2">توضیحی ثبت نشده است</p>
            )}
            {owner && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-gray-500">مالک:</span>
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    {owner.avatarUrl && <AvatarImage src={owner.avatarUrl} alt={owner.name} />}
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-xs">
                      {owner.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-700">{owner.name}</span>
        </div>
              </div>
            )}
            </div>
          </div>
        </Card>
    </div>
  );
}

// ProjectTasksTab Component
function ProjectTasksTab({
  project,
  currentUser,
  tasksWithMembers,
  allMembers,
  onTaskClick,
}: {
  project: Project;
  currentUser: TeamMember;
  tasksWithMembers: { task: Task; member: TeamMember }[];
  allMembers: TeamMember[];
  onTaskClick: (task: Task) => void;
}) {
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
              {/* Priority badge - Note: priority field doesn't exist in current Task type */}
              {/* If priority exists in database, uncomment and use: task.priority */}
              {/* 
              {task.priority && (
                <Badge variant="outline" className="text-xs" style={{
                  backgroundColor: task.priority === 'high' ? '#fee2e2' : task.priority === 'medium' ? '#fef3c7' : '#d1fae5',
                  color: task.priority === 'high' ? '#991b1b' : task.priority === 'medium' ? '#92400e' : '#065f46'
                }}>
                  {task.priority === 'high' ? 'بالا' : task.priority === 'medium' ? 'متوسط' : 'پایین'}
                </Badge>
              )}
              */}
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

// ProjectBoardTab Component
function ProjectBoardTab({
  project,
  currentUser,
  tasksWithMembers,
  allMembers,
  projectMembers,
  today,
  onUpdateTask,
  onAddProjectTask,
}: {
  project: Project;
  currentUser: TeamMember;
  tasksWithMembers: { task: Task; member: TeamMember }[];
  allMembers: TeamMember[];
  projectMembers: ProjectMember[];
  today: string;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onAddProjectTask: () => void;
}) {
  const [notes, setNotes] = useState('');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('To Do');
  const [newTaskAssignee, setNewTaskAssignee] = useState(currentUser.id);

  const isOwner = project.ownerId === currentUser.id;
  const canEditTask = (task: Task) => {
    const taskMember = tasksWithMembers.find(tm => tm.task.id === task.id)?.member;
    return isOwner || (taskMember && taskMember.id === currentUser.id);
  };

  // Get ALL project tasks (not just current user's)
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

  // "وظایف امروز من" - only current user's tasks for today (with safe date check)
  const todayTasks = useMemo(
    () => allProjectTasks
      .filter(tm => {
        const task = tm.task;
        return isTaskDateToday(task.date) && tm.member.id === currentUser.id;
      })
      .map(tm => tm.task),
    [allProjectTasks, today, currentUser.id]
  );

  // Other columns show ALL project tasks (not filtered by user)
  // Tasks without dates are excluded from "today" column but included in status columns
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
    targetStatus: TaskStatus | 'today',
    targetDate?: string
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

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !project.id) return;

    // Ensure date is always set (default to today if not provided)
    const todayStr = new Date().toISOString().split('T')[0];
    const taskDate = today || todayStr; // Use today prop if available, otherwise current date
    const startDate = taskDate; // start_date = date (as per requirements)

    const progress = newTaskStatus === 'Completed' ? 100 : newTaskStatus === 'In Progress' ? 50 : 0;
    
    const { data: inserted, error } = await supabase
      .from('tasks')
      .insert({
        member_id: newTaskAssignee,
        project_id: project.id,
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || '',
        status: newTaskStatus,
        progress,
        expected_outcome: '',
        deadline: null,
        date: taskDate,
        start_date: startDate,
        is_private: false,
      })
      .select('*')
      .single();

    if (error) {
      console.error('[supabase] error inserting task', error);
      return;
    }

    // Reset form
    setIsAddTaskOpen(false);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskStatus('To Do');
    setNewTaskAssignee(currentUser.id);

    // Trigger parent's task refresh by calling onAddProjectTask
    // This will cause App.tsx to reload tasks
    // For immediate UI update, we could add a callback prop, but for now
    // the existing dialog handler pattern is used
    if (onAddProjectTask) {
      // The parent will handle task refresh
      // In a production app, you'd want to add a refresh callback prop
    }
  };

  const getPriorityBadge = (task: Task) => {
    // Use progress as priority indicator: high progress = high priority
    // Or use status: In Progress = high, To Do = medium, Completed = low
    let priority: 'high' | 'medium' | 'low' = 'medium';
    if (task.status === 'In Progress') {
      priority = 'high';
    } else if (task.status === 'To Do') {
      priority = 'medium';
    } else {
      priority = 'low';
    }

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
        {/* Add New Task Card */}
        <Card
          className="p-3 mb-2 border-2 border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-colors cursor-pointer"
          onClick={() => setIsAddTaskOpen(true)}
        >
          <div className="text-center text-xs text-gray-500 flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            افزودن وظیفه جدید
          </div>
        </Card>
      </div>
    </Card>
  );

  // Get all project members from projectMembers prop
  const projectMembersList = useMemo(
    () => {
      const memberIds = projectMembers
        .filter(pm => pm.projectId === project.id)
        .map(pm => pm.memberId);
      return allMembers.filter(m => memberIds.includes(m.id));
    },
    [allMembers, projectMembers, project.id]
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">برد کارها</h3>
        <Button
          onClick={() => setIsAddTaskOpen(true)}
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

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>افزودن وظیفه جدید</DialogTitle>
            <DialogDescription>وظیفه جدید را به این پروژه اضافه کنید</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>عنوان</Label>
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="عنوان وظیفه"
                className="text-right"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>توضیحات</Label>
              <Textarea
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="توضیحات (اختیاری)"
                className="text-right min-h-[80px]"
                dir="rtl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>وضعیت</Label>
                <Select value={newTaskStatus} onValueChange={(v) => setNewTaskStatus(v as TaskStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="To Do">{getStatusLabelFa('To Do')}</SelectItem>
                    <SelectItem value="In Progress">{getStatusLabelFa('In Progress')}</SelectItem>
                    <SelectItem value="Completed">{getStatusLabelFa('Completed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>مسئول انجام</Label>
                <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projectMembersList.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>
              انصراف
            </Button>
            <Button onClick={handleCreateTask} disabled={!newTaskTitle.trim()}>
              افزودن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ProjectTimelineTab Component - Google Calendar Style
function ProjectTimelineTab({
  project,
  currentUser,
  tasksWithMembers,
  allMembers,
  projectMembers,
  onUpdateTask,
  onTaskClick,
  onAddProjectTask,
}: {
  project: Project;
  currentUser: TeamMember;
  tasksWithMembers: { task: Task; member: TeamMember }[];
  allMembers: TeamMember[];
  projectMembers: ProjectMember[];
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onTaskClick: (task: Task) => void;
  onAddProjectTask: () => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [selectedDateForNewTask, setSelectedDateForNewTask] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('To Do');
  const [newTaskAssignee, setNewTaskAssignee] = useState(currentUser.id);

  const allProjectTasks = useMemo(
    () => tasksWithMembers.filter(tm => tm.task.projectId === project.id),
    [tasksWithMembers, project.id]
  );

  const isOwner = project.ownerId === currentUser.id;

  const canEditTask = (task: Task) => {
    const taskMember = allProjectTasks.find(tm => tm.task.id === task.id)?.member;
    return isOwner || (taskMember && taskMember.id === currentUser.id);
  };

  // Use the safe helper function instead of inline date handling
  // getTaskDateRange is defined at the top of the file

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500';
      case 'In Progress':
        return 'bg-blue-500';
      case 'To Do':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const handleBarClick = (timedTask: TimedTask) => {
    const originalTask = allProjectTasks.find(tm => tm.task.id === timedTask.id)?.task;
    if (!originalTask) return;
    
    if (!canEditTask(originalTask)) {
      onTaskClick(originalTask);
      return;
    }
    setEditingTask(originalTask);
    setEditStartDate(timedTask.startDate.toISOString().split('T')[0]);
    setEditEndDate(timedTask.endDate.toISOString().split('T')[0]);
  };

  const handleSaveDates = async () => {
    if (!editingTask || !onUpdateTask) return;

    await onUpdateTask(editingTask.id, {
      startDate: editStartDate,
      deadline: editEndDate,
      date: editStartDate, // Also update the main date field
    });

    setEditingTask(null);
    setEditStartDate('');
    setEditEndDate('');
  };

  // Get all project tasks with their dates
  const tasksByDate = useMemo(() => {
    const map = new Map<string, { task: Task; member: TeamMember }[]>();
    
    allProjectTasks.forEach(({ task, member }) => {
      if (!task.date) return;
      const dateStr = task.date;
      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)!.push({ task, member });
    });
    
    return map;
  }, [allProjectTasks]);

  // Calendar month helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { firstDay, lastDay, daysInMonth, startingDayOfWeek };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDateForNewTask(dateStr);
    setIsAddTaskOpen(true);
  };

  const handleTaskDrop = async (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    if (!draggedTaskId || !onUpdateTask) {
      setDraggedTaskId(null);
      return;
    }

    const originalTask = allProjectTasks.find(tm => tm.task.id === draggedTaskId)?.task;
    if (!originalTask || !canEditTask(originalTask)) {
      setDraggedTaskId(null);
      return;
    }

    await onUpdateTask(originalTask.id, {
      date: targetDateStr,
      startDate: targetDateStr,
      deadline: targetDateStr,
    });
    
    setDraggedTaskId(null);
  };

  const handleTaskDragStart = (e: React.DragEvent, task: Task) => {
    if (!canEditTask(task)) {
      e.preventDefault();
      return;
    }
    setDraggedTaskId(task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const { firstDay, lastDay, daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' });
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Get week day names (RTL)
  const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  // Generate calendar days
  const calendarDays: Array<{ date: Date; dateStr: string; isCurrentMonth: boolean; isToday: boolean }> = [];
  
  // Add previous month's trailing days
  const prevMonth = new Date(currentMonth);
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const prevMonthLastDay = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();
  
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, prevMonthLastDay - i);
    calendarDays.push({
      date,
      dateStr: date.toISOString().split('T')[0],
      isCurrentMonth: false,
      isToday: date.toISOString().split('T')[0] === todayStr,
    });
  }
  
  // Add current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    calendarDays.push({
      date,
      dateStr: date.toISOString().split('T')[0],
      isCurrentMonth: true,
      isToday: date.toISOString().split('T')[0] === todayStr,
    });
  }
  
  // Add next month's leading days to complete the grid
  const remainingDays = 42 - calendarDays.length; // 6 weeks * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, day);
    calendarDays.push({
      date,
      dateStr: date.toISOString().split('T')[0],
      isCurrentMonth: false,
      isToday: date.toISOString().split('T')[0] === todayStr,
    });
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Calendar Header */}
      <Card className="p-4 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-semibold text-gray-900">{monthName}</h2>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Button>
          </div>
          <Button
            onClick={() => {
              setSelectedDateForNewTask(todayStr);
              setIsAddTaskOpen(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            افزودن وظیفه
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Week day headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {weekDays.map((day, idx) => (
              <div key={idx} className="p-2 text-center text-sm font-medium text-gray-700 border-l border-gray-200 last:border-l-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((dayInfo, idx) => {
              const dayTasks = tasksByDate.get(dayInfo.dateStr) || [];
              const isWeekend = dayInfo.date.getDay() === 5 || dayInfo.date.getDay() === 6; // Friday or Saturday

              return (
                <div
                  key={idx}
                  className={`min-h-[120px] border-l border-b border-gray-200 p-2 ${
                    !dayInfo.isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                  } ${isWeekend ? 'bg-blue-50' : ''} ${
                    dayInfo.isToday ? 'bg-purple-50 border-purple-300 border-2' : ''
                  } hover:bg-gray-50 transition-colors relative`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleTaskDrop(e, dayInfo.dateStr)}
                  onClick={() => handleDateClick(dayInfo.dateStr)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-medium ${
                        !dayInfo.isCurrentMonth
                          ? 'text-gray-400'
                          : dayInfo.isToday
                          ? 'text-purple-600 font-bold'
                          : 'text-gray-700'
                      }`}
                    >
                      {dayInfo.date.getDate()}
                    </span>
                    {dayTasks.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {dayTasks.length}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Tasks for this day */}
                  <div className="space-y-1 mt-1">
                    {dayTasks.slice(0, 3).map(({ task, member }) => {
                      const canDrag = canEditTask(task);
                      return (
                        <div
                          key={task.id}
                          draggable={canDrag}
                          onDragStart={(e) => canDrag && handleTaskDragStart(e, task)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick(task);
                          }}
                          className={`text-xs p-1.5 rounded cursor-pointer ${getStatusColor(task.status)} text-white truncate ${
                            canDrag ? 'hover:opacity-80' : ''
                          }`}
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayTasks.length - 3} بیشتر
                      </div>
                )}
              </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

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
            </div>
            <div className="space-y-2">
              <Label>تاریخ پایان</Label>
              <Input
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                className="text-right"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>
              انصراف
            </Button>
            <Button onClick={handleSaveDates}>
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog for Calendar */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>افزودن وظیفه جدید</DialogTitle>
            <DialogDescription>
              برای تاریخ: {formatJalaliDate(selectedDateForNewTask)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>عنوان</Label>
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="عنوان وظیفه"
                className="text-right"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>توضیحات</Label>
              <Textarea
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="توضیحات (اختیاری)"
                className="text-right min-h-[80px]"
                dir="rtl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>وضعیت</Label>
                <Select value={newTaskStatus} onValueChange={(v) => setNewTaskStatus(v as TaskStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="To Do">{getStatusLabelFa('To Do')}</SelectItem>
                    <SelectItem value="In Progress">{getStatusLabelFa('In Progress')}</SelectItem>
                    <SelectItem value="Completed">{getStatusLabelFa('Completed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>مسئول انجام</Label>
                <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allMembers.filter(m => 
                      projectMembers.some(pm => pm.memberId === m.id && pm.projectId === project.id)
                    ).map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddTaskOpen(false);
              setNewTaskTitle('');
              setNewTaskDescription('');
              setNewTaskStatus('To Do');
              setNewTaskAssignee(currentUser.id);
            }}>
              انصراف
            </Button>
            <Button onClick={async () => {
              if (!newTaskTitle.trim() || !project.id) return;

              const taskDate = selectedDateForNewTask || new Date().toISOString().split('T')[0];
              const startDate = taskDate;
              const progress = newTaskStatus === 'Completed' ? 100 : newTaskStatus === 'In Progress' ? 50 : 0;
              
              const { error } = await supabase
                .from('tasks')
                .insert({
                  member_id: newTaskAssignee,
                  project_id: project.id,
                  title: newTaskTitle.trim(),
                  description: newTaskDescription.trim() || '',
                  status: newTaskStatus,
                  progress,
                  expected_outcome: '',
                  deadline: null,
                  date: taskDate,
                  start_date: startDate,
                  is_private: false,
                });

              if (error) {
                console.error('[supabase] error inserting task', error);
                return;
              }

              setIsAddTaskOpen(false);
              setNewTaskTitle('');
              setNewTaskDescription('');
              setNewTaskStatus('To Do');
              setNewTaskAssignee(currentUser.id);
              
              // Trigger refresh
              onAddProjectTask();
            }} disabled={!newTaskTitle.trim()}>
              افزودن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Main Component
export function ProjectDetailView({
  project,
  currentUser,
  projectMembers,
  allMembers,
  tasksWithMembers,
  selectedDate,
  onSelectedDateChange,
  onBack,
  onTaskClick,
  onAddProjectTask,
  onUpdateTask,
}: ProjectDetailViewProps) {
  const getLocalToday = () => new Date().toLocaleDateString('en-CA');
  const today = getLocalToday();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <ProjectHeader 
          project={project} 
          currentUser={currentUser} 
          allMembers={allMembers}
          onBack={onBack} 
        />

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="tasks">کارها</TabsTrigger>
            <TabsTrigger value="board">برد</TabsTrigger>
            <TabsTrigger value="timeline">تایم‌لاین</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <ProjectTasksTab
              project={project}
              currentUser={currentUser}
              tasksWithMembers={tasksWithMembers}
              allMembers={allMembers}
              onTaskClick={onTaskClick}
            />
          </TabsContent>

          <TabsContent value="board">
            <ProjectBoardTab
              project={project}
              currentUser={currentUser}
              tasksWithMembers={tasksWithMembers}
              allMembers={allMembers}
              projectMembers={projectMembers}
              today={today}
              onUpdateTask={onUpdateTask}
              onAddProjectTask={onAddProjectTask}
            />
          </TabsContent>

          <TabsContent value="timeline">
            <ProjectTimelineTab
              project={project}
              currentUser={currentUser}
              tasksWithMembers={tasksWithMembers}
              allMembers={allMembers}
              projectMembers={projectMembers}
              onUpdateTask={onUpdateTask}
              onTaskClick={onTaskClick}
              onAddProjectTask={onAddProjectTask}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
