import { useState, useEffect } from 'react';
import type { TeamMember, TaskStatus } from '../types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { formatJalaliDate } from '../lib/dateJalali';
import { getStatusLabelFa } from '../lib/statusLabels';
import { supabase } from '../lib/supabaseClient';

interface NewCalendarTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate: Date;
  currentUser: TeamMember;
  projects: any[];
  onTaskCreated: () => void | Promise<void>;
}

export function NewCalendarTaskDialog({
  open,
  onOpenChange,
  defaultDate,
  currentUser,
  projects,
  onTaskCreated,
}: NewCalendarTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [status, setStatus] = useState<TaskStatus>('To Do');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(defaultDate.toISOString().split('T')[0]);
    }
  }, [open, defaultDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setSubmitting(true);

    try {
      const progress = status === 'Completed' ? 100 : status === 'In Progress' ? 50 : 0;

      const { error } = await supabase.from('tasks').insert({
        member_id: currentUser.id,
        title: title.trim(),
        description: description.trim() || '',
        date,
        status,
        priority,
        progress,
        is_private: isPrivate,
        project_id: projectId || null,
        expected_outcome: '',
      });

      if (error) throw error;

      // Reset form
      setTitle('');
      setDescription('');
      setProjectId('');
      setStatus('To Do');
      setPriority('medium');
      setIsPrivate(false);

      await onTaskCreated();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('خطا در ایجاد وظیفه');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">افزودن وظیفه جدید</DialogTitle>
          <DialogDescription className="text-right">
            وظیفه جدید برای تاریخ {formatJalaliDate(date)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-right block">عنوان وظیفه *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-right"
              placeholder="عنوان وظیفه را وارد کنید"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-right block">تاریخ *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <div className="text-xs text-gray-500 text-right">
                {date && formatJalaliDate(date)}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-right block">انتخاب پروژه</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="وظیفه شخصی" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">وظیفه شخصی</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-right block">وضعیت</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
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
              <Select value={priority} onValueChange={(v) => setPriority(v as 'low' | 'medium' | 'high')}>
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

          <div className="space-y-2">
            <Label className="text-right block">توضیحات</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] resize-none text-right"
              placeholder="توضیحات وظیفه را وارد کنید"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <Label htmlFor="private-task" className="text-sm cursor-pointer">
              وظیفه خصوصی است
            </Label>
            <Switch
              id="private-task"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
              disabled={submitting || !title.trim()}
            >
              {submitting ? 'در حال ایجاد...' : 'افزودن وظیفه'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
