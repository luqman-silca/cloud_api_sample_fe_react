import { message } from 'antd'
import { io, Socket } from 'socket.io-client'
import { EBizCode } from '../types'

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

  constructor (url: string) {
    this._url = url
    this._socket = null
    this._hasInit = false
    this._messageHandler = null
    this._token = ''

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
    console.log('Socket.IO connected successfully')
  }

  _onClose (reason: string) {
    console.log('Socket.IO disconnected:', reason)
  }

  _onError (error: Error) {
    console.error('Socket.IO connection error:', error)
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

  close () {
    if (this._socket) {
      this._socket.disconnect()
      this._socket = null
      this._hasInit = false
    }
  }
}

export default ConnectWebSocket
