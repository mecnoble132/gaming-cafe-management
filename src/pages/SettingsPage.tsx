import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';

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

  useEffect(() => {
    document.title = 'Settings · CoreControl';
  }, []);

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
      setLoading(false);
    };
    load();
  }, []);

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
            <Button onClick={saveAll} disabled={saving || loading}>
              {saving ? 'Saving...' : 'Save all changes'}
            </Button>
          }
        />

        <div className="mx-auto w-full max-w-[1600px] space-y-4 p-3 sm:p-4">
          {loading ? <div className="rounded-md border border-border/50 bg-background/40 p-4 text-sm text-muted-foreground">Loading settings...</div> : null}

          <section className="rounded-md border border-border/50 bg-background/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Stations ({totalStations})</h3>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={addStation}>
                  Add station
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {stations.map((station) => (
                <div key={station.id} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_140px_90px]">
                  <Input
                    placeholder="Station ID (example: ps5-4)"
                    value={station.id}
                    onChange={(e) => setStations((prev) => prev.map((x) => (x.id === station.id ? { ...x, id: e.target.value } : x)))}
                    disabled={!station.isNew}
                  />
                  <Input
                    placeholder="Station name"
                    value={station.name}
                    onChange={(e) => setStations((prev) => prev.map((x) => (x.id === station.id ? { ...x, name: e.target.value } : x)))}
                  />
                  <select
                    className="h-10 rounded-md border border-input bg-background px-2 text-sm"
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
                  <Button size="sm" variant="destructive" onClick={() => removeStation(station.id, station.isNew)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-border/50 bg-background/40 p-4">
            <h3 className="mb-3 text-sm font-semibold">Booking timings</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              These timings control when customers can book slots and the slot size used in the bookings calendar.
            </p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <label className="flex flex-col gap-2.5">
                <span className="text-xs font-medium text-muted-foreground">Opening time</span>
                <Input
                  type="time"
                  value={bookingSettings.opening_time}
                  onChange={(e) => setBookingSettings((s) => ({ ...s, opening_time: e.target.value }))}
                />
              </label>
                  <label className="flex flex-col gap-2.5">
                <span className="text-xs font-medium text-muted-foreground">Closing time</span>
                <Input
                  type="time"
                  value={bookingSettings.closing_time}
                  onChange={(e) => setBookingSettings((s) => ({ ...s, closing_time: e.target.value }))}
                />
              </label>
                  <label className="flex flex-col gap-2.5">
                <span className="text-xs font-medium text-muted-foreground">Slot length (minutes)</span>
                <Input
                  type="number"
                  min={5}
                  value={bookingSettings.slot_minutes}
                  onChange={(e) => setBookingSettings((s) => ({ ...s, slot_minutes: Number(e.target.value) || s.slot_minutes }))}
                />
              </label>
            </div>
          </section>

          <section className="rounded-md border border-border/50 bg-background/40 p-4">
            <h3 className="mb-3 text-sm font-semibold">Pricing & Game Types</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Add different categories of games (like PS5, Snooker, etc.) and define their pricing by duration.
            </p>

            <div className="mb-6">
              <Button onClick={addCustomGameType} variant="outline" size="sm" className="gap-2">
                <Plus size={16} /> Add New Game Type
              </Button>
            </div>

            {/* Dynamic Game Types Pricing */}
            {Object.keys(pricingConfig).length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-lg bg-muted/10">
                <p className="text-sm text-muted-foreground">No game types added yet. Add your first one to start billing.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.keys(pricingConfig)
                  .map(key => (
                    <div key={key} className="border-t border-border/30 pt-6 first:border-0 first:pt-0">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{key.replace(/_/g, ' ')}</div>
                          <div className="text-[11px] text-muted-foreground">Manage durations and prices</div>
                        </div>
                        <Button size="sm" variant="ghost" className="text-destructive h-7 text-[10px]" onClick={() => removeCustomGameType(key)}>
                          Remove Game Type
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="grid grid-cols-[120px_120px_1fr] gap-4 px-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Duration (Min)</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Price (₹)</span>
                        </div>

                        {Object.entries(pricingConfig[key] || {})
                          .sort(([a], [b]) => Number(a) - Number(b))
                          .map(([duration, price]) => (
                            <div key={`${key}-${duration}`} className="grid grid-cols-[120px_120px_auto] gap-4 items-center">
                              <Input
                                type="number"
                                className="h-9 font-mono"
                                value={duration}
                                onChange={(e) => updateDurationMinutes(key, duration, e.target.value)}
                                placeholder="Mins"
                              />
                              <Input
                                type="number"
                                className="h-9 font-mono"
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
                                className="h-9 w-9 text-destructive hover:bg-destructive/10"
                                onClick={() => removeDuration(key, duration)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          ))}
                        
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="mt-2 text-[11px] h-8 gap-2 border border-dashed border-border hover:bg-muted/50"
                          onClick={() => addDuration(key)}
                        >
                          <Plus size={14} /> Add Timing
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>

          <section className="rounded-md border border-border/50 bg-background/40 p-4">
            <h3 className="mb-3 text-sm font-semibold text-secondary">GG Points System</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Configure how customers earn and redeem GG points. All sessions earn points based on duration.
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Earning Rules</div>
                <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-2.5">
                    <span className="text-[11px] font-medium text-muted-foreground">Points to earn</span>
                    <Input
                      type="number"
                      value={loyaltySettings.earn_rate_points}
                      onChange={(e) => setLoyaltySettings(s => ({ ...s, earn_rate_points: Number(e.target.value) || 0 }))}
                    />
                  </label>
                      <label className="flex flex-col gap-2.5">
                    <span className="text-[11px] font-medium text-muted-foreground">Per minutes played</span>
                    <Input
                      type="number"
                      value={loyaltySettings.earn_rate_minutes}
                      onChange={(e) => setLoyaltySettings(s => ({ ...s, earn_rate_minutes: Number(e.target.value) || 0 }))}
                    />
                  </label>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  Example: {loyaltySettings.earn_rate_points} points for every {loyaltySettings.earn_rate_minutes} minutes.
                </p>
              </div>

              <div className="space-y-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Redemption Rules</div>
                <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-2.5">
                    <span className="text-[11px] font-medium text-muted-foreground">Points to redeem</span>
                    <Input
                      type="number"
                      value={loyaltySettings.redeem_rate_points}
                      onChange={(e) => setLoyaltySettings(s => ({ ...s, redeem_rate_points: Number(e.target.value) || 0 }))}
                    />
                  </label>
                      <label className="flex flex-col gap-2.5">
                    <span className="text-[11px] font-medium text-muted-foreground">For free minutes</span>
                    <Input
                      type="number"
                      value={loyaltySettings.redeem_rate_minutes}
                      onChange={(e) => setLoyaltySettings(s => ({ ...s, redeem_rate_minutes: Number(e.target.value) || 0 }))}
                    />
                  </label>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  Example: {loyaltySettings.redeem_rate_points} points gives {loyaltySettings.redeem_rate_minutes} minutes free.
                </p>
              </div>
            </div>
          </section>
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

        <div className="fixed inset-x-0 bottom-[70px] z-40 border-t border-border/50 bg-background/90 p-3 backdrop-blur-xl md:hidden">
          <Button className="w-full" onClick={saveAll} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save all changes'}
          </Button>
        </div>
      </main>
    </div>
  );
}
