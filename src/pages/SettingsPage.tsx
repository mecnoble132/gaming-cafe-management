import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SkeletonSettingsPage } from '@/components/ui/Skeleton';
import { supabase } from '@/lib/supabase';
import { DEFAULT_PRICING_CONFIG, GamePricingConfig, normalizePricingConfig } from '@/lib/pricing';
import { DEFAULT_SETTINGS, Station, StationType } from '@/lib/bookings';
import { DEFAULT_LOYALTY_SETTINGS } from '@/lib/loyalty';
import { LoyaltySettings } from '@/types';
import { toast } from 'sonner';
import { getRouteByLabel } from '@/lib/navigation';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { AlertTriangle, Plus, Trash2, User, Lock, Loader2, Settings2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTenant } from '@/hooks/useTenant';

type EditableStation = Station & { isNew?: boolean };

const DURATIONS = [15, 30, 60, 90, 120, 150, 180, 240];

export default function SettingsPage({
  onNavigate,
  onLogout,
}: {
  onNavigate?: (next: 'dashboard' | 'billing' | 'bookings' | 'settings' | 'inventory' | 'customers' | 'reports') => void;
  onLogout?: () => void;
}) {
  const [stations, setStations] = useState<EditableStation[]>([]);
  const [bookingSettings, setBookingSettings] = useState(DEFAULT_SETTINGS);
  const [pricingConfig, setPricingConfig] = useState<GamePricingConfig>(DEFAULT_PRICING_CONFIG);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings>(DEFAULT_LOYALTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [bookingSettingsId, setBookingSettingsId] = useState<string | null>(null);
  const [pricingSettingsId, setPricingSettingsId] = useState<string | null>(null);
  const [loyaltySettingsId, setLoyaltySettingsId] = useState<string | null>(null);

  // Modal States
  const [isAddGameTypeOpen, setIsAddGameTypeOpen] = useState(false);
  const [newGameTypeName, setNewGameTypeName] = useState('');
  
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'station' | 'gametype';
    id: string;
    title: string;
    description: string;
  } | null>(null);

  // Account tab specific states
  const [activeTab, setActiveTab] = useState<'account' | 'stations' | 'pricing' | 'loyalty'>('account');
  const [user, setUser] = useState<{ email?: string; name: string } | null>(null);
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingAccount, setUpdatingAccount] = useState(false);
  const [cafeName, setCafeName] = useState('');

  // Account Deletion states
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [deleteAccountConfirmText, setDeleteAccountConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const { tenant, refresh: refreshTenant, setIsLoyaltyEnabled } = useTenant();



  useEffect(() => {
    if (tenant?.name) {
      setCafeName(tenant.name);
    }
  }, [tenant]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [
        { data: profileData },
        { data: stationRows },
        { data: bookingRow },
        { data: pricingRow },
        { data: loyaltyRow }
      ] = await Promise.all([
        supabase.from('profiles').select('tenant_id').single(),
        supabase.from('stations').select('id,name,type').order('name'),
        supabase.from('booking_settings').select('id,opening_time,closing_time,slot_minutes').maybeSingle(),
        supabase.from('pricing_settings').select('id,config').maybeSingle(),
        supabase.from('loyalty_settings').select('id,*').maybeSingle(),
      ]);

      if (profileData) setTenantId(profileData.tenant_id);
      setStations((stationRows ?? []) as EditableStation[]);
      if (bookingRow) {
        setBookingSettingsId(bookingRow.id);
        setBookingSettings({
          opening_time: bookingRow.opening_time,
          closing_time: bookingRow.closing_time,
          slot_minutes: bookingRow.slot_minutes,
        });
      }
      if (pricingRow) {
        setPricingSettingsId(pricingRow.id);
        setPricingConfig(normalizePricingConfig(pricingRow.config));
      }
      if (loyaltyRow) {
        setLoyaltySettingsId(loyaltyRow.id);
        setLoyaltySettings(loyaltyRow as LoyaltySettings);
      }

      // Load auth profile details
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const currentName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User';
        setUser({
          email: authUser.email,
          name: currentName,
        });
        setName(currentName);
      }

      setLoading(false);
    };
    load();
  }, []);

  const handleUpdateAccount = async () => {
    if (newPassword && newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setUpdatingAccount(true);
    try {
      // 1. Update auth metadata name
      const { error: authNameError } = await supabase.auth.updateUser({
        data: { full_name: name }
      });
      if (authNameError) throw authNameError;

      // 2. Update password if provided
      if (newPassword) {
        const { error: passError } = await supabase.auth.updateUser({
          password: newPassword
        });
        if (passError) throw passError;
        setNewPassword('');
        setConfirmPassword('');
      }

      // 3. Update Cafe Brand Name
      if (cafeName.trim() && cafeName.trim() !== tenant?.name && tenant?.id) {
        const { error: tenantError } = await supabase
          .from('tenants')
          .update({ name: cafeName.trim() })
          .eq('id', tenant.id);
        if (tenantError) throw tenantError;
        await refreshTenant();
      }

      setUser((prev) => prev ? { ...prev, name } : null);
      toast.success('Profile and Cafe settings updated successfully!');
      
      // Dispatch sync event
      window.dispatchEvent(new CustomEvent('account-profile-updated', { detail: { name } }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to update details');
    } finally {
      setUpdatingAccount(false);
    }
  };

  const addStation = () => {
    setStations((prev) => [...prev, { id: `temp-${Date.now()}`, name: '', type: stationTypeOptions[0] || '', isNew: true }]);
  };

  const removeStation = async (id: string, isNew?: boolean) => {
    if (isNew) {
      setStations((prev) => prev.filter((s) => s.id !== id));
      return;
    }
    setDeleteConfirm({
      type: 'station',
      id,
      title: 'Delete Station?',
      description: 'Are you sure you want to delete this station? Existing bookings for this station must be removed first.'
    });
  };

  const executeRemoveStation = async (id: string) => {
    const { error } = await supabase.from('stations').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setStations((prev) => prev.filter((s) => s.id !== id));
    toast.success('Station removed');
    setDeleteConfirm(null);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      // 1. Stations
      const cleanedStations = stations
        .map((s) => {
          const payload: any = {
            name: s.name.trim(),
            type: s.type,
            ...(tenantId ? { tenant_id: tenantId } : {})
          };
          if (!s.isNew) {
            payload.id = s.id.trim();
          } else {
            payload.id = `STN-${crypto.randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase()}`;
          }
          return payload;
        })
        .filter((s) => s.name);
      
      const { error: stationError } = await supabase.from('stations').upsert(cleanedStations);
      if (stationError) throw stationError;

      // 2. Booking Settings
      const { error: bookingSettingsError } = await supabase
        .from('booking_settings')
        .upsert({ 
          id: bookingSettingsId || undefined,
          ...bookingSettings, 
          ...(tenantId ? { tenant_id: tenantId } : {}) 
        });
      if (bookingSettingsError) throw bookingSettingsError;

      // 3. Pricing Settings
      const { error: pricingError } = await supabase
        .from('pricing_settings')
        .upsert({ 
          id: pricingSettingsId || undefined,
          config: pricingConfig, 
          ...(tenantId ? { tenant_id: tenantId } : {}) 
        });
      if (pricingError) throw pricingError;

      // 4. Loyalty Settings
      const { error: loyaltyError } = await supabase
        .from('loyalty_settings')
        .upsert({ 
          id: loyaltySettingsId || undefined,
          ...loyaltySettings, 
          ...(tenantId ? { tenant_id: tenantId } : {}) 
        });
      if (loyaltyError) throw loyaltyError;

      if (typeof loyaltySettings.enabled === 'boolean') {
        setIsLoyaltyEnabled(loyaltySettings.enabled);
      }

      // Refresh stations to get proper IDs
      const { data: freshStations } = await supabase.from('stations').select('id,name,type').order('name');
      setStations((freshStations ?? []) as EditableStation[]);

      toast.success('Settings saved successfully');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const stationTypeOptions = useMemo(() => {
    return Object.keys(pricingConfig).filter(k => k !== 'vr_cricket' && k !== 'vr_adventure');
  }, [pricingConfig]);

  const addDuration = (gameType: string) => {
    setPricingConfig(prev => ({
      ...prev,
      [gameType]: {
        ...prev[gameType],
        "60": 0 // Default to 60 mins if nothing exists, or just a placeholder
      }
    }));
  };

  const removeDuration = (gameType: string, duration: string) => {
    setPricingConfig(prev => {
      const next = { ...prev };
      const gamePricing = { ...next[gameType] };
      delete gamePricing[duration];
      next[gameType] = gamePricing;
      return next;
    });
  };

  const updateDurationMinutes = (gameType: string, oldMins: string, newMins: string) => {
    if (oldMins === newMins) return;
    setPricingConfig(prev => {
      const next = { ...prev };
      const gamePricing = { ...next[gameType] };
      const price = gamePricing[oldMins];
      delete gamePricing[oldMins];
      gamePricing[newMins] = price;
      next[gameType] = gamePricing;
      return next;
    });
  };

  const addCustomGameType = () => {
    setNewGameTypeName('');
    setIsAddGameTypeOpen(true);
  };

  const confirmAddGameType = () => {
    const name = newGameTypeName.trim();
    if (!name) return;
    const key = name.toLowerCase().replace(/\s+/g, '_');
    if (pricingConfig[key]) {
      toast.error('This game type already exists.');
      return;
    }
    setPricingConfig(prev => ({
      ...prev,
      [key]: { '15': 0, '30': 0, '60': 0, '90': 0, '120': 0, '150': 0, '180': 0 }
    }));
    setIsAddGameTypeOpen(false);
    toast.success(`Game type "${name}" added`);
  };

  const removeCustomGameType = (key: string) => {
    setDeleteConfirm({
      type: 'gametype',
      id: key,
      title: 'Remove Game Type?',
      description: `Are you sure you want to remove the game type "${key.replace(/_/g, ' ')}" and all its pricing?`
    });
  };

  const executeRemoveGameType = (key: string) => {
    setPricingConfig(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setDeleteConfirm(null);
    toast.success('Game type removed');
  };

  const vrCricket = pricingConfig.vr_cricket;
  const vrAdventure = pricingConfig.vr_adventure;
  const totalStations = useMemo(() => stations.length, [stations]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        active="Settings"
        onNavigate={(next) => {
          const route = getRouteByLabel(next);
          if (route) onNavigate?.(route);
        }}
        onLogout={onLogout}
      />
      <main className="flex-1 pb-24 md:ml-64 md:pb-0">
        <PageHeader 
          title="Settings" 
          actions={
            activeTab !== 'account' && (
              <Button onClick={saveAll} disabled={saving || loading} className="rounded-xl shadow-md shadow-primary/10 font-bold px-5">
                {saving ? 'Saving...' : 'Save all changes'}
              </Button>
            )
          }
        />

        <div className="mx-auto w-full max-w-[1600px] space-y-5 p-3 sm:p-5">
          {loading ? (
            <div className="rounded-xl border border-border/50 bg-background/40 p-4 text-sm text-muted-foreground animate-pulse">
              Loading settings...
            </div>
          ) : null}

          {/* Tab Selector */}
          <div className="flex border-b border-border/40 overflow-x-auto no-scrollbar gap-2 pb-1.5">
            <button
              onClick={() => setActiveTab('account')}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 shrink-0 rounded-t-lg",
                activeTab === 'account'
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Account & Cafe
            </button>
            <button
              onClick={() => setActiveTab('stations')}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 shrink-0 rounded-t-lg",
                activeTab === 'stations'
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Stations
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 shrink-0 rounded-t-lg",
                activeTab === 'pricing'
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Pricing & Game Types
            </button>
            <button
              onClick={() => setActiveTab('loyalty')}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 shrink-0 rounded-t-lg",
                activeTab === 'loyalty'
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Loyalty Points
            </button>
          </div>

          {/* Tab Content: Account & Cafe */}
          {activeTab === 'account' && !loading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Personal Details */}
              <div className="lg:col-span-2 rounded-xl border border-border/50 bg-card/40 p-5 backdrop-blur-sm space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-primary/20 shrink-0">
                    {user?.name.slice(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Personal Profile</h3>
                    <p className="text-xs text-muted-foreground">Manage your personal profile and display settings.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Display Name</label>
                    <Input
                      placeholder="Display name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      Email Address
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono select-none">LOCKED</span>
                    </label>
                    <Input
                      disabled
                      value={user?.email || ''}
                      className="bg-muted/30 font-mono text-xs text-muted-foreground/75 border-border/40 h-10 select-none"
                    />
                  </div>
                </div>

                <div className="border-t border-border/40 my-4" />

                {/* Change Password */}
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-3">Security & Password</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New Password</label>
                      <Input
                        type="password"
                        placeholder="Minimum 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirm Password</label>
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/40 my-4" />

                {/* Save personal details button */}
                <div className="flex justify-end">
                  <Button onClick={handleUpdateAccount} disabled={updatingAccount} className="font-bold shadow-md shadow-primary/10 rounded-xl px-5">
                    {updatingAccount ? 'Saving Account...' : 'Save Account Settings'}
                  </Button>
                </div>
              </div>

              {/* Cafe & Workspaces Details */}
              <div className="space-y-5">
                {/* Cafe Profile */}
                <div className="rounded-xl border border-border/50 bg-card/40 p-5 backdrop-blur-sm space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Cafe Profile</h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cafe Name</label>
                    <Input
                      placeholder="Cafe name"
                      value={cafeName}
                      onChange={(e) => setCafeName(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      Cafe Handle (Slug)
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono select-none">LOCKED</span>
                    </label>
                    <Input
                      disabled
                      value={tenant?.slug || ''}
                      className="bg-muted/30 font-mono text-xs text-muted-foreground/75 border-border/40 h-10 select-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      Tenant ID
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono select-none">LOCKED</span>
                    </label>
                    <Input
                      disabled
                      value={tenant?.id || ''}
                      className="bg-muted/30 font-mono text-xs text-muted-foreground/75 border-border/40 h-10 select-all"
                    />
                  </div>

                  <Button onClick={handleUpdateAccount} disabled={updatingAccount} className="w-full font-bold shadow-md shadow-primary/10 rounded-xl">
                    {updatingAccount ? 'Saving Cafe...' : 'Update Cafe Profile'}
                  </Button>
                </div>

                {/* Plan and Subscription Details */}
                <div className="rounded-xl border border-border/50 bg-card/40 p-5 backdrop-blur-sm space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Plan Details</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-semibold">Active Plan</span>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(var(--primary),0.1)]">Founder Lifetime Access</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-semibold">Max Stations</span>
                    <span className="text-xs font-mono font-bold text-foreground">Unlimited</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-semibold">Database Region</span>
                    <span className="text-xs font-mono text-muted-foreground">ap-south-1 (Mumbai)</span>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 backdrop-blur-sm space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-destructive flex items-center gap-2">
                    <ShieldAlert size={16} /> Danger Zone
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete your account, cafe profile, and all associated data. This action cannot be undone.
                  </p>
                  <Button 
                    variant="destructive" 
                    className="w-full font-bold shadow-md shadow-destructive/10 rounded-xl"
                    onClick={() => {
                      setDeleteAccountConfirmText('');
                      setIsDeleteAccountOpen(true);
                    }}
                  >
                    Delete Cafe & Account
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Stations */}
          {activeTab === 'stations' && !loading && (
            <div className="space-y-5">
              <section className="rounded-xl border border-border/50 bg-card/40 p-5 backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Stations ({totalStations})</h3>
                    <p className="text-xs text-muted-foreground">Register and rename consoles, PC setups, or VR tracks.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={addStation} className="rounded-xl font-bold h-9">
                      Add station
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {stations.map((station) => (
                    <div key={station.id} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_160px_100px]">
                      <Input
                        placeholder="Station ID (example: ps5-4)"
                        value={station.id}
                        onChange={(e) => setStations((prev) => prev.map((x) => (x.id === station.id ? { ...x, id: e.target.value } : x)))}
                        disabled={!station.isNew}
                        className="h-10"
                      />
                      <Input
                        placeholder="Station name"
                        value={station.name}
                        onChange={(e) => setStations((prev) => prev.map((x) => (x.id === station.id ? { ...x, name: e.target.value } : x)))}
                        className="h-10"
                      />
                      <select
                        className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                        value={station.type}
                        onChange={(e) =>
                          setStations((prev) => prev.map((x) => (x.id === station.id ? { ...x, type: e.target.value as StationType } : x)))
                        }
                      >
                        {stationTypeOptions.map((t) => (
                          <option key={t} value={t}>
                            {t.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      <Button size="sm" variant="destructive" onClick={() => removeStation(station.id, station.isNew)} className="rounded-xl h-10 font-bold">
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-border/50 bg-card/40 p-5 backdrop-blur-sm">
                <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-muted-foreground">Booking timings</h3>
                <p className="mb-4 text-xs text-muted-foreground">
                  These timings control when customers can book slots and the slot size used in the bookings calendar.
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Opening time</span>
                    <Input
                      type="time"
                      value={bookingSettings.opening_time}
                      onChange={(e) => setBookingSettings((s) => ({ ...s, opening_time: e.target.value }))}
                      className="h-10"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Closing time</span>
                    <Input
                      type="time"
                      value={bookingSettings.closing_time}
                      onChange={(e) => setBookingSettings((s) => ({ ...s, closing_time: e.target.value }))}
                      className="h-10"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Slot length (minutes)</span>
                    <Input
                      type="number"
                      min={5}
                      value={bookingSettings.slot_minutes}
                      onChange={(e) => setBookingSettings((s) => ({ ...s, slot_minutes: Number(e.target.value) || s.slot_minutes }))}
                      className="h-10"
                    />
                  </label>
                </div>
              </section>
            </div>
          )}

          {/* Tab Content: Pricing & Game Types */}
          {activeTab === 'pricing' && !loading && (
            <section className="rounded-xl border border-border/50 bg-card/40 p-5 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-border/30 pb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pricing & Game Types</h3>
                  <p className="text-xs text-muted-foreground">
                    Add categories of games (like PS5, Snooker, PC) and define their hourly or duration pricing grid.
                  </p>
                </div>
                <Button onClick={addCustomGameType} variant="outline" size="sm" className="gap-2 rounded-xl h-10 font-bold shrink-0">
                  <Plus size={16} /> Add New Game Type
                </Button>
              </div>

              {/* Dynamic Game Types Pricing */}
              {Object.keys(pricingConfig).length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/10">
                  <p className="text-sm text-muted-foreground">No game types added yet. Add your first one to start billing.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.keys(pricingConfig)
                    .map(key => (
                      <div key={key} className="border-t border-border/30 pt-6 first:border-0 first:pt-0">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-primary uppercase tracking-wider">{key.replace(/_/g, ' ')}</div>
                            <div className="text-[10px] text-muted-foreground">Manage durations and prices</div>
                          </div>
                          <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 h-8 rounded-xl px-3 text-xs font-bold" onClick={() => removeCustomGameType(key)}>
                            Remove Game Type
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="grid grid-cols-[140px_140px_1fr] gap-4 px-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Duration (Min)</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Price (₹)</span>
                          </div>

                          {Object.entries(pricingConfig[key] || {})
                            .sort(([a], [b]) => Number(a) - Number(b))
                            .map(([duration, price]) => (
                              <div key={`${key}-${duration}`} className="grid grid-cols-[140px_140px_auto] gap-4 items-center">
                                <Input
                                  type="number"
                                  className="h-10 font-mono"
                                  value={duration}
                                  onChange={(e) => updateDurationMinutes(key, duration, e.target.value)}
                                  placeholder="Mins"
                                />
                                <Input
                                  type="number"
                                  className="h-10 font-mono"
                                  value={price}
                                  onChange={(e) =>
                                    setPricingConfig((p) => ({
                                      ...p,
                                      [key]: { ...p[key], [duration]: Number(e.target.value) || 0 },
                                    }))
                                  }
                                  placeholder="₹"
                                />
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl"
                                  onClick={() => removeDuration(key, duration)}
                                >
                                  <Trash2 size={15} />
                                </Button>
                              </div>
                            ))}
                          
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="mt-2 text-xs h-9 gap-2 border border-dashed border-border hover:bg-muted/50 rounded-xl px-4"
                            onClick={() => addDuration(key)}
                          >
                            <Plus size={15} /> Add Timing
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </section>
          )}

          {/* Tab Content: Loyalty Rules */}
          {activeTab === 'loyalty' && !loading && (
            <section className="rounded-xl border border-border/50 bg-card/40 p-5 backdrop-blur-sm space-y-6">
              <div className="flex items-center justify-between border-b border-border/30 pb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Loyalty Points System</h3>
                  <p className="text-xs text-muted-foreground">
                    Configure how customers earn and redeem loyalty points across the entire application.
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-muted/20 px-4 py-2.5 rounded-xl border border-border/30">
                  <span className="text-xs font-bold text-foreground">Enable Loyalty Program</span>
                  <button
                    type="button"
                    onClick={() => setLoyaltySettings(s => ({ ...s, enabled: !s.enabled }))}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      loyaltySettings.enabled ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        loyaltySettings.enabled ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>

              {!loyaltySettings.enabled ? (
                <div className="text-center py-10 border border-dashed border-border/60 rounded-xl bg-muted/10 space-y-2">
                  <p className="text-sm font-bold text-muted-foreground">Loyalty Points Program is currently disabled.</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto font-medium">
                    Toggle the switch above to enable point earnings, redemptions, and tracker details across the entire system.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4 rounded-xl bg-muted/20 p-4 border border-border/30">
                    <div className="text-xs font-bold text-primary uppercase tracking-wider">Earning Rules</div>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex flex-col gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Points to earn</span>
                        <Input
                          type="number"
                          value={loyaltySettings.earn_rate_points}
                          onChange={(e) => setLoyaltySettings(s => ({ ...s, earn_rate_points: Number(e.target.value) || 0 }))}
                          className="h-10"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Per minutes played</span>
                        <Input
                          type="number"
                          value={loyaltySettings.earn_rate_minutes}
                          onChange={(e) => setLoyaltySettings(s => ({ ...s, earn_rate_minutes: Number(e.target.value) || 0 }))}
                          className="h-10"
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic font-medium">
                      * Active setting: {loyaltySettings.earn_rate_points} loyalty points for every {loyaltySettings.earn_rate_minutes} minutes played.
                    </p>
                  </div>

                  <div className="space-y-4 rounded-xl bg-muted/20 p-4 border border-border/30">
                    <div className="text-xs font-bold text-purple-500 uppercase tracking-wider">Redemption Rules</div>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex flex-col gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Points to redeem</span>
                        <Input
                          type="number"
                          value={loyaltySettings.redeem_rate_points}
                          onChange={(e) => setLoyaltySettings(s => ({ ...s, redeem_rate_points: Number(e.target.value) || 0 }))}
                          className="h-10"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">For free minutes</span>
                        <Input
                          type="number"
                          value={loyaltySettings.redeem_rate_minutes}
                          onChange={(e) => setLoyaltySettings(s => ({ ...s, redeem_rate_minutes: Number(e.target.value) || 0 }))}
                          className="h-10"
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic font-medium">
                      * Active setting: {loyaltySettings.redeem_rate_points} loyalty points gives {loyaltySettings.redeem_rate_minutes} minutes free.
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Add Game Type Dialog */}
        <Dialog open={isAddGameTypeOpen} onOpenChange={setIsAddGameTypeOpen}>
          <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-xl border-border/50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus size={18} className="text-primary" />
                Add New Game Type
              </DialogTitle>
              <DialogDescription>
                Enter the name for the new game category. This will create a new duration-based pricing grid.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Game Type Name</label>
                <Input 
                  placeholder="e.g. PC Gaming, Foosball, Table Tennis" 
                  value={newGameTypeName}
                  onChange={e => setNewGameTypeName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmAddGameType()}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAddGameTypeOpen(false)}>Cancel</Button>
              <Button onClick={confirmAddGameType} disabled={!newGameTypeName.trim()}>Add Game Type</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <DialogContent className="sm:max-w-[400px] bg-background/95 backdrop-blur-xl border-border/50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle size={20} />
                {deleteConfirm?.title}
              </DialogTitle>
              <DialogDescription className="py-4 text-sm text-muted-foreground">
                {deleteConfirm?.description}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (deleteConfirm?.type === 'station') executeRemoveStation(deleteConfirm.id);
                  else if (deleteConfirm?.type === 'gametype') executeRemoveGameType(deleteConfirm.id);
                }}
              >
                Confirm Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Account Deletion Confirmation Dialog */}
        <Dialog open={isDeleteAccountOpen} onOpenChange={(open) => { if (!open) setIsDeleteAccountOpen(false); }}>
          <DialogContent className="sm:max-w-[440px] bg-background/95 backdrop-blur-xl border-destructive/30">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert size={20} />
                Delete Account Permanently
              </DialogTitle>
              <DialogDescription className="py-2 text-sm text-muted-foreground leading-relaxed">
                This will <strong className="text-foreground">permanently delete</strong> your cafe <strong className="text-foreground">{tenant?.name || 'Unknown'}</strong> and all associated data including:
                <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                  <li>All customer records and loyalty points</li>
                  <li>All booking history</li>
                  <li>All bills and transaction records</li>
                  <li>All inventory and product records</li>
                  <li>All stations and pricing settings</li>
                  <li>Your authentication credentials</li>
                </ul>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Type <span className="text-destructive font-mono">{tenant?.name || 'cafe name'}</span> to confirm
              </label>
              <Input
                placeholder={tenant?.name || 'Cafe name'}
                value={deleteAccountConfirmText}
                onChange={(e) => setDeleteAccountConfirmText(e.target.value)}
                className="h-10 border-destructive/30 focus:border-destructive"
                autoComplete="off"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setIsDeleteAccountOpen(false)} disabled={deletingAccount}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteAccountConfirmText !== (tenant?.name || '') || deletingAccount}
                onClick={async () => {
                  setDeletingAccount(true);
                  try {
                    const { error } = await supabase.rpc('self_delete_user');
                    if (error) throw error;
                    toast.success('Account deleted. Goodbye!');
                    await supabase.auth.signOut();
                    onLogout?.();
                  } catch (err: any) {
                    toast.error('Failed to delete account: ' + (err?.message || 'Unknown error'));
                  } finally {
                    setDeletingAccount(false);
                    setIsDeleteAccountOpen(false);
                  }
                }}
              >
                {deletingAccount ? 'Deleting...' : 'Permanently Delete Everything'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {activeTab !== 'account' && (
          <div className="fixed inset-x-0 bottom-[70px] z-40 border-t border-border/50 bg-background/90 p-3 backdrop-blur-xl md:hidden">
            <Button className="w-full" onClick={saveAll} disabled={saving || loading}>
              {saving ? 'Saving...' : 'Save all changes'}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
