import { useState, useEffect, useRef } from 'react'
import { message } from 'antd'
import { DRC_METHOD, DroneControlProtocol } from '@/types/drc'
import { useMqtt, DeviceTopicInfo } from './useMqtt'

export enum KeyCode {
  KEY_W = 'KeyW',
  KEY_A = 'KeyA',
  KEY_S = 'KeyS',
  KEY_D = 'KeyD',
  KEY_Q = 'KeyQ',
  KEY_E = 'KeyE',
  ARROW_UP = 'ArrowUp',
  ARROW_DOWN = 'ArrowDown',
}

export function useManualControl(
  deviceTopicInfo: DeviceTopicInfo,
  isCurrentFlightController: boolean
) {
  const [activeCodeKey, setActiveCodeKey] = useState<KeyCode | null>(null)
  const mqttHooks = useMqtt(deviceTopicInfo)
  const seqRef = useRef(0)
  const intervalRef = useRef<any>(null)
  const activeCodeKeyRef = useRef<KeyCode | null>(null)

  function handleClearInterval() {
    clearInterval(intervalRef.current)
    intervalRef.current = undefined
  }

  function resetControlState() {
    setActiveCodeKey(null)
    activeCodeKeyRef.current = null
    seqRef.current = 0
    handleClearInterval()
  }

  function handlePublish(params: DroneControlProtocol) {
    const body = {
      method: DRC_METHOD.DRONE_CONTROL,
      data: params,
    }
    handleClearInterval()
    intervalRef.current = setInterval(() => {
      body.data.seq = seqRef.current++
      seqRef.current++
      window.console.log('keyCode>>>>', activeCodeKeyRef.current, body)
      mqttHooks?.publishMqtt(deviceTopicInfo.pubTopic, body, { qos: 0 })
    }, 50)
  }

  function handleKeyup(keyCode: KeyCode) {
    if (!deviceTopicInfo.pubTopic) {
      message.error('Please ensure DRC link is established')
      return
    }
    const SPEED = 5
    const HEIGHT = 5
    const W_SPEED = 20
    seqRef.current = 0
    switch (keyCode) {
      case 'KeyA':
        if (activeCodeKeyRef.current === keyCode) return
        handlePublish({ y: -SPEED })
        setActiveCodeKey(keyCode)
        activeCodeKeyRef.current = keyCode
        break
      case 'KeyW':
        if (activeCodeKeyRef.current === keyCode) return
        handlePublish({ x: SPEED })
        setActiveCodeKey(keyCode)
        activeCodeKeyRef.current = keyCode
        break
      case 'KeyS':
        if (activeCodeKeyRef.current === keyCode) return
        handlePublish({ x: -SPEED })
        setActiveCodeKey(keyCode)
        activeCodeKeyRef.current = keyCode
        break
      case 'KeyD':
        if (activeCodeKeyRef.current === keyCode) return
        handlePublish({ y: SPEED })
        setActiveCodeKey(keyCode)
        activeCodeKeyRef.current = keyCode
        break
      case 'ArrowUp':
        if (activeCodeKeyRef.current === keyCode) return
        handlePublish({ h: HEIGHT })
        setActiveCodeKey(keyCode)
        activeCodeKeyRef.current = keyCode
        break
      case 'ArrowDown':
        if (activeCodeKeyRef.current === keyCode) return
        handlePublish({ h: -HEIGHT })
        setActiveCodeKey(keyCode)
        activeCodeKeyRef.current = keyCode
        break
      case 'KeyQ':
        if (activeCodeKeyRef.current === keyCode) return
        handlePublish({ w: -W_SPEED })
        setActiveCodeKey(keyCode)
        activeCodeKeyRef.current = keyCode
        break
      case 'KeyE':
        if (activeCodeKeyRef.current === keyCode) return
        handlePublish({ w: W_SPEED })
        setActiveCodeKey(keyCode)
        activeCodeKeyRef.current = keyCode
        break
      default:
        break
    }
  }

  useEffect(() => {
    function onKeyup() {
      resetControlState()
    }
    function onKeydown(e: KeyboardEvent) {
      handleKeyup(e.code as KeyCode)
    }

    if (isCurrentFlightController && deviceTopicInfo.pubTopic) {
      window.addEventListener('keydown', onKeydown)
      window.addEventListener('keyup', onKeyup)
    }

    return () => {
      resetControlState()
      window.removeEventListener('keydown', onKeydown)
      window.removeEventListener('keyup', onKeyup)
    }
  }, [isCurrentFlightController, deviceTopicInfo.pubTopic]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleEmergencyStop() {
    if (!deviceTopicInfo.pubTopic) {
      message.error('Please ensure DRC link is established')
      return
    }
    const body = {
      method: DRC_METHOD.DRONE_EMERGENCY_STOP,
      data: {},
    }
    resetControlState()
    window.console.log(
      'handleEmergencyStop>>>>',
      deviceTopicInfo.pubTopic,
      body
    )
    mqttHooks?.publishMqtt(deviceTopicInfo.pubTopic, body, { qos: 1 })
  }

  return {
    activeCodeKey,
    handleKeyup,
    handleEmergencyStop,
    resetControlState,
  }
}
