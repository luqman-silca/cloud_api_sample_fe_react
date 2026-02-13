import { create } from 'zustand'
import { WaylineFile } from '@/types/wayline'
import { Device } from '@/types/device'

interface WaylineState {
  waylineInfo: WaylineFile
  dockInfo: Device

  setSelectWaylineInfo: (info: WaylineFile) => void
  setSelectDockInfo: (info: Device) => void
}

export const useWaylineStore = create<WaylineState>((set) => ({
  waylineInfo: {} as WaylineFile,
  dockInfo: {} as Device,

  setSelectWaylineInfo: (info) => set({ waylineInfo: info }),
  setSelectDockInfo: (info) => set({ dockInfo: info }),
}))
