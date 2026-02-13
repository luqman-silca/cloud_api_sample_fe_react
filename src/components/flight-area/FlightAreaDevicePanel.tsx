import { Button, Spin, Tag } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { GetDeviceStatus, syncFlightArea } from '@/api/flight-area'
import { ESyncStatus } from '@/types/flight-area'

interface FlightAreaDevicePanelProps {
  data: GetDeviceStatus[]
  onClosePanel?: (val: boolean) => void
}

const statusColorMap: Record<string, string> = {
  [ESyncStatus.SYNCHRONIZED]: 'green',
  [ESyncStatus.SYNCHRONIZING]: 'blue',
  [ESyncStatus.WAIT_SYNC]: 'orange',
  [ESyncStatus.FAIL]: 'red',
  [ESyncStatus.SWITCH_FAIL]: 'red',
}

function FlightAreaDevicePanel({ data, onClosePanel }: FlightAreaDevicePanelProps) {
  const handleSync = () => {
    const deviceSns = data.map((d) => d.device_sn)
    syncFlightArea(deviceSns)
  }

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, background: '#232323', zIndex: 10, padding: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 500 }}>Device Sync Status</span>
        <CloseOutlined style={{ cursor: 'pointer' }} onClick={() => onClosePanel?.(false)} />
      </div>
      <div style={{ overflowY: 'auto', maxHeight: 'calc(100% - 80px)' }}>
        {data.map((device) => (
          <div key={device.device_sn} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #4f4f4f' }}>
            <div>
              <div>{device.nickname || device.device_name || device.device_sn}</div>
            </div>
            <div>
              {device.flight_area_status.sync_status === ESyncStatus.SYNCHRONIZING ? (
                <Spin size="small" />
              ) : (
                <Tag color={statusColorMap[device.flight_area_status.sync_status] || 'default'}>
                  {device.flight_area_status.sync_status}
                </Tag>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, textAlign: 'center' }}>
        <Button type="primary" size="small" onClick={handleSync}>
          Sync All
        </Button>
      </div>
    </div>
  )
}

export default FlightAreaDevicePanel
