import { useEffect, useRef } from 'react'
import ConnectWebSocket, { MessageHandler } from '@/websocket'
import { getWebsocketUrl } from '@/websocket/util/config'

/**
 * React hook version of useConnectWebSocket
 * Connects to WebSocket on mount, disconnects on unmount
 */
export function useConnectWebSocket(messageHandler: MessageHandler) {
  const wsRef = useRef<ConnectWebSocket | null>(null)

  useEffect(() => {
    const webSocket = new ConnectWebSocket(getWebsocketUrl())
    wsRef.current = webSocket
    webSocket.registerMessageHandler(messageHandler)
    webSocket.initSocket()

    return () => {
      webSocket.close()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
