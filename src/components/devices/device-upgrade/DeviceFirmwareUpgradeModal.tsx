import { useEffect, useState } from 'react'
import { Modal } from 'antd'
import { Device, DeviceFirmwareStatusEnum, DeviceFirmwareTypeEnum } from '@/types/device'
import { getDeviceUpgradeInfo, GetDeviceUpgradeInfoRsp, DeviceUpgradeBody } from '@/api/device-upgrade'

interface DeviceFirmwareUpgradeModalProps {
  visible: boolean
  device: Device | null
  onOk?: (body: DeviceUpgradeBody) => void
  onCancel?: () => void
  onVisibleChange?: (visible: boolean) => void
}

function DeviceFirmwareUpgradeModal({ visible, device, onOk, onCancel, onVisibleChange }: DeviceFirmwareUpgradeModalProps) {
  const [deviceUpgradeInfo, setDeviceUpgradeInfo] = useState<GetDeviceUpgradeInfoRsp | null>(null)

  useEffect(() => {
    if (visible && device?.device_name) {
      getDeviceUpgradeInfo({ device_name: device.device_name }).then(({ code, data }) => {
        if (code === 0 && data?.[0]) {
          setDeviceUpgradeInfo(data[0])
        }
      })
    }
  }, [visible, device])

  const checkConfirm = () => {
    if (!deviceUpgradeInfo?.product_version) return false
    if (!device) return false
    if (device.firmware_status !== DeviceFirmwareStatusEnum.ToUpgraded &&
        device.firmware_status !== DeviceFirmwareStatusEnum.ConsistencyUpgrade) return false
    return true
  }

  const handleOk = () => {
    if (!checkConfirm() || !device || !deviceUpgradeInfo) return
    onVisibleChange?.(false)
    onOk?.([{
      device_name: device.device_name,
      sn: device.device_sn,
      product_version: deviceUpgradeInfo.product_version,
      firmware_upgrade_type: device.firmware_status === DeviceFirmwareStatusEnum.ToUpgraded
        ? DeviceFirmwareTypeEnum.ToUpgraded
        : DeviceFirmwareTypeEnum.ConsistencyUpgrade,
    }])
  }

  const handleCancel = () => {
    onVisibleChange?.(false)
    onCancel?.()
  }

  return (
    <Modal
      open={visible}
      title="Device Upgrade"
      centered
      closable={false}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <div>Upgrade firmware version: {deviceUpgradeInfo?.product_version}</div>
    </Modal>
  )
}

export default DeviceFirmwareUpgradeModal
