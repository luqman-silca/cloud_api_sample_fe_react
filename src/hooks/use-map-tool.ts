import { GeojsonCoordinate } from '@/utils/genjson'
import { useMapContext } from '@/contexts/MapContext'

export function useMapTool() {
  const { map } = useMapContext()

  function panTo(coordinate: GeojsonCoordinate) {
    map.panTo(coordinate, 100)
    map.setZoom(18, false, 100)
  }

  return {
    panTo,
  }
}
