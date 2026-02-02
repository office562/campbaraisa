import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Plus, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3
} from 'lucide-react';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EXPENSE_CATEGORIES = [
  'Staff Salaries',
  'Food & Catering',
  'Transportation',
  'Activities & Equipment',
  'Facilities',
  'Insurance',
  'Marketing',
  'Administration',
  'Medical',
  'Other'
];

const COLORS = ['#E85D04', '#F4A261', '#2A9D8F', '#E9C46A', '#264653', '#E76F51', '#8338EC', '#3A86FF', '#FB5607', '#FF006E'];

const Financial = () => {
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: '', amount: '', description: '', date: '', vendor: ''
  });

  const fetchData = async () => {
    try {
      const [summaryRes, expensesRes] = await Promise.all([
        axios.get(`${API_URL}/api/financial/summary`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_URL}/api/expenses`, { headers: { Authorization: `Bearer ${token}` }})
      ]);
      setSummary(summaryRes.data);
      setExpenses(expensesRes.data);
    } catch (error) {
      toast.error('Failed to fetch financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/expenses`, {
        ...newExpense,
        amount: parseFloat(newExpense.amount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Expense added successfully');
      setShowAddExpense(false);
      setNewExpense({ category: '', amount: '', description: '', date: '', vendor: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to add expense');
    }
  };

  // Prepare chart data
  const expenseChartData = summary?.expense_by_category 
    ? Object.entries(summary.expense_by_category).map(([name, value]) => ({ name, value }))
    : [];

  const paymentMethodData = summary?.payment_by_method
    ? Object.entries(summary.payment_by_method).map(([name, value]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1), 
        value 
      }))
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85D04]"></div>
      </div>
    );
  }

  return (
    <div data-testid="financial-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold text-[#2D241E] tracking-tight">
            Financial Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            Track income, expenses, and overall financial health
          </p>
        </div>
        <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
          <DialogTrigger asChild>
            <Button className="btn-camp-primary" data-testid="add-expense-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl">Add Expense</DialogTitle>
              <DialogDescription>Record a new expense</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={newExpense.category}
                  onValueChange={(value) => setNewExpense({...newExpense, category: value})}
                >
                  <SelectTrigger data-testid="expense-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  required
                  data-testid="expense-amount"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  placeholder="What was this expense for?"
                  required
                  data-testid="expense-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                    required
                    data-testid="expense-date"
                  />
                </div>
                <div>
                  <Label>Vendor (Optional)</Label>
                  <Input
                    value={newExpense.vendor}
                    onChange={(e) => setNewExpense({...newExpense, vendor: e.target.value})}
                    placeholder="Vendor name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="btn-camp-primary" data-testid="save-expense-btn">
                  Add Expense
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card className="stat-card" data-testid="stat-invoiced">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Invoiced</p>
            <p className="text-3xl font-bold text-[#2D241E] mt-1">
              ${(summary?.total_invoiced || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="stat-card" data-testid="stat-collected">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-[#2A9D8F]" />
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Collected</p>
            </div>
            <p className="text-3xl font-bold text-[#2A9D8F] mt-1">
              ${(summary?.total_collected || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="stat-card" data-testid="stat-outstanding">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Outstanding</p>
            <p className="text-3xl font-bold text-[#E9C46A] mt-1">
              ${(summary?.total_outstanding || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="stat-card" data-testid="stat-expenses">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-[#E76F51]" />
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Expenses</p>
            </div>
            <p className="text-3xl font-bold text-[#E76F51] mt-1">
              ${(summary?.total_expenses || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="stat-card bg-[#E85D04]/5" data-testid="stat-net">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Net Income</p>
            <p className={`text-3xl font-bold mt-1 ${(summary?.net_income || 0) >= 0 ? 'text-[#2A9D8F]' : 'text-[#E76F51]'}`}>
              ${(summary?.net_income || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Expenses by Category */}
        <Card className="card-camp">
          <CardHeader>
            <CardTitle className="font-heading text-xl flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[#E85D04]" />
              Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={expenseChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {expenseChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No expense data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="card-camp">
          <CardHeader>
            <CardTitle className="font-heading text-xl flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#E85D04]" />
              Collections by Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethodData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentMethodData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#E85D04" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No payment data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses */}
      <Card className="card-camp">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.slice(0, 10).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#E76F51]/10 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-[#E76F51]" />
                    </div>
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {expense.category} • {expense.vendor || 'No vendor'} • {expense.date}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-[#E76F51]">-${expense.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No expenses recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note about QuickBooks */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> QuickBooks integration can be enabled in Settings for automatic expense syncing.
          Currently, expenses are tracked internally within Camp Baraisa's system.
        </p>
      </div>
    </div>
  );
};

export default Financial;
