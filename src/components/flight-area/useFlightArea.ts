import { message } from 'antd'
import { PostFlightAreaBody, saveFlightArea } from '@/api/flight-area'
import { generateCircleContent, generatePolyContent } from '@/utils/map-layer-utils'
import { GeojsonCoordinate } from '@/utils/genjson'
import { gcj02towgs84, wgs84togcj02 } from '@/vendors/coordtransform'
import { uuidv4 } from '@/utils/uuid'
import { MapDoodleEnum } from '@/types/map-enum'
import { useGMapCover } from '@/hooks/use-g-map-cover'
import { DATE_FORMAT } from '@/utils/constants'
import dayjs from 'dayjs'

export function useFlightArea() {
  const MIN_RADIUS = 10

  function checkCircle(obj: any): boolean {
    if (obj.getRadius() < MIN_RADIUS) {
      message.error(`The radius must be greater than ${MIN_RADIUS}m.`)
      return false
    }
    return true
  }

  function checkPolygon(obj: any): boolean {
    const path: any[][] = obj.getPath()
    if (path.length < 3) {
      message.error('The path of the polygon cannot be crossed.')
      return false
    }
    return true
  }

  const getWgs84 = <T extends GeojsonCoordinate | GeojsonCoordinate[]>(coordinate: T): T => {
    if (coordinate[0] instanceof Array) {
      return (coordinate as GeojsonCoordinate[]).map((c) => gcj02towgs84(c[0], c[1])) as T
    }
    return gcj02towgs84(coordinate[0] as number, coordinate[1] as number) as T
  }

  const getGcj02 = <T extends GeojsonCoordinate | GeojsonCoordinate[]>(coordinate: T): T => {
    if (coordinate[0] instanceof Array) {
      return (coordinate as GeojsonCoordinate[]).map((c) => wgs84togcj02(c[0], c[1])) as T
    }
    return wgs84togcj02(coordinate[0] as number, coordinate[1] as number) as T
  }

  return {
    getGcj02,
    getWgs84,
    checkCircle,
    checkPolygon,
  }
}
