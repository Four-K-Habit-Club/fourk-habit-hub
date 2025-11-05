import React from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Task, SubTask } from '@/types/tasks';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bath, Shirt, Sparkles, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  isSimpleMode: boolean;
  completedTasks: Set<string>;
  onToggleTask: (taskId: string, subtaskId?: string, points?: number) => void;
}

const iconMap = {
  Bath,
  Shirt,
  Sparkles,
  ChefHat,
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isSimpleMode,
  completedTasks,
  onToggleTask,
}) => {
  const { language } = useLanguage();
  const Icon = iconMap[task.icon as keyof typeof iconMap];

  const getTaskName = (nameEn: string, nameSw: string) => {
    if (language === 'sw') return nameSw;
    if (language === 'en-sw') return `${nameSw} (${nameEn})`;
    return nameEn;
  };

  const isMainTaskCompleted = completedTasks.has(task.id);
  const completedSubtasks = task.subtasks.filter(st => 
    completedTasks.has(`${task.id}-${st.id}`)
  ).length;

  const colorClasses = {
    primary: 'border-primary/20 hover:border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10',
    secondary: 'border-secondary/20 hover:border-secondary/40 bg-gradient-to-br from-secondary/5 to-secondary/10',
    accent: 'border-accent/20 hover:border-accent/40 bg-gradient-to-br from-accent/5 to-accent/10',
  };

  const iconColorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
  };

  return (
    <Card className={cn(
      "p-6 transition-all duration-300 hover:shadow-md",
      colorClasses[task.color as keyof typeof colorClasses]
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg bg-background/80",
            iconColorClasses[task.color as keyof typeof iconColorClasses]
          )}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              {getTaskName(task.nameEn, task.nameSw)}
            </h3>
            <Badge variant="secondary" className="mt-1">
              {task.points} pts
            </Badge>
          </div>
        </div>
      </div>

      {isSimpleMode ? (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60 hover:bg-background/80 transition-colors">
          <Checkbox
            id={task.id}
            checked={isMainTaskCompleted}
            onCheckedChange={() => onToggleTask(task.id, undefined, task.points)}
          />
          <label
            htmlFor={task.id}
            className="flex-1 text-sm font-medium cursor-pointer"
          >
            Complete all {task.nameEn.toLowerCase()} tasks
          </label>
          <span className="text-sm font-semibold text-muted-foreground">
            {task.points} pts
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Detailed tasks</span>
            <span>{completedSubtasks} / {task.subtasks.length} completed</span>
          </div>
          {task.subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-background/60 hover:bg-background/80 transition-colors"
            >
              <Checkbox
                id={`${task.id}-${subtask.id}`}
                checked={completedTasks.has(`${task.id}-${subtask.id}`)}
                onCheckedChange={() => onToggleTask(task.id, subtask.id, subtask.points)}
              />
              <label
                htmlFor={`${task.id}-${subtask.id}`}
                className="flex-1 text-sm cursor-pointer"
              >
                {getTaskName(subtask.nameEn, subtask.nameSw)}
              </label>
              <span className="text-sm font-semibold text-muted-foreground">
                {subtask.points} pts
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
