import { useEffect } from 'react'
import EventBus from '@/event-bus'
import { DeviceLogUploadInfo } from '@/types/device-log'

export function useDeviceLogUploadProgressEvent(onDeviceLogUploadWs: (data: DeviceLogUploadInfo) => void): void {
  useEffect(() => {
    function handleDeviceLogUploadProgress(payload: any) {
      onDeviceLogUploadWs(payload.data)
    }

    EventBus.on('deviceLogUploadProgress', handleDeviceLogUploadProgress)
    return () => {
      EventBus.off('deviceLogUploadProgress', handleDeviceLogUploadProgress)
    }
  }, [onDeviceLogUploadWs])
}
