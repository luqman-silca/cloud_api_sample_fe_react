import { useRef, useState } from 'react'
import { Button } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { ERouterName } from '@/types'
import { useDragWindow } from '@/hooks/use-drag-window'
import LivestreamAgora from '@/components/LivestreamAgora'
import LivestreamOthers from '@/components/LivestreamOthers'

function LivestreamPage() {
  const navigate = useNavigate()
  const [showLive, setShowLive] = useState(false)
  const [routeName, setRouteName] = useState<string>('LiveOthers')
  const liveRef = useRef<HTMLDivElement>(null)
  useDragWindow(liveRef)

  const options = [
    { key: 0, label: 'Agora Live', routeName: 'LiveAgora' },
    { key: 1, label: 'RTMP/GB28181 Live', routeName: 'LiveOthers' },
  ]

  const selectLivestream = (route: string) => {
    setRouteName(route)
    setShowLive(true)
  }

  const closeLive = () => {
    setShowLive(false)
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {options.map((item) => (
          <div key={item.key} style={{ width: '90%', margin: 'auto' }}>
            <Button
              className="mt10"
              style={{ width: '100%' }}
              type="primary"
              onClick={() => selectLivestream(item.routeName)}
            >
              {item.label}
            </Button>
          </div>
        ))}
      </div>
      {showLive && (
        <div
          ref={liveRef}
          style={{
            position: 'absolute',
            zIndex: 1,
            left: 0,
            top: 10,
            marginLeft: 345,
            textAlign: 'center',
            width: 800,
            height: 720,
            background: '#232323',
          }}
        >
          <div className="drag-title" style={{ height: 40, width: '100%' }} />
          <a
            style={{ position: 'absolute', right: 10, top: 10, fontSize: 16, color: 'white' }}
            onClick={closeLive}
          >
            <CloseOutlined />
          </a>
          {routeName === 'LiveAgora' ? <LivestreamAgora /> : <LivestreamOthers />}
        </div>
      )}
    </>
  )
}

export default LivestreamPage
