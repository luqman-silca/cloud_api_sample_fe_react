import { Empty } from 'antd'
import FlightAreaItem from './FlightAreaItem'
import { GetFlightArea } from '@/api/flight-area'

interface FlightAreaPanelProps {
  data: GetFlightArea[]
  onDeleteArea?: (areaId: string) => void
  onLocationArea?: (area: GetFlightArea) => void
}

function FlightAreaPanel({ data, onDeleteArea, onLocationArea }: FlightAreaPanelProps) {
  if (data.length === 0) {
    return <Empty styles={{ image: { height: 60, marginTop: 60 } }} />
  }

  return (
    <div style={{ overflowY: 'auto', height: 'calc(100vh - 150px)' }}>
      {data.map((area) => (
        <FlightAreaItem
          key={area.area_id}
          data={area}
          onDelete={onDeleteArea}
          onLocation={() => onLocationArea?.(area)}
        />
      ))}
    </div>
  )
}

export default FlightAreaPanel
