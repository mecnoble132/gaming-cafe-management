import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface TenantContextType {
  tenant: {
    id: string;
    name: string;
    slug: string;
  } | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  loading: true,
  error: null,
  refresh: async () => {},
});

export const useTenant = () => useContext(TenantContext);

export const TenantProvider: React.FC<{ children: React.ReactNode; session: Session | null }> = ({ children, session }) => {
  const [tenant, setTenant] = useState<TenantContextType['tenant']>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenant = useCallback(async () => {
    if (!session?.user) {
      setTenant(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('Fetching tenant for user:', session.user.id);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id, tenants(id, name, slug)')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw profileError;
      }
      
      console.log('Profile result:', profile);

      if (profile?.tenants) {
        setTenant(profile.tenants as any);
      } else {
        setTenant(null);
      }
    } catch (err: any) {
      console.error('Error in useTenant:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  return (
    <TenantContext.Provider value={{ tenant, loading, error, refresh: fetchTenant }}>
      {children}
    </TenantContext.Provider>
  );
};
