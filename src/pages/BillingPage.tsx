import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { CustomerStrip } from '@/components/billing/CustomerStrip';
import { GameTabs } from '@/components/billing/GameTabs';
import { BillSummary } from '@/components/billing/BillSummary';
import { Customer, BillItem, Product } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { DEFAULT_PRICING_CONFIG, GamePricingConfig, normalizePricingConfig } from '@/lib/pricing';
import { DEFAULT_LOYALTY_SETTINGS } from '@/lib/loyalty';
import { LoyaltySettings } from '@/types';
import { getRouteByLabel } from '@/lib/navigation';



export default function BillingPage({
  onNavigate,
  onLogout,
}: {
  onNavigate?: (next: 'dashboard' | 'billing' | 'bookings' | 'settings' | 'inventory' | 'customers' | 'reports') => void;
  onLogout?: () => void;
}) {
  useEffect(() => { document.title = 'Billing · CoreControl'; }, []);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [pricingConfig, setPricingConfig] = useState<GamePricingConfig>(DEFAULT_PRICING_CONFIG);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings>(DEFAULT_LOYALTY_SETTINGS);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const { data: profile } = await supabase.from('profiles').select('tenant_id').single();
      if (profile) setTenantId(profile.tenant_id);

      const { data: pricingData } = await supabase.from('pricing_settings').select('config').maybeSingle();
      if (pricingData?.config) setPricingConfig(normalizePricingConfig(pricingData.config));

      const { data: productData } = await supabase.from('products').select('*').order('name');
      if (productData && productData.length > 0) setProducts(productData);

      const { data: customerData } = await supabase.from('customers').select('*').order('name');
      if (customerData) setCustomers(customerData);

      const { data: loyaltyData } = await supabase.from('loyalty_settings').select('*').maybeSingle();
      if (loyaltyData) setLoyaltySettings(loyaltyData as LoyaltySettings);
    };
    loadData();
  }, []);

  // Handle prefill from Bookings
  useEffect(() => {
    if (customers.length > 0) {
      const raw = window.localStorage.getItem('gg_billing_prefill_v1');
      if (raw) {
        try {
          const prefill = JSON.parse(raw);
          const customer = customers.find(c => c.id === prefill.customer_id);
          if (customer) {
            setSelectedCustomer(customer);
            
            let price = 0;
            const type = prefill.game_type;
            const mins = prefill.duration_minutes;
            const ctrl = prefill.controllers || 2;
            
            if (pricingConfig[type]) {
              price = pricingConfig[type][String(mins)] || 0;
            }

            if (price > 0 || type) {
              const newItem: BillItem = {
                id: crypto.randomUUID(),
                bill_id: 'current',
                item_name: `${type.toUpperCase()} - ${prefill.station_name} (${mins}m)`,
                item_type: 'session',
                quantity: 1,
                unit_price: price,
                total_price: price,
                metadata: { 
                  game_type: type, 
                  duration_minutes: mins, 
                  controllers: ctrl,
                  station_name: prefill.station_name
                }
              };
              setBillItems([newItem]);
              toast.success(`Prefilled booking for ${customer.name}`);
            }
          }
          window.localStorage.removeItem('gg_billing_prefill_v1');
        } catch (e) {
          console.error('Prefill error:', e);
        }
      }
    }
  }, [customers, pricingConfig]);

  const addItem = (item: Omit<BillItem, 'id' | 'bill_id'>) => {
    const newItem: BillItem = { ...item, id: crypto.randomUUID(), bill_id: 'current' };
    if (item.item_type === 'product') {
      setBillItems((prev) => {
        const existing = prev.find((i) => i.item_type === 'product' && i.item_name === item.item_name);
        if (existing) {
          return prev.map((i) => i.id === existing.id
            ? { ...i, quantity: i.quantity + item.quantity, total_price: (i.quantity + item.quantity) * i.unit_price, metadata: { ...i.metadata, ...item.metadata } }
            : i);
        }
        return [...prev, newItem];
      });
    } else {
      setBillItems(prev => [...prev, newItem]);
    }
  };

  const removeItem = (id: string) => setBillItems(prev => prev.filter(i => i.id !== id));

  const updateQuantity = (id: string, delta: number) => {
    setBillItems(prev => prev.map(i => {
      if (i.id === id && i.item_type === 'product') {
        const product = products.find(p => p.id === i.metadata?.product_id);
        const newQty = Math.max(0, i.quantity + delta);
        if (newQty === 0) return i;
        if (delta > 0 && product && newQty > product.stock_quantity) {
          toast.error(`Only ${product.stock_quantity} units available`);
          return i;
        }
        return { ...i, quantity: newQty, total_price: newQty * i.unit_price };
      }
      return i;
    }));
  };

  const productQuantityById = billItems.reduce<Record<string, number>>((acc, item) => {
    if (item.item_type === 'product' && item.metadata?.product_id) {
      acc[item.metadata.product_id] = (acc[item.metadata.product_id] ?? 0) + item.quantity;
    }
    return acc;
  }, {});

  const createCustomer = async (payload: { name?: string; phone: string; whatsapp_number?: string }) => {
    const { data: existing } = await supabase.from('customers').select('*').eq('phone', payload.phone).maybeSingle();
    if (existing) {
      setCustomers((prev) => prev.map(c => c.id === existing.id ? (existing as Customer) : c));
      setSelectedCustomer(existing as Customer);
      toast.success(`Welcome back, ${existing.name || existing.phone}!`);
      return;
    }

    const created = {
      id: `CUS-${crypto.randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase()}`,
      name: payload.name || payload.phone,
      phone: payload.phone,
      whatsapp_number: payload.whatsapp_number || payload.phone,
      loyalty_points: 0,
      visits: 0,
    };

    const { data: newCustomer, error } = await supabase.from('customers').insert({ ...created, ...(tenantId ? { tenant_id: tenantId } : {}) }).select().single();
    if (error || !newCustomer) {
      toast.error(`Failed to save new customer: ${error?.message || 'Unknown error'}`);
      return;
    }
    setCustomers((prev) => [newCustomer as Customer, ...prev]);
    setSelectedCustomer(newCustomer as Customer);
    toast.success(`Customer created · ${newCustomer.id}`);
  };

  /** Generate a short ID locally (matches the DB pattern BILL-XXXXXX) */
  const generateLocalId = (prefix: string) =>
    `${prefix}-${crypto.randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase()}`;

  const handleFinalize = async ({
    paymentMethod, subtotal, discount, grandTotal, pointsEarned, pointsRedeemed, isUnlinked,
  }: {
    paymentMethod: 'cash' | 'upi' | 'card';
    subtotal: number; discount: number; grandTotal: number;
    pointsEarned: number; pointsRedeemed: number; isUnlinked: boolean;
  }) => {
    // 1. Ensure linked customer if required
    if (!selectedCustomer && !isUnlinked) {
      toast.error('Please select or create a customer first');
      return;
    }

    const customerIdVal = (isUnlinked ? null : selectedCustomer?.id) || null;
    const customerNameVal = (isUnlinked ? 'Cash Customer' : (selectedCustomer?.name || selectedCustomer?.phone)) || 'Cash Customer';
    const customerPhoneVal = (isUnlinked ? null : selectedCustomer?.phone) || null;
    const ptsEarned = isUnlinked ? 0 : (pointsEarned || 0);
    const ptsRedeemed = isUnlinked ? 0 : (pointsRedeemed || 0);

    if (!tenantId) {
      toast.error('Session not ready — please refresh the page and try again.');
      return;
    }

    try {
      // ── Step 1: Create the bill record ──
      const billId = generateLocalId('BILL');
      const { error: billError } = await supabase.from('bills').insert({
        id: billId,
        tenant_id: tenantId,
        customer_id: customerIdVal,
        customer_name: customerNameVal,
        customer_phone: customerPhoneVal,
        payment_method: paymentMethod,
        subtotal: Math.round(subtotal) || 0,
        discount: Math.round(discount) || 0,
        grand_total: Math.round(grandTotal) || 0,
        points_earned: ptsEarned,
        points_redeemed: ptsRedeemed,
        items: billItems || [],
      });

      if (billError) throw new Error(billError.message);

      // ── Step 2: Decrement stock for product items ──
      for (const item of billItems) {
        if (item.item_type === 'product' && item.metadata?.product_id) {
          const product = products.find(p => p.id === item.metadata?.product_id);
          if (product) {
            const newQty = Math.max(0, product.stock_quantity - item.quantity);
            await supabase.from('products')
              .update({ stock_quantity: newQty })
              .eq('id', item.metadata.product_id);
          }
        }
      }

      // ── Step 3: Update customer loyalty points & visits ──
      if (customerIdVal && selectedCustomer) {
        const newPoints = Math.max(0, (selectedCustomer.loyalty_points || 0) + ptsEarned - ptsRedeemed);
        const newVisits = (selectedCustomer.visits || 0) + 1;
        await supabase.from('customers')
          .update({ loyalty_points: newPoints, visits: newVisits })
          .eq('id', customerIdVal);
      }

      // ── Step 4: Refresh local state ──
      const { data: freshProducts } = await supabase.from('products').select('*').order('name');
      if (freshProducts) setProducts(freshProducts);

      if (selectedCustomer && !isUnlinked) {
        const { data: updatedCustomerData } = await supabase
          .from('customers')
          .select('*')
          .eq('id', selectedCustomer.id)
          .single();

        if (updatedCustomerData) {
          setCustomers((prev) => prev.map((c) => (c.id === selectedCustomer.id ? updatedCustomerData : c)));
        }
      }

      const customerDisplay = selectedCustomer?.name || selectedCustomer?.phone || 'Cash Customer';
      toast.success(`Bill finalized · ₹${Math.round(grandTotal)} · ${customerDisplay}`);
      if (selectedCustomer?.whatsapp_number) toast.info(`WhatsApp queued to ${selectedCustomer.whatsapp_number}`);

      setBillItems([]);
      setSelectedCustomer(null);

    } catch (err: any) {
      toast.error(`Failed to finalize bill: ${err.message}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        active="Billing"
        onNavigate={(label) => {
          const route = getRouteByLabel(label);
          if (route) onNavigate?.(route);
        }}
        onLogout={onLogout}
      />
      <main className="flex-1 pb-24 md:ml-64 md:pb-0 overflow-x-hidden">
        <PageHeader title="Billing" />
        <CustomerStrip
          selectedCustomer={selectedCustomer}
          allCustomers={customers}
          onClearCustomer={() => setSelectedCustomer(null)}
          onSelectCustomer={setSelectedCustomer}
          onCreateCustomer={createCustomer}
        />
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 p-3 sm:p-4 lg:flex-row items-start">
          <div className="flex-1 lg:w-2/3 flex flex-col gap-4 w-full min-w-0">
            <GameTabs onAddItem={addItem} products={products} productQuantityById={productQuantityById} pricingConfig={pricingConfig} />
          </div>
          <div className="w-full lg:w-1/3 lg:min-w-[380px] lg:sticky lg:top-20">
            <BillSummary
              items={billItems}
              customer={selectedCustomer}
              loyaltySettings={loyaltySettings}
              onRemoveItem={removeItem}
              onUpdateQuantity={updateQuantity}
              onFinalize={handleFinalize}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
