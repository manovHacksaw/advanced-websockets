'use client'
import { useState } from 'react'
import { Terminal, Zap, Radio, WifiOff, Trash2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { wsManager } from '@/lib/websocket'
import { ALL_EVENT_TYPES } from '@/lib/eventMeta'
import { cn } from '@/lib/utils'

export default function DevPage() {
  const connectionStatus = useStore(s => s.connectionStatus)
  const reconnectAttempt = useStore(s => s.reconnectAttempt)
  const matches = useStore(s => s.matches)
  const subscribedMatchIds = useStore(s => s.subscribedMatchIds)
  const subscribedCommentaryIds = useStore(s => s.subscribedCommentaryIds)
  const rawMessages = useStore(s => s.rawMessages)
  const subscribeToMatch = useStore(s => s.subscribeToMatch)
  const unsubscribeFromMatch = useStore(s => s.unsubscribeFromMatch)
  const subscribeToCommentary = useStore(s => s.subscribeToCommentary)
  const unsubscribeFromCommentary = useStore(s => s.unsubscribeFromCommentary)
  const simulateEvent = useStore(s => s.simulateEvent)
  const clearCommentary = useStore(s => s.clearCommentary)

  const [simEventType, setSimEventType] = useState('goal')
  const [simMatchId, setSimMatchId] = useState('')
  const [manualMatchId, setManualMatchId] = useState('')

  const statusColor = {
    connected: 'text-green-600 bg-green-50 border-green-200',
    connecting: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    reconnecting: 'text-orange-600 bg-orange-50 border-orange-200',
    disconnected: 'text-red-600 bg-red-50 border-red-200',
    error: 'text-red-700 bg-red-50 border-red-200',
  }[connectionStatus]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Terminal size={18} className="text-gray-600" />
        <h1 className="text-lg font-bold text-gray-900">GoalDigger <span className="text-gray-400 font-normal">Dev Panel</span></h1>
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">/dev</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Connection */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Connection</h2>
          <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold', statusColor)}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {connectionStatus.toUpperCase()}
            {connectionStatus === 'reconnecting' && ` (attempt ${reconnectAttempt})`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => wsManager.reconnectNow()}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-gray-900 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Radio size={12} />
              Reconnect
            </button>
            <button
              onClick={() => wsManager.disconnect()}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
            >
              <WifiOff size={12} />
              Disconnect
            </button>
          </div>
        </div>

        {/* Active subscriptions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Subscriptions</h2>
          <div className="space-y-1.5">
            <div>
              <p className="text-[10px] text-gray-400 mb-1">Match updates</p>
              {subscribedMatchIds.length === 0 ? (
                <p className="text-xs text-gray-400 italic">None</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {subscribedMatchIds.map(id => (
                    <button
                      key={id}
                      onClick={() => unsubscribeFromMatch(id)}
                      className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                      title="Click to unsubscribe"
                    >
                      #{id} ✕
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] text-gray-400 mb-1">Commentary</p>
              {subscribedCommentaryIds.length === 0 ? (
                <p className="text-xs text-gray-400 italic">None</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {subscribedCommentaryIds.map(id => (
                    <button
                      key={id}
                      onClick={() => unsubscribeFromCommentary(id)}
                      className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                      title="Click to unsubscribe"
                    >
                      #{id} ✕
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Manual subscribe */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Manual Subscribe</h2>
          <div className="flex gap-2">
            <select
              className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
              value={manualMatchId}
              onChange={e => setManualMatchId(e.target.value)}
            >
              <option value="">Select match…</option>
              {matches.map(m => (
                <option key={m.id} value={m.id}>
                  #{m.id} · {m.teamA.abbreviation} vs {m.teamB.abbreviation}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={!manualMatchId}
              onClick={() => subscribeToMatch(Number(manualMatchId))}
              className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-100 disabled:opacity-40 transition-colors"
            >
              + Match
            </button>
            <button
              disabled={!manualMatchId}
              onClick={() => subscribeToCommentary(Number(manualMatchId))}
              className="text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-lg hover:bg-green-100 disabled:opacity-40 transition-colors"
            >
              + Commentary
            </button>
            <button
              disabled={!manualMatchId}
              onClick={() => unsubscribeFromMatch(Number(manualMatchId))}
              className="text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              − Match
            </button>
            <button
              disabled={!manualMatchId}
              onClick={() => unsubscribeFromCommentary(Number(manualMatchId))}
              className="text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              − Commentary
            </button>
          </div>
        </div>

        {/* Event simulator */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Zap size={13} className="text-yellow-500" />
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Event Simulator</h2>
          </div>
          <div className="space-y-2">
            <select
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
              value={simMatchId}
              onChange={e => setSimMatchId(e.target.value)}
            >
              <option value="">Select match…</option>
              {matches.map(m => (
                <option key={m.id} value={m.id}>
                  #{m.id} · {m.teamA.abbreviation} vs {m.teamB.abbreviation}
                </option>
              ))}
            </select>
            <select
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
              value={simEventType}
              onChange={e => setSimEventType(e.target.value)}
            >
              {ALL_EVENT_TYPES.map(t => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                disabled={!simMatchId}
                onClick={() => simulateEvent(simEventType, Number(simMatchId))}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-3 py-2 rounded-lg disabled:opacity-40 transition-colors"
              >
                <Zap size={11} />
                Fire Event
              </button>
              <button
                disabled={!simMatchId}
                onClick={() => clearCommentary(Number(simMatchId))}
                className="flex items-center gap-1 text-xs font-medium bg-red-50 text-red-600 border border-red-200 px-2 py-2 rounded-lg disabled:opacity-40 hover:bg-red-100 transition-colors"
                title="Clear commentary"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Raw message log */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Terminal size={13} className="text-gray-400" />
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Message Log</h2>
          </div>
          <span className="text-xs text-gray-400">{rawMessages.length} messages</span>
        </div>
        <div className="overflow-y-auto max-h-80 font-mono text-[11px]">
          {rawMessages.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-xs">No messages yet</p>
          ) : (
            rawMessages.map(msg => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3 px-4 py-2 border-b border-gray-50 hover:bg-gray-50',
                  msg.direction === 'outbound' ? 'bg-blue-50/40' : ''
                )}
              >
                <span className="text-gray-400 shrink-0">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className={cn('shrink-0 font-semibold w-3', msg.direction === 'inbound' ? 'text-green-500' : 'text-blue-500')}>
                  {msg.direction === 'inbound' ? '←' : '→'}
                </span>
                <pre className="text-gray-700 overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(msg.payload, null, 0)}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
