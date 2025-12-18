// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

// Household Pages
import { Dashboard as HouseholdDashboard } from "./pages/Dashboard";
import { LogTasks } from "./pages/LogTasks";
import { History } from "./pages/History";

// Finance Pages
import { FinanceDashboard } from "./pages/finance/FinanceDashboard";
import { LogFinance } from "./pages/finance/LogFinance";

import { Auth } from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { Home, PieChart } from "lucide-react";

const queryClient = new QueryClient();

// --- Components for Layout ---

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-2xl">4K</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/auth" />;
};

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isFinance = location.pathname.startsWith('/finance');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Top Navigation Tabs */}
      <header className="bg-card/50 backdrop-blur-md sticky top-0 z-50 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-16">
            <div className="grid grid-cols-2 p-1 bg-muted rounded-lg w-full max-w-sm">
              <button
                onClick={() => navigate('/')}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
                  !isFinance 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Home className="w-4 h-4" />
                Household
              </button>
              <button
                onClick={() => navigate('/finance')}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
                  isFinance 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <PieChart className="w-4 h-4" />
                Finance
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

// --- Main App Component ---

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              
              {/* Household Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <HouseholdDashboard />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/log"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <LogTasks />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <History />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Finance Routes */}
              <Route
                path="/finance"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <FinanceDashboard />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/log"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <LogFinance />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;