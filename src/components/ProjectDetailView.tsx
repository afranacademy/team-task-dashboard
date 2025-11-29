import { useMemo } from 'react';
import type { Project, ProjectMember, TeamMember, Task } from '../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { ArrowLeft, Crown } from 'lucide-react';
import { ProjectTasksTab } from './ProjectTasksTab';
import { ProjectBoardTab } from './ProjectBoardTab';
import { ProjectTimelineTab } from './ProjectTimelineTab';

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
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

// ProjectHeader Component
function ProjectHeader({
  project,
  currentUser,
  allMembers,
  onBack,
}: {
  project: Project;
  currentUser: TeamMember;
  allMembers: TeamMember[];
  onBack: () => void;
}) {
  const isOwner = project.ownerId === currentUser.id;
  const owner = useMemo(() => {
    if (!project.ownerId) return null;
    return allMembers.find(m => m.id === project.ownerId) || null;
  }, [project.ownerId, allMembers]);

  return (
    <div className="mb-6" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          بازگشت به پروژه‌ها
        </Button>
      </div>
      <Card className="p-6 border-gray-200">
        <div className="flex items-start justify-between gap-4">
          <div className="text-right flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <Badge className="bg-green-100 text-green-700 border-green-200">فعال</Badge>
              {isOwner && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Crown className="w-3 h-3 ml-1" />
                  مالک پروژه
                </Badge>
              )}
            </div>
            {project.description ? (
              <p className="text-sm text-gray-600 mt-2">{project.description}</p>
            ) : (
              <p className="text-sm text-gray-400 italic mt-2">توضیحی ثبت نشده است</p>
            )}
            {owner && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-gray-500">مالک:</span>
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    {owner.avatarUrl && <AvatarImage src={owner.avatarUrl} alt={owner.name} />}
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-xs">
                      {owner.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-700">{owner.name}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Main Component
export function ProjectDetailView({
  project,
  currentUser,
  projectMembers,
  allMembers,
  tasksWithMembers,
  selectedDate,
  onSelectedDateChange,
  onBack,
  onTaskClick,
  onAddProjectTask,
  onUpdateTask,
}: ProjectDetailViewProps) {
  const getLocalToday = () => new Date().toLocaleDateString('en-CA');
  const today = getLocalToday();

  // Extract all tasks from tasksWithMembers
  const allTasks = useMemo(
    () => tasksWithMembers.map(tm => tm.task),
    [tasksWithMembers]
  );

  // Handler for updating task dates from Timeline
  const handleUpdateTaskDates = async (
    taskId: string,
    date: string,
    startDate: string,
    endDate: string
  ) => {
    if (!onUpdateTask) return;

    await onUpdateTask(taskId, {
      date,
      start_date: startDate,
      end_date: endDate,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <ProjectHeader 
          project={project} 
          currentUser={currentUser} 
          allMembers={allMembers}
          onBack={onBack} 
        />

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="tasks">کارها</TabsTrigger>
            <TabsTrigger value="board">برد</TabsTrigger>
            <TabsTrigger value="timeline">تایم‌لاین</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <ProjectTasksTab
              project={project}
              currentUser={currentUser}
              tasksWithMembers={tasksWithMembers}
              allMembers={allMembers}
              onTaskClick={onTaskClick}
            />
          </TabsContent>

          <TabsContent value="board">
            <ProjectBoardTab
              project={project}
              currentUser={currentUser}
              tasksWithMembers={tasksWithMembers}
              allMembers={allMembers}
              projectMembers={projectMembers}
              today={today}
              onUpdateTask={onUpdateTask}
              onAddProjectTask={onAddProjectTask}
            />
          </TabsContent>

          <TabsContent value="timeline">
            <ProjectTimelineTab
              project={project}
              tasks={allTasks}
              members={allMembers}
              currentUser={currentUser}
              onTaskClick={onTaskClick}
              onUpdateTask={onUpdateTask}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
