import type { Mood } from '../types';

export function getMoodEmoji(mood?: Mood): string {
  switch (mood) {
    case 'bad':
      return '☹️';
    case 'medium':
      return '🙂';
    case 'good':
      return '☺️';
    case 'great':
      return '😍';
    default:
      return '🙂';
  }
}

export function getMoodLabelFa(mood?: Mood): string {
  switch (mood) {
    case 'bad':
      return 'بد';
    case 'medium':
      return 'متوسط';
    case 'good':
      return 'خوب';
    case 'great':
      return 'عالی';
    default:
      return 'نامشخص';
  }
}
