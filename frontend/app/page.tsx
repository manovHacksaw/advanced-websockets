'use client'
import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { MatchCard } from '@/components/MatchCard'
import { Radio } from 'lucide-react'
import { cn } from '@/lib/utils'

const ALL = 'all'

export default function HomePage() {
  const matches = useStore(s => s.matches)
  const status = useStore(s => s.connectionStatus)
  const [activeSport, setActiveSport] = useState(ALL)

  const sports = [ALL, ...Array.from(new Set(matches.map(m => m.sport.toLowerCase())))]

  const filtered = activeSport === ALL
    ? matches
    : matches.filter(m => m.sport.toLowerCase() === activeSport)

  const live = filtered.filter(m => m.status === 'live')
  const upcoming = filtered.filter(m => m.status === 'scheduled')
  const finished = filtered.filter(m => m.status === 'finished')

  if (status === 'connecting' && matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-100 border-t-emerald-500 animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-xl">⚽</span>
        </div>
        <p className="text-sm text-gray-500 font-medium">Connecting to live feed…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sport filter pills */}
      {sports.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          {sports.map(sport => (
            <button
              key={sport}
              onClick={() => setActiveSport(sport)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize',
                activeSport === sport
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700'
              )}
            >
              {sport === ALL ? '🏆 All' : sport}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <span className="text-5xl">🏟️</span>
          <p className="text-base font-semibold text-gray-700">No matches yet</p>
          <p className="text-sm text-gray-400">New matches will appear here automatically</p>
        </div>
      )}

      {live.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Radio size={14} className="text-red-500 animate-pulse" />
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Live Now</h2>
            <span className="text-[11px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full leading-none">{live.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {live.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Upcoming</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      {finished.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Results</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {finished.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}
    </div>
  )
}
