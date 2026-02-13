import { useState, useCallback } from 'react'
import { Device } from '@/types/device'
import { postDeviceUpgrade, DeviceUpgradeBody } from '@/api/device-upgrade'

export function useDeviceFirmwareUpgrade(workspaceId: string) {
  const [deviceFirmwareUpgradeModalVisible, setDeviceFirmwareUpgradeModalVisible] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)

  const onDeviceUpgrade = useCallback((record: Device) => {
    if (!record) return
    setSelectedDevice(record)
    setDeviceFirmwareUpgradeModalVisible(true)
  }, [])

  const onUpgradeDeviceOk = useCallback(async (deviceUpgradeBody: DeviceUpgradeBody) => {
    const { code } = await postDeviceUpgrade(workspaceId, deviceUpgradeBody)
    if (code === 0) {
      // success
    }
  }, [workspaceId])

  return {
    deviceFirmwareUpgradeModalVisible,
    setDeviceFirmwareUpgradeModalVisible,
    selectedDevice,
    setSelectedDevice,
    onDeviceUpgrade,
    onUpgradeDeviceOk,
  }
}
