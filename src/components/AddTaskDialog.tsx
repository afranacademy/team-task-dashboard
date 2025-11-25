import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TaskStatus } from '../types';
import { formatJalaliDate } from '../lib/dateJalali';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  onAddTask: (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
    expectedOutcome: string;
    deadline?: string;
    date: string;
    isPrivate?: boolean;
  }) => void;
}

export function AddTaskDialog({ open, onOpenChange, selectedDate, onAddTask }: AddTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('To Do');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [deadline, setDeadline] = useState('');
  const [taskDate, setTaskDate] = useState(selectedDate);
  const [isPrivate, setIsPrivate] = useState(false);

  // Update taskDate when selectedDate prop changes
  useEffect(() => {
    setTaskDate(selectedDate);
  }, [selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && description.trim() && expectedOutcome.trim()) {
      onAddTask({
        title: title.trim(),
        description: description.trim(),
        status,
        expectedOutcome: expectedOutcome.trim(),
        deadline: deadline || undefined,
        date: taskDate,
        isPrivate,
      });
      setTitle('');
      setDescription('');
      setStatus('To Do');
      setExpectedOutcome('');
      setDeadline('');
      setTaskDate(selectedDate);
      setIsPrivate(false);
      onOpenChange(false);
    }
  };

  const formatDatePersian = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    if (dateStr === today) return 'امروز';
    if (dateStr === tomorrow) return 'فردا';

    return date.toLocaleDateString('fa-IR', {
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">افزودن وظیفه جدید</DialogTitle>
          <DialogDescription className="text-right">اطلاعات وظیفه خود را وارد کنید</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-right block">عنوان وظیفه</Label>
              <Input
                id="title"
                placeholder="عنوان وظیفه را وارد کنید"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-right"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-right block">توضیحات</Label>
              <Textarea
                id="description"
                placeholder="توضیحات کامل وظیفه را بنویسید"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] resize-none text-right"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-right block">وضعیت</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="To Do">باید انجام شود</SelectItem>
                    <SelectItem value="In Progress">در حال انجام</SelectItem>
                    <SelectItem value="Completed">انجام شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taskDate" className="text-right block">تاریخ وظیفه</Label>
                <div className="space-y-1">
                  <Input
                    id="taskDate"
                    type="date"
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                    required
                  />
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    تاریخ هجری شمسی: {formatJalaliDate(taskDate)}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-right block">مهلت انجام (اختیاری)</Label>
              <div className="space-y-1">
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
                {deadline && (
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    تاریخ هجری شمسی: {formatJalaliDate(deadline)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="outcome" className="text-right block">نتیجه مورد انتظار</Label>
              <Textarea
                id="outcome"
                placeholder="نتیجه یا تاثیر این وظیفه چیست؟"
                value={expectedOutcome}
                onChange={(e) => setExpectedOutcome(e.target.value)}
                className="min-h-[100px] resize-none text-right"
                required
              />
            </div>

            <div className="flex items-center justify-between mt-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
                <span>این وظیفه فقط برای خودم باشد</span>
              </label>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              لغو
            </Button>
            <Button 
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              افزودن وظیفه
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
