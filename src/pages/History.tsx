//src/pages/History.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAllDailyProgress } from '@/lib/storage';
import { DailyProgress, TASKS } from '@/types/tasks';
import { format } from 'date-fns';
import { Award, TrendingUp, Calendar } from 'lucide-react';

export const History: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [history, setHistory] = useState<DailyProgress[]>([]);

useEffect(() => {
  const fetchHistory = async () => {
    if (!user) return;
    const data = await getAllDailyProgress(user);
    setHistory(data);
  };
  fetchHistory();
}, [user]);

  const getTaskName = (taskId: string) => {
    const task = TASKS.find((t) => t.id === taskId);
    return task?.nameEn || taskId;
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
                <Card key={day.date} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {format(new Date(day.date), 'EEEE, MMMM d, yyyy')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {day.logs.length} task{day.logs.length !== 1 ? 's' : ''} completed
                      </p>
                    </div>
                    <Badge className="text-lg px-4 py-2 bg-gradient-success">
                      {day.totalPoints} pts
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {day.logs.map((log, index) => (
                      <Badge key={index} variant="secondary">
                        {getTaskName(log.taskId)} (+{log.points})
                      </Badge>
                    ))}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
