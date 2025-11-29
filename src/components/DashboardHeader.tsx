import { formatJalaliFull } from '../lib/jalaliDate';
import { Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface DashboardHeaderProps {
  userName: string;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onAddTask: (date: string) => void;
}

const motivationalQuotes = [
  'هر روز فرصتی جدید برای پیشرفت است',
  'با برنامه‌ریزی دقیق به اهدافت نزدیک‌تر شو',
  'موفقیت حاصل تلاش‌های کوچک روزانه است',
  'امروز را با انگیزه شروع کن',
];

export function DashboardHeader({
  userName,
  selectedDate,
  onDateChange,
  onAddTask,
}: DashboardHeaderProps) {
  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1>سلام {userName} 👋</h1>
          <p className="text-muted-foreground">{randomQuote}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground min-w-[130px] text-right">
            {formatJalaliFull(selectedDate)}
          </div>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-auto"
          />
          <Button onClick={() => onAddTask(selectedDate)}>
            <Plus className="w-4 h-4 ml-2" />
            افزودن وظیفه
          </Button>
        </div>
      </div>
    </div>
  );
}
