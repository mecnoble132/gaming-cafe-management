/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import BillingPage from './pages/BillingPage';
import { useEffect, useState } from 'react';
import BookingsPage from './pages/BookingsPage';
import AuthPage from './pages/AuthPage';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import SettingsPage from './pages/SettingsPage';
import InventoryPage from './pages/InventoryPage';
import CustomersPage from './pages/CustomersPage';
import ReportsPage from './pages/ReportsPage';
import DashboardPage from './pages/DashboardPage';
import OnboardingPage from './pages/OnboardingPage';
import { TenantProvider, useTenant } from './hooks/useTenant';
import { Button } from '@/components/ui/button';

const queryClient = new QueryClient();

type Page = 'dashboard' | 'billing' | 'bookings' | 'settings' | 'inventory' | 'customers' | 'reports';

function AppContent() {
  const { tenant, loading: tenantLoading, error: tenantError, refresh } = useTenant();
  const [page, setPage] = useState<Page>('dashboard');
  const [onboardingDone, setOnboardingDone] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const nav = (next: Page) => setPage(next);

  if (tenantLoading) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading cafe data...</div>;
  }

  if (tenantError || !tenant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-red-400 text-sm mb-4">
          {tenantError ? `Error: ${tenantError}` : 'Cafe profile not found.'}
        </div>
        <p className="text-muted-foreground text-xs max-w-xs mb-6">
          This usually happens if the onboarding process is still finishing. Please wait a few seconds and try again.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            Retry
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  if (!tenant.onboarding_completed && !onboardingDone) {
    return (
      <>
        <OnboardingPage onComplete={() => setOnboardingDone(true)} />
        <Toaster position="bottom-right" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {page === 'dashboard' ? (
        <DashboardPage onNavigate={nav} onLogout={handleLogout} />
      ) : page === 'billing' ? (
        <BillingPage onNavigate={nav} onLogout={handleLogout} />
      ) : page === 'bookings' ? (
        <BookingsPage onNavigate={nav} onLogout={handleLogout} />
      ) : page === 'inventory' ? (
        <InventoryPage onNavigate={nav} onLogout={handleLogout} />
      ) : page === 'customers' ? (
        <CustomersPage onNavigate={nav} onLogout={handleLogout} />
      ) : page === 'reports' ? (
        <ReportsPage onNavigate={nav} onLogout={handleLogout} />
      ) : (
        <SettingsPage onNavigate={nav} onLogout={handleLogout} />
      )}
      <Toaster position="bottom-right" />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setAuthLoading(false);
    };
    load();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {authLoading ? (
        <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Checking session...</div>
      ) : !session ? (
        <AuthPage />
      ) : (
        <TenantProvider session={session}>
          <AppContent />
        </TenantProvider>
      )}
    </QueryClientProvider>
  );
}
