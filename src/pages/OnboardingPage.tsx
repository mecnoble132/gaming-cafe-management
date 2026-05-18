import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import { DEFAULT_SETTINGS, Station } from '@/lib/bookings';
import { GamePricingConfig } from '@/lib/pricing';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Clock, Gamepad2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { markTenantOnboardingComplete } from '@/lib/onboarding';

const STEPS = ['Welcome', 'Stations', 'Hours'] as const;

type StationTypeEntry = {
  id: string;
  type: string;
  quantity: number;
};

function normalizeStationType(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '_');
}

function expandStations(entries: StationTypeEntry[]): Station[] {
  const stations: Station[] = [];
  for (const entry of entries) {
    const label = entry.type.trim();
    const slug = normalizeStationType(label);
    const count = Math.max(0, Math.floor(entry.quantity));
    if (!slug || count < 1) continue;

    for (let i = 0; i < count; i++) {
      stations.push({
        id: `draft-${slug}-${i}`,
        name: `${label} ${i + 1}`,
        type: slug,
      });
    }
  }
  return stations;
}

export default function OnboardingPage({ onComplete }: { onComplete: () => void }) {
  const { tenant, refresh } = useTenant();
  const [step, setStep] = useState(0);
  const [cafeName, setCafeName] = useState(tenant?.name === 'My Gaming Cafe' ? '' : tenant?.name ?? '');
  const [stationTypes, setStationTypes] = useState<StationTypeEntry[]>([
    { id: 'entry-0', type: '', quantity: 1 },
  ]);
  const [bookingSettings, setBookingSettings] = useState(DEFAULT_SETTINGS);
  const [pricesByType, setPricesByType] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(tenant?.id ?? null);
  const [bookingSettingsId, setBookingSettingsId] = useState<string | null>(null);
  const [pricingSettingsId, setPricingSettingsId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Setup · CoreControl';
  }, []);

  useEffect(() => {
    const load = async () => {
      const [{ data: profile }, { data: bookingRow }] = await Promise.all([
        supabase.from('profiles').select('tenant_id').single(),
        supabase.from('booking_settings').select('id,opening_time,closing_time,slot_minutes').maybeSingle(),
      ]);
      if (profile?.tenant_id) setTenantId(profile.tenant_id);
      if (bookingRow) {
        setBookingSettingsId(bookingRow.id);
        setBookingSettings({
          opening_time: bookingRow.opening_time,
          closing_time: bookingRow.closing_time,
          slot_minutes: bookingRow.slot_minutes,
        });
      }
      const { data: pricingRow } = await supabase.from('pricing_settings').select('id').maybeSingle();
      if (pricingRow) setPricingSettingsId(pricingRow.id);
    };
    load();
  }, []);

  const plannedStations = useMemo(() => expandStations(stationTypes), [stationTypes]);
  const gameTypes = useMemo(
    () => [...new Set(plannedStations.map((s) => s.type))],
    [plannedStations]
  );

  const typeLabels = useMemo(() => {
    const labels = new Map<string, string>();
    for (const entry of stationTypes) {
      const slug = normalizeStationType(entry.type);
      if (slug) labels.set(slug, entry.type.trim());
    }
    return labels;
  }, [stationTypes]);

  useEffect(() => {
    setPricesByType((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const type of gameTypes) {
        if (!(type in next)) {
          next[type] = '';
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [gameTypes]);

  const canContinue = step === 0 ? cafeName.trim().length > 0 : true;

  const addStationType = () => {
    setStationTypes((prev) => [...prev, { id: `entry-${Date.now()}`, type: '', quantity: 1 }]);
  };

  const updateStationType = (id: string, patch: Partial<Pick<StationTypeEntry, 'type' | 'quantity'>>) => {
    setStationTypes((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  };

  const removeStationType = (id: string) => {
    setStationTypes((prev) => (prev.length <= 1 ? prev : prev.filter((entry) => entry.id !== id)));
  };

  const updatePriceForType = (type: string, value: string) => {
    setPricesByType((prev) => ({ ...prev, [type]: value }));
  };

  const buildPricingConfig = (): GamePricingConfig => {
    const config: GamePricingConfig = {};
    for (const type of gameTypes) {
      const hourly = Number(pricesByType[type]) || 0;
      if (hourly <= 0) continue;
      config[type] = {
        '60': hourly,
        '30': Math.round(hourly / 2),
        '90': Math.round(hourly * 1.5),
      };
    }
    return config;
  };

  const finishOnboarding = async () => {
    if (!tenantId) {
      toast.error('Cafe profile not ready. Please try again.');
      return;
    }

    setSaving(true);
    try {
      const stationPayload = plannedStations.map((station) => ({
        id: `STN-${crypto.randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase()}`,
        name: station.name.trim() || station.type.toUpperCase(),
        type: station.type,
        tenant_id: tenantId,
      }));

      if (stationPayload.length > 0) {
        const { error: stationError } = await supabase.from('stations').insert(stationPayload);
        if (stationError) throw stationError;
      }

      const { error: bookingError } = await supabase.from('booking_settings').upsert({
        id: bookingSettingsId || undefined,
        ...bookingSettings,
        tenant_id: tenantId,
      });
      if (bookingError) throw bookingError;

      const pricingConfig = buildPricingConfig();
      if (Object.keys(pricingConfig).length > 0) {
        const { error: pricingError } = await supabase.from('pricing_settings').upsert({
          id: pricingSettingsId || undefined,
          config: pricingConfig,
          tenant_id: tenantId,
        });
        if (pricingError) throw pricingError;
      }

      await markTenantOnboardingComplete(tenantId, cafeName.trim());

      await refresh();
      toast.success('Your cafe is ready to go!');
      onComplete();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete setup.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    await finishOnboarding();
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (canContinue) void handleNext();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" className="mb-6" />
          <h1 className="text-2xl font-bold tracking-tight">Set up your gaming cafe</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            A quick setup so you can start billing, booking, and tracking customers right away.
          </p>
        </div>

        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((label, index) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  index < step
                    ? 'bg-primary text-primary-foreground'
                    : index === step
                      ? 'bg-primary/20 text-primary ring-2 ring-primary'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {index < step ? <Check size={14} /> : index + 1}
              </div>
              <span
                className={cn(
                  'hidden text-xs font-medium sm:inline',
                  index === step ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
              {index < STEPS.length - 1 ? (
                <div className={cn('mx-1 h-px w-6 sm:w-10', index < step ? 'bg-primary' : 'bg-border')} />
              ) : null}
            </div>
          ))}
        </div>

        <Card className="border-border/60 bg-background/60 shadow-lg shadow-primary/5">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-primary">
                    <Sparkles size={20} />
                    <h2 className="text-lg font-semibold">Welcome aboard</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    What should we call your cafe? This appears across your dashboard and receipts.
                  </p>
                  <label className="flex flex-col gap-2.5">
                    <span className="text-xs font-medium text-muted-foreground">Cafe name</span>
                    <Input
                      placeholder="e.g. Neon Arena Gaming Lounge"
                      value={cafeName}
                      onChange={(e) => setCafeName(e.target.value)}
                      autoFocus
                      required
                    />
                  </label>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-primary">
                    <Gamepad2 size={20} />
                    <h2 className="text-lg font-semibold">Your stations</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add each station type you have and how many. You can rename individual stations later in Settings.
                  </p>

                  <div className="space-y-2">
                    {stationTypes.map((entry) => (
                      <div
                        key={entry.id}
                        className="grid grid-cols-1 gap-2 rounded-lg border border-border/60 p-3 sm:grid-cols-[1fr_100px_auto]"
                      >
                        <label className="flex flex-col gap-2.5">
                          <span className="text-xs font-medium text-muted-foreground">Station type</span>
                          <Input
                            placeholder="e.g. PS5, PC, VR"
                            value={entry.type}
                            onChange={(e) => updateStationType(entry.id, { type: e.target.value })}
                          />
                        </label>
                        <label className="flex flex-col gap-2.5">
                          <span className="text-xs font-medium text-muted-foreground">Count</span>
                          <Input
                            type="number"
                            min={1}
                            max={99}
                            value={entry.quantity}
                            onChange={(e) =>
                              updateStationType(entry.id, {
                                quantity: Math.max(1, Math.min(99, Number(e.target.value) || 1)),
                              })
                            }
                          />
                        </label>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => removeStationType(entry.id)}
                            disabled={stationTypes.length <= 1}
                            aria-label="Remove station type"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button type="button" variant="outline" size="sm" onClick={addStationType} className="gap-1">
                    <Plus size={14} />
                    Add another type
                  </Button>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-primary">
                    <Clock size={20} />
                    <h2 className="text-lg font-semibold">Business hours & pricing</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Set your opening hours and an hourly rate (60 min) for each station type.
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-2.5">
                      <span className="text-xs font-medium text-muted-foreground">Opening time</span>
                      <Input
                        type="time"
                        value={bookingSettings.opening_time}
                        onChange={(e) =>
                          setBookingSettings((s) => ({ ...s, opening_time: e.target.value }))
                        }
                      />
                    </label>
                    <label className="flex flex-col gap-2.5">
                      <span className="text-xs font-medium text-muted-foreground">Closing time</span>
                      <Input
                        type="time"
                        value={bookingSettings.closing_time}
                        onChange={(e) =>
                          setBookingSettings((s) => ({ ...s, closing_time: e.target.value }))
                        }
                      />
                    </label>
                  </div>
                  {gameTypes.length > 0 ? (
                    <div className="space-y-3">
                      <span className="text-xs font-medium text-muted-foreground">
                        Price per hour (₹) — 60 min session
                      </span>
                      <div className="space-y-2">
                        {gameTypes.map((type) => (
                          <div
                            key={type}
                            className="flex flex-col gap-3 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:gap-3"
                          >
                            <span className="min-w-0 flex-1 text-sm font-medium">
                              {typeLabels.get(type) ?? type.replace(/_/g, ' ')}
                            </span>
                            <div className="flex items-center gap-2 sm:w-36">
                              <Input
                                type="number"
                                min={0}
                                placeholder="0"
                                value={pricesByType[type] ?? ''}
                                onChange={(e) => updatePriceForType(type, e.target.value)}
                              />
                              <span className="shrink-0 text-xs text-muted-foreground">/ hr</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        30 and 90 minute prices are calculated from the hourly rate. Adjust anytime in Settings.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Add stations in the previous step to configure pricing, or set it up later in Settings.
                    </p>
                  )}
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  disabled={step === 0 || saving}
                  className="gap-1"
                >
                  <ArrowLeft size={16} />
                  Back
                </Button>
                <div className="flex gap-2">
                  {step === 1 ? (
                    <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={saving}>
                      Skip stations
                    </Button>
                  ) : null}
                  <Button type="submit" disabled={!canContinue || saving} className="gap-1">
                    {saving ? 'Saving...' : step === STEPS.length - 1 ? 'Finish setup' : 'Continue'}
                    {step < STEPS.length - 1 && !saving ? <ArrowRight size={16} /> : null}
                    {step === STEPS.length - 1 && !saving ? <Check size={16} /> : null}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Step {step + 1} of {STEPS.length} · You can change everything later in Settings
        </p>
      </div>
    </div>
  );
}
