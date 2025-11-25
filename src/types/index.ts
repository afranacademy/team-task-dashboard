export type TaskStatus = 'To Do' | 'In Progress' | 'Completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  progress: number;
  expectedOutcome: string;
  deadline?: string;
  startDate: string;
  date: string; // The specific date this task is for
  comments?: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  initials: string;
  tasks: Task[];
  accessPermissions: string[]; // Array of user IDs who can view this user's tasks
  password?: string; // Simple password for demo
}

export interface DailyProgress {
  date: string;
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
}
