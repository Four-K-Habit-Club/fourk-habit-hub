// src/pages/History.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllDailyProgress } from '@/lib/storage';
import { DailyProgress } from '@/types/tasks';
import { format, subDays, isAfter, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { 
  Award, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Tag, 
  Download,
  BarChart3
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TASKS } from '@/types/tasks';
import * as XLSX from 'xlsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

type TimeRange = 'week' | 'month' | 'year' | 'all';

export const History: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [history, setHistory] = useState<DailyProgress[]>([]);
  const [selectedDay, setSelectedDay] = useState<DailyProgress | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      const data = await getAllDailyProgress(user);
      setHistory(data.sort((a, b) => b.date.localeCompare(a.date)));
    };
    fetchHistory();
  }, [user]);

  const getTaskName = (nameEn: string, nameSw: string) => {
    if (language === 'sw') return nameSw;
    if (language === 'en-sw') return `${nameSw} (${nameEn})`;
    return nameEn;
  };

  const getTaskDisplay = (taskId: string, subtaskId?: string) => {
    const task = TASKS.find(t => t.id === taskId);
    if (!task) {
      return {
        category: t(taskId),
        taskName: subtaskId ? t(subtaskId) : t(taskId),
      };
    }

    const categoryEn = task.nameEn;
    const categorySw = task.nameSw;

    let taskNameEn = task.nameEn;
    let taskNameSw = task.nameSw;

    if (subtaskId) {
      const subtask = task.subtasks.find(st => st.id === subtaskId);
      if (subtask) {
        taskNameEn = subtask.nameEn;
        taskNameSw = subtask.nameSw;
      }
    }

    return {
      category: getTaskName(categoryEn, categorySw),
      taskName: getTaskName(taskNameEn, taskNameSw),
    };
  };

  // Logic for filtering history based on Tabs
  const filteredHistory = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;

    if (timeRange === 'week') startDate = startOfWeek(now);
    else if (timeRange === 'month') startDate = startOfMonth(now);
    else if (timeRange === 'year') startDate = startOfYear(now);
    else return history;

    return history.filter(day => isAfter(new Date(day.date), startDate!));
  }, [history, timeRange]);

  // Logic for analytics charts
  const chartData = useMemo(() => {
    const habitCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    filteredHistory.forEach(day => {
      day.logs.forEach(log => {
        const { taskName, category } = getTaskDisplay(log.taskId, log.subtaskId);
        habitCounts[taskName] = (habitCounts[taskName] || 0) + 1;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
    });

    const mostRepeatedHabits = Object.entries(habitCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const habitsByCategory = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { mostRepeatedHabits, habitsByCategory };
  }, [filteredHistory, language]);

  const exportToExcel = () => {
    const exportData = history.flatMap(day => 
      day.logs.map(log => {
        const { category, taskName } = getTaskDisplay(log.taskId, log.subtaskId);
        return {
          Date: day.date,
          Category: category,
          Task: taskName,
          Points: log.points,
          User: user?.email || 'Unknown'
        };
      })
    );

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Task History");
    XLSX.writeFile(workbook, `Household_History_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const totalAllTime = history.reduce((sum, day) => sum + day.totalPoints, 0);
  const averageDaily = history.length > 0 ? Math.round(totalAllTime / history.length) : 0;

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {t('nav.history')}
              </h1>
              <p className="text-muted-foreground">
                View your household task completion history and statistics
              </p>
            </div>
            <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Excel
            </Button>
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

          <Tabs defaultValue="all" className="w-full" onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
                <TabsTrigger value="all">All Time</TabsTrigger>
              </TabsList>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="p-4">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Most Repeated Habits
                </h3>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.mostRepeatedHabits} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100} 
                        fontSize={10} 
                        tick={{fill: 'currentColor'}}
                      />
                      <Tooltip />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {chartData.mostRepeatedHabits.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Habits by Category
                </h3>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.habitsByCategory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        fontSize={10} 
                        tick={{fill: 'currentColor'}} 
                      />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <TabsContent value={timeRange} className="space-y-4 mt-0">
              {filteredHistory.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No data found for this period.
                  </p>
                </Card>
              ) : (
                filteredHistory.map((day) => (
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
                      {day.logs.slice(0, 5).map((log, index) => {
                        const { taskName } = getTaskDisplay(log.taskId, log.subtaskId);
                        return (
                          <Badge key={index} variant="secondary" className="font-normal bg-secondary">
                            {taskName}
                          </Badge>
                        );
                      })}
                      {day.logs.length > 5 && (
                        <Badge variant="outline">+{day.logs.length - 5} more</Badge>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
          <DialogContent className="sm:max-w-[450px] max-h-[85vh] flex flex-col">
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

                <div className="py-4 space-y-4 overflow-hidden flex flex-col">
                  <div className="bg-success/5 border border-success/20 rounded-xl p-4 text-center">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Total Points Earned</p>
                    <p className="text-4xl font-black text-success">{selectedDay.totalPoints}</p>
                  </div>

                  <div className="space-y-2 flex flex-col overflow-hidden">
                    <p className="text-sm font-bold text-muted-foreground px-1 flex items-center gap-2">
                      <Tag className="w-3 h-3" />
                      Task Details
                    </p>
                    <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {selectedDay.logs.map((log, index) => {
                        const { category, taskName } = getTaskDisplay(log.taskId, log.subtaskId);
                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-primary tracking-tight">
                                {category}
                              </span>
                              <span className="font-medium text-sm text-foreground">
                                {taskName}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-success">+{log.points}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="bg-primary/5 p-4 rounded-lg text-center mt-auto">
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
