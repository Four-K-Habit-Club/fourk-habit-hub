//src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getDailyProgress, getAllDailyProgress } from '@/lib/storage';
import { TASKS } from '@/types/tasks';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, Award, Calendar } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [todayProgress, setTodayProgress] = useState(0);
  const [weekProgress, setWeekProgress] = useState(0);

  const maxDailyPoints = TASKS.reduce((sum, task) => sum + task.points, 0);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const today = new Date().toISOString().split('T')[0];
      const todayData = await getDailyProgress(user, today);
      setTodayProgress(todayData?.totalPoints || 0);

      const allProgress = await getAllDailyProgress(user);
      const last7Days = allProgress.slice(0, 7);
      const weekTotal = last7Days.reduce((sum, day) => sum + day.totalPoints, 0);
      setWeekProgress(weekTotal);
    };

    fetchData();
  }, [user]);

  const progressPercentage = Math.min((todayProgress / maxDailyPoints) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {t('nav.dashboard')}
              </h1>
              <p className="text-muted-foreground">
                Track your daily household tasks and earn points
              </p>
            </div>
            <Link to="/log">
              <Button size="lg" className="gap-2 bg-gradient-primary">
                <Plus className="w-5 h-5" />
                Log Tasks
              </Button>
            </Link>
          </div>

          <Card className="p-8 bg-gradient-card shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Today's Progress</h2>
                <p className="text-sm text-muted-foreground">
                  {todayProgress} / {maxDailyPoints} points
                </p>
              </div>
            </div>
            <Progress value={progressPercentage} className="h-3 mb-4" />
            <div className="grid grid-cols-2 gap-4 mt-6">
              {TASKS.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/60"
                >
                  <span className="text-sm font-medium">{task.nameEn}</span>
                  <span className="text-xs text-muted-foreground">{task.points} pts</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold">This Week</h3>
                  <p className="text-2xl font-bold text-foreground">{weekProgress}</p>
                  <p className="text-xs text-muted-foreground">Total points</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Calendar className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold">Average Daily</h3>
                  <p className="text-2xl font-bold text-foreground">
                    {weekProgress > 0 ? Math.round(weekProgress / 7) : 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Points per day</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-gradient-to-r from-primary/10 to-accent/10">
            <h3 className="font-semibold mb-2">💡 Daily Tip</h3>
            <p className="text-sm text-muted-foreground">
              Consistency is key! Try to complete at least one task from each category daily
              to maintain a balanced household routine.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};
