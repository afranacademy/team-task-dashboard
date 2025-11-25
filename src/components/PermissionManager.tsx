import { useState } from 'react';
import { TeamMember } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Card } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Lock, Unlock, Shield, Users } from 'lucide-react';

interface PermissionManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: TeamMember;
  allMembers: TeamMember[];
  onUpdatePermissions: (userIds: string[]) => void;
}

export function PermissionManager({
  open,
  onOpenChange,
  currentUser,
  allMembers,
  onUpdatePermissions
}: PermissionManagerProps) {
  const [permissions, setPermissions] = useState<string[]>(currentUser.accessPermissions);

  const otherMembers = allMembers.filter(m => m.id !== currentUser.id);

  const togglePermission = (userId: string) => {
    const newPermissions = permissions.includes(userId)
      ? permissions.filter(id => id !== userId)
      : [...permissions, userId];
    
    setPermissions(newPermissions);
    onUpdatePermissions(newPermissions);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-right">
            <Shield className="w-6 h-6 text-purple-600" />
            مدیریت دسترسی‌ها
          </DialogTitle>
          <DialogDescription className="text-right">
            مشخص کنید چه کسانی می‌توانند وظایف شما را مشاهده کنند
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Status Card */}
          <Card className="p-5 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                {permissions.length > 0 ? (
                  <Unlock className="w-6 h-6 text-green-600" />
                ) : (
                  <Lock className="w-6 h-6 text-gray-600" />
                )}
              </div>
              <div className="flex-1 text-right">
                <p className="text-sm text-gray-600 mb-1">وضعیت فعلی</p>
                <div className="flex items-center gap-2 justify-end">
                  <Badge 
                    variant="outline" 
                    className={permissions.length > 0 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}
                  >
                    {permissions.length > 0 ? 'عمومی' : 'خصوصی'}
                  </Badge>
                  <p className="text-gray-900">
                    {permissions.length} نفر دسترسی دارند
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Team Members List */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-gray-600" />
              <h3 className="text-gray-900 text-right">اعضای تیم</h3>
            </div>

            <div className="space-y-3">
              {otherMembers.map((member) => {
                const hasAccess = permissions.includes(member.id);
                
                return (
                  <Card
                    key={member.id}
                    className={`p-4 transition-all duration-200 ${
                      hasAccess 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-purple-100">
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 text-right min-w-0">
                        <p className="text-gray-900 mb-0.5">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.role}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          {hasAccess ? 'دسترسی دارد' : 'دسترسی ندارد'}
                        </span>
                        <Switch
                          checked={hasAccess}
                          onCheckedChange={() => togglePermission(member.id)}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Info Box */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-800 text-right">
              💡 <strong>نکته:</strong> اعضایی که دسترسی دارند می‌توانند تمام وظایف شما را در تمام تاریخ‌ها مشاهده کنند و از پیشرفت کار شما مطلع شوند.
            </p>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
