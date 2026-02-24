import { createContext, useContext } from 'react'
import ConnectWebSocket from '@/websocket'

interface WebSocketContextType {
  ws: ConnectWebSocket | null
}

export const WebSocketContext = createContext<WebSocketContextType>({
  ws: null
})

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider')
  }
  return context.ws
}
