import { useEffect, useState } from 'react';
import { TeamMember, Task } from '../types';
import { getMoodEmoji, getMoodLabelFa } from '../lib/moodHelpers';
import { formatJalaliFull } from '../lib/jalaliDate';
import { AvatarImage } from './ui/avatar';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DailyDocument } from './DailyDocument';
import { 
  ArrowLeft,
  Calendar,
  Eye,
  Lock,
  TrendingUp,
  BarChart3
} from 'lucide-react';

interface OtherUserViewProps {
  viewedUser: TeamMember;
  currentUser: TeamMember;
  selectedDate: string;
  onBack: () => void;
  onTaskClick: (task: Task) => void;
}

export function OtherUserView({
  viewedUser,
  currentUser,
  selectedDate,
  onBack,
  onTaskClick
}: OtherUserViewProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [selectedDateState, setSelectedDateState] = useState<string>(
    selectedDate || new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    if (selectedDate) {
      setSelectedDateState(selectedDate);
    }
  }, [selectedDate]);

  // Check if current user has permission
  const hasPermission = viewedUser.accessPermissions.includes(currentUser.id);

  const visibleTasksForDay = (viewedUser.tasks ?? []).filter(
    task => task.date === selectedDateState && task.isPrivate !== true
  );

  // Group tasks by date
  const tasksByDate = visibleTasksForDay.reduce((acc, task) => {
    if (!acc[task.date]) {
      acc[task.date] = [];
    }
    acc[task.date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const sortedDates = Object.keys(tasksByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const toggleDateExpand = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  // Calculate stats
  const allTasks = visibleTasksForDay;
  const completedTasks = allTasks.filter(t => t.status === 'Completed').length;
  const overallProgress = allTasks.length > 0 
    ? Math.round((completedTasks / allTasks.length) * 100) 
    : 0;

  const today = selectedDateState;
  const todayTasks = allTasks;
  const todayCompleted = todayTasks.filter(t => t.status === 'Completed').length;
  const todayProgress = todayTasks.length > 0 
    ? Math.round((todayCompleted / todayTasks.length) * 100) 
    : 0;

  // If no permission, show access denied
  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            بازگشت
          </Button>

          <Card className="p-12 border-gray-200 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-gray-900 mb-3">دسترسی محدود</h2>
            <p className="text-gray-600 mb-2">
              {viewedUser.name} به شما دسترسی مشاهده وظایف خود را نداده است
            </p>
            <p className="text-gray-500 text-sm">
              برای دیدن وظایف این کاربر، باید وی دسترسی لازم را به شما بدهد
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          بازگشت به داشبورد
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="text-right text-sm text-gray-600">
            {formatJalaliFull(selectedDateState)}
          </div>
          <div className="flex items-center gap-2 justify-end">
            <span className="text-sm text-gray-700">انتخاب تاریخ:</span>
            <input
              type="date"
              value={selectedDateState}
              onChange={e => setSelectedDateState(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-right"
            />
          </div>
        </div>

        <Card className="p-6 mb-6 border-gray-200 bg-gradient-to-br from-white to-purple-50">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-4 border-purple-100">
              {viewedUser.avatarUrl && (
                <AvatarImage src={viewedUser.avatarUrl} alt={viewedUser.name} className="object-cover" />
              )}
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-xl">
                {viewedUser.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                  <Eye className="w-3 h-3 ml-1" />
                  در حال مشاهده
                </Badge>
              </div>
              <h1 className="text-gray-900 mb-1">{viewedUser.name}</h1>
              <p className="text-gray-600">{viewedUser.role}</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-1" aria-label="حال امروز">
              <div className="text-3xl">{getMoodEmoji(viewedUser.mood)}</div>
              <div className="text-xs text-gray-500">{getMoodLabelFa(viewedUser.mood)}</div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              {sortedDates.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-gray-500">در این تاریخ وظیفه‌ای با دسترسی عمومی ثبت نشده است.</h3>
                </div>
              ) : (
                sortedDates.map(date => (
                  <DailyDocument
                    key={date}
                    date={date}
                    tasks={tasksByDate[date]}
                    onTaskClick={onTaskClick}
                    onAddTask={() => {}} // Read-only for other users
                    isExpanded={expandedDates.has(date)}
                    onToggleExpand={() => toggleDateExpand(date)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              {sortedDates
                .filter(date => new Date(date) > new Date())
                .map(date => (
                  <DailyDocument
                    key={date}
                    date={date}
                    tasks={tasksByDate[date]}
                    onTaskClick={onTaskClick}
                    onAddTask={() => {}} // Read-only
                    isExpanded={expandedDates.has(date)}
                    onToggleExpand={() => toggleDateExpand(date)}
                  />
                ))}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
