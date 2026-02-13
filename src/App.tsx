import { BrowserRouter } from 'react-router-dom'
import AppRoutes from '@/router'

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="demo-app">
        <AppRoutes />
      </div>
    </BrowserRouter>
  )
}

export default App
