import { supabase } from '@/lib/supabase';

const STORAGE_PREFIX = 'gg_onboarding_completed_';

export function getOnboardingStorageKey(tenantId: string) {
  return `${STORAGE_PREFIX}${tenantId}`;
}

export function readLocalOnboardingComplete(tenantId: string): boolean {
  try {
    return localStorage.getItem(getOnboardingStorageKey(tenantId)) === 'true';
  } catch {
    return false;
  }
}

export function writeLocalOnboardingComplete(tenantId: string) {
  try {
    localStorage.setItem(getOnboardingStorageKey(tenantId), 'true');
  } catch {
    // ignore quota / private mode
  }
}

export function isMissingOnboardingColumnError(message: string | undefined): boolean {
  if (!message) return false;
  return message.includes('onboarding_completed') && message.includes('does not exist');
}

/** Heuristic when DB column is not migrated yet */
export async function inferOnboardingCompleted(tenantId: string, tenantName: string): Promise<boolean> {
  if (readLocalOnboardingComplete(tenantId)) return true;
  if (tenantName !== 'My Gaming Cafe') return true;

  const { count, error } = await supabase
    .from('stations')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  if (error) return false;
  return (count ?? 0) > 0;
}

export async function markTenantOnboardingComplete(tenantId: string, cafeName: string): Promise<void> {
  const { error } = await supabase
    .from('tenants')
    .update({ name: cafeName, onboarding_completed: true })
    .eq('id', tenantId);

  if (!error) return;

  if (isMissingOnboardingColumnError(error.message)) {
    const { error: nameOnlyError } = await supabase.from('tenants').update({ name: cafeName }).eq('id', tenantId);
    if (!nameOnlyError) {
      writeLocalOnboardingComplete(tenantId);
      return;
    }
  }

  writeLocalOnboardingComplete(tenantId);
}
