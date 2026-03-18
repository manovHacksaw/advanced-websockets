'use client'
import Link from 'next/link'
import type { EnrichedMatch } from '@/types'
import { TeamLogo } from './TeamLogo'
import { StatusBadge } from './StatusBadge'
import { formatMatchTime, formatMatchDate } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'

const SPORT_EMOJI: Record<string, string> = {
  football: '⚽', soccer: '⚽', tennis: '🎾',
  cricket: '🏏', basketball: '🏀', baseball: '⚾',
  rugby: '🏉', hockey: '🏑',
}

interface MatchCardProps {
  match: EnrichedMatch
  isNew?: boolean
}

export function MatchCard({ match, isNew }: MatchCardProps) {
  const sportEmoji = SPORT_EMOJI[match.sport.toLowerCase()] ?? '🏆'
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  const showScore = isLive || isFinished

  return (
    <Link href={`/matches/${match.id}`}>
      <div className={`group relative bg-white rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer ${isNew ? 'animate-slide-in' : ''} ${isLive ? 'border-red-200' : 'border-gray-100'}`}>

        {/* Color accent bar */}
        <div
          className="h-1 w-full"
          style={{
            background: `linear-gradient(90deg, ${match.teamA.color} 0%, ${match.teamB.color} 100%)`,
          }}
        />

        {/* Sport + status row */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            {sportEmoji} {match.sport}
          </span>
          <StatusBadge status={match.status} />
        </div>

        {/* Teams */}
        <div className="px-4 pb-3 space-y-2.5">
          {/* Team A */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <TeamLogo team={match.teamA} size="sm" />
              <span className={`text-sm font-semibold truncate ${isLive ? 'text-gray-900' : 'text-gray-700'}`}>
                {match.teamA.name}
              </span>
            </div>
            {showScore && (
              <span className={`text-xl font-black tabular-nums ml-2 ${match.homeScore > match.awayScore ? 'text-gray-900' : 'text-gray-400'}`}>
                {match.homeScore}
              </span>
            )}
          </div>

          {/* Team B */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <TeamLogo team={match.teamB} size="sm" />
              <span className={`text-sm font-semibold truncate ${isLive ? 'text-gray-900' : 'text-gray-700'}`}>
                {match.teamB.name}
              </span>
            </div>
            {showScore && (
              <span className={`text-xl font-black tabular-nums ml-2 ${match.awayScore > match.homeScore ? 'text-gray-900' : 'text-gray-400'}`}>
                {match.awayScore}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-100">
          <span className="text-[11px] text-gray-400 font-medium">
            {match.status === 'scheduled'
              ? `${formatMatchDate(match.startTime)} · ${formatMatchTime(match.startTime)}`
              : match.status === 'live'
              ? 'In progress'
              : `FT · ${formatMatchDate(match.startTime)}`}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 group-hover:text-emerald-500 transition-colors">
            View <ArrowRight size={11} />
          </span>
        </div>
      </div>
    </Link>
  )
}
