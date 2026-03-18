'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Bell, BellOff, Loader2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { ScoreBoard } from '@/components/ScoreBoard'
import { CommentaryFeed } from '@/components/CommentaryFeed'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export default function MatchPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = Number(params.id)
  const [loadingCommentary, setLoadingCommentary] = useState(true)

  const getMatchById = useStore(s => s.getMatchById)
  const getCommentaryForMatch = useStore(s => s.getCommentaryForMatch)
  const isSubscribedToCommentary = useStore(s => s.isSubscribedToCommentary)
  const isPending = useStore(s => s.isPending)
  const subscribeToCommentary = useStore(s => s.subscribeToCommentary)
  const unsubscribeFromCommentary = useStore(s => s.unsubscribeFromCommentary)
  const seedCommentary = useStore(s => s.seedCommentary)
  const subscribeToMatch = useStore(s => s.subscribeToMatch)

  const match = getMatchById(matchId)
  const commentary = getCommentaryForMatch(matchId)
  const subscribed = isSubscribedToCommentary(matchId)
  const pending = isPending(matchId, 'commentary')

  useEffect(() => {
    if (!matchId) return
    subscribeToMatch(matchId)
    subscribeToCommentary(matchId)

    fetch(`${API_URL}/matches/${matchId}/commentary?limit=50`)
      .then(r => r.json())
      .then(({ data }) => { if (data) seedCommentary(matchId, data) })
      .catch(() => {})
      .finally(() => setLoadingCommentary(false))
  }, [matchId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-100 border-t-emerald-500 animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-xl">⚽</span>
        </div>
        <p className="text-sm text-gray-500 font-medium">Loading match…</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        All matches
      </button>

      {/* Scoreboard */}
      <ScoreBoard match={match} />

      {/* Commentary card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-bold text-gray-900">Commentary</h3>
            {commentary.length > 0 && (
              <span className="text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-semibold">
                {commentary.length}
              </span>
            )}
          </div>

          <button
            onClick={() => subscribed ? unsubscribeFromCommentary(matchId) : subscribeToCommentary(matchId)}
            disabled={pending}
            className={cn(
              'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all',
              pending && 'opacity-50 cursor-wait',
              subscribed
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
            )}
          >
            {pending ? <Loader2 size={11} className="animate-spin" />
              : subscribed ? <Bell size={11} />
              : <BellOff size={11} />}
            {pending ? 'Subscribing…' : subscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>

        <CommentaryFeed entries={commentary} loading={loadingCommentary} />
      </div>
    </div>
  )
}
