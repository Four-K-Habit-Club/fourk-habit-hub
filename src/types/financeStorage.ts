// src/lib/financeStorage.ts
import { supabase } from '../../src/lib/supabaseClient';
import { FinanceRecord } from '@/types/finance';

// ... (getFinanceRecords and saveFinanceRecord remain the same) ...

export const getFinanceRecords = async (userId: string): Promise<FinanceRecord[]> => {
  if (!userId) return [];
  
  const { data, error } = await supabase
    .from('finance_records')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching finance records:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    ...item,
    timestamp: item.timestamp || (item.created_at ? new Date(item.created_at).getTime() : Date.now())
  })) as FinanceRecord[];
};

export const saveFinanceRecord = async (
  userId: string, 
  record: Omit<FinanceRecord, 'id' | 'user_id' | 'created_at' | 'timestamp'>
) => {
  if (!userId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('finance_records')
    .insert([{ user_id: userId, ...record }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// UPDATED FUNCTION
export const getFinanceStats = async (
  userId: string, 
  period: 'daily' | 'weekly' | 'monthly' | 'yearly', 
  dateReference: Date = new Date()
) => {
  const records = await getFinanceRecords(userId);
  
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
      const day = refDate.getDay(); // 0 (Sun) to 6 (Sat)
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

  const stats = filtered.reduce((acc, curr) => {
    const amount = Number(curr.amount);
    if (curr.type === 'income') acc.income += amount;
    if (curr.type === 'expense') acc.expense += amount;
    if (curr.type === 'savings') acc.savings += amount;
    return acc;
  }, { income: 0, expense: 0, savings: 0 });

  // Return both the aggregated stats and the raw filtered records
  return { stats, records: filtered };
};