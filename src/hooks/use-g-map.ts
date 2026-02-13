import AMapLoader from '@amap/amap-jsapi-loader'
import { AMapConfig } from '@/constants/index'

interface MapState {
  aMap: any
  map: any
  mouseTool: any
}

export function useGMapManage() {
  async function initMap(
    container: string,
    onReady: (state: MapState) => void
  ) {
    try {
      const AMap = await AMapLoader.load({ ...AMapConfig })
      const map = new AMap.Map(container, {
        center: [113.943225499, 22.577673716],
        zoom: 20,
      })
      const mouseTool = new AMap.MouseTool(map)

      onReady({ aMap: AMap, map, mouseTool })
    } catch (e) {
      console.log(e)
    }
  }

  return {
    initMap,
  }
}
