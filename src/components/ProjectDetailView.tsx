import { formatJalaliDate } from '../lib/dateJalali';
import { formatJalaliFull } from '../lib/jalaliDate';
import type { Project, ProjectMember, TeamMember, Task } from '../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { getStatusLabelFa } from '../lib/statusLabels';
import { Calendar, ArrowLeft, Users, Plus } from 'lucide-react';

interface ProjectDetailViewProps {
  currentUser: TeamMember;
  project: Project;
  projectMembers: ProjectMember[];
  allMembers: TeamMember[];
  tasksWithMembers: { task: Task; member: TeamMember }[];
  selectedDate: string;
  onSelectedDateChange: (date: string) => void;
  onBack: () => void;
  onTaskClick: (task: Task) => void;
  onAddProjectTask: () => void;
}

export function ProjectDetailView({
  project,
  projectMembers,
  allMembers,
  tasksWithMembers,
  selectedDate,
  onSelectedDateChange,
  onBack,
  onTaskClick,
  onAddProjectTask,
}: ProjectDetailViewProps) {
  const membersInProject = projectMembers
    .map(pm => allMembers.find(m => m.id === pm.memberId))
    .filter((m): m is TeamMember => Boolean(m));

  const dailyProjectTasks = tasksWithMembers.filter(
    tm => tm.task.date === selectedDate
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white" dir="rtl">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              بازگشت به پروژه‌ها
            </Button>
            <div className="text-right">
              <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-gray-600 mt-1">{project.description}</p>
              )}
            </div>
          </div>
        </div>

        <Card className="p-5 mb-6 border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <p className="text-sm text-gray-600">وظایف این پروژه در این روز</p>
              <div className="flex items-center gap-2 mt-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => onSelectedDateChange(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-right"
                />
                <span className="text-xs text-gray-500">{formatJalaliFull(selectedDate)}</span>
              </div>
            </div>
            <Button
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
              onClick={onAddProjectTask}
            >
              <Plus className="w-4 h-4 ml-1" />
              افزودن وظیفهٔ پروژه
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {dailyProjectTasks.length === 0 ? (
              <Card className="p-6 text-center border-gray-200">
                <p className="text-gray-700 mb-2">برای این تاریخ وظیفه‌ای ثبت نشده است.</p>
                <p className="text-sm text-gray-500">برای این روز یک وظیفهٔ پروژه اضافه کنید.</p>
              </Card>
            ) : (
              dailyProjectTasks.map(({ task, member }) => (
                <Card
                  key={task.id}
                  className="p-4 border-gray-200 cursor-pointer hover:border-purple-300 transition-colors"
                  onClick={() => onTaskClick(task)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-right flex-1">
                      <div className="flex items-center gap-2 justify-end mb-2">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {getStatusLabelFa(task.status)}
                        </Badge>
                        <span className="text-xs text-gray-500">{formatJalaliDate(task.date)}</span>
                      </div>
                      <h3 className="text-gray-900 text-lg">{task.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{task.description}</p>
                      <p className="text-xs text-gray-500 mt-2">نتیجهٔ مورد انتظار: {task.expectedOutcome}</p>
                      <div className="mt-3">
                        <Progress value={task.progress} className="h-2" />
                        <p className="text-xs text-gray-600 mt-1">{task.progress}%</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-10 w-10 border-2 border-purple-100">
                            {member.avatarUrl && (
                              <AvatarImage src={member.avatarUrl} alt={member.name} className="object-cover" />
                            )}
                            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white">
                              {member.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-right">
                            <p className="text-sm text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.role}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">مسئول انجام</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          <div className="space-y-4">
            <Card className="p-5 border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-gray-900">اعضای این پروژه</h3>
              </div>
              <div className="space-y-3">
                {membersInProject.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-2 rounded border border-gray-200">
                    <Avatar className="h-10 w-10 border-2 border-purple-100">
                      {member.avatarUrl && (
                        <AvatarImage src={member.avatarUrl} alt={member.name} className="object-cover" />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-sm">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.role}</p>
                    </div>
                  </div>
                ))}
                {membersInProject.length === 0 && (
                  <p className="text-sm text-gray-500 text-center">هنوز عضوی اضافه نشده است.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
