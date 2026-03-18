'use client'
import { useEffect, useRef } from 'react'
import type { CommentaryEntry } from '@/types'
import { cn, timeAgo } from '@/lib/utils'

interface CommentaryItemProps {
  entry: CommentaryEntry
  isNew?: boolean
}

export function CommentaryItem({ entry, isNew }: CommentaryItemProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isNew && entry.meta.isHighlight && ref.current) {
      ref.current.classList.add('animate-highlight-pulse')
      const t = setTimeout(() => ref.current?.classList.remove('animate-highlight-pulse'), 1200)
      return () => clearTimeout(t)
    }
  }, [isNew, entry.meta.isHighlight])

  if (entry.meta.isHighlight) {
    return (
      <div
        ref={ref}
        className={cn(
          'mx-3 my-2 rounded-xl border px-4 py-3 transition-all',
          isNew && 'animate-slide-in',
          entry.meta.bgClass,
          entry.meta.borderClass,
        )}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0 leading-none mt-0.5">{entry.meta.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('text-[11px] font-bold uppercase tracking-wider', entry.meta.textClass)}>
                {entry.meta.label}
              </span>
              <span className="text-[11px] text-gray-400">·</span>
              <span className={cn('text-[11px] font-bold', entry.meta.textClass)}>{entry.minute}&apos;</span>
              {entry.period && (
                <span className="text-[10px] text-gray-400 capitalize">{entry.period.replace(/_/g, ' ')}</span>
              )}
            </div>
            <p className={cn('text-sm font-semibold leading-relaxed', entry.meta.textClass)}>
              {entry.message}
            </p>
            {(entry.actor || entry.team) && (
              <p className="text-xs text-gray-500 mt-1">
                {[entry.actor, entry.team].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">{timeAgo(entry.createdAt)}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors',
        isNew && 'animate-slide-in'
      )}
    >
      {/* Timeline */}
      <div className="flex flex-col items-center shrink-0 w-9 pt-0.5">
        <span className="text-xs font-bold text-gray-500 tabular-nums">{entry.minute}&apos;</span>
        <div className={cn('w-1.5 h-1.5 rounded-full mt-1', entry.meta.dotClass)} />
      </div>

      <span className="text-base shrink-0 leading-none mt-0.5">{entry.meta.icon}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 leading-relaxed">{entry.message}</p>
        {(entry.actor || entry.team) && (
          <p className="text-[11px] text-gray-400 mt-0.5">
            {[entry.actor, entry.team].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">{timeAgo(entry.createdAt)}</span>
    </div>
  )
}
