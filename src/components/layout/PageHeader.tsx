import { ReactNode, useEffect, useState } from 'react';
import { Logo } from './Logo';
import { useTenant } from '@/hooks/useTenant';
import { supabase } from '@/lib/supabase';

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
}

export function PageHeader({ title, actions }: PageHeaderProps) {
  const { tenant } = useTenant();
  const [initial, setInitial] = useState('U');

  useEffect(() => {
    const getInitial = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.full_name || user.email || 'User';
        setInitial(name.slice(0, 1).toUpperCase());
      }
    };
    getInitial();

    const handleAccountUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.name) {
        setInitial(customEvent.detail.name.slice(0, 1).toUpperCase());
      }
    };
    window.addEventListener('account-profile-updated', handleAccountUpdate);
    return () => window.removeEventListener('account-profile-updated', handleAccountUpdate);
  }, []);
  
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 md:px-6">
      <div className="flex items-center gap-4">
        <Logo size="sm" iconOnly className="md:hidden" />
        <div className="flex flex-col">
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground leading-tight">{title}</h2>
          {tenant?.name && (
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.15em] leading-none">
              {tenant.name}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar py-1">
        {actions}
        
        {/* Mobile Profile Trigger */}
        <button
          onClick={() => window.dispatchEvent(new Event('open-account-settings'))}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-purple-600 text-xs font-black text-white shadow-md shadow-primary/20 shrink-0 hover:scale-95 active:scale-90 transition-transform"
          title="Account Settings"
          type="button"
        >
          {initial}
        </button>
      </div>
    </header>
  );
}
