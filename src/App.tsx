import { BrowserRouter } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AppRoutes from '@/router'
import { WebSocketProvider } from '@/components/WebSocketProvider'
import { WebSocketContext } from '@/contexts/WebSocketContext'
import { ELocalStorageKey } from '@/types'

function App() {
  console.log('App component rendering')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem(ELocalStorageKey.Token)
      setIsAuthenticated(!!token)
      console.log('Auth status:', !!token)
    }

    checkAuth()

    // Listen for storage changes (login/logout from other tabs)
    window.addEventListener('storage', checkAuth)

    // Custom event for same-tab login/logout
    window.addEventListener('auth-changed', checkAuth)

    return () => {
      window.removeEventListener('storage', checkAuth)
      window.removeEventListener('auth-changed', checkAuth)
    }
  }, [])

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {isAuthenticated ? (
        <WebSocketProvider>
          <div className="demo-app">
            <AppRoutes />
          </div>
        </WebSocketProvider>
      ) : (
        <WebSocketContext.Provider value={{ ws: null }}>
          <div className="demo-app">
            <AppRoutes />
          </div>
        </WebSocketContext.Provider>
      )}
    </BrowserRouter>
  )
}

export default App
