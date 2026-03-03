import { useEffect, useState } from 'react'
import ConnectWebSocket, { MessageHandler } from '@/websocket'
import { getWebsocketUrl } from '@/websocket/util/config'
import { ELocalStorageKey } from '@/types'

// Keep WebSocket instance outside component to persist across React Strict Mode remounts
let globalWsInstance: ConnectWebSocket | null = null
let mountCount = 0
let cleanupTimeoutId: NodeJS.Timeout | null = null

/**
 * React hook version of useConnectWebSocket
 * Connects to WebSocket on mount, disconnects on unmount
 * Persists across React Strict Mode remounts in development
 *
 * IMPORTANT: Only connects if user has a valid token (i.e., is logged in)
 */
export function useConnectWebSocket(messageHandler: MessageHandler) {
  const [ws, setWs] = useState<ConnectWebSocket | null>(null)
  const [hasToken, setHasToken] = useState(() => !!localStorage.getItem(ELocalStorageKey.Token))
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname)

  // Watch for token changes (e.g., after login)
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem(ELocalStorageKey.Token)
      setHasToken(!!token)
    }

    const checkPath = () => {
      setCurrentPath(window.location.pathname)
    }

    // Check immediately
    checkToken()
    checkPath()

    // Listen for storage changes (in case token is updated in another tab)
    window.addEventListener('storage', checkToken)

    // Listen for URL changes (popstate for back/forward, hashchange if using hash router)
    window.addEventListener('popstate', checkPath)

    // Also check periodically in case localStorage or pathname changes in same tab
    const interval = setInterval(() => {
      checkToken()
      checkPath()
    }, 1000)

    return () => {
      window.removeEventListener('storage', checkToken)
      window.removeEventListener('popstate', checkPath)
      clearInterval(interval)
    }
  }, [])

  // Initialize WebSocket when token becomes available AND not on login page
  useEffect(() => {
    // Check if we're on a login page - never connect WebSocket on login pages
    const isOnLoginPage = currentPath === '/project' ||
                         currentPath === '/' ||
                         currentPath === '/pilot'

    // If no token OR on login page, close any existing WebSocket and don't connect
    if (!hasToken || isOnLoginPage) {
      if (globalWsInstance) {
        globalWsInstance.close()
        globalWsInstance = null
      }
      setWs(null)
      return
    }

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
  }, [hasToken, currentPath])

  // Update message handler when it changes (without reconnecting)
  useEffect(() => {
    if (ws) {
      ws.registerMessageHandler(messageHandler)
    }
  }, [ws, messageHandler])

  return ws
}
