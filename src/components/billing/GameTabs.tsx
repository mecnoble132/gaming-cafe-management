import { useEffect, useMemo, useState } from 'react';
import { 
  Gamepad2, 
  Search,
  Coffee,
  CheckCircle2,
  Plus,
  PackageSearch,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BillItem, Product } from '@/types';
import { Input } from '@/components/ui/input';
import { GamePricingConfig, normalizePricingConfig } from '@/lib/pricing';

interface GameTabsProps {
  onAddItem: (item: Omit<BillItem, 'id' | 'bill_id'>) => void;
  products: Product[];
  productQuantityById: Record<string, number>;
  pricingConfig?: GamePricingConfig;
}

export function GameTabs({ onAddItem, products, productQuantityById, pricingConfig = {} }: GameTabsProps) {
  const [snacksSearch, setSnacksSearch] = useState('');
  const [customDurations, setCustomDurations] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<string>('');
  const effectivePricing = normalizePricingConfig(pricingConfig);

  const gameTypes = useMemo(() => {
    return Object.keys(effectivePricing).filter(k => Object.keys(effectivePricing[k]).length > 0);
  }, [effectivePricing]);

  // Auto-select the first game type (e.g. "pc") once pricing loads
  useEffect(() => {
    if (gameTypes.length > 0 && (!activeTab || !gameTypes.includes(activeTab) && activeTab !== 'snacks')) {
      setActiveTab(gameTypes[0]);
    }
  }, [gameTypes]);

  const getPoints = (minutes: number) => Math.floor(minutes / 30) * 5;

  const addSnack = (product: Product) => {
    const inBillQty = productQuantityById[product.id] ?? 0;
    const available = product.stock_quantity - inBillQty;
    if (available <= 0) return;
    onAddItem({
      item_type: 'product',
      item_name: product.name,
      quantity: 1,
      unit_price: product.mrp,
      total_price: product.mrp,
      metadata: {
        product_id: product.id,
        category: product.category,
        low_stock: product.stock_quantity <= product.low_stock_threshold,
      },
    });
  };

  const filteredProducts = useMemo(() => {
    const q = snacksSearch.toLowerCase();
    return products
      .filter((product) => !q || product.name.toLowerCase().includes(q) || product.category.toLowerCase().includes(q))
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }, [products, snacksSearch]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="bg-muted/20 backdrop-blur-md w-full justify-start overflow-x-auto flex-nowrap gap-2 sm:gap-3 p-1.5 sm:p-2 border border-border/50 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {gameTypes.map(type => (
          <TabsTrigger key={type} value={type} className="shrink-0 min-w-[108px] sm:min-w-[120px] h-10 sm:h-11 rounded-md px-4 sm:px-5 font-semibold tracking-wide text-xs sm:text-sm whitespace-nowrap transition-all duration-200 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_12px_rgba(var(--primary),0.25)]">
            <Gamepad2 size={18} className="mr-2" /> {type.replace(/_/g, ' ').toUpperCase()}
          </TabsTrigger>
        ))}
        <TabsTrigger value="snacks" className="shrink-0 min-w-[108px] sm:min-w-[120px] h-10 sm:h-11 rounded-md px-4 sm:px-5 font-semibold tracking-wide text-xs sm:text-sm whitespace-nowrap transition-all duration-200 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_12px_rgba(var(--primary),0.25)]">
          <Coffee size={18} className="mr-2" /> Snacks
        </TabsTrigger>
      </TabsList>

      <div className="mt-4">
        {gameTypes.map(type => (
          <TabsContent key={type} value={type} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border border-border bg-card shadow-sm rounded-lg overflow-visible">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                    <Gamepad2 className="text-primary" size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-foreground uppercase">{type.replace(/_/g, ' ')}</h3>
                    <p className="text-xs font-medium text-muted-foreground tracking-wide">Select duration</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold tracking-wide text-muted-foreground flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Duration
                    </label>
                    <Select value={customDurations[type] ?? ''} onValueChange={(val) => setCustomDurations(prev => ({ ...prev, [type]: val }))}>
                      <SelectTrigger className="h-10 text-sm font-medium rounded-md bg-background border-border focus-visible:ring-ring/50">
                        <SelectValue placeholder="How many minutes?" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
                        {Object.keys(effectivePricing[type] || {})
                          .filter(min => effectivePricing[type][min] > 0)
                          .sort((a, b) => Number(a) - Number(b))
                          .map((min) => (
                            <SelectItem key={min} value={min}>
                              {min} Minutes (₹{effectivePricing[type][min] ?? 0})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="bg-muted/30 border border-border rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold tracking-tight text-primary">
                        ₹{customDurations[type] ? (effectivePricing[type][customDurations[type]] ?? 0) : 0}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground tracking-wide">Estimated Total</span>
                    </div>
                    {customDurations[type] && (
                      <p className="text-xs font-semibold text-primary tracking-wide flex items-center gap-1">
                        <CheckCircle2 size={12} /> +{getPoints(Number(customDurations[type]))} GG pts
                      </p>
                    )}
                  </div>
                  <Button 
                    size="lg" 
                    disabled={!customDurations[type]} 
                    className="w-full sm:w-auto h-10 px-4 text-sm font-semibold tracking-wide rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.99]"
                    onClick={() => {
                      const duration = Number(customDurations[type]);
                      const price = effectivePricing[type][customDurations[type]] ?? 0;
                      onAddItem({
                        item_type: 'session',
                        item_name: `${type.replace(/_/g, ' ').toUpperCase()} Session`,
                        quantity: 1,
                        unit_price: price,
                        total_price: price,
                        metadata: { duration_minutes: duration, game_type: type }
                      });
                      setCustomDurations(prev => ({ ...prev, [type]: '' }));
                    }}
                  >
                    Add {type.replace(/_/g, ' ')} <Plus size={16} className="ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="snacks" className="animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              value={snacksSearch}
              onChange={(e) => setSnacksSearch(e.target.value)}
              className="pl-9 h-10 transition-all duration-300 focus:bg-background focus:border-primary/40 focus:ring-[4px] focus:ring-primary/10 focus:shadow-[0_0_20px_rgba(var(--primary),0.1)] outline-none"
              placeholder="Search snacks and drinks"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const inBillQty = productQuantityById[product.id] ?? 0;
              const available = product.stock_quantity - inBillQty;
              const isOut = available <= 0;
              const isLow = product.stock_quantity <= product.low_stock_threshold;
              return (
                <button
                  key={product.id}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border bg-card/50 transition-all text-center gap-1 group ${
                    isOut ? 'opacity-40 cursor-not-allowed' : 'hover:border-primary/50 active:scale-95'
                  }`}
                  disabled={isOut}
                  onClick={() => addSnack(product)}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{product.category}</span>
                  <span className="text-sm font-bold">{product.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">₹{product.mrp}</span>
                  {isOut ? (
                    <Badge variant="outline">Out of stock</Badge>
                  ) : isLow ? (
                    <Badge variant="outline" className="text-amber-600 border-amber-500/50">Low</Badge>
                  ) : null}
                </button>
              );
            })}
            <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed bg-card/30 text-center gap-1 text-muted-foreground">
              <PackageSearch size={18} />
              <span className="text-sm font-semibold">Search more</span>
            </button>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
