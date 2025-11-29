import { Task } from '../types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Eye, Lock } from 'lucide-react';
import { getStatusLabelFa } from '../lib/statusLabels';

interface PrivateTasksProps {
  tasks: Task[];
  selectedDate: string;
  onViewTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export function PrivateTasks({
  tasks,
  selectedDate,
  onViewTask,
  onDeleteTask,
}: PrivateTasksProps) {
  const privateTasks = tasks.filter(
    t => t.isPrivate && t.date === selectedDate
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <h3>وظایف خصوصی (برای این روز)</h3>
        </div>
        <Badge variant="secondary">{privateTasks.length} مورد</Badge>
      </div>

      {privateTasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          هیچ وظیفه خصوصی برای این روز ثبت نشده است
        </div>
      ) : (
        <div className="space-y-3">
          {privateTasks.map(task => (
            <Card key={task.id} className="p-4 bg-purple-50 border-purple-200">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm">{task.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {getStatusLabelFa(task.status)}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {task.progress ?? 0}% پیشرفت
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onViewTask(task)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteTask(task.id)}
                  >
                    حذف
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
