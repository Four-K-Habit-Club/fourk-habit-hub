import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAllDailyProgress } from '@/lib/storage';
import { DailyProgress, TASKS } from '@/types/tasks';
import { format } from 'date-fns';
import { Award, TrendingUp, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const History: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [history, setHistory] = useState<DailyProgress[]>([]);
  const [selectedDay, setSelectedDay] = useState<DailyProgress | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      const data = await getAllDailyProgress(user);
      // Sort newest first
      setHistory(data.sort((a, b) => b.date.localeCompare(a.date)));
    };
    fetchHistory();
  }, [user]);

  // Logic to resolve specific Task/Subtask name exactly like LogTasks
  const getTaskName = (taskId: string, subtaskId?: string) => {
    const task = TASKS.find((t) => t.id === taskId);
    if (!task) return taskId;
    
    // If there is a subtask, get the specific name from translation keys
    if (subtaskId) {
      const subtask = task.subtasks.find(s => s.id === subtaskId);
      return subtask ? t(`${taskId}.${subtaskId}`) : t(taskId);
    }
    return t(taskId);
  };

  const totalAllTime = history.reduce((sum, day) => sum + day.totalPoints, 0);
  const averageDaily = history.length > 0 ? Math.round(totalAllTime / history.length) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t('nav.history')}
            </h1>
            <p className="text-muted-foreground">
              View your household task completion history and statistics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                  <p className="text-2xl font-bold text-foreground">{totalAllTime}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Daily</p>
                  <p className="text-2xl font-bold text-foreground">{averageDaily}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Calendar className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Days Tracked</p>
                  <p className="text-2xl font-bold text-foreground">{history.length}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            {history.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  No history yet. Start logging your tasks to see your progress here!
                </p>
              </Card>
            ) : (
              history.map((day) => (
                <Card 
                  key={day.date} 
                  className="p-6 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
                  onClick={() => setSelectedDay(day)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {format(new Date(day.date), 'EEEE, MMMM d, yyyy')}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-success" />
                        {day.logs.length} task{day.logs.length !== 1 ? 's' : ''} completed
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="text-lg px-4 py-2 bg-gradient-success">
                        {day.totalPoints} pts
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {day.logs.slice(0, 5).map((log, index) => (
                      <Badge key={index} variant="secondary" className="font-normal">
                        {getTaskName(log.taskId, log.subtaskId)}
                      </Badge>
                    ))}
                    {day.logs.length > 5 && (
                      <Badge variant="outline">+{day.logs.length - 5} more</Badge>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Detailed Breakdown Dialog */}
        <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
          <DialogContent className="sm:max-w-[450px]">
            {selectedDay && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <Award className="w-6 h-6 text-primary" />
                    Day Summary
                  </DialogTitle>
                  <DialogDescription className="text-lg font-medium">
                    {format(new Date(selectedDay.date), 'EEEE, MMMM d')}
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                  <div className="bg-success/5 border border-success/20 rounded-xl p-4 text-center">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Total Points Earned</p>
                    <p className="text-4xl font-black text-success">{selectedDay.totalPoints}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-bold text-muted-foreground px-1">Task Details</p>
                    <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {selectedDay.logs.map((log, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-success" />
                            <span className="font-medium text-sm">
                              {getTaskName(log.taskId, log.subtaskId)}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-primary">+{log.points}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="bg-primary/5 p-4 rounded-lg text-center">
                  <p className="text-xs text-primary font-medium italic">
                    "Excellent work! Every task completed is a step toward a better home."
                  </p>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
