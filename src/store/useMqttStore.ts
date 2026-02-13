import { create } from 'zustand'

interface MqttState {
  mqttState: any
  clientId: string

  setMqttState: (mqttState: any) => void
  setClientId: (clientId: string) => void
}

export const useMqttStore = create<MqttState>((set) => ({
  mqttState: null,
  clientId: '',

  setMqttState: (mqttState) => set({ mqttState }),
  setClientId: (clientId) => set({ clientId }),
}))
