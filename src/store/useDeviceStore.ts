import { create } from 'zustand'
import { EDeviceTypeName } from '@/types'
import { Device, DeviceHms, DeviceOsd, DeviceStatus, DockOsd, GatewayOsd, OSDVisible } from '@/types/device'
import { WaylineFile } from '@/types/wayline'
import { DevicesCmdExecuteInfo } from '@/types/device-cmd'

interface DeviceState {
  deviceState: {
    gatewayInfo: Record<string, GatewayOsd>
    deviceInfo: Record<string, DeviceOsd>
    dockInfo: Record<string, DockOsd>
    currentSn: string
    currentType: number
  }
  deviceStatusEvent: {
    deviceOnline: DeviceStatus | Record<string, never>
    deviceOffline: Record<string, any>
  }
  markerInfo: {
    coverMap: Record<string, any>
    pathMap: Record<string, any[]>
  }
  osdVisible: OSDVisible
  hmsInfo: Record<string, DeviceHms[]>
  devicesCmdExecuteInfo: DevicesCmdExecuteInfo

  setDeviceInfo: (info: { sn: string; host: DeviceOsd }) => void
  setGatewayInfo: (info: { sn: string; host: GatewayOsd }) => void
  setDockInfo: (info: { sn: string; host: any }) => void
  setDeviceOnline: (info: DeviceStatus) => void
  setDeviceOffline: (info: { sn: string }) => void
  setOsdVisible: (info: OSDVisible) => void
  setDeviceHmsInfo: (info: { sn: string; host: DeviceHms[] }) => void
  setDevicesCmdExecuteInfo: (info: any) => void
}

export const useDeviceStore = create<DeviceState>((set) => ({
  deviceState: {
    gatewayInfo: {},
    deviceInfo: {},
    dockInfo: {},
    currentSn: '',
    currentType: -1,
  },
  deviceStatusEvent: {
    deviceOnline: {} as DeviceStatus,
    deviceOffline: {},
  },
  markerInfo: {
    coverMap: {},
    pathMap: {},
  },
  osdVisible: {
    sn: '',
    callsign: '',
    model: '',
    visible: false,
    gateway_sn: '',
    is_dock: false,
    payloads: null,
  } as OSDVisible,
  hmsInfo: {},
  devicesCmdExecuteInfo: {} as DevicesCmdExecuteInfo,

  setDeviceInfo: (info) =>
    set((state) => ({
      deviceState: {
        ...state.deviceState,
        deviceInfo: {
          ...state.deviceState.deviceInfo,
          [info.sn]: info.host,
        },
        currentSn: info.sn,
        currentType: EDeviceTypeName.Aircraft,
      },
    })),

  setGatewayInfo: (info) =>
    set((state) => ({
      deviceState: {
        ...state.deviceState,
        gatewayInfo: {
          ...state.deviceState.gatewayInfo,
          [info.sn]: info.host,
        },
        currentSn: info.sn,
        currentType: EDeviceTypeName.Gateway,
      },
    })),

  // Critical: Preserves conditional branching for mode_code vs wireless_link vs job_number
  setDockInfo: (info) =>
    set((state) => {
      if (Object.keys(info.host).length === 0) {
        return state
      }
      const dockInfo = { ...state.deviceState.dockInfo }
      if (!dockInfo[info.sn]) {
        dockInfo[info.sn] = {} as DockOsd
      }
      const dock = { ...dockInfo[info.sn] }

      if (info.host.mode_code !== undefined) {
        dock.basic_osd = info.host
      } else if (info.host.wireless_link) {
        dock.link_osd = info.host
      } else if (info.host.job_number !== undefined) {
        dock.work_osd = info.host
      }

      dockInfo[info.sn] = dock

      return {
        deviceState: {
          ...state.deviceState,
          dockInfo,
          currentSn: info.sn,
          currentType: EDeviceTypeName.Dock,
        },
      }
    }),

  setDeviceOnline: (info) =>
    set((state) => ({
      deviceStatusEvent: {
        ...state.deviceStatusEvent,
        deviceOnline: info,
      },
    })),

  setDeviceOffline: (info) =>
    set((state) => {
      const gatewayInfo = { ...state.deviceState.gatewayInfo }
      const deviceInfo = { ...state.deviceState.deviceInfo }
      const dockInfo = { ...state.deviceState.dockInfo }
      const hmsInfo = { ...state.hmsInfo }
      delete gatewayInfo[info.sn]
      delete deviceInfo[info.sn]
      delete dockInfo[info.sn]
      delete hmsInfo[info.sn]
      return {
        deviceStatusEvent: {
          ...state.deviceStatusEvent,
          deviceOffline: info,
        },
        deviceState: {
          ...state.deviceState,
          gatewayInfo,
          deviceInfo,
          dockInfo,
        },
        hmsInfo,
      }
    }),

  setOsdVisible: (info) => set({ osdVisible: info }),

  setDeviceHmsInfo: (info) =>
    set((state) => {
      const existingHms = state.hmsInfo[info.sn] ?? []
      const existingIds = new Set(existingHms.map(h => h.hms_id))

      // Only add HMS that don't already exist (deduplicate by hms_id)
      const newHms = info.host.filter(h => !existingIds.has(h.hms_id))

      return {
        hmsInfo: {
          ...state.hmsInfo,
          [info.sn]: newHms.concat(existingHms),
        },
      }
    }),

  // Critical: Preserves timestamp-based deduplication logic
  setDevicesCmdExecuteInfo: (info) =>
    set((state) => {
      if (!info.sn) return state
      const cmdInfo = { ...state.devicesCmdExecuteInfo }
      if (cmdInfo[info.sn]) {
        const list = [...cmdInfo[info.sn]]
        const index = list.findIndex(
          (cmdExecuteInfo) => cmdExecuteInfo.biz_code === info.biz_code
        )
        if (index >= 0) {
          // Discard older messages
          if (list[index].timestamp > info.timestamp) {
            return state
          }
          list[index] = info
        } else {
          list.push(info)
        }
        cmdInfo[info.sn] = list
      } else {
        cmdInfo[info.sn] = [info]
      }
      return { devicesCmdExecuteInfo: cmdInfo }
    }),
}))
