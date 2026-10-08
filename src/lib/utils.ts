import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('ru-RU', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  
  const diffInMs = now.getTime() - d.getTime();
  if (diffInMs < 0) return 'Только что';
  
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMins < 1) return 'Только что';
  if (diffInMins < 60) return `${diffInMins} мин. назад`;
  if (diffInHours < 24) return `${diffInHours} ч. назад`;
  if (diffInDays < 7) return `${diffInDays} дн. назад`;
  
  return formatDate(d);
}

export function getRandomColor(): string {
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}


export function getPriorityBadgeVariant(priority: string): "destructive" | "default" | "secondary" | "outline" {
  switch (priority) {
    case 'URGENT':
      return 'destructive'; 
    case 'HIGH':
      return 'default';     
    case 'MEDIUM':
      return 'secondary';   
    case 'LOW':
      return 'outline';     
    default:
      return 'outline';
  }
}

export function getPriorityLabel(priority: string): string {
  switch (priority) {
    case 'URGENT': return 'Критично';
    case 'HIGH': return 'Высокий';
    case 'MEDIUM': return 'Средний';
    default: return 'Низкий';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'TODO': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'REVIEW': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'DONE': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}
