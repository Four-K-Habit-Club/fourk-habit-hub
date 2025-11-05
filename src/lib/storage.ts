import { TaskLog, DailyProgress } from '@/types/tasks';

const STORAGE_KEY = 'fourk-task-logs';

export const saveTaskLog = (userEmail: string, log: TaskLog): void => {
  const allData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  
  if (!allData[userEmail]) {
    allData[userEmail] = {};
  }
  
  if (!allData[userEmail][log.date]) {
    allData[userEmail][log.date] = [];
  }
  
  allData[userEmail][log.date].push(log);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
};

export const removeTaskLog = (userEmail: string, date: string, taskId: string, subtaskId?: string): void => {
  const allData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  
  if (!allData[userEmail] || !allData[userEmail][date]) {
    return;
  }
  
  allData[userEmail][date] = allData[userEmail][date].filter((log: TaskLog) => {
    if (subtaskId) {
      return !(log.taskId === taskId && log.subtaskId === subtaskId);
    }
    return log.taskId !== taskId;
  });
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
};

export const getTaskLogsForDate = (userEmail: string, date: string): TaskLog[] => {
  const allData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  return allData[userEmail]?.[date] || [];
};

export const getDailyProgress = (userEmail: string, date: string): DailyProgress => {
  const logs = getTaskLogsForDate(userEmail, date);
  const totalPoints = logs.reduce((sum, log) => sum + log.points, 0);
  
  return {
    date,
    totalPoints,
    logs,
  };
};

export const getAllDailyProgress = (userEmail: string): DailyProgress[] => {
  const allData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const userData = allData[userEmail] || {};
  
  return Object.keys(userData)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .map(date => getDailyProgress(userEmail, date));
};

export const isTaskCompleted = (userEmail: string, date: string, taskId: string, subtaskId?: string): boolean => {
  const logs = getTaskLogsForDate(userEmail, date);
  
  if (subtaskId) {
    return logs.some(log => log.taskId === taskId && log.subtaskId === subtaskId);
  }
  
  return logs.some(log => log.taskId === taskId && !log.subtaskId);
};
