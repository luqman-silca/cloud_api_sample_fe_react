import { create } from 'zustand'

interface LivestreamState {
  livestreamOthersVisible: boolean
  livestreamAgoraVisible: boolean

  setLivestreamOthersVisible: (visible: boolean) => void
  setLivestreamAgoraVisible: (visible: boolean) => void
}

export const useLivestreamStore = create<LivestreamState>((set) => ({
  livestreamOthersVisible: false,
  livestreamAgoraVisible: false,

  setLivestreamOthersVisible: (visible) =>
    set({ livestreamOthersVisible: visible }),
  setLivestreamAgoraVisible: (visible) =>
    set({ livestreamAgoraVisible: visible }),
}))
