import React, { useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '../components/AppSidebar';
import { useFinance } from '../contexts/FinanceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { DollarSign, Plus, Trash2, TrendingUp, TrendingDown, Wallet, Target, Edit, Calendar, Receipt } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { CurvedArches } from '../components/PageHeaderImages';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const {
    incomes,
    expenses,
    totalIncome,
    totalExpenses,
    currentMonthExpenses,
    paidExpenses,
    unpaidExpenses,
    currentBalance,
    savingsGoal,
    totalSavings,
    headerImages,
    updateHeaderImage,
    addIncome,
    updateIncome,
    deleteIncome,
    addExpense,
    updateExpense,
    deleteExpense,
    toggleExpensePaid,
    updateSavingsGoal,
  } = useFinance();

  const { toast } = useToast();

  const [newIncome, setNewIncome] = useState({ name: '', amount: '', type: 'monthly', date: '', savings: '' });
  const [newExpense, setNewExpense] = useState({ name: '', amount: '', type: 'monthly', dueDate: '', isRecurring: true });
  const [editingSavingsGoal, setEditingSavingsGoal] = useState(false);
  const [newSavingsGoal, setNewSavingsGoal] = useState('');
  const [editingIncome, setEditingIncome] = useState<string | null>(null);
  const [editIncomeData, setEditIncomeData] = useState({ name: '', amount: '', type: 'monthly', date: '', savings: '' });
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [editExpenseData, setEditExpenseData] = useState({ name: '', amount: '', type: 'monthly', dueDate: '', isRecurring: true });

  const handleAddIncome = () => {
    if (newIncome.name && newIncome.amount && newIncome.date) {
      const [year, month, day] = newIncome.date.split('-').map(Number);
      const date = new Date(year, month - 1, day, 12, 0, 0);
      
      addIncome({
        name: newIncome.name,
        amount: parseFloat(newIncome.amount),
        type: newIncome.type as 'monthly' | 'weekly' | 'biweekly' | 'yearly',
        date: date,
        savings: parseFloat(newIncome.savings) || 0,
      });
      setNewIncome({ name: '', amount: '', type: 'monthly', date: '', savings: '' });
      toast({
        title: "Income added! 💰",
        description: "Your income source has been added.",
      });
    }
  };

  const handleAddExpense = () => {
    if (newExpense.name && newExpense.amount && newExpense.dueDate) {
      const [year, month, day] = newExpense.dueDate.split('-').map(Number);
      const dueDate = new Date(year, month - 1, day, 12, 0, 0);
      
      addExpense({
        name: newExpense.name,
        amount: parseFloat(newExpense.amount),
        type: newExpense.type as 'monthly' | 'weekly' | 'biweekly' | 'yearly',
        dueDate: dueDate,
        isRecurring: newExpense.isRecurring,
      });
      setNewExpense({ name: '', amount: '', type: 'monthly', dueDate: '', isRecurring: true });
      toast({
        title: "Expense added! 📊",
        description: "Your expense has been added.",
      });
    }
  };

  const handleUpdateSavingsGoal = () => {
    if (newSavingsGoal) {
      updateSavingsGoal(parseFloat(newSavingsGoal));
      setNewSavingsGoal('');
      setEditingSavingsGoal(false);
      toast({
        title: "Savings goal updated! 🎯",
        description: "Your savings goal has been updated.",
      });
    }
  };

  const handleEditIncome = (incomeId: string) => {
    const income = incomes.find(i => i.id === incomeId);
    if (income) {
      const date = new Date(income.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      setEditIncomeData({
        name: income.name,
        amount: income.amount.toString(),
        type: income.type,
        date: `${year}-${month}-${day}`,
        savings: income.savings.toString(),
      });
      setEditingIncome(incomeId);
    }
  };

  const handleSaveIncome = () => {
    if (editingIncome) {
      const [year, month, day] = editIncomeData.date.split('-').map(Number);
      const date = new Date(year, month - 1, day, 12, 0, 0);
      
      updateIncome(editingIncome, {
        name: editIncomeData.name,
        amount: parseFloat(editIncomeData.amount),
        type: editIncomeData.type as 'monthly' | 'weekly' | 'biweekly' | 'yearly',
        date: date,
        savings: parseFloat(editIncomeData.savings) || 0,
      });
      setEditingIncome(null);
      toast({
        title: "Income updated! ✓",
        description: "Your income has been updated.",
      });
    }
  };

  const handleEditExpense = (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (expense) {
      const date = new Date(expense.dueDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      setEditExpenseData({
        name: expense.name,
        amount: expense.amount.toString(),
        type: expense.type,
        dueDate: `${year}-${month}-${day}`,
        isRecurring: expense.isRecurring ?? true,
      });
      setEditingExpense(expenseId);
    }
  };

  const handleSaveExpense = () => {
    if (editingExpense) {
      const [year, month, day] = editExpenseData.dueDate.split('-').map(Number);
      const dueDate = new Date(year, month - 1, day, 12, 0, 0);
      
      updateExpense(editingExpense, {
        name: editExpenseData.name,
        amount: parseFloat(editExpenseData.amount),
        type: editExpenseData.type as 'monthly' | 'weekly' | 'biweekly' | 'yearly',
        dueDate: dueDate,        isRecurring: editExpenseData.isRecurring,      });
      setEditingExpense(null);
      toast({
        title: "Expense updated! ✓",
        description: "Your expense has been updated.",
      });
    }
  };

  const handleToggleExpensePaid = (expense: typeof expenses[0]) => {
    // Show appropriate toast based on action
    if (!expense.isPaid) {
      // Marking as paid
      if (expense.isRecurring) {
        const currentDueDate = new Date(expense.dueDate);
        const nextDueDate = new Date(currentDueDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        if (nextDueDate.getDate() !== currentDueDate.getDate()) {
          nextDueDate.setDate(0);
        }
        toast({
          title: "Expense paid! ✓",
          description: `Next due: ${format(nextDueDate, 'MMM d, yyyy')}`,
        });
      } else {
        toast({
          title: "Expense paid! ✓",
          description: "One-time expense marked as complete.",
        });
      }
    } else {
      // Unmarking as paid (accident)
      toast({
        title: "Expense unmarked",
        description: "Amount restored to balance.",
      });
    }
    
    toggleExpensePaid(expense.id);
  };

  const isOverdue = (dueDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const savingsProgress = savingsGoal > 0 ? (totalSavings / savingsGoal) * 100 : 0;

  const expenseData = expenses.map(exp => ({
    name: exp.name,
    value: exp.amount,
  }));

  const COLORS = ['#f4c2c2', '#d4c4b0', '#f5e6d3', '#e8d5c4', '#f0e5d8', '#fad4d8', '#e5c9c1'];

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const currentMonthIncome = incomes
    .filter(income => {
      const incomeDate = new Date(income.date);
      return incomeDate >= monthStart && incomeDate <= monthEnd;
    })
    .reduce((sum, income) => sum + income.amount, 0);

  const monthlyData = [
    { month: format(today, 'MMM'), income: currentMonthIncome, expenses: currentMonthExpenses },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-coquette-brown-50 via-coquette-pink-50 to-white">
        <AppSidebar />
        <SidebarInset className="flex-1 w-full min-w-0">
          <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-coquette-brown-200 bg-white/80 backdrop-blur-sm px-6 py-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2 flex-1">
              <DollarSign className="h-6 w-6 text-coquette-pink-400" />
              <h1 className="text-2xl font-bold text-coquette-brown-600">Finance</h1>
            </div>
            <div className="flex gap-2">
              <Link to="/finance/budget">
                <Button variant="outline" size="sm" className="border-coquette-brown-200 text-coquette-brown-600 hover:bg-coquette-pink-100">
                  Budget Planner
                </Button>
              </Link>
              <Link to="/finance/history">
                <Button variant="outline" size="sm" className="border-coquette-brown-200 text-coquette-brown-600 hover:bg-coquette-pink-100">
                  <Receipt className="h-4 w-4 mr-2" />
                  Payment History
                </Button>
              </Link>
            </div>
          </header>

           {/* Curved Image Arches */}
           <CurvedArches
             images={headerImages}
             onUpload={async (index, image) => {
               await updateHeaderImage(index, image);
               toast({
                 title: "Image uploaded! 🎨",
                 description: "Your decorative arch has been updated.",
               });
             }}
             onRemove={async (index) => {
               await updateHeaderImage(index, '');
               toast({
                 title: "Image removed",
                 description: "Arch image has been cleared.",
               });
             }}
           />

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Financial Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="border-coquette-brown-200 bg-gradient-to-br from-white to-coquette-pink-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-coquette-brown-600 text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Total Income
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-coquette-brown-600">${totalIncome.toFixed(2)}</p>
                    <p className="text-xs text-coquette-brown-500 mt-1">Monthly</p>
                  </CardContent>
                </Card>

                <Card className="border-coquette-brown-200 bg-gradient-to-br from-white to-coquette-brown-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-coquette-brown-600 text-sm flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Remaining Expenses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-coquette-brown-600">${unpaidExpenses.toFixed(2)}</p>
                    <p className="text-xs text-coquette-brown-500 mt-1">Left to pay this month</p>
                  </CardContent>
                </Card>

                <Card className="border-coquette-brown-200 bg-gradient-to-br from-white to-green-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-coquette-brown-600 text-sm flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-green-500" />
                      Paid This Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">${paidExpenses.toFixed(2)}</p>
                    <p className="text-xs text-coquette-brown-500 mt-1">of ${currentMonthExpenses.toFixed(2)} total</p>
                  </CardContent>
                </Card>

                <Card className="border-coquette-brown-200 bg-gradient-to-br from-white to-coquette-pink-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-coquette-brown-600 text-sm flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Current Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-coquette-brown-600">${currentBalance.toFixed(2)}</p>
                    <p className="text-xs text-coquette-brown-500 mt-1">Available</p>
                  </CardContent>
                </Card>

                <Card className="border-coquette-brown-200 bg-gradient-to-br from-white to-coquette-brown-100 cursor-pointer hover:shadow-lg transition-all">
                  <CardHeader>
                    <CardTitle className="text-coquette-brown-600 text-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Savings Goal
                      </div>
                      <Dialog open={editingSavingsGoal} onOpenChange={setEditingSavingsGoal}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-coquette-brown-200"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="border-coquette-brown-200">
                          <DialogHeader>
                            <DialogTitle className="text-coquette-brown-600">Update Savings Goal</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-coquette-brown-600">New Savings Goal</Label>
                              <Input
                                type="number"
                                value={newSavingsGoal}
                                onChange={(e) => setNewSavingsGoal(e.target.value)}
                                placeholder={`Current: $${savingsGoal.toFixed(2)}`}
                                className="border-coquette-brown-200"
                              />
                            </div>
                            <Button 
                              onClick={handleUpdateSavingsGoal} 
                              className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
                            >
                              Update Goal
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-coquette-brown-600">${totalSavings.toFixed(2)}</p>
                    <Progress value={savingsProgress} className="h-2 mt-2" />
                    <p className="text-xs text-coquette-brown-500 mt-1">
                      {savingsProgress.toFixed(0)}% of ${savingsGoal.toFixed(0)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-coquette-brown-600">Income vs Expenses (This Month)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f5e6d3" />
                        <XAxis dataKey="month" stroke="#9c7c5f" />
                        <YAxis stroke="#9c7c5f" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #d4c4b0',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="income" fill="#d4c4b0" radius={[8, 8, 0, 0]} name="Income" />
                        <Bar dataKey="expenses" fill="#f4c2c2" radius={[8, 8, 0, 0]} name="Expenses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-coquette-brown-600">Expense Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col lg:flex-row items-center gap-4">
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={expenseData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {expenseData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #d4c4b0',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Legend */}
                      <div className="w-full lg:w-auto max-h-[200px] overflow-y-auto">
                        <div className="grid grid-cols-1 gap-1.5 text-sm">
                          {expenseData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span className="text-coquette-brown-600 truncate max-w-[120px]">{entry.name}</span>
                              <span className="text-coquette-brown-500 font-medium ml-auto">${entry.value.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Income Sources */}
              <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-coquette-brown-600">Income Sources</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Income
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-coquette-brown-200">
                      <DialogHeader>
                        <DialogTitle className="text-coquette-brown-600">Add Income Source</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-coquette-brown-600">Income Name</Label>
                          <Input
                            value={newIncome.name}
                            onChange={(e) => setNewIncome({ ...newIncome, name: e.target.value })}
                            placeholder="e.g., Salary, Freelance"
                            className="border-coquette-brown-200"
                          />
                        </div>
                        <div>
                          <Label className="text-coquette-brown-600">Amount</Label>
                          <Input
                            type="number"
                            value={newIncome.amount}
                            onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                            placeholder="0.00"
                            className="border-coquette-brown-200"
                          />
                        </div>
                        <div>
                          <Label className="text-coquette-brown-600">Income Type</Label>
                          <Select
                            value={newIncome.type}
                            onValueChange={(value) => setNewIncome({ ...newIncome, type: value })}
                          >
                            <SelectTrigger className="border-coquette-brown-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Biweekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-coquette-brown-600">Date</Label>
                          <Input
                            type="date"
                            value={newIncome.date}
                            onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
                            className="border-coquette-brown-200"
                          />
                        </div>
                        <div>
                          <Label className="text-coquette-brown-600">Savings from this income</Label>
                          <Input
                            type="number"
                            value={newIncome.savings}
                            onChange={(e) => setNewIncome({ ...newIncome, savings: e.target.value })}
                            placeholder="0.00"
                            className="border-coquette-brown-200"
                          />
                        </div>
                        <Button onClick={handleAddIncome} className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                          Add Income
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {incomes.map(income => {
                      const date = new Date(income.date);
                      return (
                        <Card key={income.id} className="border-coquette-brown-200 bg-gradient-to-br from-coquette-pink-50 to-white">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-coquette-brown-600 mb-2">{income.name}</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm text-coquette-brown-500">
                                  <div>
                                    <span className="font-medium">Amount:</span> ${income.amount.toFixed(2)}
                                  </div>
                                  <div>
                                    <span className="font-medium">Type:</span> {income.type}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{format(date, 'MMM d, yyyy')}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Savings:</span> ${income.savings.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Dialog open={editingIncome === income.id} onOpenChange={(open) => !open && setEditingIncome(null)}>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditIncome(income.id)}
                                      className="text-coquette-brown-500 hover:bg-coquette-brown-100"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="border-coquette-brown-200">
                                    <DialogHeader>
                                      <DialogTitle className="text-coquette-brown-600">Edit Income</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label className="text-coquette-brown-600">Income Name</Label>
                                        <Input
                                          value={editIncomeData.name}
                                          onChange={(e) => setEditIncomeData({ ...editIncomeData, name: e.target.value })}
                                          className="border-coquette-brown-200"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-coquette-brown-600">Amount</Label>
                                        <Input
                                          type="number"
                                          value={editIncomeData.amount}
                                          onChange={(e) => setEditIncomeData({ ...editIncomeData, amount: e.target.value })}
                                          className="border-coquette-brown-200"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-coquette-brown-600">Income Type</Label>
                                        <Select
                                          value={editIncomeData.type}
                                          onValueChange={(value) => setEditIncomeData({ ...editIncomeData, type: value })}
                                        >
                                          <SelectTrigger className="border-coquette-brown-200">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="biweekly">Biweekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="yearly">Yearly</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label className="text-coquette-brown-600">Date</Label>
                                        <Input
                                          type="date"
                                          value={editIncomeData.date}
                                          onChange={(e) => setEditIncomeData({ ...editIncomeData, date: e.target.value })}
                                          className="border-coquette-brown-200"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-coquette-brown-600">Savings from this income</Label>
                                        <Input
                                          type="number"
                                          value={editIncomeData.savings}
                                          onChange={(e) => setEditIncomeData({ ...editIncomeData, savings: e.target.value })}
                                          className="border-coquette-brown-200"
                                        />
                                      </div>
                                      <Button onClick={handleSaveIncome} className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                                        Save Changes
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteIncome(income.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Expenses */}
              <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-coquette-brown-600">Expenses</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Expense
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-coquette-brown-200">
                      <DialogHeader>
                        <DialogTitle className="text-coquette-brown-600">Add Expense</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-coquette-brown-600">Expense Name</Label>
                          <Input
                            value={newExpense.name}
                            onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                            placeholder="e.g., Rent, Groceries"
                            className="border-coquette-brown-200"
                          />
                        </div>
                        <div>
                          <Label className="text-coquette-brown-600">Amount</Label>
                          <Input
                            type="number"
                            value={newExpense.amount}
                            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                            placeholder="0.00"
                            className="border-coquette-brown-200"
                          />
                        </div>
                        <div>
                          <Label className="text-coquette-brown-600">Type</Label>
                          <Select
                            value={newExpense.type}
                            onValueChange={(value) => setNewExpense({ ...newExpense, type: value })}
                          >
                            <SelectTrigger className="border-coquette-brown-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Biweekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-coquette-brown-600">Due Date</Label>
                          <Input
                            type="date"
                            value={newExpense.dueDate}
                            onChange={(e) => setNewExpense({ ...newExpense, dueDate: e.target.value })}
                            className="border-coquette-brown-200"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="recurring"
                            checked={newExpense.isRecurring}
                            onCheckedChange={(checked) => setNewExpense({ ...newExpense, isRecurring: checked as boolean })}
                            className="border-coquette-brown-300"
                          />
                          <Label htmlFor="recurring" className="text-coquette-brown-600 cursor-pointer">
                            Recurring expense (auto-reschedules when paid)
                          </Label>
                        </div>
                        <Button onClick={handleAddExpense} className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                          Add Expense
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {expenses.map(expense => {
                      const overdue = isOverdue(expense.dueDate);
                      const daysUntil = getDaysUntilDue(expense.dueDate);
                      const dueDate = new Date(expense.dueDate);
                      
                      return (
                        <Card 
                          key={expense.id} 
                          className={`border-2 transition-all ${
                            expense.isPaid
                              ? 'border-coquette-brown-200 bg-gray-100'
                              : overdue 
                              ? 'border-red-400 bg-red-50' 
                              : 'border-coquette-brown-200 bg-gradient-to-br from-coquette-brown-50 to-white'
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <Checkbox
                                  checked={expense.isPaid}
                                  onCheckedChange={() => handleToggleExpensePaid(expense)}
                                  className="mt-1 border-coquette-brown-300"
                                />
                                <div className="flex-1">
                                  <h4 className={`font-semibold mb-2 ${
                                    expense.isPaid 
                                      ? 'text-gray-500 line-through' 
                                      : overdue 
                                      ? 'text-red-600' 
                                      : 'text-coquette-brown-600'
                                  }`}>
                                    {expense.name}
                                    {overdue && !expense.isPaid && <span className="ml-2 text-xs font-bold">OVERDUE</span>}
                                    {expense.isPaid && <span className="ml-2 text-xs font-bold text-green-600">PAID</span>}
                                  </h4>
                                  <div className="grid grid-cols-2 gap-2 text-sm text-coquette-brown-500">
                                    <div>
                                      <span className="font-medium">Amount:</span> ${expense.amount.toFixed(2)}
                                    </div>
                                    <div>
                                      <span className="font-medium">Type:</span> {expense.type}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      <span className={overdue && !expense.isPaid ? 'text-red-600 font-semibold' : ''}>
                                        {format(dueDate, 'MMM d, yyyy')}
                                      </span>
                                    </div>
                                    {!overdue && !expense.isPaid && daysUntil >= 0 && (
                                      <div>
                                        <span className="font-medium">Due in:</span> {daysUntil} days
                                      </div>
                                    )}
                                    {expense.isPaid && expense.isRecurring && expense.nextDueDate && (
                                      <div className="col-span-2 text-green-600 font-medium">
                                        Next due: {format(new Date(expense.nextDueDate), 'MMM d, yyyy')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Dialog open={editingExpense === expense.id} onOpenChange={(open) => !open && setEditingExpense(null)}>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditExpense(expense.id)}
                                      className="text-coquette-brown-500 hover:bg-coquette-brown-100"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="border-coquette-brown-200">
                                    <DialogHeader>
                                      <DialogTitle className="text-coquette-brown-600">Edit Expense</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label className="text-coquette-brown-600">Expense Name</Label>
                                        <Input
                                          value={editExpenseData.name}
                                          onChange={(e) => setEditExpenseData({ ...editExpenseData, name: e.target.value })}
                                          className="border-coquette-brown-200"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-coquette-brown-600">Amount</Label>
                                        <Input
                                          type="number"
                                          value={editExpenseData.amount}
                                          onChange={(e) => setEditExpenseData({ ...editExpenseData, amount: e.target.value })}
                                          className="border-coquette-brown-200"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-coquette-brown-600">Type</Label>
                                        <Select
                                          value={editExpenseData.type}
                                          onValueChange={(value) => setEditExpenseData({ ...editExpenseData, type: value })}
                                        >
                                          <SelectTrigger className="border-coquette-brown-200">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="biweekly">Biweekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="yearly">Yearly</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label className="text-coquette-brown-600">Due Date</Label>
                                        <Input
                                          type="date"
                                          value={editExpenseData.dueDate}
                                          onChange={(e) => setEditExpenseData({ ...editExpenseData, dueDate: e.target.value })}
                                          className="border-coquette-brown-200"
                                        />
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id="edit-recurring"
                                          checked={editExpenseData.isRecurring}
                                          onCheckedChange={(checked) => setEditExpenseData({ ...editExpenseData, isRecurring: checked as boolean })}
                                          className="border-coquette-brown-300"
                                        />
                                        <Label htmlFor="edit-recurring" className="text-coquette-brown-600 cursor-pointer">
                                          Recurring expense (auto-reschedules when paid)
                                        </Label>
                                      </div>
                                      <Button onClick={handleSaveExpense} className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                                        Save Changes
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteExpense(expense.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;