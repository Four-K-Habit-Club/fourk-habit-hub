//src/types/finance.ts
export type TransactionType = 'income' | 'expense' | 'savings';

export interface FinanceRecord {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  description?: string;
  timestamp: number;
}

export const FINANCE_CATEGORIES = {
  income: ['Salary', 'Business', 'Freelance', 'Gift', 'Other'],
  expense: ['Food', 'Transport', 'Rent', 'Utilities', 'Shopping', 'Entertainment', 'Health', 'Education', 'Other'],
  savings: ['Emergency Fund', 'Investment', 'Goal', 'General']
};