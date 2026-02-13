import { Dropdown } from 'antd'
import { EFlightAreaType } from '@/types/flight-area'

interface FlightAreaActionIconProps {
  className?: string
  onSelectAction?: (params: { type: EFlightAreaType; isCircle: boolean }) => void
  onClick?: (params: { type: EFlightAreaType; isCircle: boolean }) => void
}

function FlightAreaActionIcon({ className, onSelectAction, onClick }: FlightAreaActionIconProps) {
  const items = [
    {
      key: 'dfence-polygon',
      label: 'GeoFence Polygon',
      onClick: () => {
        const params = { type: EFlightAreaType.DFENCE, isCircle: false }
        onSelectAction?.(params)
        onClick?.(params)
      },
    },
    {
      key: 'dfence-circle',
      label: 'GeoFence Circle',
      onClick: () => {
        const params = { type: EFlightAreaType.DFENCE, isCircle: true }
        onSelectAction?.(params)
        onClick?.(params)
      },
    },
    {
      key: 'nfz-polygon',
      label: 'NFZ Polygon',
      onClick: () => {
        const params = { type: EFlightAreaType.NFZ, isCircle: false }
        onSelectAction?.(params)
        onClick?.(params)
      },
    },
    {
      key: 'nfz-circle',
      label: 'NFZ Circle',
      onClick: () => {
        const params = { type: EFlightAreaType.NFZ, isCircle: true }
        onSelectAction?.(params)
        onClick?.(params)
      },
    },
  ]

  return (
    <Dropdown menu={{ items }} trigger={['click']}>
      <div className={className} style={{ cursor: 'pointer' }}>
        <span style={{ fontSize: 14 }}>FA</span>
      </div>
    </Dropdown>
  )
}

export default FlightAreaActionIcon
