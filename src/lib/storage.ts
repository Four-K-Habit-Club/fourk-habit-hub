// src/lib/storage.ts
import { supabase } from '@/lib/supabaseClient';
import { TaskLog, DailyProgress } from '@/types/tasks';
import { User } from '@supabase/supabase-js';

export const saveTaskLog = async (user: User | null, log: TaskLog): Promise<void> => {
  if (!user) return;

  const date = log.date;
  const { data: existing, error: fetchError } = await supabase
    .from('daily_progress')
    .select('logs, totalPoints')
    .eq('user_id', user.id)
    .eq('date', date)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // Ignore "no rows"
    console.error('Fetch error:', fetchError);
    return;
  }

  let newLogs = existing ? [...existing.logs, log] : [log];
  const newTotal = newLogs.reduce((sum, l) => sum + l.points, 0);

  if (existing) {
    const { error } = await supabase
      .from('daily_progress')
      .update({ logs: newLogs, totalPoints: newTotal })
      .eq('user_id', user.id)
      .eq('date', date);
    if (error) console.error('Update error:', error);
  } else {
    const { error } = await supabase
      .from('daily_progress')
      .insert({
        user_id: user.id,
        date,
        totalPoints: newTotal,
        logs: newLogs,
      });
    if (error) console.error('Insert error:', error);
  }
};

export const removeTaskLog = async (user: User | null, date: string, taskId: string, subtaskId?: string): Promise<void> => {
  if (!user) return;

  const { data: existing, error: fetchError } = await supabase
    .from('daily_progress')
    .select('logs, totalPoints')
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
    .update({ logs: filteredLogs, totalPoints: newTotal })
    .eq('user_id', user.id)
    .eq('date', date);

  if (error) console.error('Remove error:', error);
};

export const getDailyProgress = async (user: User | null, date: string): Promise<DailyProgress | null> => {
  if (!user) return null;

  const { data, error } = await supabase
    .from('daily_progress')
    .select('date, totalPoints, logs')
    .eq('user_id', user.id)
    .eq('date', date)
    .single();

  if (error || !data) return null;
  return data;
};

export const getAllDailyProgress = async (user: User | null): Promise<DailyProgress[]> => {
  if (!user) return [];

  const { data, error } = await supabase
    .from('daily_progress')
    .select('date, totalPoints, logs')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) {
    console.error('Fetch all error:', error);
    return [];
  }
  return data || [];
};

export const isTaskCompleted = async (user: User | null, date: string, taskId: string, subtaskId?: string): Promise<boolean> => {
  if (!user) return false;

  const { data: progress } = await supabase
    .from('daily_progress')
    .select('logs')
    .eq('user_id', user.id)
    .eq('date', date)
    .single();

  if (!progress) return false;

  return progress.logs.some((log: TaskLog) =>
    subtaskId
      ? log.taskId === taskId && log.subtaskId === subtaskId
      : log.taskId === taskId && !log.subtaskId
  );
};
