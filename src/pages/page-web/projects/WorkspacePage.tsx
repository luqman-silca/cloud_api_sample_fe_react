import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '@/components/common/Sidebar'
import { ERouterName } from '@/types'
import { MapProvider } from '@/contexts/MapContext'
import GMap from '@/components/GMap'
import TaskPanel from '@/components/task/TaskPanel'
import MediaPanel from '@/components/MediaPanel'

function WorkspacePage() {
  const location = useLocation()

  const isMediaRoute = location.pathname === '/' + ERouterName.WORKSPACE + '/' + ERouterName.MEDIA
  const isTaskRoute = location.pathname.startsWith('/' + ERouterName.WORKSPACE + '/' + ERouterName.TASK)

  return (
    <div style={{ display: 'flex', transition: 'width 0.2s ease', height: '100%', width: '100%' }}>
      <div style={{ display: 'flex', width: 335, flex: '0 0 335px', backgroundColor: '#232323', height: '100%' }}>
        <Sidebar />
        <div
          className="uranus-scrollbar dark"
          style={{ flex: 1, color: '#fff', width: 285, overflow: 'auto', height: '100%' }}
        >
          <Outlet />
        </div>
      </div>
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <MapProvider>
          <GMap />
        </MapProvider>
        {isMediaRoute && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 100,
              background: '#f6f8fa',
            }}
          >
            <MediaPanel />
          </div>
        )}
        {isTaskRoute && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 100,
              background: '#f6f8fa',
            }}
          >
            <TaskPanel />
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkspacePage
