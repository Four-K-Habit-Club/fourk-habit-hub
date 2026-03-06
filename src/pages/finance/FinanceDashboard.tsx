// pages/finance/FinanceDashboard.tsx
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
import { 
  Plus, 
  Wallet, 
  TrendingDown, 
  PiggyBank, 
  ArrowUpRight, 
  ArrowDownRight, 
  Loader2, 
  X, 
  Calendar as CalendarIcon, 
  Tag, 
  BarChart3, 
  List, 
  ChevronLeft,
  Download,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { FinanceRecord, FINANCE_CATEGORIES } from '@/types/finance';
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import * as XLSX from 'xlsx';

// Define the 50-30-20 mapping based on FINANCE_CATEGORIES
const BUDGET_MAPPING = {
  Needs: ['Rent', 'Utilities', 'Food', 'Transport', 'Health', 'Education'],
  Wants: ['Shopping', 'Entertainment', 'Other'],
  Dreams: FINANCE_CATEGORIES.savings // All savings categories map to Dreams/Goals
};

export const FinanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'>('monthly');
  const [stats, setStats] = useState({ income: 0, expense: 0, savings: 0 });
  const [allPeriodRecords, setAllPeriodRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<'income' | 'expense' | 'savings' | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'detail'>('detail');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  
  // State for Budget Assessment Interaction
  const [activeBudgetGroup, setActiveBudgetGroup] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setSelectedCategory(null);
        setCategoryFilter('all');
        setDateRange({ from: undefined, to: undefined });
        setActiveBudgetGroup(null);
        
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

  // Logic for 50-30-20 Rule Assessment
  const budgetAssessment = useMemo(() => {
    const needsAmount = allPeriodRecords
      .filter(r => r.type === 'expense' && BUDGET_MAPPING.Needs.includes(r.category))
      .reduce((sum, r) => sum + r.amount, 0);
    
    const wantsAmount = allPeriodRecords
      .filter(r => r.type === 'expense' && BUDGET_MAPPING.Wants.includes(r.category))
      .reduce((sum, r) => sum + r.amount, 0);
    
    const dreamsAmount = allPeriodRecords
      .filter(r => r.type === 'savings')
      .reduce((sum, r) => sum + r.amount, 0);

    const totalBudget = stats.income || (needsAmount + wantsAmount + dreamsAmount);
    
    const data = [
      { name: 'Needs', value: needsAmount, target: 0.50, color: '#0ea5e9' }, // Blue
      { name: 'Wants', value: wantsAmount, target: 0.30, color: '#f43f5e' }, // Rose
      { name: 'Dreams', value: dreamsAmount, target: 0.20, color: '#10b981' }, // Emerald
    ];

    const analysis = data.map(item => {
      const currentPct = totalBudget > 0 ? item.value / totalBudget : 0;
      const isOver = currentPct > item.target;
      const diffPct = Math.max(0, currentPct - item.target);
      const diffAmount = Math.max(0, item.value - (totalBudget * item.target));
      
      return { ...item, currentPct, isOver, diffPct, diffAmount };
    });

    return { data, analysis, totalBudget };
  }, [allPeriodRecords, stats.income]);

  // Records for the clicked pie slice
  const budgetGroupRecords = useMemo(() => {
    if (!activeBudgetGroup) return [];
    return allPeriodRecords.filter(r => {
      if (activeBudgetGroup === 'Dreams') return r.type === 'savings';
      if (activeBudgetGroup === 'Needs') return r.type === 'expense' && BUDGET_MAPPING.Needs.includes(r.category);
      if (activeBudgetGroup === 'Wants') return r.type === 'expense' && BUDGET_MAPPING.Wants.includes(r.category);
      return false;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeBudgetGroup, allPeriodRecords]);

  const exportToExcel = () => {
    const exportData = allPeriodRecords.map(record => ({
      Date: format(new Date(record.date), 'yyyy-MM-dd HH:mm'),
      Type: record.type.charAt(0).toUpperCase() + record.type.slice(1),
      Category: record.category || 'Uncategorized',
      Description: record.description || '-',
      Amount: record.amount,
      Currency: 'KES'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Finance Records");
    XLSX.writeFile(workbook, `Finance_Report_${period}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const netBalance = stats.income - stats.expense;

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    allPeriodRecords
      .filter(r => r.type === selectedCategory)
      .forEach(r => cats.add(r.category || 'Uncategorized'));
    return ['all', ...Array.from(cats).sort()];
  }, [allPeriodRecords, selectedCategory]);

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

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allPeriodRecords, selectedCategory, categoryFilter, dateRange]);

  const graphData = useMemo(() => {
    const groupKey = categoryFilter === 'all' ? 'category' : 'description';
    const map = new Map<string, number>();

    filteredRecords.forEach(r => {
      let label = (r[groupKey as keyof FinanceRecord] as string || '').trim();
      
      if (!label) {
        label = groupKey === 'category' ? 'Uncategorized' : (r.category || 'Unnamed Item');
      }

      map.set(label, (map.get(label) || 0) + r.amount);
    });

    return Array.from(map.entries())
      .map(([label, amount]) => ({ label, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredRecords, categoryFilter]);

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

  const getPeriodLabel = (p: string) => p === 'all' ? 'Till Date' : p;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 px-4 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Finance Overview</h2>
          <p className="text-muted-foreground">Track your wealth and spending habits</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToExcel} className="gap-2">
            <Download className="w-4 h-4" /> Export Excel
          </Button>
          <Link to="/finance/log">
            <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
              <Plus className="w-5 h-5" /> Log Transaction
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex justify-center">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-full max-w-lg">
          <TabsList className="grid w-full grid-cols-5 bg-muted/50 p-1">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
            <TabsTrigger value="all">Till Date</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card onClick={() => setSelectedCategory(selectedCategory === 'income' ? null : 'income')} className={`p-6 cursor-pointer transition-all duration-200 ${selectedCategory === 'income' ? 'ring-2 ring-emerald-500 scale-[1.02]' : 'hover:shadow-md hover:-translate-y-1'} bg-gradient-to-br from-emerald-50 to-emerald-100/30 border-emerald-100`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-600"><Wallet className="w-6 h-6" /></div>
            <div className="px-2 py-1 rounded-full bg-emerald-100/50 text-emerald-700 text-xs font-medium flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> Income</div>
          </div>
          <p className="text-sm font-medium text-muted-foreground capitalize">{getPeriodLabel(period)} Income</p>
          <h3 className="text-3xl font-bold text-emerald-700 mt-1">{formatCurrency(stats.income)}</h3>
        </Card>

        <Card onClick={() => setSelectedCategory(selectedCategory === 'expense' ? null : 'expense')} className={`p-6 cursor-pointer transition-all duration-200 ${selectedCategory === 'expense' ? 'ring-2 ring-red-500 scale-[1.02]' : 'hover:shadow-md hover:-translate-y-1'} bg-gradient-to-br from-red-50 to-red-100/30 border-red-100`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-red-100 text-red-600"><TrendingDown className="w-6 h-6" /></div>
            <div className="px-2 py-1 rounded-full bg-red-100/50 text-red-700 text-xs font-medium flex items-center gap-1"><ArrowDownRight className="w-3 h-3" /> Expenses</div>
          </div>
          <p className="text-sm font-medium text-muted-foreground capitalize">{getPeriodLabel(period)} Expenses</p>
          <h3 className="text-3xl font-bold text-red-700 mt-1">{formatCurrency(stats.expense)}</h3>
        </Card>

        <Card onClick={() => setSelectedCategory(selectedCategory === 'savings' ? null : 'savings')} className={`p-6 cursor-pointer transition-all duration-200 ${selectedCategory === 'savings' ? 'ring-2 ring-blue-500 scale-[1.02]' : 'hover:shadow-md hover:-translate-y-1'} bg-gradient-to-br from-blue-50 to-blue-100/30 border-blue-100`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600"><PiggyBank className="w-6 h-6" /></div>
            <div className="px-2 py-1 rounded-full bg-blue-100/50 text-blue-700 text-xs font-medium">Savings</div>
          </div>
          <p className="text-sm font-medium text-muted-foreground capitalize">{getPeriodLabel(period)} Savings</p>
          <h3 className="text-3xl font-bold text-blue-700 mt-1">{formatCurrency(stats.savings)}</h3>
        </Card>
      </div>

      {/* Drill-down Section (Existing) */}
      {selectedCategory && (
        <Card className="p-0 overflow-hidden border animate-in slide-in-from-top-4 duration-300">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'graph' | 'detail')} className="w-full">
            <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${selectedCategory === 'income' ? 'bg-emerald-50/50' : selectedCategory === 'expense' ? 'bg-red-50/50' : 'bg-blue-50/50'}`}>
              <div className="flex items-center gap-2">
                {categoryFilter !== 'all' && (
                  <Button variant="ghost" size="icon" onClick={() => setCategoryFilter('all')} title="Back to categories">
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                )}
                <h3 className="font-semibold capitalize flex items-center gap-2 text-lg">
                  <span className={`w-2.5 h-2.5 rounded-full ${selectedCategory === 'income' ? 'bg-emerald-500' : selectedCategory === 'expense' ? 'bg-red-500' : 'bg-blue-500'}`} />
                  {categoryFilter === 'all' ? `${getPeriodLabel(period)} ${selectedCategory} Breakdown` : `Items in ${categoryFilter}`}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <TabsList className="grid grid-cols-2 w-48">
                  <TabsTrigger value="graph" className="gap-2"><BarChart3 className="w-4 h-4" /> Graph</TabsTrigger>
                  <TabsTrigger value="detail" className="gap-2"><List className="w-4 h-4" /> Detail</TabsTrigger>
                </TabsList>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}><X className="w-4 h-4" /></Button>
              </div>
            </div>

            <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="All Categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {availableCategories.filter(c => c !== 'all').map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {dateRange.from && dateRange.to ? `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}` : <span>Pick a date range</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar mode="range" selected={{ from: dateRange.from, to: dateRange.to }} onSelect={(range: any) => setDateRange({ from: range?.from, to: range?.to })} numberOfMonths={2} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <TabsContent value="graph" className="m-0 p-6">
              {graphData.length > 0 ? (
                <div className="h-[450px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={graphData} margin={{ top: 20, right: 30, left: 40, bottom: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
                      <XAxis dataKey="label" angle={-45} textAnchor="end" height={100} interval={0} tick={{ fontSize: 11, fill: 'currentColor' }} />
                      <YAxis tickFormatter={(value) => `KSh ${value > 999 ? (value/1000).toFixed(0) + 'k' : value}`} tick={{ fontSize: 11 }} width={60} />
                      <Tooltip 
                        cursor={{fill: 'rgba(0,0,0,0.05)'}}
                        formatter={(value: number) => [formatCurrency(value), categoryFilter === 'all' ? "Category Total" : "Item Total"]}
                      />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={40} onClick={(data) => categoryFilter === 'all' && setCategoryFilter(data.label)}>
                        {graphData.map((entry, index) => <Cell key={`cell-${index}`} fill={getColor(index, selectedCategory!)} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data matches filters.</div>}
            </TabsContent>
            
            <TabsContent value="detail" className="m-0">
              <div className="max-h-[500px] overflow-y-auto divide-y">
                {filteredRecords.map((record) => (
                  <div key={record.id} className="p-4 hover:bg-muted/50 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{record.description || record.category}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-3">
                        <span>{format(new Date(record.date), 'MMM dd, yyyy')}</span>
                        <span className="bg-muted px-1.5 py-0.5 rounded-full">{record.category}</span>
                      </div>
                    </div>
                    <div className={`font-bold ${record.type === 'expense' ? 'text-red-600' : 'text-emerald-600'}`}>
                      {record.type === 'expense' ? '-' : '+'}{formatCurrency(record.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* Financial Health Summary */}
      <Card className="p-6 bg-card border shadow-sm">
        <h3 className="font-semibold mb-6 flex items-center gap-2"><span className="w-1 h-6 bg-primary rounded-full"></span>Financial Health Summary</h3>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Net Balance</span>
              <span className={`font-bold ${netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(netBalance)}</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${netBalance >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${stats.income > 0 ? Math.min(Math.abs(netBalance / stats.income) * 100, 100) : 0}%` }}></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Savings Rate</span>
              <span className="font-medium">{stats.income > 0 ? Math.round((stats.savings / stats.income) * 100) : 0}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${stats.income > 0 ? Math.min((stats.savings / stats.income) * 100, 100) : 0}%` }}></div>
            </div>
          </div>
        </div>
      </Card>

      {/* NEW: Budget Assessment Section */}
      <Card className="p-6 bg-card border shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
            Budget Assessment (50-30-20 Rule)
          </h3>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-sky-500" /> Needs (50%)</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500" /> Wants (30%)</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Dreams (20%)</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Pie Chart */}
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={budgetAssessment.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  onClick={(data) => setActiveBudgetGroup(activeBudgetGroup === data.name ? null : data.name)}
                  style={{ cursor: 'pointer', outline: 'none' }}
                >
                  {budgetAssessment.data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      opacity={activeBudgetGroup && activeBudgetGroup !== entry.name ? 0.4 : 1}
                      stroke={activeBudgetGroup === entry.name ? '#000' : 'none'}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold">{Math.round(((stats.expense + stats.savings) / (stats.income || 1)) * 100)}%</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">of Income</span>
            </div>
          </div>

          {/* Analysis Info */}
          <div className="space-y-4">
            {budgetAssessment.analysis.map((item) => (
              <div key={item.name} className={`p-4 rounded-xl border transition-colors ${activeBudgetGroup === item.name ? 'bg-muted ring-1 ring-primary' : 'bg-muted/30'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold flex items-center gap-2">
                    {item.name} 
                    <span className="text-xs font-normal text-muted-foreground">({Math.round(item.currentPct * 100)}% vs {item.target * 100}%)</span>
                  </span>
                  <span className="font-semibold">{formatCurrency(item.value)}</span>
                </div>
                
                {item.isOver ? (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Over budget by <b>{Math.round(item.diffPct * 100)}%</b> ({formatCurrency(item.diffAmount)})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 p-2 rounded mt-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Within the recommended {item.target * 100}% limit.</span>
                  </div>
                )}
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground italic text-center">Tip: Click a section of the pie chart to view transactions.</p>
          </div>
        </div>

        {/* Click-to-reveal Details */}
        {activeBudgetGroup && (
          <div className="mt-8 border-t pt-6 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium flex items-center gap-2 text-lg">
                Recent <span className="font-bold">{activeBudgetGroup}</span> Transactions
              </h4>
              <Button variant="ghost" size="sm" onClick={() => setActiveBudgetGroup(null)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {budgetGroupRecords.slice(0, 10).map((record) => (
                <div key={record.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/20 border border-transparent hover:border-muted-foreground/20 transition-all">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{record.description || record.category}</span>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(record.date), 'PPP')}</span>
                  </div>
                  <span className="font-mono font-bold text-sm">{formatCurrency(record.amount)}</span>
                </div>
              ))}
              {budgetGroupRecords.length === 0 && (
                <p className="col-span-2 text-center py-8 text-muted-foreground">No records found for this category.</p>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

