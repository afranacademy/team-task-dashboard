import { Task } from '../types';
import { formatJalaliDate } from '../lib/dateJalali';
import { getStatusLabelFa } from '../lib/statusLabels';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Calendar, Target, Lock } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onDeleteTask?: (taskId: string) => void;
}

const statusColors = {
  'To Do': 'bg-gray-100 text-gray-700 border-gray-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  'Completed': 'bg-green-50 text-green-700 border-green-200'
};

const statusDotColors = {
  'To Do': 'bg-gray-400',
  'In Progress': 'bg-blue-500',
  'Completed': 'bg-green-500'
};

export function TaskCard({ task, onClick, onDeleteTask }: TaskCardProps) {
  return (
    <Card 
      className="w-full overflow-hidden break-words p-5 hover:shadow-md transition-all duration-200 cursor-pointer border-gray-200 hover:border-purple-200"
      onClick={onClick}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-gray-900 mb-1 truncate">{task.title}</h4>
            <p className="text-gray-500 text-sm line-clamp-2">{task.description}</p>
          </div>
          <div className="flex items-start gap-2">
            {task.isPrivate && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <Lock className="w-3 h-3 ml-1" />
                خصوصی
              </Badge>
            )}
            {onDeleteTask && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTask(task.id);
                }}
                className="text-xs px-2 py-1 rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
              >
                حذف
              </button>
            )}
            <Badge 
              variant="outline" 
              className={`${statusColors[task.status]} border shrink-0`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusDotColors[task.status]} mr-1.5`} />
              {getStatusLabelFa(task.status)}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="text-gray-900">{task.progress}%</span>
            </div>
            <Progress 
              value={task.progress} 
              className="h-2"
            />
          </div>
          
          {task.deadline && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>موعد: {formatJalaliDate(task.deadline)}</span>
            </div>
          )}
          
          <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
            <Target className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-purple-600 mb-1">Expected Outcome</p>
              <p className="text-sm text-gray-700 line-clamp-2">{task.expectedOutcome}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
