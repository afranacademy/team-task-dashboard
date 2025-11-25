import { useState, useMemo, useEffect } from 'react';
import { TeamMember, Task, Project, Mood } from '../types';
import { getMoodEmoji } from '../lib/moodHelpers';
import { formatJalaliDate } from '../lib/dateJalali';
import { formatJalaliFull } from '../lib/jalaliDate';
import { getStatusLabelFa } from '../lib/statusLabels';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DailyDocument } from './DailyDocument';
import { 
  LogOut,
  Settings, 
  Users,
  Calendar,
  Lock,
  Unlock,
  TrendingUp,
  BarChart3
} from 'lucide-react';

interface PersonalDashboardProps {
  currentUser: TeamMember;
  allMembers: TeamMember[];
  projects: Project[];
  selectedDate: string;
  onSelectedDateChange: (date: string) => void;
  onLogout: () => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (date: string) => void;
  onManagePermissions: () => void;
  onViewOtherUser: (userId: string) => void;
  onEditProfile: () => void;
  onOpenProjects: () => void;
  onUpdateMood: (userId: string, mood: Mood) => void;
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
  onUpdateMood
}: PersonalDashboardProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [selectedMood, setSelectedMood] = useState<Mood | null>(currentUser.mood ?? null);

  useEffect(() => {
    setSelectedMood(currentUser.mood ?? null);
  }, [currentUser.mood]);

  const tasksForSelectedDate = (currentUser.tasks ?? []).filter(
    task => task.date === selectedDate
  );
  const personalTasksForSelectedDate = tasksForSelectedDate.filter(task => !task.projectId);
  const projectTasksForSelectedDate = tasksForSelectedDate.filter(task => task.projectId);

  const sharedTasksForSelectedDate = personalTasksForSelectedDate.filter(task => !task.isPrivate);
  const privateTasksForSelectedDate = personalTasksForSelectedDate.filter(task => task.isPrivate);

  const projectMap = new Map<string, Project>();
  projects.forEach(p => projectMap.set(p.id, p));

  const projectTasksGroupedByProject = projectTasksForSelectedDate.reduce((acc, t) => {
    if (!t.projectId) return acc;
    if (!acc[t.projectId]) acc[t.projectId] = [];
    acc[t.projectId].push(t);
    return acc;
  }, {} as Record<string, Task[]>);

  // Group tasks by date and sort
  const tasksByDate = useMemo(() => {
    const grouped = sharedTasksForSelectedDate.reduce((acc, task) => {
      if (!acc[task.date]) {
        acc[task.date] = [];
      }
      acc[task.date].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    // Sort dates in descending order (newest first)
    const sortedDates = Object.keys(grouped).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    return sortedDates.map(date => ({
      date,
      tasks: grouped[date]
    }));
  }, [sharedTasksForSelectedDate]);

  // Get dates for next 7 days (for quick access)
  const upcomingDates = useMemo(() => {
    const dates: string[] = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Only add if not already in tasksByDate
      if (!tasksByDate.find(td => td.date === dateStr)) {
        dates.push(dateStr);
      }
    }
    
    return dates;
  }, [tasksByDate]);

  // Get accessible members
  const accessibleMembers = allMembers.filter(
    m => m.id !== currentUser.id && m.accessPermissions.includes(currentUser.id)
  );

  // Calculate overall stats
  const allTasks = sharedTasksForSelectedDate;
  const completedTasks = allTasks.filter(t => t.status === 'Completed').length;
  const overallProgress = allTasks.length > 0 
    ? Math.round((completedTasks / allTasks.length) * 100) 
    : 0;

  const toggleDateExpand = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const today = selectedDate;
  const todayTasks = sharedTasksForSelectedDate;
  const todayCompleted = todayTasks.filter(t => t.status === 'Completed').length;
  const todayProgress = todayTasks.length > 0 
    ? Math.round((todayCompleted / todayTasks.length) * 100) 
    : 0;

  const MoodPicker = () => {
    const moodValue: Mood | undefined = selectedMood ?? currentUser.mood ?? 'medium';

    const moodOptions: { value: Mood; label: string; emoji: string }[] = [
      { value: 'bad', label: 'بد', emoji: '☹️' },
      { value: 'medium', label: 'متوسط', emoji: '🙂' },
      { value: 'good', label: 'خوب', emoji: '☺️' },
      { value: 'great', label: 'عالی', emoji: '😍' },
    ];

    const handleMoodSelect = (mood: Mood) => {
      setSelectedMood(mood);
      onUpdateMood(currentUser.id, mood);
    };

    return (
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="text-right">
          <p className="text-sm text-gray-500">حال امروز</p>
          <p className="text-base text-gray-900">حست چطوره؟</p>
        </div>
        <div className="flex items-center gap-2 justify-end" dir="rtl">
          <span className="text-xs text-gray-500">حال امروز:</span>
          {moodOptions.map(option => {
            const isActive = moodValue === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleMoodSelect(option.value)}
                className={[
                  'w-8 h-8 flex items-center justify-center rounded-full border text-lg transition',
                  isActive
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                ].join(' ')}
                aria-label={option.label}
              >
                {option.emoji}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-4 border-purple-100">
              {currentUser.avatarUrl && (
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} className="object-cover" />
              )}
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-lg">
                {currentUser.initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-right">
              <h1 className="text-gray-900">{currentUser.name}</h1>
              <p className="text-gray-500">{currentUser.role}</p>
            </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onEditProfile}
              className="gap-2"
            >
              ویرایش پروفایل
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenProjects}
              className="gap-2"
            >
              پروژه‌ها
            </Button>
            <Button
              variant="outline"
              onClick={onManagePermissions}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              مدیریت دسترسی‌ها
            </Button>
            <Button
              variant="outline"
              onClick={onLogout}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              خروج
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onSelectedDateChange(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-right"
            />
            <div className="text-xs text-gray-500 text-right">
              {formatJalaliFull(selectedDate)}
            </div>
          </div>
          <Button
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            onClick={() => onAddTask(selectedDate)}
          >
            افزودن وظیفه
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="p-5 border-gray-200 bg-gradient-to-br from-blue-50 to-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600">امروز</p>
                </div>
                <p className="text-3xl text-gray-900 mb-1">{todayTasks.length}</p>
                <p className="text-sm text-gray-500">وظیفه - {todayProgress}% پیشرفت</p>
              </Card>

              <Card className="p-5 border-gray-200 bg-gradient-to-br from-purple-50 to-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-600">کل وظایف</p>
                </div>
                <p className="text-3xl text-gray-900 mb-1">{allTasks.length}</p>
                <p className="text-sm text-gray-500">{completedTasks} انجام شده</p>
              </Card>

              <Card className="p-5 border-gray-200 bg-gradient-to-br from-green-50 to-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">پیشرفت کلی</p>
                </div>
                <p className="text-3xl text-gray-900 mb-1">{overallProgress}%</p>
                <p className="text-sm text-gray-500">از همه وظایف</p>
              </Card>
            </div>

            <MoodPicker />

            {/* Daily Documents */}
            <Card className="p-6 border-gray-200">
              <Tabs defaultValue="timeline" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="timeline">
                    <Calendar className="w-4 h-4 mr-2" />
                    تایم‌لاین روزانه
                  </TabsTrigger>
                  <TabsTrigger value="upcoming">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    روزهای آینده
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="space-y-4">
                  {tasksByDate.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-gray-500 mb-2">هنوز وظیفه‌ای ثبت نشده</h3>
                      <p className="text-gray-400 mb-6">برای شروع، یک و��یفه برای امروز اضافه کنید</p>
                      <Button
                        onClick={() => onAddTask(today)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600"
                      >
                        افزودن اولین وظیفه
                      </Button>
                    </div>
                  ) : (
                    tasksByDate.map(({ date, tasks }) => (
                      <DailyDocument
                        key={date}
                        date={date}
                        tasks={tasks}
                        onTaskClick={onTaskClick}
                        onAddTask={onAddTask}
                        isExpanded={expandedDates.has(date)}
                        onToggleExpand={() => toggleDateExpand(date)}
                        actionSlot={
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAddTask(date)}
                          >
                            افزودن وظیفه برای این روز
                          </Button>
                        }
                      />
                    ))
                  )}
                </TabsContent>

                  <TabsContent value="upcoming" className="space-y-4">
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-right">
                      <p className="text-sm text-blue-800">
                        💡 روزهای آینده که هنوز وظیفه‌ای برای آن‌ها تعریف نشده
                      </p>
                  </div>
                  
                  {upcomingDates.map(date => (
                    <DailyDocument
                      key={date}
                      date={date}
                      tasks={[]}
                      onTaskClick={onTaskClick}
                      onAddTask={onAddTask}
                      isExpanded={false}
                      onToggleExpand={() => toggleDateExpand(date)}
                      actionSlot={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAddTask(date)}
                        >
                          افزودن وظیفه برای این روز
                        </Button>
                      }
                    />
                  ))}

                  {/* Existing upcoming dates with tasks */}
                  {tasksByDate
                    .filter(({ date }) => new Date(date) > new Date())
                    .map(({ date, tasks }) => (
                      <DailyDocument
                        key={date}
                        date={date}
                        tasks={tasks}
                        onTaskClick={onTaskClick}
                        onAddTask={onAddTask}
                        isExpanded={expandedDates.has(date)}
                        onToggleExpand={() => toggleDateExpand(date)}
                        actionSlot={
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAddTask(date)}
                          >
                            افزودن وظیفه برای این روز
                          </Button>
                        }
                      />
                    ))}
                </TabsContent>
              </Tabs>
            </Card>

            {Object.keys(projectTasksGroupedByProject).length > 0 && (
              <Card className="p-5 border-gray-200" dir="rtl">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-base font-semibold text-gray-900 text-right">
                    کارهای پروژه (برای این روز)
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 text-right">
                    این‌ها وظایف پروژه‌ای هستند که در تاریخ انتخاب‌شده باید انجام شوند.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="space-y-4">
                    {Object.entries(projectTasksGroupedByProject).map(([projectId, tasks]) => {
                      const project = projectMap.get(projectId);
                      return (
                        <div key={projectId} className="border-t border-gray-100 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-semibold text-gray-800">
                              {project?.name ?? 'پروژه بدون نام'}
                            </div>
                            {project?.description && (
                              <div className="text-xs text-gray-500 max-w-xs text-right">
                                {project.description}
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            {tasks.map(task => (
                              <button
                                key={task.id}
                                type="button"
                                onClick={() => onTaskClick(task)}
                                className="w-full text-right border border-gray-100 rounded-lg px-3 py-2 hover:bg-gray-50 flex flex-col gap-1"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {task.title}
                                  </span>
                                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] bg-gray-100 text-gray-700">
                                    {getStatusLabelFa(task.status)}
                                  </span>
                                </div>
                                {task.expectedOutcome && (
                                  <div className="text-xs text-gray-500 line-clamp-2">
                                    {task.expectedOutcome}
                                  </div>
                                )}
                                <div className="mt-1">
                                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-purple-500"
                                      style={{ width: `${task.progress ?? 0}%` }}
                                    />
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {privateTasksForSelectedDate.length > 0 && (
              <Card className="p-5 border-dashed border-gray-300 bg-purple-50/40">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">وظایف خصوصی (فقط خود شما می‌بینید)</h3>
                  <p className="text-xs text-gray-500">این وظایف در دید سایر اعضای تیم نیستند.</p>
                </div>
                <div className="space-y-2">
                  {privateTasksForSelectedDate.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-lg border border-gray-200 bg-white shadow-sm flex items-center justify-between"
                    >
                      <div className="text-right">
                        <p className="text-sm text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500">{task.status}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => onTaskClick(task)}>
                        مشاهده
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Access Status */}
            <Card className="p-5 border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  {currentUser.accessPermissions.length > 0 ? (
                    <Unlock className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div className="text-right flex-1">
                  <p className="text-sm text-gray-500">وضعیت دسترسی</p>
                  <p className="text-gray-900">
                    {currentUser.accessPermissions.length > 0 ? 'عمومی' : 'خصوصی'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-right mb-3">
                {currentUser.accessPermissions.length} نفر می‌توانند وظایف شما را ببینند
              </p>
              <Button
                variant="outline"
                onClick={onManagePermissions}
                className="w-full gap-2"
              >
                <Settings className="w-4 h-4" />
                تنظیمات دسترسی
              </Button>
            </Card>

            {/* Team Members */}
            <Card className="p-5 border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-gray-900 text-right flex-1">
                  اعضای تیم قابل مشاهده
                </h3>
              </div>
              
              {accessibleMembers.length === 0 ? (
                <p className="text-sm text-gray-500 text-right">
                  هنوز کسی به شما دسترسی نداده است
                </p>
              ) : (
                <div className="space-y-2">
                  {accessibleMembers.map((member) => (
                    <Card
                      key={member.id}
                      className="p-3 cursor-pointer hover:bg-purple-50 transition-colors border-gray-200"
                      onClick={() => onViewOtherUser(member.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-purple-100">
                          {member.avatarUrl && (
                            <AvatarImage src={member.avatarUrl} alt={member.name} className="object-cover" />
                          )}
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-sm">
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-right min-w-0">
                          <p className="text-sm text-gray-900 truncate">{member.name}</p>
                          <p className="text-xs text-gray-500 truncate">{member.role}</p>
                        </div>
                        <span className="text-2xl" aria-label="حال امروز">{getMoodEmoji(member.mood)}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
