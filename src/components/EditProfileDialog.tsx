import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import type { TeamMember } from '../types';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: TeamMember;
  onSave: (data: { name: string; role: string; avatarUrl?: string }) => Promise<void> | void;
}

export function EditProfileDialog({ open, onOpenChange, currentUser, onSave }: EditProfileDialogProps) {
  const [name, setName] = useState(currentUser.name);
  const [role, setRole] = useState(currentUser.role);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');

  useEffect(() => {
    if (open) {
      setName(currentUser.name);
      setRole(currentUser.role);
      setAvatarUrl(currentUser.avatarUrl || '');
    }
  }, [open, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name: name.trim(),
      role: role.trim(),
      avatarUrl: avatarUrl.trim() || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">ویرایش پروفایل</DialogTitle>
          <DialogDescription className="text-right">
            نام، نقش و آدرس عکس پروفایل خود را به‌روزرسانی کنید.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-right block">نام</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-right"
              placeholder="نام خود را وارد کنید"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-right block">نقش در تیم</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="text-right"
              placeholder="مثلا: طراح، مدیر پروژه، توسعه‌دهنده"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatarUrl" className="text-right block">آدرس عکس پروفایل (اختیاری)</Label>
            <Input
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="text-right"
              placeholder="https://..."
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              ذخیره تغییرات
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
