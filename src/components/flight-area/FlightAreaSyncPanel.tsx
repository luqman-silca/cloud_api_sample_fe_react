import { useEffect, useMemo, useState } from 'react'
import { Spin } from 'antd'
import { RobotFilled, RightOutlined } from '@ant-design/icons'
import FlightAreaDevicePanel from './FlightAreaDevicePanel'
import { GetDeviceStatus, getDeviceStatus } from '@/api/flight-area'
import { ESyncStatus, FlightAreaSyncProgress } from '@/types/flight-area'
import EventBus from '@/event-bus'

function FlightAreaSyncPanel() {
  const [visible, setVisible] = useState(false)
  const [syncDevices, setSyncDevices] = useState<GetDeviceStatus[]>([])

  const syncDevicesCount = useMemo(
    () =>
      syncDevices.filter(
        (device) =>
          device.flight_area_status.sync_status === ESyncStatus.SYNCHRONIZING ||
          device.flight_area_status.sync_status === ESyncStatus.WAIT_SYNC
      ).length,
    [syncDevices]
  )

  useEffect(() => {
    getDeviceStatus().then((res) => {
      if (res.code === 0) {
        setSyncDevices(res.data)
      }
    })
  }, [])

  useEffect(() => {
    const handleSyncProgress = (data: FlightAreaSyncProgress) => {
      const status = { sync_code: data.result, sync_status: data.status, sync_msg: data.message }
      setSyncDevices((prev) => {
        const exists = prev.find((d) => d.device_sn === data.sn)
        if (exists) {
          return prev.map((d) => (d.device_sn === data.sn ? { ...d, flight_area_status: status } : d))
        }
        return [...prev, { device_sn: data.sn, flight_area_status: status }]
      })
    }

    EventBus.on('flightAreasSyncProgressWs', handleSyncProgress)
    return () => {
      EventBus.off('flightAreasSyncProgressWs', handleSyncProgress)
    }
  }, [])

  const switchPanel = () => setVisible(!visible)
  const closePanel = (val: boolean) => setVisible(val)

  return (
    <div
      style={{ height: 70, cursor: 'pointer', padding: 10, display: 'flex', alignItems: 'center', position: 'relative' }}
    >
      <RobotFilled style={{ fontSize: 30 }} />
      <div style={{ marginLeft: 20, marginRight: 10, display: 'flex', flexDirection: 'column' }} onClick={switchPanel}>
        <div style={{ fontSize: 18 }}>Sync Across Devices</div>
        {syncDevicesCount > 0 && (
          <div>
            <Spin size="small" /> Syncing to {syncDevicesCount} devices
          </div>
        )}
      </div>
      <RightOutlined style={{ fontSize: 18 }} onClick={switchPanel} />
      {visible && <FlightAreaDevicePanel data={syncDevices} onClosePanel={closePanel} />}
    </div>
  )
}

export default FlightAreaSyncPanel
