import { useState, useEffect } from 'react'
import { message, notification } from 'antd'
import EventBus from '@/event-bus/'
import { EBizCode } from '@/types'
import { ControlSource } from '@/types/device'
import {
  ControlSourceChangeType,
  ControlSourceChangeInfo,
  FlyToPointMessage,
  TakeoffToPointMessage,
  DrcModeExitNotifyMessage,
  DrcStatusNotifyMessage,
} from '@/types/drone-control'

export function useDroneControlWsEvent(sn: string, payloadSn: string) {
  const [droneControlSource, setDroneControlSource] = useState(ControlSource.A)
  const [payloadControlSource, setPayloadControlSource] = useState(
    ControlSource.B
  )

  useEffect(() => {
    function onControlSourceChange(data: ControlSourceChangeInfo) {
      if (data.type === ControlSourceChangeType.Flight && data.sn === sn) {
        setDroneControlSource(data.control_source)
        message.info(
          `Flight control is changed to ${data.control_source}`
        )
        return
      }
      if (
        data.type === ControlSourceChangeType.Payload &&
        data.sn === payloadSn
      ) {
        setPayloadControlSource(data.control_source)
        message.info(
          `Payload control is changed to ${data.control_source}.`
        )
      }
    }

    function handleProgress(key: string, msg: string, error: number) {
      if (error !== 0) {
        notification.error({
          key,
          message: key + 'Error code:' + error,
          description: msg,
          duration: null,
        })
      } else {
        notification.info({
          key,
          message: key,
          description: msg,
          duration: 30,
        })
      }
    }

    function handleDroneControlWsEvent(payload: any) {
      if (!payload) return

      switch (payload.biz_code) {
        case EBizCode.ControlSourceChange:
          onControlSourceChange(payload.data)
          break
        case EBizCode.FlyToPointProgress: {
          const {
            sn: deviceSn,
            result,
            message: msg,
          } = payload.data as FlyToPointMessage
          if (deviceSn !== sn) return
          handleProgress(
            EBizCode.FlyToPointProgress,
            `device(sn: ${deviceSn}) ${msg}`,
            result
          )
          break
        }
        case EBizCode.TakeoffToPointProgress: {
          const {
            sn: deviceSn,
            result,
            message: msg,
          } = payload.data as TakeoffToPointMessage
          if (deviceSn !== sn) return
          handleProgress(
            EBizCode.TakeoffToPointProgress,
            `device(sn: ${deviceSn}) ${msg}`,
            result
          )
          break
        }
        case EBizCode.JoystickInvalidNotify: {
          const {
            sn: deviceSn,
            result,
            message: msg,
          } = payload.data as DrcModeExitNotifyMessage
          if (deviceSn !== sn) return
          handleProgress(
            EBizCode.JoystickInvalidNotify,
            `device(sn: ${deviceSn}) ${msg}`,
            result
          )
          break
        }
        case EBizCode.DrcStatusNotify: {
          // const { sn: deviceSn, result, message: msg } = payload.data as DrcStatusNotifyMessage
          break
        }
      }
    }

    EventBus.on('droneControlWs', handleDroneControlWsEvent)
    return () => {
      EventBus.off('droneControlWs', handleDroneControlWsEvent)
    }
  }, [sn, payloadSn])

  return {
    droneControlSource,
    setDroneControlSource,
    payloadControlSource,
    setPayloadControlSource,
  }
}
