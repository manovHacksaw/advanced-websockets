import { create } from 'zustand'
import type {
  EnrichedMatch,
  CommentaryEntry,
  ConnectionStatus,
  PendingSubscription,
  RawMessage,
  WSMessage,
} from '@/types'
import { enrichMatch, enrichCommentary } from '@/lib/enrich'
import { wsManager } from '@/lib/websocket'

const MAX_COMMENTARY = 100
const MAX_RAW_MESSAGES = 50

interface AppState {
  // Connection
  connectionStatus: ConnectionStatus
  reconnectAttempt: number

  // Data
  matches: EnrichedMatch[]
  commentary: Record<number, CommentaryEntry[]>

  // Subscriptions (arrays for reactivity)
  subscribedMatchIds: number[]
  subscribedCommentaryIds: number[]
  pendingSubscriptions: PendingSubscription[]

  // UI
  selectedMatchId: number | null

  // Dev
  rawMessages: RawMessage[]

  // Derived selectors
  getMatchById: (id: number) => EnrichedMatch | undefined
  isSubscribedToMatch: (id: number) => boolean
  isSubscribedToCommentary: (id: number) => boolean
  isPending: (matchId: number, type: 'match' | 'commentary') => boolean
  getCommentaryForMatch: (id: number) => CommentaryEntry[]

  // Actions
  setConnectionStatus: (status: ConnectionStatus, attempt?: number) => void
  handleWSMessage: (message: WSMessage) => void
  logOutbound: (payload: unknown) => void
  subscribeToMatch: (matchId: number) => void
  unsubscribeFromMatch: (matchId: number) => void
  subscribeToCommentary: (matchId: number) => void
  unsubscribeFromCommentary: (matchId: number) => void
  setSelectedMatch: (id: number | null) => void
  seedMatches: (matches: RawMatch[]) => void
  seedCommentary: (matchId: number, entries: RawCommentary[]) => void
  simulateEvent: (eventType: string, matchId: number) => void
  clearCommentary: (matchId: number) => void
}

// Inline raw types for seeding (avoid circular dependency)
interface RawMatch {
  id: number; sport: string; homeTeam: string; awayTeam: string
  homeScore: number; awayScore: number; status: 'scheduled' | 'live' | 'finished'
  startTime: string; endTime?: string | null; createdAt: string
}
interface RawCommentary {
  id: number; matchId: number; minute: number; sequence: number
  period?: string; eventType: string; actor?: string; team?: string
  message: string; createdAt: string
}

export const useStore = create<AppState>((set, get) => ({
  connectionStatus: 'connecting',
  reconnectAttempt: 0,
  matches: [],
  commentary: {},
  subscribedMatchIds: [],
  subscribedCommentaryIds: [],
  pendingSubscriptions: [],
  selectedMatchId: null,
  rawMessages: [],

  // Derived selectors
  getMatchById: (id) => get().matches.find(m => m.id === id),
  isSubscribedToMatch: (id) => get().subscribedMatchIds.includes(id),
  isSubscribedToCommentary: (id) => get().subscribedCommentaryIds.includes(id),
  isPending: (matchId, type) =>
    get().pendingSubscriptions.some(p => p.matchId === matchId && p.type === type),
  getCommentaryForMatch: (id) => get().commentary[id] ?? [],

  setConnectionStatus: (status, attempt = 0) =>
    set({ connectionStatus: status, reconnectAttempt: attempt }),

  handleWSMessage: (message) => {
    const rawEntry: RawMessage = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      direction: 'inbound',
      payload: message,
    }
    set(s => ({ rawMessages: [rawEntry, ...s.rawMessages].slice(0, MAX_RAW_MESSAGES) }))

    switch (message.type) {
      case 'match_created': {
        const raw = message.data as RawMatch
        const enriched = enrichMatch(raw)
        set(s => ({
          matches: s.matches.some(m => m.id === enriched.id)
            ? s.matches
            : [enriched, ...s.matches],
        }))
        break
      }
      case 'commentary': {
        const raw = message.data as RawCommentary
        const enriched = enrichCommentary(raw)
        set(s => {
          const existing = s.commentary[enriched.matchId] ?? []
          if (existing.some(c => c.id === enriched.id)) return s
          const updated = [enriched, ...existing].slice(0, MAX_COMMENTARY)
          return { commentary: { ...s.commentary, [enriched.matchId]: updated } }
        })
        break
      }
      case 'match_update': {
        const raw = message.data as Partial<RawMatch> & { id: number }
        if (!raw?.id) break
        set(s => ({
          matches: s.matches.map(m =>
            m.id === raw.id ? { ...m, homeScore: raw.homeScore ?? m.homeScore, awayScore: raw.awayScore ?? m.awayScore, status: raw.status ?? m.status } : m
          ),
        }))
        break
      }
    }
  },

  logOutbound: (payload) => {
    const rawEntry: RawMessage = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      direction: 'outbound',
      payload,
    }
    set(s => ({ rawMessages: [rawEntry, ...s.rawMessages].slice(0, MAX_RAW_MESSAGES) }))
  },

  subscribeToMatch: (matchId) => {
    set(s => ({
      pendingSubscriptions: [
        ...s.pendingSubscriptions,
        { matchId, type: 'match', action: 'subscribe' },
      ],
    }))
    wsManager.send({ type: 'subscribe', matchId })
    setTimeout(() => {
      set(s => ({
        subscribedMatchIds: s.subscribedMatchIds.includes(matchId)
          ? s.subscribedMatchIds
          : [...s.subscribedMatchIds, matchId],
        pendingSubscriptions: s.pendingSubscriptions.filter(
          p => !(p.matchId === matchId && p.type === 'match')
        ),
      }))
    }, 400)
  },

  unsubscribeFromMatch: (matchId) => {
    wsManager.send({ type: 'unsubscribe', matchId })
    set(s => ({
      subscribedMatchIds: s.subscribedMatchIds.filter(id => id !== matchId),
    }))
  },

  subscribeToCommentary: (matchId) => {
    set(s => ({
      pendingSubscriptions: [
        ...s.pendingSubscriptions,
        { matchId, type: 'commentary', action: 'subscribe' },
      ],
    }))
    wsManager.send({ type: 'subscribe_commentary', matchId })
    setTimeout(() => {
      set(s => ({
        subscribedCommentaryIds: s.subscribedCommentaryIds.includes(matchId)
          ? s.subscribedCommentaryIds
          : [...s.subscribedCommentaryIds, matchId],
        pendingSubscriptions: s.pendingSubscriptions.filter(
          p => !(p.matchId === matchId && p.type === 'commentary')
        ),
      }))
    }, 400)
  },

  unsubscribeFromCommentary: (matchId) => {
    wsManager.send({ type: 'unsubscribe_commentary', matchId })
    set(s => ({
      subscribedCommentaryIds: s.subscribedCommentaryIds.filter(id => id !== matchId),
    }))
  },

  setSelectedMatch: (id) => set({ selectedMatchId: id }),

  seedMatches: (rawMatches) => {
    const enriched = rawMatches.map(enrichMatch)
    set(s => {
      const existingIds = new Set(s.matches.map(m => m.id))
      const newMatches = enriched.filter(m => !existingIds.has(m.id))
      return { matches: [...newMatches, ...s.matches] }
    })
  },

  seedCommentary: (matchId, entries) => {
    const enriched = entries.map(enrichCommentary)
    set(s => {
      const existing = s.commentary[matchId] ?? []
      const existingIds = new Set(existing.map(c => c.id))
      const newEntries = enriched.filter(c => !existingIds.has(c.id))
      const merged = [...existing, ...newEntries]
        .sort((a, b) => b.minute - a.minute || b.sequence - a.sequence)
        .slice(0, MAX_COMMENTARY)
      return { commentary: { ...s.commentary, [matchId]: merged } }
    })
  },

  simulateEvent: (eventType, matchId) => {
    const simulated = {
      type: 'commentary',
      matchId,
      data: {
        id: Date.now(),
        matchId,
        minute: Math.floor(Math.random() * 90) + 1,
        sequence: 99,
        period: 'second_half',
        eventType,
        actor: 'Simulated Player',
        team: 'Home',
        message: `[SIM] ${eventType.replace(/_/g, ' ')} event at ${new Date().toLocaleTimeString()}`,
        createdAt: new Date().toISOString(),
      },
    }
    get().handleWSMessage(simulated)
  },

  clearCommentary: (matchId) => {
    set(s => ({ commentary: { ...s.commentary, [matchId]: [] } }))
  },
}))
