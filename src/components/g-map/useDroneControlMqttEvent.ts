import { useState, useEffect } from 'react'
import EventBus from '@/event-bus/'
import {
  DRC_METHOD,
  DRCHsiInfo,
  DRCOsdInfo,
  DRCDelayTimeInfo,
  DrcResponseInfo,
} from '@/types/drc'

export function useDroneControlMqttEvent(sn: string) {
  const [drcInfo, setDrcInfo] = useState('')
  const [errorInfo, setErrorInfo] = useState('')

  useEffect(() => {
    let hsiInfo = ''
    let osdInfo = ''
    let delayInfo = ''

    function handleHsiInfo(data: DRCHsiInfo) {
      hsiInfo = `method: ${DRC_METHOD.HSI_INFO_PUSH}\r\n ${JSON.stringify(data)}\r\n `
    }

    function handleOsdInfo(data: DRCOsdInfo) {
      osdInfo = `method: ${DRC_METHOD.OSD_INFO_PUSH}\r\n ${JSON.stringify(data)}\r\n `
    }

    function handleDelayTimeInfo(data: DRCDelayTimeInfo) {
      delayInfo = `method: ${DRC_METHOD.DELAY_TIME_INFO_PUSH}\r\n ${JSON.stringify(data)}\r\n `
    }

    function handleDroneControlErrorInfo(data: DrcResponseInfo) {
      if (!data.result) return
      setErrorInfo(
        `Drc error code: ${data.result}, seq: ${data.output?.seq}`
      )
    }

    function handleDroneControlMqttEvent(payload: any) {
      if (!payload || !payload.method) return

      switch (payload.method) {
        case DRC_METHOD.HSI_INFO_PUSH:
          handleHsiInfo(payload.data)
          break
        case DRC_METHOD.OSD_INFO_PUSH:
          handleOsdInfo(payload.data)
          break
        case DRC_METHOD.DELAY_TIME_INFO_PUSH:
          handleDelayTimeInfo(payload.data)
          break
        case DRC_METHOD.DRONE_EMERGENCY_STOP:
        case DRC_METHOD.DRONE_CONTROL:
          handleDroneControlErrorInfo(payload.data)
          break
      }
      setDrcInfo(hsiInfo + osdInfo + delayInfo)
    }

    EventBus.on('droneControlMqttInfo', handleDroneControlMqttEvent)
    return () => {
      EventBus.off('droneControlMqttInfo', handleDroneControlMqttEvent)
    }
  }, [sn])

  return { drcInfo, errorInfo, setErrorInfo }
}
