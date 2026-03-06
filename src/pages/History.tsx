// src/pages/History.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAllDailyProgress } from '@/lib/storage';
import { DailyProgress, TASKS } from '@/types/tasks';
import { format } from 'date-fns';
import { Award, TrendingUp, Calendar, CheckCircle2, PartyPopper, ChevronRight, Trophy } from 'lucide-react';
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
      // Sort history by date descending (newest first)
      setHistory(data.sort((a, b) => b.date.localeCompare(a.date)));
    };
    fetchHistory();
  }, [user]);

  // Helper to find the specific localized name of a subtask
  const getSubtaskName = (taskId: string, subtaskId?: string) => {
    const task = TASKS.find((t) => t.id === taskId);
    if (!subtaskId) return t(taskId);
    
    const subtask = task?.subtasks.find(s => s.id === subtaskId);
    // Try to find the localized subtask name, fallback to task category name
    return subtask ? t(`${taskId}.${subtaskId}`) : t(taskId);
  };

  const totalAllTime = history.reduce((sum, day) => sum + day.totalPoints, 0);
  const averageDaily = history.length > 0 ? Math.round(totalAllTime / history.length) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-12">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t('nav.history')}
            </h1>
            <p className="text-muted-foreground italic">
              "Consistency is the key to a happy home."
            </p>
          </header>

          {/* Stats Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Total Earned</p>
                  <p className="text-2xl font-black text-foreground">{totalAllTime} <span className="text-sm font-normal">pts</span></p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/10">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Daily Avg</p>
                  <p className="text-2xl font-black text-foreground">{averageDaily} <span className="text-sm font-normal">pts</span></p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-secondary/10 text-secondary-foreground">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Days Tracked</p>
                  <p className="text-2xl font-black text-foreground">{history.length}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* History List */}
          <div className="space-y-3">
            {history.length === 0 ? (
              <Card className="p-12 text-center border-dashed">
                <Award className="w-12 h-12 text-muted/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No records found. Start your journey today!</p>
              </Card>
            ) : (
              history.map((day) => (
                <Card 
                  key={day.date} 
                  className="p-5 cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all group relative overflow-hidden active:scale-[0.98]"
                  onClick={() => setSelectedDay(day)}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center font-bold text-primary border-2 border-background shadow-sm">
                        {format(new Date(day.date), 'dd')}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">
                          {format(new Date(day.date), 'EEEE, MMMM yyyy')}
                        </h3>
                        <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {day.logs.length} Tasks Completed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-2xl font-black text-primary">+{day.totalPoints}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  {/* Subtle progress background bar based on points (optional) */}
                  <div className="absolute bottom-0 left-0 h-1 bg-primary/20 transition-all" style={{ width: `${Math.min(day.totalPoints, 100)}%` }} />
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Detailed Achievement Dialog */}
        <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
          <DialogContent className="sm:max-w-md bg-gradient-to-b from-background to-muted/30 border-none shadow-2xl">
            {selectedDay && (
              <>
                <DialogHeader className="space-y-4">
                  <div className="mx-auto bg-yellow-400/20 p-4 rounded-full w-fit animate-bounce">
                    <PartyPopper className="w-8 h-8 text-yellow-600" />
                  </div>
                  <div className="text-center">
                    <DialogTitle className="text-2xl font-black italic tracking-tighter">DAZZLING EFFORT!</DialogTitle>
                    <DialogDescription className="text-base font-semibold text-foreground/70">
                      {format(new Date(selectedDay.date), 'MMMM d, yyyy')}
                    </DialogDescription>
                  </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Points Big Badge */}
                  <div className="bg-primary text-primary-foreground rounded-3xl p-6 text-center shadow-inner relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-xs uppercase font-bold tracking-[0.2em] opacity-80">Daily Score</p>
                      <p className="text-6xl font-black">{selectedDay.totalPoints}</p>
                      <p className="text-sm font-medium">Points Logged</p>
                    </div>
                    <Trophy className="absolute -bottom-2 -right-2 w-24 h-24 opacity-10 rotate-12" />
                  </div>

                  {/* Task List Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground px-1 tracking-widest">Achievements Breakdown</h4>
                    <div className="max-h-[30vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {selectedDay.logs.map((log, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-background rounded-xl border border-border/50 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-sm font-bold">{getSubtaskName(log.taskId, log.subtaskId)}</span>
                          </div>
                          <Badge variant="secondary" className="font-mono text-primary font-bold">
                            +{log.points}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground italic">Keep going! Your future self is thanking you.</p>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
