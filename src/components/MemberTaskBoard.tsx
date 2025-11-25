import { TeamMember, Task } from '../types';
import { TaskCard } from './TaskCard';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowLeft, Plus, Calendar, TrendingUp } from 'lucide-react';

interface MemberTaskBoardProps {
  member: TeamMember;
  onBack: () => void;
  onTaskClick: (task: Task) => void;
  onAddTask: () => void;
}

export function MemberTaskBoard({ member, onBack, onTaskClick, onAddTask }: MemberTaskBoardProps) {
  const completedTasks = member.tasks.filter(t => t.status === 'Completed').length;
  const inProgressTasks = member.tasks.filter(t => t.status === 'In Progress').length;
  const todoTasks = member.tasks.filter(t => t.status === 'To Do').length;
  const progressPercentage = member.tasks.length > 0 
    ? Math.round((completedTasks / member.tasks.length) * 100) 
    : 0;

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const tasksByStatus = {
    'To Do': member.tasks.filter(t => t.status === 'To Do'),
    'In Progress': member.tasks.filter(t => t.status === 'In Progress'),
    'Completed': member.tasks.filter(t => t.status === 'Completed')
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Team Overview
        </Button>

        {/* Member Header */}
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <Avatar className="h-20 w-20 border-4 border-purple-100">
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-2xl">
                {member.initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-gray-900 mb-1">{member.name}</h1>
              <p className="text-gray-500 text-lg mb-4">{member.role}</p>
              
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Calendar className="w-4 h-4" />
                <span>{currentDate}</span>
              </div>

              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-sm text-gray-500">Total Tasks</p>
                  <p className="text-2xl text-gray-900">{member.tasks.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl text-green-600">{completedTasks}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">In Progress</p>
                  <p className="text-2xl text-blue-600">{inProgressTasks}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">To Do</p>
                  <p className="text-2xl text-gray-600">{todoTasks}</p>
                </div>
              </div>
            </div>

            <div className="md:min-w-[200px]">
              <p className="text-sm text-gray-500 mb-2">Completion Rate</p>
              <div className="flex items-center gap-3 mb-2">
                <Progress value={progressPercentage} className="flex-1 h-3" />
                <span className="text-2xl text-gray-900">{progressPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-gray-900">Tasks</h2>
            <Button 
              onClick={onAddTask}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Task
            </Button>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-4 mb-6">
              <TabsTrigger value="all">
                All ({member.tasks.length})
              </TabsTrigger>
              <TabsTrigger value="todo">
                To Do ({todoTasks})
              </TabsTrigger>
              <TabsTrigger value="progress">
                In Progress ({inProgressTasks})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Done ({completedTasks})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              {member.tasks.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-gray-500 mb-2">No tasks yet</h3>
                  <p className="text-gray-400">Start by adding a new task</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {member.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick(task)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="todo" className="mt-0">
              {tasksByStatus['To Do'].length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No tasks to do
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasksByStatus['To Do'].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick(task)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="progress" className="mt-0">
              {tasksByStatus['In Progress'].length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No tasks in progress
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasksByStatus['In Progress'].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick(task)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              {tasksByStatus['Completed'].length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No completed tasks yet
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasksByStatus['Completed'].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick(task)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
