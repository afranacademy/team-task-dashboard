import { useEffect, useState } from 'react';
import type { TaskStatus, TeamMember } from '../types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { formatJalaliDate } from '../lib/dateJalali';
import { getStatusLabelFa } from '../lib/statusLabels';

interface AddProjectTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  projectMembers: TeamMember[];
  selectedDate: string;
  onAddTask: (data: {
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
  }) => void | Promise<void>;
}

export function AddProjectTaskDialog({
  open,
  onOpenChange,
  projectName,
  projectMembers,
  selectedDate,
  onAddTask,
}: AddProjectTaskDialogProps) {
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('To Do');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [taskDate, setTaskDate] = useState(selectedDate);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    if (open) {
      setTaskDate(selectedDate);
      const defaultAssignee = projectMembers[0]?.id ?? '';
      setAssigneeId(defaultAssignee);
    }
  }, [open, selectedDate, projectMembers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigneeId || !title.trim()) return;

    // Build task data - only include date fields if explicitly set
    const taskData: any = {
      assigneeId,
      title: title.trim(),
      description: description.trim(),
      status,
      expectedOutcome: expectedOutcome.trim(),
      deadline: deadline || undefined,
      isPrivate,
      priority,
    };

    // Only include date fields if user has set them
    if (taskDate) taskData.date = taskDate;
    if (startDate) taskData.start_date = startDate;
    if (endDate) taskData.end_date = endDate;

    await onAddTask(taskData);
    
    // Reset form
    setTitle('');
    setDescription('');
    setStatus('To Do');
    setExpectedOutcome('');
    setDeadline('');
    setIsPrivate(false);
    setTaskDate(selectedDate);
    setStartDate('');
    setEndDate('');
    setPriority('medium');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">افزودن وظیفهٔ پروژه</DialogTitle>
          <DialogDescription className="text-right">
            پروژه: {projectName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-right block">مسئول انجام</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-right block">تاریخ وظیفه</Label>
              <div className="space-y-1">
                <Input
                  type="date"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  required
                />
              </div>
              <div className="text-xs text-gray-500 mt-1 text-right">
                تاریخ هجری شمسی: {formatJalaliDate(taskDate)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-right block">عنوان وظیفه</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-right"
              placeholder="عنوان وظیفه را وارد کنید"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-right block">توضیحات</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] resize-none text-right"
              placeholder="توضیحات وظیفه را وارد کنید"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-right block">وضعیت</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
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
              <Label className="text-right block">اولویت</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as 'low' | 'medium' | 'high')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">بالا</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="low">پایین</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-right block">تاریخ شروع (اختیاری)</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              {startDate && (
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {formatJalaliDate(startDate)}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-right block">تاریخ پایان (اختیاری)</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              {endDate && (
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {formatJalaliDate(endDate)}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-right block">نتیجهٔ مورد انتظار</Label>
            <Textarea
              value={expectedOutcome}
              onChange={(e) => setExpectedOutcome(e.target.value)}
              className="min-h-[100px] resize-none text-right"
              placeholder="نتیجهٔ مورد انتظار از این وظیفه"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            <span className="text-sm text-gray-700">این وظیفه فقط برای خود من قابل مشاهده باشد</span>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              افزودن وظیفهٔ پروژه
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
