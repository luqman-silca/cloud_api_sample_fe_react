import { useCallback, useEffect, useRef, useState } from 'react'
import { Row, Col, Tooltip, Empty } from 'antd'
import { RocketOutlined } from '@ant-design/icons'
import { EDeviceTypeName, ELocalStorageKey } from '@/types'
import { Device } from '@/types/device'
import { useWaylineStore } from '@/store/useWaylineStore'
import { getBindingDevices } from '@/api/manage'
import { IPage } from '@/api/http/type'

function DockPage() {
  const workspaceId = localStorage.getItem(ELocalStorageKey.WorkspaceId)!
  const [docksData, setDocksData] = useState<Device[]>([])
  const [scrollHeight, setScrollHeight] = useState(0)
  const setSelectDockInfo = useWaylineStore((s) => s.setSelectDockInfo)
  const canRefreshRef = useRef(true)
  const bodyRef = useRef<IPage>({ page: 1, total: -1, page_size: 10 })
  const dataRef = useRef<Device[]>([])

  const getDocks = useCallback(async () => {
    if (!canRefreshRef.current) return
    canRefreshRef.current = false

    try {
      const res = await getBindingDevices(workspaceId, bodyRef.current, EDeviceTypeName.Dock)
      if (res.code !== 0) return
      const newData = [...dataRef.current, ...res.data.list]
      dataRef.current = newData
      setDocksData(newData)
      bodyRef.current.page = res.data.pagination.page
      bodyRef.current.page_size = res.data.pagination.page_size
      bodyRef.current.total = res.data.pagination.total
    } finally {
      canRefreshRef.current = true
    }
  }, [workspaceId])

  useEffect(() => {
    const parent = document.querySelector('.dock-page .scrollbar')?.parentNode as HTMLDivElement
    if (parent) {
      setScrollHeight(document.body.clientHeight - (parent.firstElementChild?.clientHeight || 0))
    }
    getDocks()

    const key = setInterval(() => {
      const dataEl = document.getElementById('dock-data')?.lastElementChild as HTMLDivElement
      const b = bodyRef.current
      if (b.total === 0 || Math.ceil(b.total / b.page_size) <= b.page || (scrollHeight + 50 <= (dataEl?.clientHeight || 0) + (dataEl?.offsetTop || 0))) {
        clearInterval(key)
        return
      }
      bodyRef.current.page++
      getDocks()
    }, 1000)

    return () => clearInterval(key)
  }, [getDocks])

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const b = bodyRef.current
    if (
      element.scrollTop + element.clientHeight >= element.scrollHeight - 5 &&
      Math.ceil(b.total / b.page_size) > b.page &&
      canRefreshRef.current
    ) {
      bodyRef.current.page++
      getDocks()
    }
  }

  const selectDock = (dock: Device) => {
    setSelectDockInfo(dock)
  }

  return (
    <div className="dock-page" style={{ height: '100%' }}>
      <div style={{ height: 50, lineHeight: '50px', borderBottom: '1px solid #4f4f4f', fontWeight: 450 }}>
        <Row>
          <Col span={1} />
          <Col span={22}>Devices</Col>
          <Col span={1} />
        </Row>
      </div>
      <div className="scrollbar" style={{ height: scrollHeight || 'calc(100% - 50px)', overflow: 'auto' }}>
        {docksData.length !== 0 ? (
          <div id="dock-data" className="uranus-scrollbar" style={{ overflow: 'auto', height: '100%' }} onScroll={onScroll}>
            {docksData.map((dock) => (
              <div key={dock.device_sn}>
                <div
                  style={{
                    background: '#3c3c3c',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    marginTop: 10,
                    height: 70,
                    width: '95%',
                    fontSize: 13,
                    borderRadius: 2,
                    cursor: 'pointer',
                    paddingTop: 5,
                  }}
                  onClick={() => selectDock(dock)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', height: 30, fontWeight: 'bold', margin: '0 10px' }}>
                    <Tooltip title={dock.nickname}>
                      <div style={{ width: 120, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', paddingRight: 10 }}>
                        {dock.nickname}
                      </div>
                    </Tooltip>
                  </div>
                  <div style={{ marginLeft: 10, marginTop: 5, color: 'hsla(0,0%,100%,0.65)' }}>
                    <span><RocketOutlined /></span>
                    <span style={{ marginLeft: 5 }}>{dock.children?.[0]?.nickname ?? 'No drone'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty styles={{ image: { height: 60, marginTop: 60 } }} />
        )}
      </div>
    </div>
  )
}

export default DockPage
