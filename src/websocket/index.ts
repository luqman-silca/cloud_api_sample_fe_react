import { message } from 'antd'
import { io, Socket } from 'socket.io-client'
import { EBizCode, ELocalStorageKey, ERouterName, EUserType } from '../types'

interface WebSocketOptions {
  data: any
  cache?: boolean | string
  destroyCache?: string
}

export interface MessageHandler {
  (data : {[key: string]: any}): void
}

export interface CommonHostWs<T> {
  sn: string
  host: T
}

/**
 * ConnectWebSocket class - Socket.IO implementation
 * Replaces native WebSocket with Socket.IO for compatibility with NestJS backend
 */
class ConnectWebSocket {
  _url: string
  _socket: Socket | null
  _hasInit: boolean
  _messageHandler: MessageHandler | null
  _token: string
  _joinedRooms: Set<string>  // Track joined rooms
  _authErrorCount: number  // Track consecutive auth errors

  constructor (url: string) {
    this._url = url
    this._socket = null
    this._hasInit = false
    this._messageHandler = null
    this._token = ''
    this._joinedRooms = new Set()
    this._authErrorCount = 0

    // Extract token from URL if present (ws://url?x-auth-token=xxx)
    const urlObj = new URL(url.replace('ws://', 'http://').replace('wss://', 'https://'))
    this._token = urlObj.searchParams.get('x-auth-token') || ''

    // Remove query params for Socket.IO connection (we'll use auth instead)
    this._url = `${urlObj.protocol}//${urlObj.host}`
  }

  initSocket () {
    if (this._hasInit) {
      return
    }
    if (!this._url) {
      return
    }

    // Initialize Socket.IO client with authentication
    this._socket = io(this._url, {
      auth: {
        token: this._token
      },
      reconnection: true,
      reconnectionDelay: 5000,      // Initial delay: 5s
      reconnectionDelayMax: 20000,   // Max delay: 20s
      reconnectionAttempts: 5,       // Max retries: 5
      transports: ['websocket'],     // Use WebSocket only (no polling)
    })

    this._hasInit = true

    this._socket.on('connect', this._onOpen.bind(this))
    this._socket.on('disconnect', this._onClose.bind(this))
    this._socket.on('connect_error', this._onError.bind(this))

    // Listen for 'message' event from server
    this._socket.on('message', this._onMessage.bind(this))

    // Listen for all other events and pass to message handler
    this._socket.onAny((event, data) => {
      if (event !== 'connect' && event !== 'disconnect' && event !== 'connect_error') {
        this._onMessage(data)
      }
    })
  }

  _onOpen () {
    // Connected - reset auth error count
    this._authErrorCount = 0
  }

  _onClose (reason: string) {
    // Clear joined rooms on disconnect
    this._joinedRooms.clear()
  }

  async _onError (error: any) {
    // Check if this is an authentication error
    const isAuthError = error?.message?.includes('Authentication error') || error?.message?.includes('Invalid token')

    if (isAuthError) {
      // Check if user is on login page - if so, always silently ignore auth errors
      // Login pages: /project, /pilot
      const currentPath = window.location.pathname
      const isOnLoginPage = currentPath === '/project' ||
                           currentPath === '/' ||
                           currentPath === '/pilot'

      if (isOnLoginPage) {
        // On login page - silently ignore ALL auth errors
        // This is expected behavior since user hasn't logged in yet
        // or has been redirected here after token expiry
        return
      }

      // Not on login page - we have a token but it's invalid, try to refresh
      console.error('Socket.IO authentication error:', error)
      this._authErrorCount++

      // Only try to refresh token once to avoid infinite loop
      if (this._authErrorCount === 1) {
        console.log('WebSocket authentication failed, attempting to refresh token...')

        try {
          // Import axios instance (avoid circular dependency)
          const { default: request } = await import('@/api/http/request')

          // Attempt to refresh token
          const refreshResponse = await request.post('/manage/api/v1/token/refresh', {})

          if (refreshResponse.data.code === 0 && refreshResponse.data.data?.token) {
            const newToken = refreshResponse.data.data.token

            // Update token in localStorage
            localStorage.setItem(ELocalStorageKey.Token, newToken)

            // Update token in this instance
            this._token = newToken

            console.log('Token refreshed successfully, reconnecting WebSocket...')

            // Disconnect and reconnect with new token
            if (this._socket) {
              this._socket.auth = { token: newToken }
              this._socket.disconnect()
              this._socket.connect()
            }

            return
          }
        } catch (refreshError) {
          console.error('Failed to refresh token for WebSocket:', refreshError)
        }
      }

      // If we've tried multiple times or refresh failed, redirect to login
      if (this._authErrorCount >= 2) {
        console.error('WebSocket authentication failed after token refresh, redirecting to login...')

        // Clear expired token from localStorage
        localStorage.removeItem(ELocalStorageKey.Token)

        const flag: number = Number(localStorage.getItem(ELocalStorageKey.Flag))
        switch (flag) {
          case EUserType.Web:
            window.location.href = '/' + ERouterName.PROJECT
            break
          case EUserType.Pilot:
            window.location.href = '/' + ERouterName.PILOT
            break
        }
      }
    } else {
      // Non-auth errors should still be logged
      console.error('Socket.IO connection error:', error)
    }
  }

  registerMessageHandler (messageHandler: MessageHandler) {
    this._messageHandler = messageHandler
  }

  _onMessage (data: any) {
    // If data is already an object, use it directly
    // If it's a string, try to parse it
    let parsedData = data
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data)
      } catch (e) {
        parsedData = { data }
      }
    }

    this._messageHandler && this._messageHandler(parsedData)
  }

  sendMessage = (message: WebSocketOptions): void => {
    if (!this._socket || !this._socket.connected) {
      console.warn('Socket.IO not connected, cannot send message')
      return
    }

    // Emit 'message' event with data
    this._socket.emit('message', message.data)
  }

  emit = (event: string, data?: any): void => {
    if (!this._socket || !this._socket.connected) {
      console.warn('Socket.IO not connected, cannot emit event')
      return
    }

    this._socket.emit(event, data)
  }

  /**
   * Check if already joined an OSD room for a device
   */
  isInDeviceOsdRoom = (deviceSn: string): boolean => {
    return this._joinedRooms.has(`osd:${deviceSn}`)
  }

  /**
   * Join OSD room for a device (idempotent - safe to call multiple times)
   */
  joinDeviceOsd = (deviceSn: string): void => {
    const roomKey = `osd:${deviceSn}`

    // Skip if already joined
    if (this._joinedRooms.has(roomKey)) {
      return
    }

    this.emit('join:device:osd', deviceSn)
    this._joinedRooms.add(roomKey)
  }

  /**
   * Leave OSD room for a device
   */
  leaveDeviceOsd = (deviceSn: string): void => {
    const roomKey = `osd:${deviceSn}`

    if (!this._joinedRooms.has(roomKey)) {
      return
    }

    this.emit('leave:device:osd', deviceSn)
    this._joinedRooms.delete(roomKey)
  }

  /**
   * Get list of all joined rooms
   */
  getJoinedRooms = (): string[] => {
    return Array.from(this._joinedRooms)
  }

  close () {
    if (this._socket) {
      this._socket.disconnect()
      this._socket = null
      this._hasInit = false
      this._joinedRooms.clear()
    }
  }
}

export default ConnectWebSocket
