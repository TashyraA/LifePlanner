import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type TransactionCategory = 'needs' | 'wants' | 'savings' | 'uncategorized';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: TransactionCategory;
  isExpense: boolean; // true = expense, false = income
  source?: string; // where it came from (manual, imported, etc.)
}

export interface BudgetRule {
  needs: number; // percentage (default 50)
  wants: number; // percentage (default 30)
  savings: number; // percentage (default 20)
}

interface BudgetContextType {
  transactions: Transaction[];
  monthlyIncome: number;
  budgetRule: BudgetRule;
  
  // Calculated values
  needsSpent: number;
  wantsSpent: number;
  savingsAmount: number;
  needsBudget: number;
  wantsBudget: number;
  savingsBudget: number;
  
  // Actions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id'>>) => void;
  deleteTransaction: (id: string) => void;
  categorizeTransaction: (id: string, category: TransactionCategory) => void;
  setMonthlyIncome: (income: number) => void;
  setBudgetRule: (rule: BudgetRule) => void;
  importTransactions: (transactions: Omit<Transaction, 'id'>[]) => void;
  clearAllTransactions: () => void;
  getCurrentMonthTransactions: () => Transaction[];
}

const BudgetContext = createContext<BudgetContextType | null>(null);

const STORAGE_KEY = 'budget_data';

const isCurrentMonth = (date: Date) => {
  const now = new Date();
  const transactionDate = new Date(date);
  return transactionDate.getMonth() === now.getMonth() && 
         transactionDate.getFullYear() === now.getFullYear();
};

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored, (key, value) => {
          if (key === 'date' && value) {
            return new Date(value);
          }
          return value;
        });
        return data.transactions || [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [monthlyIncome, setMonthlyIncomeState] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        return data.monthlyIncome || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  });

  const [budgetRule, setBudgetRuleState] = useState<BudgetRule>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        return data.budgetRule || { needs: 50, wants: 30, savings: 20 };
      } catch {
        return { needs: 50, wants: 30, savings: 20 };
      }
    }
    return { needs: 50, wants: 30, savings: 20 };
  });

  // Save to localStorage
  useEffect(() => {
    const data = { transactions, monthlyIncome, budgetRule };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('localDataSaved'));
  }, [transactions, monthlyIncome, budgetRule]);

  // Calculate current month spending by category
  const getCurrentMonthTransactions = () => {
    return transactions.filter(t => isCurrentMonth(t.date));
  };

  const currentMonthTransactions = getCurrentMonthTransactions();

  const needsSpent = currentMonthTransactions
    .filter(t => t.category === 'needs' && t.isExpense)
    .reduce((sum, t) => sum + t.amount, 0);

  const wantsSpent = currentMonthTransactions
    .filter(t => t.category === 'wants' && t.isExpense)
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsAmount = currentMonthTransactions
    .filter(t => t.category === 'savings')
    .reduce((sum, t) => sum + (t.isExpense ? -t.amount : t.amount), 0);

  // Calculate budgets based on rule
  const needsBudget = (monthlyIncome * budgetRule.needs) / 100;
  const wantsBudget = (monthlyIncome * budgetRule.wants) / 100;
  const savingsBudget = (monthlyIncome * budgetRule.savings) / 100;

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = {
      ...transaction,
      id: uuidv4(),
      date: new Date(transaction.date),
    };
    setTransactions([...transactions, newTransaction]);
  };

  const updateTransaction = (id: string, updates: Partial<Omit<Transaction, 'id'>>) => {
    setTransactions(transactions.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const categorizeTransaction = (id: string, category: TransactionCategory) => {
    setTransactions(transactions.map(t =>
      t.id === id ? { ...t, category } : t
    ));
  };

  const setMonthlyIncome = (income: number) => {
    setMonthlyIncomeState(income);
  };

  const setBudgetRule = (rule: BudgetRule) => {
    setBudgetRuleState(rule);
  };

  const importTransactions = (newTransactions: Omit<Transaction, 'id'>[]) => {
    const transactionsWithIds = newTransactions.map(t => ({
      ...t,
      id: uuidv4(),
      date: new Date(t.date),
    }));
    setTransactions([...transactions, ...transactionsWithIds]);
  };

  const clearAllTransactions = () => {
    setTransactions([]);
  };

  return (
    <BudgetContext.Provider value={{
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
      updateTransaction,
      deleteTransaction,
      categorizeTransaction,
      setMonthlyIncome,
      setBudgetRule,
      importTransactions,
      clearAllTransactions,
      getCurrentMonthTransactions,
    }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) throw new Error('useBudget must be used within BudgetProvider');
  return context;
};
