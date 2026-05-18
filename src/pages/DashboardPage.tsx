import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  Users, 
  AlertCircle, 
  Plus, 
  ArrowRight,
  IndianRupee,
  ShoppingBag
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getRouteByLabel } from '@/lib/navigation';

type DashboardData = {
  revenueToday: number;
  revenueYesterday: number;
  newCustomersToday: number;
  totalCustomers: number;
  lowStockItems: any[];
  recentBills: any[];
  revenueHistory: any[];
};

export default function DashboardPage({
  onNavigate,
  onLogout,
}: {
  onNavigate?: (next: 'dashboard' | 'billing' | 'bookings' | 'settings' | 'inventory' | 'customers' | 'reports') => void;
  onLogout?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    revenueToday: 0,
    revenueYesterday: 0,
    newCustomersToday: 0,
    totalCustomers: 0,
    lowStockItems: [],
    recentBills: [],
    revenueHistory: [],
  });

  useEffect(() => {
    document.title = 'Dashboard · CoreControl';
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      const today = new Date();
      const yesterday = subDays(today, 1);

      const [
        { data: allCustomers },
        { data: customersToday },
        { data: billsToday },
        { data: billsYesterday },
        { data: lowStockProducts },
        { data: recentBills },
        { data: historyBills }
      ] = await Promise.all([
        supabase.from('customers').select('id'),
        supabase.from('customers').select('id').gte('created_at', startOfDay(today).toISOString()),
        supabase.from('bills').select('grand_total').gte('created_at', startOfDay(today).toISOString()).lte('created_at', endOfDay(today).toISOString()),
        supabase.from('bills').select('grand_total').gte('created_at', startOfDay(yesterday).toISOString()).lte('created_at', endOfDay(yesterday).toISOString()),
        supabase.from('products').select('*').lt('stock_quantity', 5).limit(3),
        supabase.from('bills').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('bills').select('grand_total, created_at').gte('created_at', subDays(today, 7).toISOString())
      ]);

      const revToday = billsToday?.reduce((sum, b) => sum + b.grand_total, 0) || 0;
      const revYesterday = billsYesterday?.reduce((sum, b) => sum + b.grand_total, 0) || 0;

      const historyMap: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        historyMap[format(subDays(today, i), 'MMM dd')] = 0;
      }
      historyBills?.forEach(b => {
        const dateKey = format(new Date(b.created_at), 'MMM dd');
        if (historyMap[dateKey] !== undefined) {
          historyMap[dateKey] += b.grand_total;
        }
      });

      const revenueHistory = Object.entries(historyMap)
        .map(([name, total]) => ({ name, revenue: total }))
        .reverse();

      setData({
        revenueToday: revToday,
        revenueYesterday: revYesterday,
        newCustomersToday: customersToday?.length || 0,
        totalCustomers: allCustomers?.length || 0,
        lowStockItems: lowStockProducts || [],
        recentBills: recentBills || [],
        revenueHistory,
      });
      setLoading(false);
    };

    loadDashboard();
  }, []);

  const revenueGrowth = data.revenueYesterday > 0 
    ? Math.round(((data.revenueToday - data.revenueYesterday) / data.revenueYesterday) * 100)
    : 0;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        active="Dashboard"
        onNavigate={(next) => {
          const route = getRouteByLabel(next);
          if (route) onNavigate?.(route);
        }}
        onLogout={onLogout}
      />
      <main className="flex-1 pb-24 md:ml-64 md:pb-0">
        <PageHeader title="Command Center" />

        <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6">
          {loading ? (
             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-32 bg-muted/20 rounded-xl border border-border/50"></div>
                ))}
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-border/50 bg-card/60 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today's Revenue</p>
                      <h3 className="mt-1 text-2xl font-bold text-foreground">₹{data.revenueToday.toLocaleString()}</h3>
                      <p className={cn("mt-2 text-xs font-bold flex items-center gap-1", revenueGrowth >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth}% <span className="font-normal text-muted-foreground">vs yesterday</span>
                      </p>
                    </div>
                    <div className="rounded-xl bg-primary/10 p-3 text-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]">
                      <IndianRupee size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/60 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer Traffic</p>
                      <h3 className="mt-1 text-2xl font-bold text-foreground">{data.newCustomersToday} <span className="text-sm font-normal text-muted-foreground">New Today</span></h3>
                      <p className="mt-2 text-xs font-bold text-muted-foreground">
                        {data.totalCustomers} total members
                      </p>
                    </div>
                    <div className="rounded-xl bg-orange-500/10 p-3 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                      <Users size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/60 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => onNavigate?.('billing')} className="h-8 flex-1 min-w-[80px] gap-1 text-[10px] font-bold uppercase tracking-tight">
                          <Plus size={12} /> Bill
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onNavigate?.('bookings')} className="h-8 flex-1 min-w-[80px] gap-1 text-[10px] font-bold uppercase tracking-tight border-primary/30 text-primary hover:bg-primary/5">
                          <Plus size={12} /> Book
                        </Button>
                      </div>
                    </div>
                    <div className="ml-4 rounded-xl bg-blue-500/10 p-3 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                      <TrendingUp size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/60 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inventory Status</p>
                      <h3 className="mt-1 text-2xl font-bold text-foreground">{data.lowStockItems.length > 0 ? data.lowStockItems.length : 'All OK'}</h3>
                      <p className={cn("mt-2 text-xs font-bold", data.lowStockItems.length > 0 ? "text-red-400" : "text-emerald-400")}>
                        {data.lowStockItems.length > 0 ? 'Items below threshold' : 'Stock levels healthy'}
                      </p>
                    </div>
                    <div className={cn("rounded-xl p-3 shadow-lg", data.lowStockItems.length > 0 ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500")}>
                      <AlertCircle size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="border-border/50 bg-card/60 backdrop-blur-xl lg:col-span-2">
              <CardContent className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-sm font-bold tracking-tight text-foreground">Revenue Trend (Last 7 Days)</h3>
                  <Button variant="ghost" size="sm" onClick={() => onNavigate?.('reports')} className="text-xs text-muted-foreground hover:text-primary">
                    Full Report <ArrowRight size={14} className="ml-1" />
                  </Button>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.revenueHistory}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#ffffff10', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: 'var(--primary)' }} />
                      <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-border/50 bg-card/60 backdrop-blur-xl">
                <CardContent className="p-6">
                  <h3 className="mb-4 text-sm font-bold tracking-tight text-foreground">Low Stock Alerts</h3>
                  <div className="space-y-4">
                    {data.lowStockItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <ShoppingBag size={32} className="mb-2 text-muted-foreground/30" />
                        <p className="text-xs text-muted-foreground">All items fully stocked</p>
                      </div>
                    ) : (
                      data.lowStockItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/20 p-3">
                          <div>
                            <p className="text-xs font-bold text-foreground">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground">{item.category}</p>
                          </div>
                          <Badge variant="outline" className="border-red-500/50 text-red-400 text-[10px]">
                            {item.stock_quantity} left
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                  <Button variant="outline" className="mt-4 w-full text-xs font-bold h-9" onClick={() => onNavigate?.('inventory')}>
                    Manage Inventory
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/60 backdrop-blur-xl">
                <CardContent className="p-6">
                  <h3 className="mb-4 text-sm font-bold tracking-tight text-foreground">Recent Bills</h3>
                  <div className="space-y-3">
                    {data.recentBills.length === 0 ? (
                      <p className="py-6 text-center text-xs text-muted-foreground">No recent transactions</p>
                    ) : (
                      data.recentBills.map((bill) => (
                        <div key={bill.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-foreground">{bill.customer_name}</p>
                            <p className="text-[10px] text-muted-foreground">{format(new Date(bill.created_at), 'hh:mm a')}</p>
                          </div>
                          <p className="text-xs font-bold text-primary">₹{bill.grand_total}</p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
