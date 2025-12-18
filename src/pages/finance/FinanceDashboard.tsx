//src/pages/finance/FinanceDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFinanceStats } from '../../lib/financeStorage';
import { Link } from 'react-router-dom';
import { Plus, Wallet, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';

export const FinanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [stats, setStats] = useState({ income: 0, expense: 0, savings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const data = await getFinanceStats(user.id, period, new Date());
        setStats(data);
      } catch (error) {
        console.error("Failed to load finance stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);
  };

  const netBalance = stats.income - stats.expense;

  if (loading && stats.income === 0 && stats.expense === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Finance Overview</h2>
          <p className="text-muted-foreground">Track your wealth and spending habits</p>
        </div>
        <Link to="/finance/log">
          <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
            <Plus className="w-5 h-5" />
            Log Transaction
          </Button>
        </Link>
      </div>

      <div className="flex justify-center">
        <Tabs defaultValue="monthly" onValueChange={(v) => setPeriod(v as any)} className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Income Card */}
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/30 border-emerald-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="px-2 py-1 rounded-full bg-emerald-100/50 text-emerald-700 text-xs font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Income
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground capitalize">{period} Income</p>
            <h3 className="text-3xl font-bold text-emerald-700 mt-1">{formatCurrency(stats.income)}</h3>
          </div>
        </Card>

        {/* Expenses Card */}
        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100/30 border-red-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div className="px-2 py-1 rounded-full bg-red-100/50 text-red-700 text-xs font-medium flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" /> Expenses
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground capitalize">{period} Expenses</p>
            <h3 className="text-3xl font-bold text-red-700 mt-1">{formatCurrency(stats.expense)}</h3>
          </div>
        </Card>

        {/* Savings Card */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/30 border-blue-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div className="px-2 py-1 rounded-full bg-blue-100/50 text-blue-700 text-xs font-medium">
              Savings
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground capitalize">{period} Savings</p>
            <h3 className="text-3xl font-bold text-blue-700 mt-1">{formatCurrency(stats.savings)}</h3>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card border shadow-sm">
        <h3 className="font-semibold mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded-full"></span>
          Financial Health Summary
        </h3>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Net Balance</span>
              <span className={`font-bold ${netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(netBalance)}
              </span>
            </div>
            {/* Visual Bar for Net Balance vs Income */}
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full ${netBalance >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                style={{ width: `${stats.income > 0 ? Math.min(Math.abs(netBalance / stats.income) * 100, 100) : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Savings Rate</span>
              <span className="font-medium">
                {stats.income > 0 ? Math.round((stats.savings / stats.income) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500"
                style={{ width: `${stats.income > 0 ? Math.min((stats.savings / stats.income) * 100, 100) : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};