'use client'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, MessageSquare } from 'lucide-react'
import type { CommentaryEntry } from '@/types'
import { CommentaryItem } from './CommentaryItem'

interface CommentaryFeedProps {
  entries: CommentaryEntry[]
  loading?: boolean
}

export function CommentaryFeed({ entries, loading }: CommentaryFeedProps) {
  const topRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef(entries.length)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [newEntryIds, setNewEntryIds] = useState<Set<number>>(new Set())

  // Track newly added entries for animation
  useEffect(() => {
    if (entries.length > prevLengthRef.current) {
      const addedIds = entries
        .slice(0, entries.length - prevLengthRef.current)
        .map(e => e.id)
      setNewEntryIds(new Set(addedIds))
      // Auto scroll to top (newest)
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      // Clear new markers after animation
      const t = setTimeout(() => setNewEntryIds(new Set()), 1500)
      prevLengthRef.current = entries.length
      return () => clearTimeout(t)
    }
    prevLengthRef.current = entries.length
  }, [entries.length])

  const handleScroll = () => {
    if (containerRef.current) {
      setShowScrollTop(containerRef.current.scrollTop > 200)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-10 h-8 bg-gray-100 rounded" />
            <div className="flex-1">
              <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-2 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <MessageSquare size={32} className="text-gray-200 mb-3" />
        <p className="text-sm font-medium text-gray-500">No commentary yet</p>
        <p className="text-xs text-gray-400 mt-1">Updates will appear here in real-time</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-y-auto max-h-[600px] divide-y divide-gray-50"
      >
        <div ref={topRef} />
        {entries.map(entry => (
          <CommentaryItem
            key={entry.id}
            entry={entry}
            isNew={newEntryIds.has(entry.id)}
          />
        ))}
      </div>

      {showScrollTop && (
        <button
          onClick={() => topRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-white border border-gray-200 shadow-md text-xs text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-all"
        >
          <ChevronDown size={12} className="rotate-180" />
          Latest
        </button>
      )}
    </div>
  )
}
