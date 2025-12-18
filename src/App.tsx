// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Button } from '@/components/ui/button';
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
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
import { Home, PieChart, LogOut } from "lucide-react";

const queryClient = new QueryClient();


// --- Components for Layout ---

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg mx-auto mb-4 animate-pulse">
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
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  
  const isFinance = location.pathname.startsWith('/finance');

  if (!user) return null;
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Top Navigation Tabs */}
      <header className="bg-card/50 backdrop-blur-md sticky top-0 z-50 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Logo Section (Left) */}
            <div 
              className="flex items-center gap-2 cursor-pointer shrink-0 transition-opacity hover:opacity-80" 
              onClick={() => navigate('/')}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">4K</span>
              </div>
              <span className="font-bold text-xl text-foreground hidden md:block">Four K Habit Club</span>
            </div>

            {/* Navigation Tabs (Center) */}
            <div className="flex-1 flex justify-center">
              <div className="grid grid-cols-2 p-1 bg-muted/80 rounded-lg w-full max-w-[280px] sm:max-w-xs shadow-inner">
                <button
                  onClick={() => navigate('/')}
                  className={cn(
                    "flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                    !isFinance 
                      ? "bg-background text-foreground shadow-sm scale-[1.02]" 
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden xs:inline">Household</span>
                </button>
                <button
                  onClick={() => navigate('/finance')}
                  className={cn(
                    "flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                    isFinance 
                      ? "bg-background text-foreground shadow-sm scale-[1.02]" 
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  <PieChart className="w-4 h-4" />
                  <span className="hidden xs:inline">Finance</span>
                </button>
              </div>
            </div>

            {/* Logout Button (Right) */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout} 
              className="gap-2 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.logout')}</span>
            </Button>
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