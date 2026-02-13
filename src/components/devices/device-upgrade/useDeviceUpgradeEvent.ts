import { useEffect } from 'react'
import EventBus from '@/event-bus'
import { DeviceCmdExecuteInfo } from '@/types/device-cmd'

export function useDeviceUpgradeEvent(onDeviceUpgradeWs: (payload: DeviceCmdExecuteInfo) => void): void {
  useEffect(() => {
    function handleDeviceUpgrade(payload: any) {
      onDeviceUpgradeWs(payload.data)
    }

    EventBus.on('deviceUpgrade', handleDeviceUpgrade)
    return () => {
      EventBus.off('deviceUpgrade', handleDeviceUpgrade)
    }
  }, [onDeviceUpgradeWs])
}
