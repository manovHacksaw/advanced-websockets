export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error'

export interface RawMatch {
  id: number
  sport: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  status: 'scheduled' | 'live' | 'finished'
  startTime: string
  endTime?: string | null
  createdAt: string
}

export interface RawCommentary {
  id: number
  matchId: number
  minute: number
  sequence: number
  period?: string
  eventType: string
  actor?: string
  team?: string
  message: string
  metadata?: Record<string, unknown>
  tags?: string[]
  createdAt: string
}

export interface TeamInfo {
  name: string
  abbreviation: string
  logoUrl: string
  color: string
}

export interface EnrichedMatch {
  id: number
  sport: string
  teamA: TeamInfo
  teamB: TeamInfo
  homeScore: number
  awayScore: number
  status: 'scheduled' | 'live' | 'finished'
  startTime: string
  endTime?: string | null
  createdAt: string
}

export interface EventMeta {
  icon: string
  label: string
  isHighlight: boolean
  bgClass: string
  textClass: string
  borderClass: string
  dotClass: string
}

export interface CommentaryEntry {
  id: number
  matchId: number
  minute: number
  sequence: number
  period: string
  eventType: string
  actor?: string
  team?: string
  message: string
  createdAt: string
  meta: EventMeta
}

export interface PendingSubscription {
  matchId: number
  type: 'match' | 'commentary'
  action: 'subscribe' | 'unsubscribe'
}

export interface RawMessage {
  id: string
  timestamp: string
  direction: 'inbound' | 'outbound'
  payload: unknown
}

export interface WSMessage {
  type: string
  matchId?: number
  data?: unknown
}
