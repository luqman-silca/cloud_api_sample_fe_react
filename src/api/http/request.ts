import axios from 'axios'
import { uuidv4 } from '@/utils/uuid'
import { CURRENT_CONFIG } from './config'
import { message } from 'antd'
import { ELocalStorageKey, ERouterName, EUserType } from '@/types/enums'
export * from './type'

const REQUEST_ID = 'X-Request-Id'
function getAuthToken () {
  return localStorage.getItem(ELocalStorageKey.Token)
}

const instance = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  // timeout: 12000,
})

instance.interceptors.request.use(
  config => {
    config.headers[ELocalStorageKey.Token] = getAuthToken()
    // config.headers[REQUEST_ID] = uuidv4()
    config.baseURL = CURRENT_CONFIG.baseURL
    return config
  },
  error => {
    return Promise.reject(error)
  },
)

// Track if we're currently refreshing token to avoid multiple refresh attempts
let isRefreshing = false
let failedQueue: Array<{resolve: (value?: any) => void, reject: (reason?: any) => void}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

instance.interceptors.response.use(
  response => {
    if (response.data.code && response.data.code !== 0) {
      message.error(response.data.message)
    }
    return response
  },
  async err => {
    console.error('API Error:', err?.config?.url, err?.config?.method, err)

    const originalRequest = err.config

    let description = '-'
    if (err.response?.data && err.response.data.message) {
      description = err.response.data.message
    }
    if (err.response?.data && err.response.data.result) {
      description = err.response.data.result.message
    }
    // @See: https://github.com/axios/axios/issues/383
    if (!err.response || !err.response.status) {
      message.error('The network is abnormal, please check the backend service and try again')
      return Promise.reject(err)
    }
    if (err.response?.status !== 200) {
      message.error(`ERROR_CODE: ${err.response?.status}`)
    }

    // Handle 401 Unauthorized - try to refresh token first
    if (err.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({resolve, reject})
        }).then(token => {
          originalRequest.headers[ELocalStorageKey.Token] = token
          return instance(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Attempt to refresh the token
        const refreshResponse = await instance.post('/manage/api/v1/token/refresh', {})

        if (refreshResponse.data.code === 0 && refreshResponse.data.data?.token) {
          const newToken = refreshResponse.data.data.token

          // Update token in localStorage
          localStorage.setItem(ELocalStorageKey.Token, newToken)

          // Update authorization header
          originalRequest.headers[ELocalStorageKey.Token] = newToken

          // Process queued requests
          processQueue(null, newToken)

          isRefreshing = false

          // Retry original request with new token
          return instance(originalRequest)
        } else {
          throw new Error('Token refresh failed')
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        processQueue(refreshError, null)
        isRefreshing = false

        // Clear expired token from localStorage
        localStorage.removeItem(ELocalStorageKey.Token)

        // Redirect to login page (with absolute path)
        const flag: number = Number(localStorage.getItem(ELocalStorageKey.Flag))
        switch (flag) {
          case EUserType.Web:
            window.location.href = '/' + ERouterName.PROJECT
            break
          case EUserType.Pilot:
            window.location.href = '/' + ERouterName.PILOT
            break
        }

        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(err)
  },
)

export default instance
