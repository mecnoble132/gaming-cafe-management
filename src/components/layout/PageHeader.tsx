import { ReactNode } from 'react';
import { Logo } from './Logo';
import { useTenant } from '@/hooks/useTenant';

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
}

export function PageHeader({ title, actions }: PageHeaderProps) {
  const { tenant } = useTenant();
  
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
      </div>
    </header>
  );
}
