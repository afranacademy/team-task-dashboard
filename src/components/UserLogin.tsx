import { useState } from 'react';
import { TeamMember } from '../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Lock, User } from 'lucide-react';

interface UserLoginProps {
  members: TeamMember[];
  onLogin: (memberId: string) => void;
}

export function UserLogin({ members, onLogin }: UserLoginProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!selectedUserId) {
      setError('لطفا یک کاربر انتخاب کنید');
      return;
    }

    const user = members.find(m => m.id === selectedUserId);
    if (!user) return;

    if (password === user.password) {
      onLogin(selectedUserId);
      setError('');
    } else {
      setError('رمز عبور اشتباه است');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl p-8 border-gray-200 shadow-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-gray-900 mb-2">داشبورد مدیریت وظایف تیم</h1>
          <p className="text-gray-600">لطفا وارد حساب کاربری خود شوید</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {members.map((member) => (
            <Card
              key={member.id}
              className={`p-4 cursor-pointer transition-all duration-200 ${
                selectedUserId === member.id
                  ? 'border-purple-500 border-2 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
              }`}
              onClick={() => {
                setSelectedUserId(member.id);
                setError('');
              }}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-purple-100">
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-right">
                  <h3 className="text-gray-900 truncate text-sm">{member.name}</h3>
                  <p className="text-gray-500 text-xs">{member.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {selectedUserId && (
          <div className="space-y-4">
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="password"
                placeholder="رمز عبور (Demo: 1234)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="pr-12 text-right"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-right">
                {error}
              </div>
            )}

            <Button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              ورود به داشبورد
            </Button>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-right">
          <p className="text-sm text-blue-800">
            💡 <strong>نکته:</strong> برای ورود به عنوان Demo، هر کاربری را انتخاب کرده و رمز <code className="bg-blue-100 px-2 py-1 rounded">1234</code> را وارد کنید
          </p>
        </div>
      </Card>
    </div>
  );
}
