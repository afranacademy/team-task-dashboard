import type { TaskStatus } from '../types';

export function getStatusLabelFa(status: TaskStatus): string {
  switch (status) {
    case 'To Do':
      return 'در صف انجام';
    case 'In Progress':
      return 'در حال انجام';
    case 'Completed':
      return 'تکمیل شده';
    default:
      return '';
  }
}
