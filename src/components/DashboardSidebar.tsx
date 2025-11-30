import { TeamMember, Mood } from '../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  LayoutDashboard,
  FolderKanban,
  Calendar as CalendarIcon,
  Settings,
  LogOut,
  Edit,
} from 'lucide-react';

interface DashboardSidebarProps {
  currentUser: TeamMember;
  accessibleMembers: TeamMember[];
  onUpdateMood: (userId: string, mood: Mood) => void;
  onViewOtherUser: (userId: string) => void;
  onManagePermissions: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
  onOpenProjects: () => void;
  onOpenCalendar: () => void;
}

const moodOptions: { value: Mood; emoji: string; label: string }[] = [
  { value: 'bad', label: 'بد', emoji: '☹️' },
  { value: 'medium', label: 'متوسط', emoji: '🙂' },
  { value: 'good', label: 'خوب', emoji: '☺️' },
  { value: 'great', label: 'عالی', emoji: '😍' },
];

const getInitials = (name: string, fallback: string) => {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase() || fallback;
};

export function DashboardSidebar({
  currentUser,
  accessibleMembers,
  onUpdateMood,
  onViewOtherUser,
  onManagePermissions,
  onEditProfile,
  onLogout,
  onOpenProjects,
  onOpenCalendar,
}: DashboardSidebarProps) {
  const accessStatus = currentUser.accessPermissions.length > 0 ? 'عمومی' : 'خصوصی';

  return (
    <aside className="w-[280px] shrink-0 h-screen sticky top-0 overflow-y-auto">
      <div className="flex flex-col gap-4 p-4">
        <Card className="p-4">
          <div className="flex flex-col items-center gap-3">
            <Avatar className="w-16 h-16 ring-4 ring-purple-50">
              {currentUser.avatarUrl ? (
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-lg">
                {currentUser.initials || getInitials(currentUser.name, 'ME')}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-base">{currentUser.name}</h3>
              <p className="text-sm text-muted-foreground">{currentUser.role}</p>
            </div>
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onEditProfile}
              >
                <Edit className="w-4 h-4 ml-2" />
                ویرایش
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4 ml-2" />
                خروج
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-2">
          <nav className="flex flex-col gap-1">
            <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground transition-colors">
              <LayoutDashboard className="w-5 h-5" />
              <span>داشبورد</span>
            </button>
            <button
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-accent transition-colors text-right"
              onClick={onOpenProjects}
            >
              <FolderKanban className="w-5 h-5" />
              <span>پروژه‌ها</span>
            </button>
            <button
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-accent transition-colors text-right"
              onClick={onOpenCalendar}
            >
              <CalendarIcon className="w-5 h-5" />
              <span>تقویم</span>
            </button>
          </nav>
        </Card>

        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm mb-1">حال امروز</h4>
              {currentUser.mood && (
                <p className="text-xs text-muted-foreground">
                  ثبت شده {moodOptions.find(m => m.value === currentUser.mood)?.emoji}
                </p>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {moodOptions.map((mood) => {
                const isActive = currentUser.mood === mood.value;
                return (
                  <button
                    key={mood.value}
                    onClick={() => onUpdateMood(currentUser.id, mood.value)}
                    className={[
                      'text-2xl p-2 rounded-lg transition-all hover:scale-110',
                      isActive ? 'bg-purple-100 ring-2 ring-purple-600' : 'hover:bg-accent',
                    ].join(' ')}
                    title={mood.label}
                  >
                    {mood.emoji}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm mb-3">اعضای تیم قابل مشاهده</h4>
              {accessibleMembers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  هنوز کسی به شما دسترسی نداده است.
                </p>
              ) : (
                <div className="space-y-2">
                  {accessibleMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => onViewOtherUser(member.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-right"
                    >
                      <Avatar className="w-8 h-8">
                        {member.avatarUrl ? (
                          <AvatarImage src={member.avatarUrl} alt={member.name} className="object-cover" />
                        ) : null}
                        <AvatarFallback className="bg-purple-500 text-white text-xs">
                          {member.initials || getInitials(member.name, '?')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                      </div>
                      {member.mood && (
                        <span className="text-lg">
                          {moodOptions.find(m => m.value === member.mood)?.emoji}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t space-y-2">
              <p className="text-xs text-muted-foreground">
                وضعیت دسترسی: <span className="text-foreground">{accessStatus}</span>
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onManagePermissions}
              >
                <Settings className="w-4 h-4 ml-2" />
                تنظیمات دسترسی
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </aside>
  );
}
