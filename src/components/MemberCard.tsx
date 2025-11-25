import { TeamMember } from '../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { CheckCircle2, Clock } from 'lucide-react';

interface MemberCardProps {
  member: TeamMember;
  onClick: () => void;
}

export function MemberCard({ member, onClick }: MemberCardProps) {
  const completedTasks = member.tasks.filter(t => t.status === 'Completed').length;
  const totalTasks = member.tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer border-gray-200" onClick={onClick}>
      <div className="flex items-start gap-4">
        <Avatar className="h-14 w-14 border-2 border-purple-100">
          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white">
            {member.initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-gray-900 truncate">{member.name}</h3>
          <p className="text-gray-500 text-sm">{member.role}</p>
          
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Tasks Today</span>
              <span className="text-gray-900">{totalTasks}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Completed</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-gray-900">{completedTasks}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">In Progress</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-gray-900">
                  {member.tasks.filter(t => t.status === 'In Progress').length}
                </span>
              </div>
            </div>
            
            <div className="pt-2">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Progress</span>
                <span className="text-gray-900">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>
        </div>
      </div>
      
      <Button 
        className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        View Tasks
      </Button>
    </Card>
  );
}
