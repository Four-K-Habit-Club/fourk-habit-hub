//src/pages/LogTasks.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navigation } from '@/components/Navigation';
import { TaskCard } from '@/components/TaskCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TASKS } from '@/types/tasks';
import { saveTaskLog, removeTaskLog, isTaskCompleted, getTaskLogsForDate } from '@/lib/storage';
import { toast } from 'sonner';
import { CalendarIcon, Sparkles, Award } from 'lucide-react';
import { format } from 'date-fns';

export const LogTasks: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isSimpleMode, setIsSimpleMode] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [currentPoints, setCurrentPoints] = useState(0);

  const dateString = format(selectedDate, 'yyyy-MM-dd');

  const calculatePoints = async (): Promise<number> => {
    if (!user) return 0;
    const logs = await getTaskLogsForDate(user, dateString);
    return logs.reduce((total, log) => total + log.points, 0);
  };

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const completed = new Set<string>();
      const logs = await getTaskLogsForDate(user, dateString);
      const points = await calculatePoints();
      setCurrentPoints(points);

      for (const task of TASKS) {
        if (isSimpleMode) {
          const completedTask = await isTaskCompleted(user, dateString, task.id);
          if (completedTask) completed.add(task.id);
        } else {
          for (const subtask of task.subtasks) {
            const completedSub = await isTaskCompleted(user, dateString, task.id, subtask.id);
            if (completedSub) completed.add(`${task.id}-${subtask.id}`);
          }
        }
      }
      setCompletedTasks(completed);
    };

    fetchData();
  }, [user, dateString, isSimpleMode]);

  const handleToggleTask = async (taskId: string, subtaskId?: string, points?: number) => {
    if (!user || !points) return;

    const key = subtaskId ? `${taskId}-${subtaskId}` : taskId;
    const isCompleted = completedTasks.has(key);

    if (isCompleted) {
      await removeTaskLog(user, dateString, taskId, subtaskId);
      setCompletedTasks((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      const newPoints = await calculatePoints();
      setCurrentPoints(newPoints);
      toast.info(t('task.uncompleted'));
    } else {
      await saveTaskLog(user, {
        date: dateString,
        taskId,
        subtaskId,
        points,
        timestamp: Date.now(),
      });
      setCompletedTasks((prev) => new Set(prev).add(key));
      const newPoints = await calculatePoints();
      setCurrentPoints(newPoints);
      toast.success(t('task.completed'), {
        description: `+${points} points`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t('nav.log')}
            </h1>
            <p className="text-muted-foreground">
              Log your daily household tasks and track your progress
            </p>
          </div>

          <Card className="p-6 bg-gradient-card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      {format(selectedDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                {selectedDate.toDateString() !== new Date().toDateString() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                  >
                    Back to Today
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Label htmlFor="mode-toggle" className="text-sm">
                  {isSimpleMode ? t('common.simple') : t('common.advanced')}
                </Label>
                <Switch
                  id="mode-toggle"
                  checked={!isSimpleMode}
                  onCheckedChange={(checked) => setIsSimpleMode(!checked)}
                />
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/20">
            <div className="flex items-center justify-center gap-4">
              <Award className="w-8 h-8 text-primary" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Today's Progress</p>
                <p className="text-4xl font-bold text-foreground">{currentPoints}</p>
                <p className="text-sm text-muted-foreground">points</p>
              </div>
            </div>
          </Card>

          <div className="overflow-x-auto pb-4">
            <div className="flex gap-6 min-w-max">
              {TASKS.map((task) => (
                <div key={task.id} className="w-80 flex-shrink-0">
                  <TaskCard
                    task={task}
                    isSimpleMode={isSimpleMode}
                    completedTasks={completedTasks}
                    onToggleTask={handleToggleTask}
                  />
                </div>
              ))}
            </div>
          </div>

          <Card className="p-4 bg-gradient-to-r from-primary/5 to-accent/5">
            <p className="text-sm text-center text-muted-foreground">
              💡 <strong>Tip:</strong> Use Advanced Mode to track individual tasks within each category
              for more detailed progress tracking.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};
