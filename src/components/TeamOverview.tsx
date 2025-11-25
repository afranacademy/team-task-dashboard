import { TeamMember } from '../types';
import { MemberCard } from './MemberCard';
import { Button } from './ui/button';
import { UserPlus, Users, CheckCircle2, Clock, ListTodo } from 'lucide-react';

interface TeamOverviewProps {
  members: TeamMember[];
  onMemberClick: (memberId: string) => void;
  onAddMember: () => void;
}

export function TeamOverview({ members, onMemberClick, onAddMember }: TeamOverviewProps) {
  const totalTasks = members.reduce((sum, member) => sum + member.tasks.length, 0);
  const completedTasks = members.reduce(
    (sum, member) => sum + member.tasks.filter(t => t.status === 'Completed').length,
    0
  );
  const inProgressTasks = members.reduce(
    (sum, member) => sum + member.tasks.filter(t => t.status === 'In Progress').length,
    0
  );
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">Team Daily Workflow Dashboard</h1>
          <p className="text-gray-600 text-lg">
            Track who is doing what, see progress, and understand the impact of completed work.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Team Members</p>
                <p className="text-3xl text-gray-900">{members.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Tasks</p>
                <p className="text-3xl text-gray-900">{totalTasks}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                <ListTodo className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Completed</p>
                <p className="text-3xl text-gray-900">{completedTasks}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">In Progress</p>
                <p className="text-3xl text-gray-900">{inProgressTasks}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Header with Add Member Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-gray-900 mb-1">Team Members</h2>
            <p className="text-gray-500">Overall team progress: {overallProgress}%</p>
          </div>
          <Button 
            onClick={onAddMember}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onClick={() => onMemberClick(member.id)}
            />
          ))}
        </div>

        {members.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-500 mb-2">No team members yet</h3>
            <p className="text-gray-400 mb-6">Get started by adding your first team member</p>
            <Button onClick={onAddMember} className="bg-gradient-to-r from-purple-600 to-blue-600">
              <UserPlus className="w-4 h-4 mr-2" />
              Add First Member
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
