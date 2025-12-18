declare module '@/lib/financeStorage' {
  type TransactionType = 'income' | 'expense' | 'savings';

  interface FinanceRecord {
    id: string;
    type: TransactionType;
    amount: number;
    category: string;
    date: string; // ISO date string
    description?: string;
    timestamp: number;
  }

  export function getFinanceRecords(user: any): FinanceRecord[];

  export function saveFinanceRecord(
    user: any,
    record: Omit<FinanceRecord, 'id' | 'timestamp'>
  ): FinanceRecord | undefined;

  export function getFinanceStats(
    user: any,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    dateReference?: Date
  ): { income: number; expense: number; savings: number };
}
