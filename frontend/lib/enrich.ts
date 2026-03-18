import type { RawMatch, RawCommentary, EnrichedMatch, CommentaryEntry, TeamInfo } from '@/types'
import { getEventMeta } from './eventMeta'
import { nameToHex } from './utils'

function getAbbreviation(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return name.slice(0, 3).toUpperCase()
  return words.map(w => w[0]).join('').slice(0, 3).toUpperCase()
}

function buildTeamInfo(name: string): TeamInfo {
  const abbreviation = getAbbreviation(name)
  const hex = nameToHex(name)
  const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(abbreviation)}&size=128&background=${hex}&color=fff&bold=true&format=svg`
  return { name, abbreviation, logoUrl, color: `#${hex}` }
}

export function enrichMatch(raw: RawMatch): EnrichedMatch {
  return {
    id: raw.id,
    sport: raw.sport,
    teamA: buildTeamInfo(raw.homeTeam),
    teamB: buildTeamInfo(raw.awayTeam),
    homeScore: raw.homeScore ?? 0,
    awayScore: raw.awayScore ?? 0,
    status: raw.status,
    startTime: raw.startTime,
    endTime: raw.endTime,
    createdAt: raw.createdAt,
  }
}

export function enrichCommentary(raw: RawCommentary): CommentaryEntry {
  return {
    id: raw.id,
    matchId: raw.matchId,
    minute: raw.minute,
    sequence: raw.sequence ?? 0,
    period: raw.period ?? '',
    eventType: raw.eventType,
    actor: raw.actor,
    team: raw.team,
    message: raw.message,
    createdAt: raw.createdAt,
    meta: getEventMeta(raw.eventType),
  }
}
