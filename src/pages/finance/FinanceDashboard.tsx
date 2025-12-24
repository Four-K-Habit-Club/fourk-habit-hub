import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { getFinanceStats } from '../../lib/financeStorage';
import { Link } from 'react-router-dom';
import { Plus, Wallet, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight, Loader2, X, Calendar as CalendarIcon, Tag, BarChart3, List } from 'lucide-react';
import { FinanceRecord } from '@/types/finance';
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const FinanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  
  // State for data
  const [stats, setStats] = useState({ income: 0, expense: 0, savings: 0 });
  const [allPeriodRecords, setAllPeriodRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // State for interaction (which card is clicked)
  const [selectedCategory, setSelectedCategory] = useState<'income' | 'expense' | 'savings' | null>(null);

  // New states for views and filters
  const [viewMode, setViewMode] = useState<'graph' | 'detail'>('detail');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setSelectedCategory(null);
        setCategoryFilter('all');
        setDateRange({ from: undefined, to: undefined });
        setViewMode('detail');
        
        const { stats: newStats, records } = await getFinanceStats(user.id, period, new Date());
        setStats(newStats);
        setAllPeriodRecords(records);
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

  // Compute category breakdown
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    allPeriodRecords
      .filter(r => r.type === selectedCategory)
      .forEach(r => {
        const cat = r.category || 'Uncategorized';
        map.set(cat, (map.get(cat) || 0) + r.amount);
      });
    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [allPeriodRecords, selectedCategory]);

  // Get unique categories for filter dropdown
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    allPeriodRecords
      .filter(r => r.type === selectedCategory)
      .forEach(r => cats.add(r.category || 'Uncategorized'));
    return ['all', ...Array.from(cats).sort()];
  }, [allPeriodRecords, selectedCategory]);

  // Filtered records for detail view
  const filteredRecords = useMemo(() => {
    let records = selectedCategory 
      ? allPeriodRecords.filter(r => r.type === selectedCategory)
      : [];

    if (categoryFilter !== 'all') {
      records = records.filter(r => (r.category || 'Uncategorized') === categoryFilter);
    }

    if (dateRange.from && dateRange.to) {
      records = records.filter(r => {
        const recordDate = new Date(r.date);
        return isWithinInterval(recordDate, { start: startOfDay(dateRange.from!), end: endOfDay(dateRange.to!) });
      });
    }

    // Sort newest first
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allPeriodRecords, selectedCategory, categoryFilter, dateRange]);

  const colors = {
    income: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
    expense: ['#ef4444', '#f87171', '#fca5a5', '#fecaca'],
    savings: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
  };

  const getColor = (index: number, type: string) => {
    const palette = colors[type as keyof typeof colors] || colors.expense;
    return palette[index % palette.length];
  };

  if (loading && stats.income === 0 && stats.expense === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
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

      {/* Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Income Card */}
        <Card 
          onClick={() => setSelectedCategory(selectedCategory === 'income' ? null : 'income')}
          className={`p-6 cursor-pointer transition-all duration-200 ${
            selectedCategory === 'income' 
              ? 'ring-2 ring-emerald-500 ring-offset-2 transform scale-[1.02]' 
              : 'hover:shadow-md hover:-translate-y-1'
          } bg-gradient-to-br from-emerald-50 to-emerald-100/30 border-emerald-100 shadow-sm`}
        >
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
        <Card 
          onClick={() => setSelectedCategory(selectedCategory === 'expense' ? null : 'expense')}
          className={`p-6 cursor-pointer transition-all duration-200 ${
            selectedCategory === 'expense' 
              ? 'ring-2 ring-red-500 ring-offset-2 transform scale-[1.02]' 
              : 'hover:shadow-md hover:-translate-y-1'
          } bg-gradient-to-br from-red-50 to-red-100/30 border-red-100 shadow-sm`}
        >
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
        <Card 
          onClick={() => setSelectedCategory(selectedCategory === 'savings' ? null : 'savings')}
          className={`p-6 cursor-pointer transition-all duration-200 ${
            selectedCategory === 'savings' 
              ? 'ring-2 ring-blue-500 ring-offset-2 transform scale-[1.02]' 
              : 'hover:shadow-md hover:-translate-y-1'
          } bg-gradient-to-br from-blue-50 to-blue-100/30 border-blue-100 shadow-sm`}
        >
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

      {/* Enhanced Detail Section (Graph + Detail with filters) */}
      {selectedCategory && (
        <Card className="p-0 overflow-hidden border animate-in slide-in-from-top-4 duration-300">
          <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            selectedCategory === 'income' ? 'bg-emerald-50/50' : 
            selectedCategory === 'expense' ? 'bg-red-50/50' : 'bg-blue-50/50'
          }`}>
            <div className="flex items-center justify-between w-full sm:w-auto">
              <h3 className="font-semibold capitalize flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                   selectedCategory === 'income' ? 'bg-emerald-500' : 
                   selectedCategory === 'expense' ? 'bg-red-500' : 'bg-blue-500'
                }`} />
                {period} {selectedCategory} Breakdown
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* View Mode Tabs */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'graph' | 'detail')} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-2 max-w-xs">
                <TabsTrigger value="graph" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Graph
                </TabsTrigger>
                <TabsTrigger value="detail" className="flex items-center gap-2">
                  <List className="w-4 h-4" /> Detail
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <TabsContent value="graph" className="p-6 mt-0">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="category" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tickFormatter={(value) => `KES ${value / 1000}k`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Category: ${label}`}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getColor(index, selectedCategory)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                No data available for this period.
              </div>
            )}
          </TabsContent>

          <TabsContent value="detail" className="mt-0">
            {/* Filters Row */}
            <div className="p-4 border-b bg-muted/30 flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Tag className="w-5 h-5 text-muted-foreground" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {availableCategories.filter(c => c !== 'all').map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 flex-1">
                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {dateRange.from && dateRange.to ? (
                        `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range: any) => setDateRange({ from: range?.from, to: range?.to })}
                      numberOfMonths={2}
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
                {(dateRange.from || dateRange.to) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateRange({ from: undefined, to: undefined })}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto">
              {filteredRecords.length > 0 ? (
                <div className="divide-y">
                  {filteredRecords.map((record) => (
                    <div key={record.id} className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2">
                          {record.description || record.category}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(record.date), 'MMM dd, yyyy')}
                          </span>
                          <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded-full">
                            <Tag className="w-3 h-3" />
                            {record.category || 'Uncategorized'}
                          </span>
                        </div>
                      </div>
                      <div className={`font-bold ${
                        record.type === 'income' ? 'text-emerald-600' : 
                        record.type === 'expense' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {record.type === 'expense' ? '-' : '+'}{formatCurrency(record.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No transactions match the selected filters.
                </div>
              )}
            </div>
          </TabsContent>
        </Card>
      )}

      {/* Financial Health Summary */}
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
