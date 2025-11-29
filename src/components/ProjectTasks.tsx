import { Task, Project } from '../types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Eye } from 'lucide-react';
import { getStatusLabelFa } from '../lib/statusLabels';

interface ProjectTasksProps {
  tasks: Task[];
  projects: Project[];
  selectedDate: string;
  onViewTask: (task: Task) => void;
}

export function ProjectTasks({
  tasks,
  projects,
  selectedDate,
  onViewTask,
}: ProjectTasksProps) {
  const projectTasks = tasks.filter(
    t => t.projectId && t.date === selectedDate
  );

  if (projectTasks.length === 0) {
    return null;
  }

  const projectMap = new Map<string, Project>();
  projects.forEach(p => projectMap.set(p.id, p));

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3>کارهای پروژه (برای این روز)</h3>
        <Badge variant="secondary">{projectTasks.length} مورد</Badge>
      </div>

      <div className="space-y-3">
        {projectTasks.map(task => (
          <Card key={task.id} className="p-4 bg-accent/50">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm">{task.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {projectMap.get(task.projectId ?? '')?.name ?? 'پروژه'}
                  </Badge>
                </div>
                {task.description && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {getStatusLabelFa(task.status)}
                  </Badge>
                  {typeof task.progress === 'number' && (
                    <span className="text-xs text-muted-foreground">
                      {task.progress}% پیشرفت
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onViewTask(task)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}
