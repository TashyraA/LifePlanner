import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { compressImage, storeImageInIndexedDB, retrieveImageFromIndexedDB, removeImageFromIndexedDB } from '../lib/imageCompression';

export interface Income {
  id: string;
  name: string;
  amount: number;
  type: 'monthly' | 'weekly' | 'biweekly' | 'yearly';
  date: Date;
  savings: number;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  type: 'monthly' | 'weekly' | 'biweekly' | 'yearly';
  dueDate: Date;
  isPaid: boolean;
  isRecurring: boolean;
  nextDueDate?: Date; // For recurring expenses, shows the next due date when paid
}

export interface PaymentRecord {
  id: string;
  expenseId: string; // Link to the expense for undo functionality
  expenseName: string;
  amount: number;
  paidDate: Date;
  originalDueDate: Date;
}

interface FinanceContextType {
  incomes: Income[];
  expenses: Expense[];
  paymentHistory: PaymentRecord[];
  totalIncome: number;
  totalExpenses: number;
  currentMonthExpenses: number;
  currentMonthPaidTotal: number;
  paidExpenses: number;
  unpaidExpenses: number;
  currentBalance: number;
  savingsGoal: number;
  totalSavings: number;
   headerImages: [string, string, string];
  addIncome: (income: Omit<Income, 'id'>) => void;
  updateIncome: (id: string, updates: Partial<Omit<Income, 'id'>>) => void;
  deleteIncome: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'isPaid'>) => void;
  updateExpense: (id: string, updates: Partial<Omit<Expense, 'id'>>) => void;
  deleteExpense: (id: string) => void;
  toggleExpensePaid: (id: string) => void;
  deletePaymentRecord: (id: string) => void;
  updateSavingsGoal: (goal: number) => void;
   updateHeaderImage: (index: 0 | 1 | 2, image: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

const STORAGE_KEY = 'finance_data';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [incomes, setIncomes] = useState<Income[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored, (key, value) => {
          if (key === 'date' && value) {
            return new Date(value);
          }
          return value;
        });
        return data.incomes || [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored, (key, value) => {
          if (key === 'dueDate' && value) {
            return new Date(value);
          }
          return value;
        });
        return data.expenses || [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored, (key, value) => {
          if ((key === 'paidDate' || key === 'originalDueDate') && value) {
            return new Date(value);
          }
          return value;
        });
        return data.paymentHistory || [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [savingsGoal, setSavingsGoal] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        return data.savingsGoal || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  });

   const [headerImages, setHeaderImages] = useState<[string, string, string]>(['', '', '']);
   const [headerImageKeys, setHeaderImageKeys] = useState<[string, string, string]>(() => {
     const stored = localStorage.getItem(STORAGE_KEY);
     if (stored) {
       try {
         const data = JSON.parse(stored);
         return data.headerImageKeys || ['', '', ''];
       } catch {
         return ['', '', ''];
       }
     }
     return ['', '', ''];
   });

  useEffect(() => {
    const loadHeaderImages = async () => {
      const newImages: [string, string, string] = ['', '', ''];
      for (let i = 0; i < 3; i++) {
        if (headerImageKeys[i]) {
          const image = await retrieveImageFromIndexedDB(headerImageKeys[i]);
          if (image) newImages[i] = image;
        }
      }
      setHeaderImages(newImages);
    };
    loadHeaderImages();
  }, []);

  // Auto-reset paid recurring expenses when new month arrives
  useEffect(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const updatedExpenses = expenses.map(expense => {
      // Only process recurring expenses that are marked as paid
      if (!expense.isRecurring || !expense.isPaid) return expense;

      const dueDate = new Date(expense.dueDate);
      // If the due date month is before the current month, reset the expense
      if (dueDate.getFullYear() < currentYear || 
          (dueDate.getFullYear() === currentYear && dueDate.getMonth() < currentMonth)) {
        // Move to next due date if we have one, otherwise calculate it
        const nextDueDate = expense.nextDueDate ? new Date(expense.nextDueDate) : (() => {
          const next = new Date(dueDate);
          next.setMonth(next.getMonth() + 1);
          if (next.getDate() !== dueDate.getDate()) {
            next.setDate(0);
          }
          return next;
        })();

        return {
          ...expense,
          dueDate: nextDueDate,
          isPaid: false,
          nextDueDate: undefined,
        };
      }
      return expense;
    });

    // Only update if there were changes
    const hasChanges = updatedExpenses.some((exp, i) => 
      exp.isPaid !== expenses[i].isPaid || 
      new Date(exp.dueDate).getTime() !== new Date(expenses[i].dueDate).getTime()
    );

    if (hasChanges) {
      setExpenses(updatedExpenses);
    }
  }, []); // Run once on mount

  useEffect(() => {
     const data = { incomes, expenses, paymentHistory, savingsGoal, headerImageKeys };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('localDataSaved'));
   }, [incomes, expenses, paymentHistory, savingsGoal, headerImageKeys]);

  // Helper function to check if expense is due in current month
  const isExpenseDueInCurrentMonth = (expense: Expense) => {
    const now = new Date();
    const expenseDate = new Date(expense.dueDate);
    return expenseDate.getMonth() === now.getMonth() && 
           expenseDate.getFullYear() === now.getFullYear();
  };

  // Helper to check if payment was made in current month
  const isPaymentInCurrentMonth = (payment: PaymentRecord) => {
    const now = new Date();
    const paidDate = new Date(payment.paidDate);
    return paidDate.getMonth() === now.getMonth() && 
           paidDate.getFullYear() === now.getFullYear();
  };

  // Get expenses for current month: only those due this month
  // Recurring expenses that were paid will have their dueDate set to next month,
  // so they automatically disappear from current month
  const currentMonthExpensesList = expenses.filter(isExpenseDueInCurrentMonth);

  // Get payments made in current month
  const currentMonthPayments = paymentHistory.filter(isPaymentInCurrentMonth);
  const currentMonthPaidTotal = currentMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const currentMonthExpenses = currentMonthExpensesList.reduce((sum, expense) => sum + expense.amount, 0);
  // Paid expenses: total paid this month (from payment history)
  const paidExpenses = currentMonthPaidTotal;
  // Unpaid expenses: those due this month that haven't been paid
  const unpaidExpenses = currentMonthExpensesList.filter(e => !e.isPaid).reduce((sum, expense) => sum + expense.amount, 0);
  const totalSavings = incomes.reduce((sum, income) => sum + income.savings, 0);
  // Current balance = income - paid expenses this month - savings
  const currentBalance = totalIncome - currentMonthPaidTotal - totalSavings;

  const addIncome = (income: Omit<Income, 'id'>) => {
    setIncomes([...incomes, { ...income, id: uuidv4() }]);
  };

  const updateIncome = (id: string, updates: Partial<Omit<Income, 'id'>>) => {
    setIncomes(incomes.map(income => 
      income.id === id ? { ...income, ...updates } : income
    ));
  };

  const deleteIncome = (id: string) => {
    setIncomes(incomes.filter(income => income.id !== id));
  };

  const addExpense = (expense: Omit<Expense, 'id' | 'isPaid'>) => {
    setExpenses([...expenses, { 
      ...expense, 
      id: uuidv4(), 
      isPaid: false,
      isRecurring: expense.isRecurring ?? true // Default to recurring
    }]);
  };

  const updateExpense = (id: string, updates: Partial<Omit<Expense, 'id'>>) => {
    setExpenses(expenses.map(expense => 
      expense.id === id ? { ...expense, ...updates } : expense
    ));
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
  };

  const toggleExpensePaid = (id: string) => {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    // If marking as paid (not currently paid)
    if (!expense.isPaid) {
      // Add payment record
      const paymentRecord: PaymentRecord = {
        id: uuidv4(),
        expenseId: expense.id,
        expenseName: expense.name,
        amount: expense.amount,
        paidDate: new Date(),
        originalDueDate: new Date(expense.dueDate),
      };
      setPaymentHistory([...paymentHistory, paymentRecord]);

      if (expense.isRecurring) {
        // Calculate next due date (same day next month)
        const currentDueDate = new Date(expense.dueDate);
        const nextDueDate = new Date(currentDueDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        
        // Handle edge cases where the day doesn't exist in the next month
        if (nextDueDate.getDate() !== currentDueDate.getDate()) {
          nextDueDate.setDate(0);
        }
        
        // Mark as paid and store next due date (stays visible with "PAID" status)
        setExpenses(expenses.map(e => 
          e.id === id ? { ...e, isPaid: true, nextDueDate: nextDueDate } : e
        ));
      } else {
        // Non-recurring: mark as paid
        setExpenses(expenses.map(e => 
          e.id === id ? { ...e, isPaid: true } : e
        ));
      }
    } else {
      // Unmarking as paid (clicked by accident)
      // Remove the most recent payment record for this expense in current month
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const updatedPaymentHistory = [...paymentHistory];
      // Find and remove the payment record for this expense from current month
      const paymentIndex = updatedPaymentHistory.findIndex(p => {
        const paidDate = new Date(p.paidDate);
        return p.expenseId === expense.id && 
               paidDate.getMonth() === currentMonth && 
               paidDate.getFullYear() === currentYear;
      });
      
      if (paymentIndex !== -1) {
        updatedPaymentHistory.splice(paymentIndex, 1);
        setPaymentHistory(updatedPaymentHistory);
      }

      // Reset expense to unpaid
      setExpenses(expenses.map(e => 
        e.id === id ? { ...e, isPaid: false, nextDueDate: undefined } : e
      ));
    }
  };

  const updateSavingsGoal = (goal: number) => {
    setSavingsGoal(goal);
  };

   const updateHeaderImage = async (index: 0 | 1 | 2, image: string) => {
     try {
       if (!image) {
         const oldKey = headerImageKeys[index];
         if (oldKey) await removeImageFromIndexedDB(oldKey);
         const newKeys: [string, string, string] = [...headerImageKeys];
         newKeys[index] = '';
         setHeaderImageKeys(newKeys);
         const newImages: [string, string, string] = [...headerImages];
         newImages[index] = '';
         setHeaderImages(newImages);
         return;
       }

       if (image.startsWith('data:')) {
         const compressed = await compressImage(image);
         const imageKey = `finance_header_${index}_${Date.now()}`;
         await storeImageInIndexedDB(imageKey, compressed);
         const oldKey = headerImageKeys[index];
         if (oldKey) await removeImageFromIndexedDB(oldKey);
         const newKeys: [string, string, string] = [...headerImageKeys];
         newKeys[index] = imageKey;
         setHeaderImageKeys(newKeys);
         const newImages: [string, string, string] = [...headerImages];
         newImages[index] = compressed;
         setHeaderImages(newImages);
       } else {
         const newImages: [string, string, string] = [...headerImages];
         newImages[index] = image;
         setHeaderImages(newImages);
         const newKeys: [string, string, string] = [...headerImageKeys];
         newKeys[index] = '';
         setHeaderImageKeys(newKeys);
       }
     } catch (error) {
       console.error('Failed to update header image:', error);
       throw error;
     }
   };

  const deletePaymentRecord = (id: string) => {
    setPaymentHistory(paymentHistory.filter(p => p.id !== id));
  };

  return (
    <FinanceContext.Provider value={{
      incomes,
      expenses,
      paymentHistory,
      totalIncome,
      totalExpenses,
      currentMonthExpenses,
      currentMonthPaidTotal,
      paidExpenses,
      unpaidExpenses,
      currentBalance,
      savingsGoal,
      totalSavings,
       headerImages,
      addIncome,
      updateIncome,
      deleteIncome,
      addExpense,
      updateExpense,
      deleteExpense,
      toggleExpensePaid,
      deletePaymentRecord,
      updateSavingsGoal,
       updateHeaderImage,
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within FinanceProvider');
  return context;
};