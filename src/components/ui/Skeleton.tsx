import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded bg-muted/40 backdrop-blur-sm', className)}
      {...props}
    />
  );
}

export function SkeletonDashboardPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block w-64 border-r border-border/50 bg-background/50 h-screen" />
      <div className="flex-1 p-4 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between pb-4 border-b border-border/30">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
        
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 p-4 bg-card/40 space-y-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        {/* Stations/Grid Area Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/50 p-5 bg-card/40 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-24 rounded-lg" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-8 w-20 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonBillingPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block w-64 border-r border-border/50 bg-background/50 h-screen" />
      <div className="flex-1 space-y-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3.5 w-40" />
          </div>
        </div>

        {/* Customer Strip */}
        <div className="h-14 w-full rounded-xl border border-border/50 bg-card/30 flex items-center px-4 justify-between">
          <div className="flex items-center gap-3 w-1/3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>

        {/* Main Columns */}
        <div className="flex flex-col gap-4 lg:flex-row items-start">
          {/* Tabs and Cards list */}
          <div className="flex-1 space-y-4 w-full">
            <div className="flex gap-2 border-b border-border/40 pb-2">
              <Skeleton className="h-8 w-20 rounded" />
              <Skeleton className="h-8 w-20 rounded" />
              <Skeleton className="h-8 w-20 rounded" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/50 p-3 bg-card/30 space-y-3">
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </div>

          {/* Checkout Drawer Summary */}
          <div className="w-full lg:w-1/3 h-[500px] rounded-xl border border-border/50 bg-card/30 p-4 space-y-4 shrink-0">
            <Skeleton className="h-6 w-32" />
            <SeparatorSkeleton />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <SeparatorSkeleton />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonBookingsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block w-64 border-r border-border/50 bg-background/50 h-screen" />
      <div className="flex-1 p-4 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border/30">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <div className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-10 w-20 shrink-0" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonCustomersPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block w-64 border-r border-border/50 bg-background/50 h-screen" />
      <div className="flex-1 p-4 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border/30">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-14 w-40 rounded-xl" />
          <Skeleton className="h-14 w-40 rounded-xl" />
        </div>
        <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
          <div className="p-4 bg-muted/20 flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-border/10">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-7 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonInventoryPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block w-64 border-r border-border/50 bg-background/50 h-screen" />
      <div className="flex-1 p-4 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border/30">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 p-4 bg-card/30 space-y-3">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-4 w-32" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-8 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonReportsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block w-64 border-r border-border/50 bg-background/50 h-screen" />
      <div className="flex-1 p-4 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border/30">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-border/50 bg-card/30 p-5 space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-[280px] w-full rounded-lg" />
          </div>
          <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonSettingsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block w-64 border-r border-border/50 bg-background/50 h-screen" />
      <div className="flex-1 p-4 space-y-6">
        <div className="pb-4 border-b border-border/30">
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex gap-2 border-b border-border/40 pb-2 overflow-x-auto">
          <Skeleton className="h-8 w-28 shrink-0 rounded" />
          <Skeleton className="h-8 w-24 shrink-0 rounded" />
          <Skeleton className="h-8 w-32 shrink-0 rounded" />
          <Skeleton className="h-8 w-28 shrink-0 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-border/50 bg-card/30 p-5 space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-2xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SeparatorSkeleton() {
  return <div className="h-[1px] w-full bg-border/40 my-2 animate-pulse" />;
}
