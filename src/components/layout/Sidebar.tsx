import { useEffect, useState } from 'react';
import {
  CalendarCheck2,
  Users,
  Home,
  LogOut,
  Settings,
  Package,
  BarChart2,
  LayoutDashboard,
  Settings2,
  User,
  Lock,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Home, label: 'Billing' },
  { icon: CalendarCheck2, label: 'Bookings' },
  { icon: Users, label: 'Customers' },
  { icon: Package, label: 'Inventory' },
  { icon: BarChart2, label: 'Reports' },
  { icon: Settings, label: 'Settings' },
];

export function Sidebar({
  active = 'Billing',
  onNavigate,
  onLogout,
}: {
  active?: string;
  onNavigate?: (label: string) => void;
  onLogout?: () => void;
}) {
  const [user, setUser] = useState<{ email?: string; name: string } | null>(null);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const currentName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User';
        setUser({
          email: authUser.email,
          name: currentName,
        });
      }
    };
    getProfile();

    const handleAccountUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.name) {
        setUser((prev) => prev ? { ...prev, name: customEvent.detail.name } : null);
      }
    };
    window.addEventListener('account-profile-updated', handleAccountUpdate);
    return () => window.removeEventListener('account-profile-updated', handleAccountUpdate);
  }, []);

  return (
    <>
      <nav className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-border/50 bg-background/60 p-4 backdrop-blur-xl md:flex z-50">
        <div className="mb-8 px-2">
          <Logo size="md" />
        </div>

        <div className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onNavigate?.(item.label)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold tracking-wide transition-all',
                item.label === active
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.2)]'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-border/40 space-y-3">
          {/* Profile Card */}
          {user && (
            <button
              onClick={() => onNavigate?.('Settings')}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-muted/40 transition-all border border-transparent hover:border-border/30 group"
              type="button"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-purple-600 text-sm font-extrabold text-white shadow-md shadow-primary/20">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-black group-hover:text-primary transition-colors text-foreground">{user.name}</div>
                <div className="truncate text-[10px] text-muted-foreground font-mono">{user.email}</div>
              </div>
              <Settings2 size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          <Button
            className="w-full justify-start gap-3 rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all"
            variant="outline"
            onClick={onLogout}
            type="button"
          >
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </nav>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-7 gap-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onNavigate?.(item.label)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[11px] font-semibold',
                item.label === active ? 'bg-primary/15 text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
