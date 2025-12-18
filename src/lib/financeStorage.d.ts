declare module "@/lib/financeStorage" {
  // Minimal inline type defs to satisfy TS resolution when using path aliases in editors
  export interface FinanceRecord {
    id: string;
    type: 'income' | 'expense' | 'savings';
    amount: number;
    category: string;
    date: string;
    description?: string;
    timestamp: number;
  }

  export function getFinanceRecords(user: any): FinanceRecord[];

  export function saveFinanceRecord(user: any, record: Omit<FinanceRecord, 'id' | 'timestamp'>): FinanceRecord;

  export function getFinanceStats(
    user: any,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    dateReference?: Date
  ): { income: number; expense: number; savings: number };
}
