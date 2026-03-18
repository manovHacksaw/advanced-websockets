import type { EnrichedMatch } from '@/types'
import { TeamLogo } from './TeamLogo'
import { StatusBadge } from './StatusBadge'
import { formatMatchDate, formatMatchTime } from '@/lib/utils'

interface ScoreBoardProps {
  match: EnrichedMatch
}

export function ScoreBoard({ match }: ScoreBoardProps) {
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  const showScore = isLive || isFinished
  const homeWin = match.homeScore > match.awayScore
  const awayWin = match.awayScore > match.homeScore

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gray-900">
      {/* Team color gradient strip at top */}
      <div
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${match.teamA.color}, ${match.teamB.color})` }}
      />

      {/* Live glow effect */}
      {isLive && (
        <div
          className="absolute inset-0 opacity-10 pointer-events-none rounded-2xl"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${match.teamA.color}, transparent 70%)` }}
        />
      )}

      <div className="relative px-6 py-6">
        {/* Status + sport */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <StatusBadge status={match.status} />
          <span className="text-xs font-medium capitalize text-gray-500">{match.sport}</span>
          {!showScore && (
            <span className="text-xs text-gray-500">
              · {formatMatchDate(match.startTime)}, {formatMatchTime(match.startTime)}
            </span>
          )}
        </div>

        {/* Teams + score */}
        <div className="flex items-center justify-between gap-4">
          {/* Team A */}
          <div className="flex flex-col items-center gap-2.5 flex-1">
            <TeamLogo team={match.teamA} size="lg" />
            <span className={`text-sm font-bold text-center leading-tight ${isFinished && homeWin ? 'text-white' : 'text-gray-300'}`}>
              {match.teamA.name}
            </span>
            {isFinished && homeWin && (
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Winner</span>
            )}
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-1 shrink-0 min-w-[100px]">
            {showScore ? (
              <>
                <div className="flex items-center gap-4">
                  <span className={`text-5xl font-black tabular-nums ${homeWin ? 'text-white' : isFinished ? 'text-gray-500' : 'text-white'}`}>
                    {match.homeScore}
                  </span>
                  <span className="text-2xl font-light text-gray-600">:</span>
                  <span className={`text-5xl font-black tabular-nums ${awayWin ? 'text-white' : isFinished ? 'text-gray-500' : 'text-white'}`}>
                    {match.awayScore}
                  </span>
                </div>
                {isFinished && (
                  <span className="text-[11px] text-gray-500 font-medium mt-1 uppercase tracking-wider">Full Time</span>
                )}
                {isLive && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[11px] text-red-400 font-semibold uppercase tracking-wider">Live</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-white">{formatMatchTime(match.startTime)}</span>
                <span className="text-xs text-gray-500 mt-1">{formatMatchDate(match.startTime)}</span>
              </div>
            )}
          </div>

          {/* Team B */}
          <div className="flex flex-col items-center gap-2.5 flex-1">
            <TeamLogo team={match.teamB} size="lg" />
            <span className={`text-sm font-bold text-center leading-tight ${isFinished && awayWin ? 'text-white' : 'text-gray-300'}`}>
              {match.teamB.name}
            </span>
            {isFinished && awayWin && (
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Winner</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
