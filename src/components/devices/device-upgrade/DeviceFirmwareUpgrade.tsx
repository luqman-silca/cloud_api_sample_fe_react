import { useMemo } from 'react'
import { Tag } from 'antd'
import { Device, DeviceFirmwareStatusEnum, DeviceFirmwareStatus, DeviceFirmwareStatusColor } from '@/types/device'

interface DeviceFirmwareUpgradeProps {
  device: Device
  onDeviceUpgrade?: (device: Device) => void
}

function DeviceFirmwareUpgrade({ device, onDeviceUpgrade }: DeviceFirmwareUpgradeProps) {
  const needUpgrade = useMemo(() => {
    return device.firmware_status === DeviceFirmwareStatusEnum.ConsistencyUpgrade ||
           device.firmware_status === DeviceFirmwareStatusEnum.ToUpgraded
  }, [device.firmware_status])

  const getTagStatus = (record: Device) => {
    return record.firmware_status && record.firmware_status !== DeviceFirmwareStatusEnum.None
  }

  const getFirmwareTag = (status: DeviceFirmwareStatusEnum) => {
    return {
      text: DeviceFirmwareStatus[status] || '',
      color: DeviceFirmwareStatusColor[status] || '',
    }
  }

  const handleUpgrade = () => {
    if (!needUpgrade) return
    onDeviceUpgrade?.(device)
  }

  const tag = getFirmwareTag(device.firmware_status)

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span>{device.firmware_version}</span>
      {getTagStatus(device) && (
        <span style={{ marginLeft: 10, cursor: 'pointer' }}>
          <Tag color={tag.color} onClick={handleUpgrade} style={{ cursor: needUpgrade ? 'pointer' : 'default' }}>
            {tag.text}
          </Tag>
        </span>
      )}
      {device.firmware_status === DeviceFirmwareStatusEnum.DuringUpgrade && (
        <span>{device.firmware_progress}</span>
      )}
    </div>
  )
}

export default DeviceFirmwareUpgrade
