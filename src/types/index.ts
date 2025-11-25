export type TaskStatus = 'To Do' | 'In Progress' | 'Completed';
export type Mood = 'bad' | 'medium' | 'good' | 'great';

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
  isPrivate?: boolean; // true = only owner can see, false/undefined = visible to team
  projectId?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId?: string;
  createdAt?: string;
}

export interface ProjectMember {
  projectId: string;
  memberId: string;
  role?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  avatarUrl?: string;
  initials: string;
  password?: string;           // ⬅️ این خط جدید
  mood?: Mood;
  tasks: Task[];
  accessPermissions: string[]; // Array of user IDs who can view this user's tasks
}

export interface DailyProgress {
  date: string;
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
}
