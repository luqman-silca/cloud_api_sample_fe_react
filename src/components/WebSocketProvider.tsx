import { useCallback, ReactNode } from 'react'
import { useConnectWebSocket } from '@/hooks/use-connect-websocket'
import { useDeviceStore } from '@/store/useDeviceStore'
import { WebSocketContext } from '@/contexts/WebSocketContext'
import { EBizCode } from '@/types'

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { setDeviceInfo, setDockInfo, setGatewayInfo } = useDeviceStore()

  // WebSocket message handler for device OSD and events
  const messageHandler = useCallback((payload: any) => {
    if (!payload) {
      return
    }

    console.log('WebSocket message received:', payload)

    // Handle different message types
    if (payload.sn) {
      // Check if it's an OSD message (has type field)
      if (payload.type) {
        console.log(`OSD update for ${payload.sn}:`, payload.type, payload.data)

        // Update device store based on device type
        if (payload.type === 'dock') {
          setDockInfo({ sn: payload.sn, host: payload.data })
        } else if (payload.type === 'rc_drone' || payload.type === 'dock_drone') {
          setDeviceInfo({ sn: payload.sn, host: payload.data })
        } else if (payload.type === 'rc') {
          setGatewayInfo({ sn: payload.sn, host: payload.data })
        }
      }
    }

    // Handle legacy biz_code based messages (if any)
    switch (payload.biz_code) {
      case EBizCode.DeviceOnline:
        console.log('Device online:', payload.data)
        break
      case EBizCode.DeviceOffline:
        console.log('Device offline:', payload.data)
        break
      default:
        // Unknown message type
        break
    }
  }, [setDeviceInfo, setDockInfo, setGatewayInfo])

  // Initialize WebSocket connection
  const ws = useConnectWebSocket(messageHandler)

  return (
    <WebSocketContext.Provider value={{ ws }}>
      {children}
    </WebSocketContext.Provider>
  )
}
