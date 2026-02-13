import { Switch, Tooltip } from 'antd'
import { AimOutlined, DeleteOutlined } from '@ant-design/icons'
import { GetFlightArea, changeFlightAreaStatus } from '@/api/flight-area'
import { FlightAreaTypeTitleMap, EGeometryType } from '@/types/flight-area'

interface FlightAreaItemProps {
  data: GetFlightArea
  onDelete?: (areaId: string) => void
  onLocation?: () => void
}

function FlightAreaItem({ data, onDelete, onLocation }: FlightAreaItemProps) {
  const geometryType = data.content.geometry.type as string
  const title = FlightAreaTypeTitleMap[data.type]?.[geometryType as EGeometryType] || data.type

  const handleStatusChange = (checked: boolean) => {
    changeFlightAreaStatus(data.area_id, checked)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderBottom: '1px solid #4f4f4f' }}>
      <div style={{ flex: 1 }}>
        <Tooltip title={data.name}>
          <div style={{ fontWeight: 500, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {data.name}
          </div>
        </Tooltip>
        <div style={{ fontSize: 12, color: 'hsla(0,0%,100%,0.45)', marginTop: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'hsla(0,0%,100%,0.35)', marginTop: 2 }}>{data.username}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Switch size="small" checked={data.status} onChange={handleStatusChange} />
        <AimOutlined style={{ cursor: 'pointer', fontSize: 16 }} onClick={onLocation} />
        <DeleteOutlined style={{ cursor: 'pointer', fontSize: 16, color: '#ff4d4f' }} onClick={() => onDelete?.(data.area_id)} />
      </div>
    </div>
  )
}

export default FlightAreaItem
