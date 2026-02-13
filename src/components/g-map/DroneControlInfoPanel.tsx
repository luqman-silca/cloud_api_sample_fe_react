import { Input } from 'antd'

const { TextArea } = Input

interface DroneControlInfoPanelProps {
  message?: string
}

function DroneControlInfoPanel({ message: msg }: DroneControlInfoPanelProps) {
  return (
    <div className="drone-control-info-wrap">
      <TextArea
        value={msg || ''}
        placeholder="drc info"
        rows={5}
        disabled
        style={{
          backgroundColor: '#000',
          color: '#fff',
          whiteSpace: 'pre-wrap',
        }}
      />
    </div>
  )
}

export default DroneControlInfoPanel
