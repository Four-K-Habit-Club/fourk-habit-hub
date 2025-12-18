import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FINANCE_CATEGORIES, TransactionType } from '@/types/finance';
import { saveFinanceRecord } from '../../lib/financeStorage';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ChevronLeft, Save } from 'lucide-react';

export const LogFinance: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense' as TransactionType,
    amount: '',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.amount || !formData.category) return;

    setLoading(true);
    try {
      await saveFinanceRecord(user.id, {
        type: formData.type,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        description: formData.description
      });
      toast.success('Transaction logged successfully');
      navigate('/finance');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/finance')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Log Transaction</h2>
          <p className="text-sm text-muted-foreground">Record income, expense or savings</p>
        </div>
      </div>

      <Card className="p-6 shadow-lg border-t-4 border-t-primary">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>Transaction Type</Label>
            <div className="grid grid-cols-3 gap-3">
              {(['income', 'expense', 'savings'] as TransactionType[]).map((t) => (
                <div
                  key={t}
                  onClick={() => setFormData({ ...formData, type: t, category: '' })}
                  className={`cursor-pointer text-center py-3 px-2 rounded-lg border transition-all duration-200 ${
                    formData.type === t
                      ? t === 'income' ? 'bg-emerald-100 border-emerald-500 text-emerald-800 font-bold'
                      : t === 'expense' ? 'bg-red-100 border-red-500 text-red-800 font-bold'
                      : 'bg-blue-100 border-blue-500 text-blue-800 font-bold'
                      : 'border-muted hover:bg-muted/50'
                  }`}
                >
                  <span className="capitalize text-sm">{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                className="text-lg font-medium"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(v) => setFormData({ ...formData, category: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {FINANCE_CATEGORIES[formData.type].map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Description (Optional)</Label>
            <Input
              id="desc"
              placeholder="e.g. Weekly groceries"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90" 
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <span className="animate-pulse">Saving...</span>
            ) : (
              <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Save Transaction</span>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
};