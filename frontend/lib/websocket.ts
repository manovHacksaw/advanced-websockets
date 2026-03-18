import type { WSMessage, ConnectionStatus } from '@/types'

type MessageHandler = (message: WSMessage) => void
type StatusHandler = (status: ConnectionStatus, attempt?: number) => void
type RawOutboundHandler = (payload: unknown) => void

const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 15000, 30000]

class WebSocketManager {
  private ws: WebSocket | null = null
  private url = ''
  private reconnectAttempt = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private destroyed = false
  private messageHandlers = new Set<MessageHandler>()
  private statusHandlers = new Set<StatusHandler>()
  private outboundHandlers = new Set<RawOutboundHandler>()

  connect(url: string) {
    this.url = url
    this.destroyed = false
    this.reconnectAttempt = 0
    this.openConnection()
  }

  private openConnection() {
    if (this.destroyed) return

    this.notifyStatus(this.reconnectAttempt > 0 ? 'reconnecting' : 'connecting', this.reconnectAttempt)

    try {
      this.ws = new WebSocket(this.url)
    } catch {
      this.scheduleReconnect()
      return
    }

    this.ws.onopen = () => {
      this.reconnectAttempt = 0
      this.notifyStatus('connected')
    }

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WSMessage
        this.routeMessage(message)
      } catch {
        // ignore malformed messages
      }
    }

    this.ws.onclose = () => {
      if (!this.destroyed) {
        this.notifyStatus('disconnected')
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = () => {
      this.notifyStatus('error')
    }
  }

  private routeMessage(message: WSMessage) {
    for (const handler of this.messageHandlers) {
      handler(message)
    }
  }

  private scheduleReconnect() {
    if (this.destroyed) return
    const delay = BACKOFF_DELAYS[Math.min(this.reconnectAttempt, BACKOFF_DELAYS.length - 1)]
    this.reconnectAttempt++
    this.notifyStatus('reconnecting', this.reconnectAttempt)
    this.reconnectTimer = setTimeout(() => this.openConnection(), delay)
  }

  private notifyStatus(status: ConnectionStatus, attempt?: number) {
    for (const handler of this.statusHandlers) {
      handler(status, attempt)
    }
  }

  send(payload: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload))
      for (const handler of this.outboundHandlers) {
        handler(payload)
      }
    }
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  onStatus(handler: StatusHandler) {
    this.statusHandlers.add(handler)
    return () => this.statusHandlers.delete(handler)
  }

  onOutbound(handler: RawOutboundHandler) {
    this.outboundHandlers.add(handler)
    return () => this.outboundHandlers.delete(handler)
  }

  disconnect() {
    this.destroyed = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.ws = null
  }

  reconnectNow() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.reconnectAttempt = 0
    this.ws?.close()
    this.openConnection()
  }
}

export const wsManager = new WebSocketManager()
