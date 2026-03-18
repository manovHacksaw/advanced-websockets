'use client'
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { wsManager } from '@/lib/websocket'
import { cn } from '@/lib/utils'

export function ConnectionIndicator() {
  const status = useStore(s => s.connectionStatus)
  const attempt = useStore(s => s.reconnectAttempt)

  const config = {
    connected: {
      dot: 'bg-green-500',
      text: 'Connected',
      icon: <Wifi size={13} />,
      pill: 'bg-green-50 text-green-700 border-green-200',
    },
    connecting: {
      dot: 'bg-yellow-400 animate-pulse',
      text: 'Connecting…',
      icon: <RefreshCw size={13} className="animate-spin" />,
      pill: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    },
    reconnecting: {
      dot: 'bg-orange-400 animate-pulse',
      text: `Reconnecting (${attempt})`,
      icon: <RefreshCw size={13} className="animate-spin" />,
      pill: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    disconnected: {
      dot: 'bg-red-400',
      text: 'Disconnected',
      icon: <WifiOff size={13} />,
      pill: 'bg-red-50 text-red-700 border-red-200',
    },
    error: {
      dot: 'bg-red-500',
      text: 'Connection error',
      icon: <AlertCircle size={13} />,
      pill: 'bg-red-50 text-red-700 border-red-200',
    },
  }[status]

  return (
    <button
      onClick={() => status !== 'connected' && wsManager.reconnectNow()}
      title={status !== 'connected' ? 'Click to reconnect' : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
        config.pill,
        status !== 'connected' && 'cursor-pointer hover:opacity-80'
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />
      {config.icon}
      <span>{config.text}</span>
    </button>
  )
}
