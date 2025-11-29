import { Task } from '../types';
import { Card } from './ui/card';
import { Progress } from './ui/progress';

interface StatsCardsProps {
  tasks: Task[];
  selectedDate: string;
}

export function StatsCards({ tasks, selectedDate }: StatsCardsProps) {
  const todayTasks = tasks.filter(t => t.date === selectedDate);
  const todayCompleted = todayTasks.filter(t => t.status === 'Completed').length;
  const todayProgress = todayTasks.length > 0 ? Math.round((todayCompleted / todayTasks.length) * 100) : 0;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="p-5 shadow-xs border-border/60">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">امروز</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl">{todayTasks.length}</span>
            <span className="text-sm text-muted-foreground">وظیفه</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>پیشرفت</span>
              <span>{todayProgress}%</span>
            </div>
            <Progress value={todayProgress} className="h-2" />
          </div>
        </div>
      </Card>

      <Card className="p-5 shadow-xs border-border/60">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">کل وظایف</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl">{totalTasks}</span>
            <span className="text-sm text-muted-foreground">وظیفه</span>
          </div>
          <div className="flex gap-4 text-xs">
            <span className="text-green-600">{completedTasks} تکمیل شده</span>
            <span className="text-orange-600">{totalTasks - completedTasks} باقی‌مانده</span>
          </div>
        </div>
      </Card>

      <Card className="p-5 shadow-xs border-border/60">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">پیشرفت کلی</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl">{overallProgress}%</span>
          </div>
          <div className="space-y-1">
            <Progress value={overallProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {completedTasks} تکمیل، {inProgressTasks} در حال انجام
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
