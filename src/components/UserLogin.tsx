import type React from 'react';
import { useState } from 'react';
import type { TeamMember } from '../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Lock } from 'lucide-react';

interface UserLoginProps {
  members: TeamMember[];
  onLoginWithCredentials: (
    name: string,
    password: string,
    role?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

type LoginMode = 'selectExisting' | 'createNew';

export function UserLogin({ members, onLoginWithCredentials }: UserLoginProps) {
  const [mode, setMode] = useState<LoginMode>('selectExisting');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [passwordExisting, setPasswordExisting] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

  const handleExistingSubmit = async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    if (!selectedMemberId) {
      setError('لطفا نام و رمز عبور را وارد کنید');
      return;
    }

    const selectedMember = members.find((member: TeamMember) => member.id === selectedMemberId);
    if (!selectedMember) {
      setError('کاربر یافت نشد');
      return;
    }

    if (!passwordExisting) {
      setError('لطفا نام و رمز عبور را وارد کنید');
      return;
    }

    const result = await onLoginWithCredentials(selectedMember.name, passwordExisting);
    if (!result.success) {
      setError(result.error ?? 'ورود ناموفق بود');
    } else {
      setError('');
    }
  };

  const handleCreateSubmit = async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    const trimmedName = newName.trim();
    const trimmedRole = newRole.trim();

    if (!trimmedName || !trimmedRole || !newPassword) {
      setError('لطفا نام، نقش و رمز عبور را وارد کنید');
      return;
    }

    const result = await onLoginWithCredentials(trimmedName, newPassword, trimmedRole);
    if (!result.success) {
      setError(result.error ?? 'ورود ناموفق بود');
    } else {
      setError('');
    }
  };

  const switchToExisting = () => {
    setMode('selectExisting');
    setError('');
    setPasswordExisting('');
    setNewName('');
    setNewRole('');
    setNewPassword('');
  };

  const switchToCreate = () => {
    setMode('createNew');
    setError('');
    setSelectedMemberId(null);
    setPasswordExisting('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl p-8 border-gray-200 shadow-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl overflow-hidden flex items-center justify-center bg-white">
            <img
              src="http://afranacademy.org/wp-content/uploads/2024/10/afran-favicon-200px.png"
              alt="AFRAN logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-gray-900 mb-2 text-lg font-semibold">
            داشبورد مدیریت وظایف تیم افران
          </h1>
          <p className="text-gray-600 text-sm">
            {mode === 'selectExisting'
              ? 'لطفا حساب کاربری خود را انتخاب کنید'
              : 'ثبت نام / ورود عضو جدید'}
          </p>
        </div>

        {mode === 'selectExisting' ? (
          <div className="space-y-4 text-right">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map((member: TeamMember) => {
                const isSelected = selectedMemberId === member.id;
                return (
                  <button
                    type="button"
                    key={member.id}
                    onClick={() => {
                      setSelectedMemberId(member.id);
                      setError('');
                    }}
                    className={`text-right p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 shadow-sm'
                        : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                        {member.initials}
                      </div>
                      <div className="flex-1">
                        <div className="text-gray-900 text-sm font-medium">{member.name}</div>
                        <div className="text-gray-500 text-xs truncate">{member.role}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {members.length === 0 ? (
              <div className="text-sm text-gray-600 text-center py-4">
                هنوز هیچ عضوی ثبت نشده است. برای ساخت حساب جدید، ثبت نام کنید.
              </div>
            ) : (
              selectedMemberId && (
                <form onSubmit={handleExistingSubmit} className="space-y-3">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      رمز عبور
                    </label>
                    <div className="relative">
                      <Input
                        dir="ltr"
                        type="password"
                        placeholder="رمز عبور"
                        value={passwordExisting}
                        onChange={e => {
                          setPasswordExisting(e.target.value);
                          setError('');
                        }}
                        className="pr-10 font-sans tracking-[0.3em] text-left"
                      />
                      <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    ورود
                  </Button>
                </form>
              )
            )}

            <button
              type="button"
              onClick={switchToCreate}
              className="w-full text-center text-xs text-blue-600 hover:underline mt-2"
            >
              عضو جدید هستید؟ برای ورود/ثبت نام کلیک کنید
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-right">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                نام
              </label>
              <Input
                dir="rtl"
                placeholder="نام و نام خانوادگی"
                value={newName}
                onChange={e => {
                  setNewName(e.target.value);
                  setError('');
                }}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                نقش
              </label>
              <Input
                dir="rtl"
                placeholder="نقش در تیم، مثلا: تولید محتوا، مشاور، مدیر پروژه"
                value={newRole}
                onChange={e => {
                  setNewRole(e.target.value);
                  setError('');
                }}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                رمز عبور
              </label>
              <div className="relative">
                <Input
                  dir="ltr"
                  type="password"
                  placeholder="رمز عبور"
                  value={newPassword}
                  onChange={e => {
                    setNewPassword(e.target.value);
                    setError('');
                  }}
                  className="pr-10 font-sans tracking-[0.3em] text-left"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              ورود / ساخت حساب جدید
            </Button>

            <button
              type="button"
              onClick={switchToExisting}
              className="w-full text-center text-xs text-blue-600 hover:underline mt-2"
            >
              بازگشت به انتخاب اعضا
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}
