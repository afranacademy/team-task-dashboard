import { useEffect, useState } from 'react';
import { Task, TaskStatus, TeamMember } from '../types';
import { formatJalaliDate } from '../lib/dateJalali';
import { getStatusLabelFa } from '../lib/statusLabels';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Target, User, Clock, Lock, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Switch } from './ui/switch';
import { Button } from './ui/button';

interface TaskDetailModalProps {
  task: Task | null;
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
}

const statusColors = {
  'To Do': 'bg-gray-100 text-gray-700 border-gray-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  'Completed': 'bg-green-50 text-green-700 border-green-200',
};

export function TaskDetailModal({
  task,
  member,
  open,
  onOpenChange,
  onUpdateTask,
  onDeleteTask,
}: TaskDetailModalProps) {
  const [isPrivate, setIsPrivate] = useState<boolean>(task?.isPrivate ?? false);

  useEffect(() => {
    setIsPrivate(task?.isPrivate ?? false);
  }, [task]);

  if (!task || !member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gray-900 text-right">{task.title}</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            جزئیات و به‌روزرسانی‌های مربوط به این وظیفه
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2" dir="rtl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={statusColors[task.status]}>
              {getStatusLabelFa(task.status)}
            </Badge>
            {isPrivate && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <Lock className="w-3 h-3 ml-1" />
                خصوصی
              </Badge>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Avatar className="h-10 w-10 border-2 border-purple-100">
                {member.avatarUrl && (
                  <AvatarImage src={member.avatarUrl} alt={member.name} className="object-cover" />
                )}
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white">
                  {member.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-0.5">
                  <User className="w-3.5 h-3.5" />
                  <span>مسئول انجام</span>
                </div>
                <p className="text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-500">{member.role}</p>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-purple-700">
                <ShieldCheck className="w-4 h-4" />
                <span>حریم خصوصی</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">فقط خودم ببینم</span>
                <Switch
                  checked={isPrivate}
                  onCheckedChange={(checked) => {
                    setIsPrivate(!!checked);
                    onUpdateTask(task.id, { isPrivate: !!checked });
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-700 mb-2">وضعیت</Label>
              <Select
                value={task.status}
                onValueChange={(value) => onUpdateTask(task.id, { status: value as TaskStatus })}
              >
                <SelectTrigger className={statusColors[task.status]}>
                  <SelectValue placeholder={getStatusLabelFa(task.status)}>
                    {getStatusLabelFa(task.status)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="To Do">{getStatusLabelFa('To Do')}</SelectItem>
                  <SelectItem value="In Progress">{getStatusLabelFa('In Progress')}</SelectItem>
                  <SelectItem value="Completed">{getStatusLabelFa('Completed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-700 mb-2">پیشرفت</Label>
              <div className="flex items-center gap-3">
                <Progress value={task.progress} className="flex-1 h-2.5" />
                <span className="text-sm text-gray-900 min-w-[3ch]">{task.progress}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                تاریخ شروع
              </Label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                <Calendar className="w-4 h-4 text-gray-400" />
                {formatJalaliDate(task.startDate)}
              </div>
            </div>

            {task.deadline && (
              <div className="space-y-2">
                <Label className="text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  مهلت انجام
                </Label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatJalaliDate(task.deadline)}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700">توضیحات</Label>
            <Textarea
              value={task.description}
              onChange={(e) => onUpdateTask(task.id, { description: e.target.value })}
              className="min-h-[100px] resize-none"
              placeholder="توضیحات وظیفه..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 flex items-center gap-2">
              <Target className="w-4 h-4" />
              نتیجهٔ مورد انتظار / تأثیر
            </Label>
            <Textarea
              value={task.expectedOutcome}
              onChange={(e) => onUpdateTask(task.id, { expectedOutcome: e.target.value })}
              className="min-h-[100px] resize-none bg-purple-50 border-purple-100"
              placeholder="نتیجهٔ مورد انتظار از این وظیفه چیست؟"
            />
          </div>

          {task.comments && task.comments.length > 0 && (
            <div className="space-y-2">
              <Label className="text-gray-700">یادداشت‌ها</Label>
              <div className="mt-3 space-y-2">
                {task.comments.map((comment, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                    {comment}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="destructive"
              onClick={() => {
                onDeleteTask(task.id);
                onOpenChange(false);
              }}
            >
              حذف وظیفه
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              بستن
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
