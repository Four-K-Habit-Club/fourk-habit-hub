// src/pages/History.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAllDailyProgress } from '@/lib/storage';
import { DailyProgress } from '@/types/tasks';
import { format } from 'date-fns';
import { Award, TrendingUp, Calendar, CheckCircle2, ArrowRight, ListChecks } from 'lucide-react';
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
      setHistory(data.sort((a, b) => b.date.localeCompare(a.date)));
    };
    fetchHistory();
  }, [user]);

  // Matches the exact naming logic in LogTasks.tsx
  const getTaskSentence = (subtaskId: string) => t(subtaskId);
  const getCategoryName = (taskId: string) => t(taskId);

  const totalAllTime = history.reduce((sum, day) => sum + day.totalPoints, 0);
  const averageDaily = history.length > 0 ? Math.round(totalAllTime / history.length) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-foreground">
              {t('nav.history')}
            </h1>
            <p className="text-muted-foreground italic">
              Record of your completed household tasks
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 border-l-4 border-l-primary">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Total Points</p>
                  <p className="text-2xl font-bold">{totalAllTime}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-success">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-success" />
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Daily Average</p>
                  <p className="text-2xl font-bold">{averageDaily}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-secondary">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Days Logged</p>
                  <p className="text-2xl font-bold">{history.length}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* History List */}
          <div className="space-y-4">
            {history.length === 0 ? (
              <Card className="p-12 text-center border-dashed">
                <p className="text-muted-foreground">No tasks logged yet.</p>
              </Card>
            ) : (
              history.map((day) => (
                <Card 
                  key={day.date} 
                  className="p-5 hover:border-primary/50 transition-colors cursor-pointer group"
                  onClick={() => setSelectedDay(day)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg">
                        {format(new Date(day.date), 'EEEE, MMMM d, yyyy')}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/10 border-none">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {day.logs.length} Completed
                        </Badge>
                        <span className="text-xs">• Click to view details</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-black text-primary">{day.totalPoints}</p>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Points</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Quick Task Sentence Preview */}
                  <div className="flex flex-wrap gap-2">
                    {day.logs.slice(0, 3).map((log, idx) => (
                      <span key={idx} className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground">
                        {log.subtaskId ? getTaskSentence(log.subtaskId) : getCategoryName(log.taskId)}
                      </span>
                    ))}
                    {day.logs.length > 3 && (
                      <span className="text-xs text-primary font-bold">+{day.logs.length - 3} more</span>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Detailed Breakdown Dialog */}
        <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
          <DialogContent className="sm:max-w-[450px] max-h-[85vh] flex flex-col p-0 overflow-hidden">
            {selectedDay && (
              <>
                <div className="p-6 pb-0">
                  <DialogHeader>
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <ListChecks className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-widest">Daily Summary</span>
                    </div>
                    <DialogTitle className="text-2xl font-black">
                      {format(new Date(selectedDay.date), 'MMMM d, yyyy')}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      You earned <span className="text-success font-bold">{selectedDay.totalPoints} points</span> today.
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                   <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Detailed tasks</p>
                    
                    <div className="space-y-2">
                      {selectedDay.logs.map((log, index) => (
                        <div key={index} className="flex flex-col p-3 rounded-xl bg-muted/30 border border-border/50">
                          <div className="flex items-center justify-between mb-1">
                            {/* Category - e.g., BATHING */}
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wide">
                              {getCategoryName(log.taskId)}
                            </span>
                            {/* Points - e.g., 5 pts */}
                            <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                              {log.points} pts
                            </span>
                          </div>
                          {/* Task Sentence - e.g., Brushing teeth properly */}
                          <p className="text-sm font-semibold text-foreground leading-tight">
                            {log.subtaskId ? getTaskSentence(log.subtaskId) : getCategoryName(log.taskId)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="p-6 pt-2">
                  <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl text-center">
                    <p className="text-xs text-primary font-medium">
                      "Excellent work! Every task completed is a step toward a better home."
                    </p>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
