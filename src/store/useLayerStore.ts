import { create } from 'zustand'
import { getLayers } from '@/api/layer'
import { LayerType } from '@/types/mapLayer'
import { Layer } from '@/types/map.d'

interface WsEvent {
  mapElementCreat: Record<string, any>
  mapElementUpdate: Record<string, any>
  mapElementDelete: Record<string, any>
}

interface LayerState {
  Layers: Layer[]
  layerBaseInfo: Record<string, string>
  drawVisible: boolean
  coverMap: Record<string, any[]>
  wsEvent: WsEvent

  setLayerInfo: (layers: Layer[]) => void
  setDrawVisible: (visible: boolean) => void
  setMapElementCreate: (info: any) => void
  setMapElementUpdate: (info: any) => void
  setMapElementDelete: (info: any) => void
  getAllElement: () => Promise<void>
  updateElement: (content: { type: 'is_check' | 'is_select'; id: string; bool: boolean }) => void
  setLayerBaseInfo: (layers: Layer[]) => void
  getLayerInfo: (id: string) => string | undefined
}

export const useLayerStore = create<LayerState>((set, get) => ({
  Layers: [
    {
      name: 'default',
      id: '',
      is_distributed: true,
      elements: [],
      is_check: false,
      is_select: false,
      type: 1,
      order: 0,
      create_time: 0,
      is_lock: false,
    },
    {
      name: 'share',
      id: '',
      is_distributed: true,
      elements: [],
      is_check: false,
      is_select: false,
      type: 2,
      order: 0,
      create_time: 0,
      is_lock: false,
    },
  ],
  layerBaseInfo: {},
  drawVisible: false,
  coverMap: {},
  wsEvent: {
    mapElementCreat: {},
    mapElementUpdate: {},
    mapElementDelete: {},
  },

  setLayerInfo: (layers) => set({ Layers: layers }),
  setDrawVisible: (visible) => set({ drawVisible: visible }),

  setMapElementCreate: (info) =>
    set((state) => ({
      wsEvent: { ...state.wsEvent, mapElementCreat: info },
    })),
  setMapElementUpdate: (info) =>
    set((state) => ({
      wsEvent: { ...state.wsEvent, mapElementUpdate: info },
    })),
  setMapElementDelete: (info) =>
    set((state) => ({
      wsEvent: { ...state.wsEvent, mapElementDelete: info },
    })),

  getAllElement: async () => {
    const result = await getLayers({
      groupId: '',
      isDistributed: true,
    })
    set({ Layers: result.data?.list })
    console.log(result)
  },

  updateElement: (content) => {
    const key = content.id.replaceAll('resource__', '')
    const type = content.type
    set((state) => {
      const layers = [...state.Layers]
      const layer = layers.find((item) => item.id === key)
      if (layer) {
        ;(layer as any)[type] = content.bool
      }
      return { Layers: layers }
    })
  },

  setLayerBaseInfo: (layers) => {
    const obj: Record<string, string> = {}
    layers.forEach((layer: any) => {
      if (layer.type === LayerType.Default) {
        obj.default = layer.id
      } else if (layer.type === LayerType.Share) {
        obj.share = layer.id
      }
    })
    set({ layerBaseInfo: obj })
    console.log('layerBaseInfo', obj)
  },

  getLayerInfo: (id) => {
    return get().layerBaseInfo[id]
  },
}))
