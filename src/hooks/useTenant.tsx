import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { inferOnboardingCompleted, isMissingOnboardingColumnError } from '@/lib/onboarding';

interface TenantContextType {
  tenant: {
    id: string;
    name: string;
    slug: string;
    onboarding_completed: boolean;
  } | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isLoyaltyEnabled: boolean;
  setIsLoyaltyEnabled: (enabled: boolean) => void;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  loading: true,
  error: null,
  refresh: async () => {},
  isLoyaltyEnabled: true,
  setIsLoyaltyEnabled: () => {},
});

export const useTenant = () => useContext(TenantContext);

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  onboarding_completed?: boolean;
};

async function resolveOnboardingCompleted(row: TenantRow): Promise<boolean> {
  if (typeof row.onboarding_completed === 'boolean') {
    return row.onboarding_completed;
  }
  return inferOnboardingCompleted(row.id, row.name);
}

export const TenantProvider: React.FC<{ children: React.ReactNode; session: Session | null }> = ({
  children,
  session,
}) => {
  const [tenant, setTenant] = useState<TenantContextType['tenant']>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoyaltyEnabled, setIsLoyaltyEnabled] = useState(true);

  const fetchTenant = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setTenant(null);
      setLoading(false);
      return;
    }

    setTenant((curr) => {
      if (!curr) {
        setLoading(true);
      }
      return curr;
    });
    setError(null);
    try {
      let profile: { tenant_id: string; tenants: TenantRow | TenantRow[] | null } | null = null;

      const withFlag = await supabase
        .from('profiles')
        .select('tenant_id, tenants(id, name, slug, onboarding_completed)')
        .eq('id', userId)
        .maybeSingle();

      if (withFlag.error && isMissingOnboardingColumnError(withFlag.error.message)) {
        const basic = await supabase
          .from('profiles')
          .select('tenant_id, tenants(id, name, slug)')
          .eq('id', userId)
          .maybeSingle();

        if (basic.error) throw basic.error;
        profile = basic.data;
      } else {
        if (withFlag.error) throw withFlag.error;
        profile = withFlag.data;
      }

      const tenantRow = Array.isArray(profile?.tenants) ? profile?.tenants[0] : profile?.tenants;

      if (tenantRow) {
        const onboarding_completed = await resolveOnboardingCompleted(tenantRow);
        setTenant({
          id: tenantRow.id,
          name: tenantRow.name,
          slug: tenantRow.slug,
          onboarding_completed,
        });

        // Safe query for loyalty settings
        try {
          const { data: loyaltyData } = await supabase
            .from('loyalty_settings')
            .select('enabled')
            .maybeSingle();
          if (loyaltyData && typeof loyaltyData.enabled === 'boolean') {
            setIsLoyaltyEnabled(loyaltyData.enabled);
          } else {
            setIsLoyaltyEnabled(true);
          }
        } catch {
          setIsLoyaltyEnabled(true);
        }
      } else {
        setTenant(null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load cafe profile';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  return (
    <TenantContext.Provider value={{ tenant, loading, error, refresh: fetchTenant, isLoyaltyEnabled, setIsLoyaltyEnabled }}>
      {children}
    </TenantContext.Provider>
  );
};
