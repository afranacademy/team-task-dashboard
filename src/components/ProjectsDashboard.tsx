import { useMemo, useState } from 'react';
import type { Project, ProjectMember, TeamMember } from '../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Users, ArrowLeft, FolderPlus, Eye } from 'lucide-react';

interface ProjectsDashboardProps {
  currentUser: TeamMember;
  projects: Project[];
  projectMembers: ProjectMember[];
  allMembers: TeamMember[];
  onBackToPersonal: () => void;
  onOpenProject: (projectId: string) => void;
  onCreateProject: (data: {
    name: string;
    description?: string;
    memberIds: string[];
  }) => void | Promise<void>;
}

export function ProjectsDashboard({
  currentUser,
  projects,
  projectMembers,
  allMembers,
  onBackToPersonal,
  onOpenProject,
  onCreateProject,
}: ProjectsDashboardProps) {
  const myProjectIds = useMemo(
    () => projectMembers.filter(pm => pm.memberId === currentUser.id).map(pm => pm.projectId),
    [projectMembers, currentUser.id]
  );

  const myProjects = useMemo(
    () => projects.filter(p => myProjectIds.includes(p.id)),
    [projects, myProjectIds]
  );

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([currentUser.id]);

  const toggleMember = (id: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateProject({ name, description, memberIds: selectedMemberIds });
    setName('');
    setDescription('');
    setSelectedMemberIds([currentUser.id]);
  };

  const memberCount = (projectId: string) =>
    projectMembers.filter(pm => pm.projectId === projectId).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onBackToPersonal} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              بازگشت به داشبورد
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">پروژه‌ها</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects List */}
          <div className="lg:col-span-2 space-y-4">
            {myProjects.length === 0 ? (
              <Card className="p-6 text-center border-gray-200">
                <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 mb-2">هنوز در هیچ پروژه‌ای عضو نیستید</p>
                <p className="text-sm text-gray-500">یک پروژه جدید بسازید و اعضا را اضافه کنید.</p>
              </Card>
            ) : (
              myProjects.map(project => (
                <Card key={project.id} className="p-5 border-gray-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-right flex-1">
                      <h3 className="text-lg text-gray-900">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        اعضا: {memberCount(project.id)} نفر
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenProject(project.id)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      مشاهده جزئیات
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Create Project */}
          <Card className="p-5 border-gray-200 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <FolderPlus className="w-5 h-5 text-purple-600" />
              <h3 className="text-gray-900">پروژه جدید</h3>
            </div>

            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-2">
                <Label className="text-right block">نام پروژه</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="نام پروژه را وارد کنید"
                  className="text-right"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-right block">توضیحات پروژه</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="توضیحات کوتاه درباره پروژه"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-right block">اعضای پروژه</Label>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {allMembers.map(member => (
                    <label key={member.id} className="flex items-center justify-between p-2 rounded border border-gray-200">
                      <div className="text-right">
                        <p className="text-sm text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.role}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(member.id)}
                        onChange={() => toggleMember(member.id)}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
              >
                ساخت پروژه
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
