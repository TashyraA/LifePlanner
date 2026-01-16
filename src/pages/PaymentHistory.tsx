import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '../components/AppSidebar';
import { useFinance, PaymentRecord } from '../contexts/FinanceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, Calendar, ArrowLeft, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const PaymentHistory = () => {
  const { paymentHistory, deletePaymentRecord } = useFinance();
  const { toast } = useToast();

  // Group payments by month/year
  const groupedPayments = paymentHistory.reduce((groups, payment) => {
    const paidDate = new Date(payment.paidDate);
    const monthYear = format(paidDate, 'MMMM yyyy');
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(payment);
    return groups;
  }, {} as Record<string, PaymentRecord[]>);

  // Sort months in descending order (most recent first)
  const sortedMonths = Object.keys(groupedPayments).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB.getTime() - dateA.getTime();
  });

  // Calculate total per month
  const getMonthTotal = (payments: PaymentRecord[]) => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-coquette-brown-50 via-coquette-pink-50 to-white">
        <AppSidebar />
        <SidebarInset className="flex-1 w-full min-w-0">
          <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-coquette-brown-200 bg-white/80 backdrop-blur-sm px-6 py-4">
            <SidebarTrigger />
            <Link to="/finance">
              <Button variant="ghost" size="sm" className="text-coquette-brown-500 hover:bg-coquette-brown-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Finance
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Receipt className="h-6 w-6 text-coquette-pink-400" />
              <h1 className="text-2xl font-bold text-coquette-brown-600">Payment History</h1>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {sortedMonths.length === 0 ? (
                <Card className="border-coquette-brown-200">
                  <CardContent className="p-8 text-center">
                    <Receipt className="h-12 w-12 text-coquette-brown-300 mx-auto mb-4" />
                    <p className="text-coquette-brown-500">No payment history yet.</p>
                    <p className="text-sm text-coquette-brown-400 mt-2">
                      When you pay expenses, they'll appear here organized by month.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                sortedMonths.map(monthYear => (
                  <Card key={monthYear} className="border-coquette-brown-200">
                    <CardHeader className="bg-gradient-to-r from-coquette-pink-100 to-coquette-brown-100 rounded-t-lg">
                      <CardTitle className="flex justify-between items-center text-coquette-brown-600">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          {monthYear}
                        </span>
                        <span className="text-lg font-bold">
                          ${getMonthTotal(groupedPayments[monthYear]).toFixed(2)}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {groupedPayments[monthYear]
                          .sort((a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime())
                          .map(payment => (
                            <div
                              key={payment.id}
                              className="flex justify-between items-center p-3 bg-gradient-to-r from-coquette-brown-50 to-white rounded-lg border border-coquette-brown-100"
                            >
                              <div>
                                <h4 className="font-semibold text-coquette-brown-600">
                                  {payment.expenseName}
                                </h4>
                                <div className="text-sm text-coquette-brown-400 space-x-4">
                                  <span>Paid: {format(new Date(payment.paidDate), 'MMM d, yyyy')}</span>
                                  <span>•</span>
                                  <span>Due: {format(new Date(payment.originalDueDate), 'MMM d, yyyy')}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-coquette-brown-600">
                                  ${payment.amount.toFixed(2)}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    deletePaymentRecord(payment.id);
                                    toast({
                                      title: "Payment deleted",
                                      description: "Record removed from history.",
                                    });
                                  }}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default PaymentHistory;
