import { useEffect, useMemo, useState } from 'react';
import { TeamMember, Task } from '../types';
import { getMoodEmoji, getMoodLabelFa } from '../lib/moodHelpers';
import { formatJalaliFull } from '../lib/jalaliDate';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { StatsCards } from './StatsCards';
import { TimelineSection } from './TimelineSection';
import { ArrowLeft, Calendar as CalendarIcon, Lock } from 'lucide-react';

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
  onTaskClick,
}: OtherUserViewProps) {
  const [selectedDateState, setSelectedDateState] = useState<string>(
    selectedDate || new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    if (selectedDate) {
      setSelectedDateState(selectedDate);
    }
  }, [selectedDate]);

  const hasPermission = viewedUser.accessPermissions.includes(currentUser.id);

  const visibleTasks = useMemo(
    () => (viewedUser.tasks ?? []).filter(task => !task.isPrivate),
    [viewedUser.tasks]
  );

  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-purple-50">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-purple-50" dir="rtl">
      <div className="max-w-[1180px] mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button
            variant="ghost"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            بازگشت به داشبورد
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">انتخاب تاریخ:</span>
            <input
              type="date"
              value={selectedDateState}
              onChange={e => setSelectedDateState(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-right"
            />
          </div>
        </div>

        <Card className="p-6 border-gray-200 bg-gradient-to-br from-white to-purple-50">
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

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon className="w-4 h-4" />
            {formatJalaliFull(selectedDateState)}
          </div>
        </div>

        <StatsCards tasks={visibleTasks} selectedDate={selectedDateState} />

        <TimelineSection
          tasks={visibleTasks}
          selectedDate={selectedDateState}
          onTaskClick={onTaskClick}
          onDeleteTask={undefined}
          onAddTaskForDate={() => {}}
          readOnly
        />
      </div>
    </div>
  );
}
