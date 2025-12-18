import { FinanceRecord } from "@/types/finance";
import { User } from "@supabase/supabase-js";

const STORAGE_KEY = 'finance_records';

export const getFinanceRecords = (user: User | null): FinanceRecord[] => {
  if (!user) return [];
  const data = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
  return data ? JSON.parse(data) : [];
};

export const saveFinanceRecord = (user: User | null, record: Omit<FinanceRecord, 'id' | 'timestamp'>) => {
  if (!user) return;
  const records = getFinanceRecords(user);
  const newRecord: FinanceRecord = {
    ...record,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify([...records, newRecord]));
  return newRecord;
};

export const getFinanceStats = (
  user: User | null, 
  period: 'daily' | 'weekly' | 'monthly' | 'yearly', 
  dateReference: Date = new Date()
) => {
  const records = getFinanceRecords(user);
  
  const filtered = records.filter(record => {
    const recordDate = new Date(record.date);
    const refDate = new Date(dateReference);
    
    // Reset times for accurate comparison
    recordDate.setHours(0,0,0,0);
    refDate.setHours(0,0,0,0);

    if (period === 'daily') {
      return recordDate.getTime() === refDate.getTime();
    }
    if (period === 'weekly') {
      // Calculate start of week (Sunday)
      const day = refDate.getDay();
      const diff = refDate.getDate() - day;
      
      const startOfWeek = new Date(refDate);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0,0,0,0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23,59,59,999);
      
      return recordDate >= startOfWeek && recordDate <= endOfWeek;
    }
    if (period === 'monthly') {
      return recordDate.getMonth() === refDate.getMonth() && recordDate.getFullYear() === refDate.getFullYear();
    }
    if (period === 'yearly') {
      return recordDate.getFullYear() === refDate.getFullYear();
    }
    return false;
  });

  return filtered.reduce((acc, curr) => {
    acc[curr.type] += curr.amount;
    return acc;
  }, { income: 0, expense: 0, savings: 0 });
};