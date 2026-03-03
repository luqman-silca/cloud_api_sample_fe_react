import { useEffect, useState } from 'react'
import ConnectWebSocket, { MessageHandler } from '@/websocket'
import { getWebsocketUrl } from '@/websocket/util/config'

// Keep WebSocket instance outside component to persist across React Strict Mode remounts
let globalWsInstance: ConnectWebSocket | null = null
let mountCount = 0
let cleanupTimeoutId: NodeJS.Timeout | null = null

/**
 * React hook version of useConnectWebSocket
 * Connects to WebSocket on mount, disconnects on unmount
 * Persists across React Strict Mode remounts in development
 */
export function useConnectWebSocket(messageHandler: MessageHandler) {
  const [ws, setWs] = useState<ConnectWebSocket | null>(null)

  // Initialize WebSocket once (persists across Strict Mode remounts)
  useEffect(() => {
    // Cancel any pending cleanup
    if (cleanupTimeoutId) {
      clearTimeout(cleanupTimeoutId)
      cleanupTimeoutId = null
    }

    mountCount++

    // Check if existing instance is connected, if not, clear it
    if (globalWsInstance && (!globalWsInstance._socket || !globalWsInstance._socket.connected)) {
      globalWsInstance = null
    }

    if (!globalWsInstance) {
      const webSocket = new ConnectWebSocket(getWebsocketUrl())
      globalWsInstance = webSocket
      webSocket.initSocket()
    }

    // Update state to trigger re-render
    setWs(globalWsInstance)

    return () => {
      mountCount--

      // Only close if no components are using it
      cleanupTimeoutId = setTimeout(() => {
        if (mountCount === 0 && globalWsInstance) {
          globalWsInstance.close()
          globalWsInstance = null
          setWs(null)
        }
        cleanupTimeoutId = null
      }, 100)
    }
  }, [])

  // Update message handler when it changes (without reconnecting)
  useEffect(() => {
    if (ws) {
      ws.registerMessageHandler(messageHandler)
    }
  }, [ws, messageHandler])

  return ws
}
