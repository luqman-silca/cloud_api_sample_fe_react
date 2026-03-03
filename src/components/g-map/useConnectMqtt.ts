import { useEffect, useRef } from 'react'
import { useDeviceStore } from '@/store/useDeviceStore'
import { useMqttStore } from '@/store/useMqttStore'
import { postDrc } from '@/api/drc'
import { UranusMqtt } from '@/mqtt'

type StatusOptions =
  | { status: 'close'; event?: CloseEvent }
  | { status: 'open'; retryCount: number }
  | { status: 'pending' }

export function useConnectMqtt() {
  const mqttRef = useRef<UranusMqtt | null>(null)
  const osdVisible = useDeviceStore((s) => s.osdVisible)
  const setMqttState = useMqttStore((s) => s.setMqttState)
  const setClientId = useMqttStore((s) => s.setClientId)

  const dockOsdVisible =
    osdVisible && osdVisible.visible && osdVisible.is_dock

  useEffect(() => {
    let cancelled = false

    async function connect() {
      if (dockOsdVisible) {
        if (mqttRef.current) return
        const result = await postDrc({})
        if (cancelled) return
        if (result?.code === 0) {
          const { address, client_id, username, password } = result.data
          console.log('[MQTT] Address from backend:', address)
          console.log('[MQTT] Client ID:', client_id)
          const mqtt = new UranusMqtt(address, {
            clientId: client_id,
            username,
            password,
          })
          mqtt.initMqtt()
          mqtt.on('onStatus', (statusOptions: StatusOptions) => {
            // TODO: handle error cases
          })
          mqttRef.current = mqtt
          setMqttState(mqtt)
          setClientId(client_id)
        }
      } else {
        if (mqttRef.current) {
          mqttRef.current.destroyed()
          mqttRef.current = null
          setMqttState(null)
          setClientId('')
        }
      }
    }

    connect()

    return () => {
      cancelled = true
    }
  }, [dockOsdVisible]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      mqttRef.current?.destroyed()
    }
  }, [])
}
