// src/pages/History.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAllDailyProgress } from '@/lib/storage';
import { DailyProgress, TASKS } from '@/types/tasks'; // Imported TASKS to ensure consistency
import { format } from 'date-fns';
import { Award, TrendingUp, Calendar, CheckCircle2, ArrowRight, ClipboardCheck } from 'lucide-react';
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

  /**
   * getTaskDisplay logic
   * This matches the logic in LogTasks.tsx
   */
  const getTaskDisplay = (taskId: string, subtaskId?: string) => {
    // Translate the Category (e.g., "kuoga" -> "Bathing")
    const categoryName = t(taskId);
    
    // Translate the Task (e.g., "teeth" -> "Brushing teeth properly")
    // If no subtask exists, we use the category name
    const taskName = subtaskId ? t(subtaskId) : categoryName;

    return {
      category: categoryName,
      task: taskName
    };
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

          {/* Statistics Section */}
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

          {/* History List */}
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
                        <CheckCircle2 className="w-4 h-3 text-success" />
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

                  {/* Summary Preview: Displays sentences, not IDs */}
                  <div className="flex flex-wrap gap-2">
                    {day.logs.slice(0, 4).map((log, index) => (
                      <Badge key={index} variant="secondary" className="font-normal">
                        {getTaskDisplay(log.taskId, log.subtaskId).task}
                      </Badge>
                    ))}
                    {day.logs.length > 4 && (
                      <Badge variant="outline">+{day.logs.length - 4} more</Badge>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Detailed Breakdown Dialog */}
        <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
          <DialogContent className="sm:max-w-[450px] max-h-[80vh] overflow-y-auto">
            {selectedDay && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <ClipboardCheck className="w-6 h-6 text-primary" />
                    Day Summary
                  </DialogTitle>
                  <DialogDescription className="text-lg font-medium">
                    {format(new Date(selectedDay.date), 'EEEE, MMMM d')}
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                  <div className="bg-success/5 border border-success/20 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Total Points</p>
                    <p className="text-4xl font-black text-success">{selectedDay.totalPoints}</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-bold text-muted-foreground px-1">Task Details</p>
                    <div className="space-y-2">
                      {selectedDay.logs.map((log, index) => {
                        const details = getTaskDisplay(log.taskId, log.subtaskId);
                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border/50">
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-primary/70">
                                {details.category}
                              </span>
                              <span className="font-semibold text-sm leading-tight">
                                {details.task}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-success text-sm">
                              +{log.points}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="bg-primary/5 p-4 rounded-lg text-center border border-primary/10">
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
