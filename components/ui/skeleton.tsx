'use client'

import React from 'react'
import { cn } from '@/lib/utils'

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      'animate-pulse rounded-lg bg-muted/60',
      className
    )} />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      {/* Header skeleton */}
      <div className="card-glass rounded-xl p-5">
        <div className="flex flex-wrap gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-2.5">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sensor cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <Skeleton className="w-5 h-5 rounded-full" />
            </div>
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-1 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* Branch skeleton */}
      <div className="card-glass rounded-xl p-5">
        <Skeleton className="h-5 w-40 mb-5" />
        <Skeleton className="h-10 w-full rounded-full mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-6 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-5">
        {[1, 2].map(i => (
          <div key={i} className="card-glass rounded-xl p-5 space-y-3">
            <Skeleton className="h-5 w-32" />
            {[1, 2, 3, 4].map(j => (
              <Skeleton key={j} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
