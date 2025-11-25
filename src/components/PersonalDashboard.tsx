import { useState, useMemo } from 'react';
import { TeamMember, Task } from '../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
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
  onLogout: () => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (date: string) => void;
  onManagePermissions: () => void;
  onViewOtherUser: (userId: string) => void;
}

export function PersonalDashboard({
  currentUser,
  allMembers,
  onLogout,
  onTaskClick,
  onAddTask,
  onManagePermissions,
  onViewOtherUser
}: PersonalDashboardProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Group tasks by date and sort
  const tasksByDate = useMemo(() => {
    const grouped = currentUser.tasks.reduce((acc, task) => {
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
  }, [currentUser.tasks]);

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
  const allTasks = currentUser.tasks;
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

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = currentUser.tasks.filter(t => t.date === today);
  const todayCompleted = todayTasks.filter(t => t.status === 'Completed').length;
  const todayProgress = todayTasks.length > 0 
    ? Math.round((todayCompleted / todayTasks.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-4 border-purple-100">
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-lg">
                {currentUser.initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-right">
              <h1 className="text-gray-900">{currentUser.name}</h1>
              <p className="text-gray-500">{currentUser.role}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      />
                    ))}
                </TabsContent>
              </Tabs>
            </Card>
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
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-sm">
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-right min-w-0">
                          <p className="text-sm text-gray-900 truncate">{member.name}</p>
                          <p className="text-xs text-gray-500 truncate">{member.role}</p>
                        </div>
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
