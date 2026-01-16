import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '../components/AppSidebar';
import { useBudget, TransactionCategory } from '../contexts/BudgetContext';
import { useFinance } from '../contexts/FinanceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { 
  DollarSign, Plus, Trash2, Edit, Upload, PiggyBank, 
  Home, ShoppingBag, Sparkles, AlertTriangle, CheckCircle2,
  ArrowUpCircle, ArrowDownCircle, FileSpreadsheet, Link2
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const categoryIcons = {
  needs: Home,
  wants: ShoppingBag,
  savings: PiggyBank,
  uncategorized: AlertTriangle,
};

const categoryColors = {
  needs: '#f4c2c2',
  wants: '#d4c4b0',
  savings: '#b8d4b8',
  uncategorized: '#e0e0e0',
};

const Budget = () => {
  const {
    transactions,
    monthlyIncome,
    budgetRule,
    needsSpent,
    wantsSpent,
    savingsAmount,
    needsBudget,
    wantsBudget,
    savingsBudget,
    addTransaction,
    deleteTransaction,
    categorizeTransaction,
    setMonthlyIncome,
    setBudgetRule,
    importTransactions,
    getCurrentMonthTransactions,
  } = useBudget();

  // Get Finance tracker data
  const { 
    incomes: financeIncomes, 
    expenses: financeExpenses, 
    totalIncome: financeTotalIncome,
    currentMonthExpenses: financeCurrentMonthExpenses 
  } = useFinance();

  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [incomeInput, setIncomeInput] = useState(monthlyIncome.toString());
  
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category: 'uncategorized' as TransactionCategory,
    isExpense: true,
  });

  const [importText, setImportText] = useState('');
  const [editingRule, setEditingRule] = useState(false);
  const [newRule, setNewRule] = useState(budgetRule);

  const currentMonthTransactions = getCurrentMonthTransactions();
  const uncategorizedTransactions = currentMonthTransactions.filter(t => t.category === 'uncategorized');

  const handleAddTransaction = () => {
    if (newTransaction.description && newTransaction.amount) {
      addTransaction({
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        date: new Date(newTransaction.date),
        category: newTransaction.category,
        isExpense: newTransaction.isExpense,
        source: 'manual',
      });
      setNewTransaction({
        description: '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        category: 'uncategorized',
        isExpense: true,
      });
      setIsAddDialogOpen(false);
      toast({
        title: "Transaction added! 💰",
        description: "Your transaction has been recorded.",
      });
    }
  };

  const handleImportTransactions = () => {
    try {
      const lines = importText.trim().split('\n');
      const newTransactions = lines.map(line => {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 3) {
          return {
            description: parts[0],
            amount: Math.abs(parseFloat(parts[1])),
            date: new Date(parts[2]),
            category: 'uncategorized' as TransactionCategory,
            isExpense: parseFloat(parts[1]) < 0 || parts[1].startsWith('-'),
            source: 'imported',
          };
        }
        return null;
      }).filter((t): t is NonNullable<typeof t> => t !== null);

      if (newTransactions.length > 0) {
        importTransactions(newTransactions);
        setImportText('');
        setIsImportDialogOpen(false);
        toast({
          title: `Imported ${newTransactions.length} transactions! 📊`,
          description: "Review and categorize them below.",
        });
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Please check your CSV format.",
        variant: "destructive",
      });
    }
  };

  // Sync Finance expenses to Budget
  const handleSyncFromFinance = () => {
    // Get current month's expenses from Finance
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter finance expenses for current month
    const currentMonthFinanceExpenses = financeExpenses.filter(expense => {
      const dueDate = new Date(expense.dueDate);
      return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
    });

    // Get existing transaction descriptions to avoid duplicates
    const existingDescriptions = new Set(
      getCurrentMonthTransactions()
        .filter(t => t.source === 'finance')
        .map(t => t.description.toLowerCase())
    );

    const newTransactions = currentMonthFinanceExpenses
      .filter(expense => !existingDescriptions.has(expense.name.toLowerCase()))
      .map(expense => ({
        description: expense.name,
        amount: expense.amount,
        date: new Date(expense.dueDate),
        category: 'uncategorized' as TransactionCategory,
        isExpense: true,
        source: 'finance',
      }));

    if (newTransactions.length > 0) {
      importTransactions(newTransactions);
      toast({
        title: `Synced ${newTransactions.length} expenses! 🔗`,
        description: "Categorize them as Needs or Wants below.",
      });
    } else {
      toast({
        title: "Already in sync!",
        description: "All Finance expenses are already in your budget.",
      });
    }
    setIsSyncDialogOpen(false);
  };

  // Auto-set income from Finance if budget income is 0
  useEffect(() => {
    if (monthlyIncome === 0 && financeTotalIncome > 0) {
      setIncomeInput(financeTotalIncome.toFixed(2));
    }
  }, [financeTotalIncome, monthlyIncome]);

  const handleSetIncome = () => {
    const income = parseFloat(incomeInput);
    if (!isNaN(income) && income > 0) {
      setMonthlyIncome(income);
      setIsIncomeDialogOpen(false);
      toast({
        title: "Income updated! 💵",
        description: `Monthly income set to $${income.toFixed(2)}`,
      });
    }
  };

  const handleSaveRule = () => {
    if (newRule.needs + newRule.wants + newRule.savings === 100) {
      setBudgetRule(newRule);
      setEditingRule(false);
      toast({
        title: "Budget rule updated! ✓",
        description: `${newRule.needs}/${newRule.wants}/${newRule.savings} rule applied.`,
      });
    } else {
      toast({
        title: "Invalid rule",
        description: "Percentages must add up to 100%.",
        variant: "destructive",
      });
    }
  };

  const pieData = [
    { name: 'Needs', value: needsSpent, budget: needsBudget, color: categoryColors.needs },
    { name: 'Wants', value: wantsSpent, budget: wantsBudget, color: categoryColors.wants },
    { name: 'Savings', value: savingsAmount, budget: savingsBudget, color: categoryColors.savings },
  ];

  const totalSpent = needsSpent + wantsSpent;
  const remainingBudget = monthlyIncome - totalSpent - savingsAmount;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-coquette-brown-50 via-coquette-pink-50 to-white">
        <AppSidebar />
        <SidebarInset className="flex-1 w-full min-w-0">
          <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-coquette-brown-200 bg-white/80 backdrop-blur-sm px-6 py-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2 flex-1">
              <PiggyBank className="h-6 w-6 text-coquette-pink-400" />
              <h1 className="text-2xl font-bold text-coquette-brown-600">Budget Planner</h1>
            </div>
            <div className="flex gap-2">
              <Dialog open={isIncomeDialogOpen} onOpenChange={setIsIncomeDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-coquette-brown-200 text-coquette-brown-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Set Income
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-coquette-brown-600">Set Monthly Income</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Monthly Take-Home Income</Label>
                      <Input
                        type="number"
                        value={incomeInput}
                        onChange={(e) => setIncomeInput(e.target.value)}
                        placeholder="0.00"
                        className="border-coquette-brown-200"
                      />
                      <p className="text-xs text-coquette-brown-400 mt-1">
                        Enter your total monthly income after taxes.
                      </p>
                    </div>
                    <Button onClick={handleSetIncome} className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                      Save Income
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-coquette-brown-200 text-coquette-brown-600">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-coquette-brown-600">Import Transactions</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Paste CSV Data</Label>
                      <Textarea
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        placeholder="Description, Amount, Date&#10;Grocery Store, -85.50, 2026-01-15&#10;Netflix, -15.99, 2026-01-10"
                        rows={8}
                        className="border-coquette-brown-200 font-mono text-sm"
                      />
                      <p className="text-xs text-coquette-brown-400 mt-1">
                        Format: Description, Amount (negative for expenses), Date (YYYY-MM-DD)
                      </p>
                    </div>
                    <Button onClick={handleImportTransactions} className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Import Transactions
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-coquette-brown-200 text-coquette-brown-600">
                    <Link2 className="h-4 w-4 mr-2" />
                    Sync Finance
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-coquette-brown-600">Sync from Finance Tracker</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="bg-coquette-pink-50 p-4 rounded-lg border border-coquette-brown-200">
                      <p className="text-sm text-coquette-brown-600 mb-2 font-medium">Finance Tracker Summary</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-coquette-brown-400">Total Monthly Income:</p>
                          <p className="font-semibold text-green-600">${financeTotalIncome.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-coquette-brown-400">Monthly Expenses:</p>
                          <p className="font-semibold text-red-500">${financeCurrentMonthExpenses.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-coquette-brown-400">Income Sources:</p>
                          <p className="font-semibold">{financeIncomes.length}</p>
                        </div>
                        <div>
                          <p className="text-coquette-brown-400">Expense Items:</p>
                          <p className="font-semibold">{financeExpenses.length}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-coquette-brown-500">
                      This will import your current month's expenses from the Finance Tracker as uncategorized transactions. 
                      You can then categorize them as Needs or Wants for your 50/30/20 budget breakdown.
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          setMonthlyIncome(financeTotalIncome);
                          toast({
                            title: "Income synced! 💵",
                            description: `Monthly income set to $${financeTotalIncome.toFixed(2)} from Finance Tracker.`,
                          });
                        }}
                        variant="outline"
                        className="flex-1 border-coquette-brown-200 text-coquette-brown-600"
                        disabled={financeTotalIncome === 0}
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Sync Income
                      </Button>
                      <Button 
                        onClick={handleSyncFromFinance} 
                        className="flex-1 bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
                        disabled={financeExpenses.length === 0}
                      >
                        <Link2 className="h-4 w-4 mr-2" />
                        Sync Expenses
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-coquette-brown-600">Add Transaction</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={newTransaction.description}
                        onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                        placeholder="e.g., Grocery shopping"
                        className="border-coquette-brown-200"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          value={newTransaction.amount}
                          onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                          placeholder="0.00"
                          className="border-coquette-brown-200"
                        />
                      </div>
                      <div>
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={newTransaction.date}
                          onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                          className="border-coquette-brown-200"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={newTransaction.isExpense ? 'expense' : 'income'}
                          onValueChange={(value) => setNewTransaction({ ...newTransaction, isExpense: value === 'expense' })}
                        >
                          <SelectTrigger className="border-coquette-brown-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="expense">Expense</SelectItem>
                            <SelectItem value="income">Income/Savings</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select
                          value={newTransaction.category}
                          onValueChange={(value: TransactionCategory) => setNewTransaction({ ...newTransaction, category: value })}
                        >
                          <SelectTrigger className="border-coquette-brown-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="needs">Needs (50%)</SelectItem>
                            <SelectItem value="wants">Wants (30%)</SelectItem>
                            <SelectItem value="savings">Savings (20%)</SelectItem>
                            <SelectItem value="uncategorized">Uncategorized</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleAddTransaction} className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                      Add Transaction
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Income Warning */}
              {monthlyIncome === 0 && (
                <Card className="border-yellow-300 bg-yellow-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                      <div>
                        <p className="font-semibold text-yellow-800">Set your monthly income</p>
                        <p className="text-sm text-yellow-700">
                          Click "Set Income" above to enter your monthly take-home pay and see your 50/30/20 budget breakdown.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Budget Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-coquette-brown-200 bg-gradient-to-br from-white to-coquette-pink-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-coquette-brown-600 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Monthly Income
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-coquette-brown-600">${monthlyIncome.toFixed(2)}</p>
                    <p className="text-xs text-coquette-brown-500">Take-home pay</p>
                  </CardContent>
                </Card>

                <Card className="border-coquette-brown-200" style={{ background: `linear-gradient(to br, white, ${categoryColors.needs}40)` }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-coquette-brown-600 flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Needs ({budgetRule.needs}%)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-coquette-brown-600">${needsSpent.toFixed(2)}</p>
                    <Progress 
                      value={needsBudget > 0 ? (needsSpent / needsBudget) * 100 : 0} 
                      className="h-2 mt-2"
                    />
                    <p className="text-xs text-coquette-brown-500 mt-1">
                      of ${needsBudget.toFixed(2)} budget
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-coquette-brown-200" style={{ background: `linear-gradient(to br, white, ${categoryColors.wants}40)` }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-coquette-brown-600 flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      Wants ({budgetRule.wants}%)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-coquette-brown-600">${wantsSpent.toFixed(2)}</p>
                    <Progress 
                      value={wantsBudget > 0 ? (wantsSpent / wantsBudget) * 100 : 0} 
                      className="h-2 mt-2"
                    />
                    <p className="text-xs text-coquette-brown-500 mt-1">
                      of ${wantsBudget.toFixed(2)} budget
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-coquette-brown-200" style={{ background: `linear-gradient(to br, white, ${categoryColors.savings}40)` }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-coquette-brown-600 flex items-center gap-2">
                      <PiggyBank className="h-4 w-4" />
                      Savings ({budgetRule.savings}%)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-coquette-brown-600">${savingsAmount.toFixed(2)}</p>
                    <Progress 
                      value={savingsBudget > 0 ? (savingsAmount / savingsBudget) * 100 : 0} 
                      className="h-2 mt-2"
                    />
                    <p className="text-xs text-coquette-brown-500 mt-1">
                      of ${savingsBudget.toFixed(2)} goal
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Budget Rule Editor */}
              <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-coquette-brown-600 flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      50/30/20 Budget Rule
                    </CardTitle>
                    {!editingRule ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingRule(true)}
                        className="border-coquette-brown-200 text-coquette-brown-600"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Customize
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewRule(budgetRule);
                            setEditingRule(false);
                          }}
                          className="border-coquette-brown-200"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveRule}
                          className="bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
                        >
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: `${categoryColors.needs}40` }}>
                      <Home className="h-8 w-8 mx-auto mb-2 text-coquette-brown-600" />
                      <h3 className="font-semibold text-coquette-brown-600">Needs</h3>
                      {editingRule ? (
                        <Input
                          type="number"
                          value={newRule.needs}
                          onChange={(e) => setNewRule({ ...newRule, needs: parseInt(e.target.value) || 0 })}
                          className="mt-2 text-center"
                          max={100}
                          min={0}
                        />
                      ) : (
                        <p className="text-3xl font-bold text-coquette-brown-600 mt-2">{budgetRule.needs}%</p>
                      )}
                      <p className="text-xs text-coquette-brown-500 mt-2">
                        Rent, utilities, groceries, insurance, minimum debt payments
                      </p>
                    </div>

                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: `${categoryColors.wants}40` }}>
                      <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-coquette-brown-600" />
                      <h3 className="font-semibold text-coquette-brown-600">Wants</h3>
                      {editingRule ? (
                        <Input
                          type="number"
                          value={newRule.wants}
                          onChange={(e) => setNewRule({ ...newRule, wants: parseInt(e.target.value) || 0 })}
                          className="mt-2 text-center"
                          max={100}
                          min={0}
                        />
                      ) : (
                        <p className="text-3xl font-bold text-coquette-brown-600 mt-2">{budgetRule.wants}%</p>
                      )}
                      <p className="text-xs text-coquette-brown-500 mt-2">
                        Dining out, entertainment, subscriptions, hobbies
                      </p>
                    </div>

                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: `${categoryColors.savings}40` }}>
                      <PiggyBank className="h-8 w-8 mx-auto mb-2 text-coquette-brown-600" />
                      <h3 className="font-semibold text-coquette-brown-600">Savings</h3>
                      {editingRule ? (
                        <Input
                          type="number"
                          value={newRule.savings}
                          onChange={(e) => setNewRule({ ...newRule, savings: parseInt(e.target.value) || 0 })}
                          className="mt-2 text-center"
                          max={100}
                          min={0}
                        />
                      ) : (
                        <p className="text-3xl font-bold text-coquette-brown-600 mt-2">{budgetRule.savings}%</p>
                      )}
                      <p className="text-xs text-coquette-brown-500 mt-2">
                        Emergency fund, investments, extra debt payments
                      </p>
                    </div>
                  </div>
                  {editingRule && (
                    <p className={`text-center mt-4 text-sm ${newRule.needs + newRule.wants + newRule.savings === 100 ? 'text-green-600' : 'text-red-500'}`}>
                      Total: {newRule.needs + newRule.wants + newRule.savings}% {newRule.needs + newRule.wants + newRule.savings === 100 ? '✓' : '(must equal 100%)'}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Charts and Transactions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Spending Chart */}
                <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-coquette-brown-600">Spending Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={pieData.filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spent']}
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #d4c4b0',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="text-center mt-4">
                      <p className="text-sm text-coquette-brown-500">
                        Remaining: <span className={`font-bold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          ${remainingBudget.toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Uncategorized Transactions */}
                <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-coquette-brown-600 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      Categorize Transactions ({uncategorizedTransactions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {uncategorizedTransactions.length > 0 ? (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {uncategorizedTransactions.slice(0, 10).map(transaction => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-3 bg-coquette-pink-50 rounded-lg border border-coquette-brown-200"
                          >
                            <div className="flex items-center gap-3">
                              {transaction.isExpense ? (
                                <ArrowDownCircle className="h-5 w-5 text-red-400" />
                              ) : (
                                <ArrowUpCircle className="h-5 w-5 text-green-400" />
                              )}
                              <div>
                                <p className="font-medium text-coquette-brown-600 text-sm">{transaction.description}</p>
                                <p className="text-xs text-coquette-brown-400">
                                  {format(new Date(transaction.date), 'MMM d')} • ${transaction.amount.toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <Select
                              value={transaction.category}
                              onValueChange={(value: TransactionCategory) => categorizeTransaction(transaction.id, value)}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs border-coquette-brown-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="needs">Needs</SelectItem>
                                <SelectItem value="wants">Wants</SelectItem>
                                <SelectItem value="savings">Savings</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-coquette-brown-400">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-400" />
                        <p>All transactions are categorized!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* All Transactions */}
              <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-coquette-brown-600">This Month's Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="needs">Needs</TabsTrigger>
                      <TabsTrigger value="wants">Wants</TabsTrigger>
                      <TabsTrigger value="savings">Savings</TabsTrigger>
                    </TabsList>
                    {['all', 'needs', 'wants', 'savings'].map(tab => (
                      <TabsContent key={tab} value={tab} className="mt-4">
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {currentMonthTransactions
                            .filter(t => tab === 'all' || t.category === tab)
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(transaction => {
                              const Icon = categoryIcons[transaction.category];
                              return (
                                <div
                                  key={transaction.id}
                                  className="flex items-center justify-between p-3 rounded-lg border border-coquette-brown-200 hover:bg-coquette-pink-50 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="p-2 rounded-full"
                                      style={{ backgroundColor: `${categoryColors[transaction.category]}60` }}
                                    >
                                      <Icon className="h-4 w-4 text-coquette-brown-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-coquette-brown-600">{transaction.description}</p>
                                      <p className="text-xs text-coquette-brown-400">
                                        {format(new Date(transaction.date), 'MMM d, yyyy')}
                                        {transaction.source && ` • ${transaction.source}`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`font-semibold ${transaction.isExpense ? 'text-red-500' : 'text-green-500'}`}>
                                      {transaction.isExpense ? '-' : '+'}${transaction.amount.toFixed(2)}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteTransaction(transaction.id)}
                                      className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          {currentMonthTransactions.filter(t => tab === 'all' || t.category === tab).length === 0 && (
                            <p className="text-center py-8 text-coquette-brown-400">No transactions in this category</p>
                          )}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card className="border-coquette-brown-200 bg-gradient-to-r from-coquette-pink-100 to-coquette-brown-100">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-coquette-brown-600 mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Budget Tips
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-coquette-brown-600">
                    <div>
                      <p className="font-medium">🏠 Needs (50%)</p>
                      <p className="text-coquette-brown-500">Housing, utilities, groceries, transportation, insurance, minimum debt payments.</p>
                    </div>
                    <div>
                      <p className="font-medium">🎉 Wants (30%)</p>
                      <p className="text-coquette-brown-500">Dining out, entertainment, subscriptions, vacations, shopping for non-essentials.</p>
                    </div>
                    <div>
                      <p className="font-medium">💰 Savings (20%)</p>
                      <p className="text-coquette-brown-500">Emergency fund, retirement, investments, extra debt payments, financial goals.</p>
                    </div>
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

export default Budget;
