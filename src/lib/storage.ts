// src/lib/storage.ts
import { supabase } from '@/lib/supabaseClient';
import { TaskLog, DailyProgress } from '@/types/tasks';
import { User } from '@supabase/supabase-js';

export const saveTaskLog = async (user: User | null, log: TaskLog): Promise<void> => {
  if (!user) return;

  const date = log.date;
  const { data: existing, error: fetchError } = await supabase
    .from('daily_progress')
    .select('logs, total_points')
    .eq('user_id', user.id)
    .eq('date', date)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Fetch error:', fetchError);
    return;
  }

  let newLogs = existing ? [...existing.logs, log] : [log];
  const newTotal = newLogs.reduce((sum, l) => sum + l.points, 0);

  if (existing) {
    const { error } = await supabase
      .from('daily_progress')
      .update({ logs: newLogs, total_points: newTotal })
      .eq('user_id', user.id)
      .eq('date', date);
    if (error) console.error('Update error:', error);
  } else {
    const { error } = await supabase
      .from('daily_progress')
      .insert({
        user_id: user.id,
        date,
        total_points: newTotal,
        logs: newLogs,
      });
    if (error) console.error('Insert error:', error);
  }
};

export const removeTaskLog = async (user: User | null, date: string, taskId: string, subtaskId?: string): Promise<void> => {
  if (!user) return;

  const { data: existing, error: fetchError } = await supabase
    .from('daily_progress')
    .select('logs, total_points')
    .eq('user_id', user.id)
    .eq('date', date)
    .single();

  if (fetchError || !existing) return;

  const filteredLogs = existing.logs.filter((log: TaskLog) =>
    subtaskId
      ? !(log.taskId === taskId && log.subtaskId === subtaskId)
      : log.taskId !== taskId
  );

  const newTotal = filteredLogs.reduce((sum: number, l: TaskLog) => sum + l.points, 0);

  const { error } = await supabase
    .from('daily_progress')
    .update({ logs: filteredLogs, total_points: newTotal })
    .eq('user_id', user.id)
    .eq('date', date);

  if (error) console.error('Remove error:', error);
};

export const getDailyProgress = async (user: User | null, date: string): Promise<DailyProgress | null> => {
  if (!user) return null;

  const { data, error } = await supabase
    .from('daily_progress')
    .select('date, total_points, logs')
    .eq('user_id', user.id)
    .eq('date', date)
    .single();

  if (error || !data) return null;

  // Map snake_case to camelCase
  return {
    date: data.date,
    totalPoints: data.total_points,
    logs: data.logs,
  };
};

export const getAllDailyProgress = async (user: User | null): Promise<DailyProgress[]> => {
  if (!user) return [];

  const { data, error } = await supabase
    .from('daily_progress')
    .select('date, total_points, logs')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) {
    console.error('Fetch all error:', error);
    return [];
  }

  // Map snake_case to camelCase
  return (data || []).map((row: any) => ({
    date: row.date,
    totalPoints: row.total_points,
    logs: row.logs,
  }));
};

export const isTaskCompleted = async (user: User | null, date: string, taskId: string, subtaskId?: string): Promise<boolean> => {
  if (!user) return false;

  const { data: progress, error } = await supabase
    .from('daily_progress')
    .select('logs')
    .eq('user_id', user.id)
    .eq('date', date)
    .single();

  if (error || !progress) return false;

  return progress.logs.some((log: TaskLog) =>
    subtaskId
      ? log.taskId === taskId && log.subtaskId === subtaskId
      : log.taskId === taskId && !log.subtaskId
  );
};

export const getTaskLogsForDate = async (user: User | null, date: string): Promise<TaskLog[]> => {
  if (!user) return [];

  const { data, error } = await supabase
    .from('daily_progress')
    .select('logs')
    .eq('user_id', user.id)
    .eq('date', date)
    .single();

  if (error || !data) return [];
  return data.logs || [];
};