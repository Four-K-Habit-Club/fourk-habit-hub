// src/pages/LogTasks.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navigation } from '@/components/Navigation';
import { TaskCard } from '@/components/TaskCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TASKS, Task } from '@/types/tasks';
import { saveTaskLog, removeTaskLog, isTaskCompleted, getTaskLogsForDate } from '@/lib/storage';
import { toast } from 'sonner';
import { CalendarIcon, Award, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';

export const LogTasks: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [currentPoints, setCurrentPoints] = useState(0);

  const dateString = format(selectedDate, 'yyyy-MM-dd');

  const calculatePoints = async (): Promise<number> => {
    if (!user) return 0;
    const logs = await getTaskLogsForDate(user, dateString);
    return logs.reduce((total, log) => total + log.points, 0);
  };

  const getTaskTitle = () => {
    const today = new Date();
    const isToday = 
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate();

    if (isToday) {
      return "Today";
    } else {
      return format(selectedDate, "EEEE, MMMM d");
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const completed = new Set<string>();
      // Calculate points
      const points = await calculatePoints();
      setCurrentPoints(points);

      // In "Advanced" mode (which is now default), we check every subtask
      for (const task of TASKS) {
        for (const subtask of task.subtasks) {
          const completedSub = await isTaskCompleted(user, dateString, task.id, subtask.id);
          if (completedSub) completed.add(`${task.id}-${subtask.id}`);
        }
      }
      setCompletedTasks(completed);
    };

    fetchData();
  }, [user, dateString]);

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

  // New function to handle "Complete All" for a specific category
  const handleCompleteCategory = async (task: Task) => {
    if (!user) return;

    let pointsAdded = 0;
    const newCompleted = new Set(completedTasks);
    const updates: Promise<any>[] = [];

    // Iterate through all subtasks of the category
    for (const subtask of task.subtasks) {
      const key = `${task.id}-${subtask.id}`;
      
      // If this specific subtask is NOT already done, log it
      if (!completedTasks.has(key)) {
        updates.push(
          saveTaskLog(user, {
            date: dateString,
            taskId: task.id,
            subtaskId: subtask.id,
            points: subtask.points,
            timestamp: Date.now(),
          })
        );
        newCompleted.add(key);
        pointsAdded += subtask.points;
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
      setCompletedTasks(newCompleted);
      const newTotal = await calculatePoints();
      setCurrentPoints(newTotal);
      toast.success(`Completed all ${t(task.id)} tasks!`, {
        description: `+${pointsAdded} points added`,
      });
    } else {
      toast.info(`All tasks in ${t(task.id)} are already completed.`);
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
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/20">
            <div className="flex items-center justify-center gap-4">
              <Award className="w-8 h-8 text-primary" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">{getTaskTitle()}'s Progress</p>
                <p className="text-4xl font-bold text-foreground">{currentPoints}</p>
                <p className="text-sm text-muted-foreground">points</p>
              </div>
            </div>
          </Card>

          <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-4 sm:gap-6 min-w-max">
              {TASKS.map((task) => (
                <div 
                  key={task.id} 
                  // UPDATED: For better partial visibility of next card
                  className="w-[70vw] sm:w-80 flex-shrink-0 flex flex-col gap-3"
                >
                  <TaskCard
                    task={task}
                    isSimpleMode={false} 
                    completedTasks={completedTasks}
                    onToggleTask={handleToggleTask}
                  />
                  <Button 
                    className="w-full shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleCompleteCategory(task)}
                  >
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Complete All {t(task.id)}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
