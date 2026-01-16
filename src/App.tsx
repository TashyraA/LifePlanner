import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { FirebaseAuthProvider } from "./contexts/FirebaseAuthContext";
import { DataSyncProvider } from "./components/DataSyncProvider";
import { PlannerProvider } from "./contexts/PlannerContext";
import { FinanceProvider } from "./contexts/FinanceContext";
import { FitnessProvider } from "./contexts/FitnessContext";
import { MealProvider } from "./contexts/MealContext";
import { CollegeProvider } from "./contexts/CollegeContext";
import { NotebookProvider } from "./contexts/NotebookContext";
import { BudgetProvider } from "./contexts/BudgetContext";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Planner from "@/pages/Planner";
import MonthView from "@/pages/MonthView";
import Dashboard from "@/pages/Dashboard";
import FitnessTracker from "@/pages/FitnessTracker";
import MealTracker from "@/pages/MealTracker";
import RecipeBank from "@/pages/RecipeBank";
import CollegeDashboard from "@/pages/CollegeDashboard";
import PaymentHistory from "@/pages/PaymentHistory";
import Budget from "@/pages/Budget";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <FirebaseAuthProvider>
          <AuthProvider>
            <DataSyncProvider>
              <PlannerProvider>
                <FinanceProvider>
                  <FitnessProvider>
                    <MealProvider>
                      <CollegeProvider>
                        <NotebookProvider>
                          <BudgetProvider>
                            <BrowserRouter>
                            <Toaster />
                            <Sonner />
                            <Routes>
                              <Route path="/" element={<Index />} />
                              <Route path="/login" element={<Login />} />
                              <Route path="/home" element={<Home />} />
                              <Route path="/planner" element={<Planner />} />
                              <Route path="/planner/:monthIndex" element={<MonthView />} />
                              <Route path="/finance" element={<Dashboard />} />
                              <Route path="/finance/history" element={<PaymentHistory />} />
                              <Route path="/finance/budget" element={<Budget />} />
                              <Route path="/fitness" element={<FitnessTracker />} />
                              <Route path="/meals" element={<MealTracker />} />
                              <Route path="/recipes" element={<RecipeBank />} />
                              <Route path="/college" element={<CollegeDashboard />} />
                              <Route path="/settings" element={<Settings />} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </BrowserRouter>
                          </BudgetProvider>
                        </NotebookProvider>
                      </CollegeProvider>
                    </MealProvider>
                  </FitnessProvider>
                </FinanceProvider>
              </PlannerProvider>
            </DataSyncProvider>
          </AuthProvider>
        </FirebaseAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;