import { useEffect, useRef } from 'react'
import { IClientPublishOptions, IPublishPacket } from '@/mqtt'
import { useMqttStore } from '@/store/useMqttStore'
import { DRC_METHOD } from '@/types/drc'
import EventBus from '@/event-bus'

export interface DeviceTopicInfo {
  sn: string
  pubTopic: string
  subTopic: string
}

type MessageMqtt = (
  topic: string,
  payload: Buffer,
  packet: IPublishPacket
) => void | Promise<void>

export function useMqtt(deviceTopicInfo: DeviceTopicInfo) {
  const cacheSubscribeArrRef = useRef<
    { topic: string; callback?: MessageMqtt }[]
  >([])
  const heartBeatSeqRef = useRef(0)
  const heartStateRef = useRef(new Map<string, { pingInterval: any }>())

  const mqttState = useMqttStore((s) => s.mqttState)

  function publishMqtt(
    topic: string,
    body: object,
    ots?: IClientPublishOptions
  ) {
    mqttState?.publishMqtt(topic, JSON.stringify(body), ots)
  }

  function onMessageMqtt(message: any) {
    if (
      cacheSubscribeArrRef.current.findIndex(
        (item) => item.topic === message?.topic
      ) !== -1
    ) {
      const payloadStr = new TextDecoder('utf-8').decode(message?.payload)
      const payloadObj = JSON.parse(payloadStr)
      switch (payloadObj?.method) {
        case DRC_METHOD.HEART_BEAT:
          break
        case DRC_METHOD.DELAY_TIME_INFO_PUSH:
        case DRC_METHOD.HSI_INFO_PUSH:
        case DRC_METHOD.OSD_INFO_PUSH:
        case DRC_METHOD.DRONE_CONTROL:
        case DRC_METHOD.DRONE_EMERGENCY_STOP:
          EventBus.emit('droneControlMqttInfo', payloadObj)
          break
        default:
          break
      }
    }
  }

  function subscribeMqtt(topic: string, handleMessageMqtt?: MessageMqtt) {
    mqttState?.subscribeMqtt(topic)
    const handler = handleMessageMqtt || onMessageMqtt
    mqttState?.on('onMessageMqtt', handler)
    cacheSubscribeArrRef.current.push({ topic, callback: handler })
  }

  function unsubscribeDrc() {
    cacheSubscribeArrRef.current.forEach((item) => {
      mqttState?.off('onMessageMqtt', item.callback)
      mqttState?.unsubscribeMqtt(item.topic)
    })
    cacheSubscribeArrRef.current = []
  }

  function publishDrcPing(sn: string) {
    const body = {
      method: DRC_METHOD.HEART_BEAT,
      data: {
        ts: new Date().getTime(),
        seq: heartBeatSeqRef.current,
      },
    }
    const pingInterval = setInterval(() => {
      if (!mqttState) return
      heartBeatSeqRef.current += 1
      body.data.ts = new Date().getTime()
      body.data.seq = heartBeatSeqRef.current
      publishMqtt(deviceTopicInfo.pubTopic, body, { qos: 0 })
    }, 1000)
    heartStateRef.current.set(sn, { pingInterval })
  }

  useEffect(() => {
    if (deviceTopicInfo.subTopic !== '') {
      subscribeMqtt(deviceTopicInfo.subTopic)
      publishDrcPing(deviceTopicInfo.sn)
    } else {
      clearInterval(
        heartStateRef.current.get(deviceTopicInfo.sn)?.pingInterval
      )
      heartStateRef.current.delete(deviceTopicInfo.sn)
      heartBeatSeqRef.current = 0
    }
  }, [deviceTopicInfo.subTopic, deviceTopicInfo.sn]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      unsubscribeDrc()
      heartBeatSeqRef.current = 0
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    mqttState,
    publishMqtt,
    subscribeMqtt,
  }
}
