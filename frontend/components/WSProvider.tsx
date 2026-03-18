'use client'
import { useEffect } from 'react'
import { wsManager } from '@/lib/websocket'
import { useStore } from '@/store/useStore'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000/ws'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export function WSProvider({ children }: { children: React.ReactNode }) {
  const setConnectionStatus = useStore(s => s.setConnectionStatus)
  const handleWSMessage = useStore(s => s.handleWSMessage)
  const logOutbound = useStore(s => s.logOutbound)
  const seedMatches = useStore(s => s.seedMatches)

  useEffect(() => {
    // Seed initial match data from REST
    fetch(`${API_URL}/matches`)
      .then(r => r.json())
      .then(({ data }) => data && seedMatches(data))
      .catch(() => {})

    // Connect WebSocket
    wsManager.connect(WS_URL)

    const unsubStatus = wsManager.onStatus((status, attempt) => {
      setConnectionStatus(status, attempt)
    })

    const unsubMessage = wsManager.onMessage(handleWSMessage)
    const unsubOutbound = wsManager.onOutbound(logOutbound)

    return () => {
      unsubStatus()
      unsubMessage()
      unsubOutbound()
      wsManager.disconnect()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>
}
