import { EFlightAreaType } from '@/types/flight-area'
import pin19be6b from '@/assets/icons/pin-19be6b.svg'
import pin212121 from '@/assets/icons/pin-212121.svg'
import pin2d8cf0 from '@/assets/icons/pin-2d8cf0.svg'
import pinb620e0 from '@/assets/icons/pin-b620e0.svg'
import pine23c39 from '@/assets/icons/pin-e23c39.svg'
import pineffbb00 from '@/assets/icons/pin-ffbb00.svg'
import { useLayerStore } from '@/store/useLayerStore'
import { useMapContext } from '@/contexts/MapContext'
import { GeojsonCoordinate } from '@/types/map.d'

export function useGMapCover() {
  const { aMap: AMap, map } = useMapContext()
  const coverMap = useLayerStore((s) => s.coverMap)

  const normalColor = '#2D8CF0'
  const flightAreaColorMap = {
    [EFlightAreaType.DFENCE]: '#19be6b',
    [EFlightAreaType.NFZ]: '#ff0000',
  }
  const disableColor = '#b3b3b3'

  function AddCoverToMap(cover: any) {
    map.add(cover)
    coverMap[cover.getExtData().id] = [cover]
  }

  function getPinIcon(color?: string) {
    const colorObj: Record<string, any> = {
      '2d8cf0': pin2d8cf0,
      '19be6b': pin19be6b,
      212121: pin212121,
      b620e0: pinb620e0,
      e23c39: pine23c39,
      ffbb00: pineffbb00,
    }
    const iconName = (color?.replaceAll('#', '') || '').toLocaleLowerCase()
    return new AMap.Icon({
      image: colorObj[iconName],
    })
  }

  function init2DPin(
    name: string,
    coordinates: GeojsonCoordinate,
    color?: string,
    data?: {}
  ) {
    const pin = new AMap.Marker({
      position: new AMap.LngLat(coordinates[0], coordinates[1]),
      title: name,
      icon: getPinIcon(color),
      extData: data,
    })
    AddCoverToMap(pin)
  }

  function AddOverlayGroup(overlayGroup: any) {
    map.add(overlayGroup)
    const id = overlayGroup.getExtData().id
    coverMap[id] = [...(coverMap[id] || []), overlayGroup]
  }

  function initPolyline(
    name: string,
    coordinates: GeojsonCoordinate[],
    color?: string,
    data?: {}
  ) {
    const path: any[] = []
    coordinates.forEach((coordinate) => {
      path.push(new AMap.LngLat(coordinate[0], coordinate[1]))
    })
    const polyline = new AMap.Polyline({
      path,
      strokeColor: color || normalColor,
      strokeOpacity: 1,
      strokeWeight: 2,
      strokeStyle: 'solid',
      extData: data,
    })
    AddOverlayGroup(polyline)
  }

  function initPolygon(
    name: string,
    coordinates: GeojsonCoordinate[][],
    color?: string,
    data?: {}
  ) {
    const path: any[] = []
    coordinates[0].forEach((coordinate) => {
      path.push(new AMap.LngLat(coordinate[0], coordinate[1]))
    })
    const polygon = new AMap.Polygon({
      path,
      strokeOpacity: 1,
      strokeWeight: 2,
      fillColor: color || normalColor,
      fillOpacity: 0.4,
      strokeColor: color || normalColor,
      extData: data,
    })
    AddOverlayGroup(polygon)
  }

  function removeCoverFromMap(id: string) {
    if (coverMap[id]) {
      coverMap[id].forEach((cover: any) => map.remove(cover))
      coverMap[id] = []
    }
  }

  function getElementFromMap(id: string): any[] {
    return coverMap[id]
  }

  function updatePinElement(
    id: string,
    name: string,
    coordinates: GeojsonCoordinate,
    color?: string
  ) {
    const elements = getElementFromMap(id)
    if (elements && elements.length > 0) {
      const element = elements[0]
      const icon = getPinIcon(color)
      element.setPosition(new AMap.LngLat(coordinates[0], coordinates[1]))
      element.setIcon(icon)
      element.setTitle(name)
    } else {
      init2DPin(name, coordinates, color, { id, name })
    }
  }

  function updatePolylineElement(
    id: string,
    name: string,
    coordinates: GeojsonCoordinate[],
    color?: string
  ) {
    const elements = getElementFromMap(id)
    if (elements && elements.length > 0) {
      const element = elements[0]
      const options = element.getOptions()
      options.strokeColor = color || normalColor
      element.setOptions(options)
    } else {
      initPolyline(name, coordinates, color, { id, name })
    }
  }

  function updatePolygonElement(
    id: string,
    name: string,
    coordinates: GeojsonCoordinate[][],
    color?: string
  ) {
    const elements = getElementFromMap(id)
    if (elements && elements.length > 0) {
      const element = elements[0]
      const options = element.getOptions()
      options.fillColor = color || normalColor
      options.strokeColor = color || normalColor
      element.setOptions(options)
    } else {
      initPolygon(name, coordinates, color, { id, name })
    }
  }

  function initTextInfo(
    content: string,
    coordinates: GeojsonCoordinate,
    id: string
  ) {
    const info = new AMap.Text({
      text: content,
      position: new AMap.LngLat(coordinates[0], coordinates[1]),
      extData: { id, type: 'text' },
      anchor: 'top-center',
      style: {
        background: 'none',
        borderStyle: 'none',
        fontSize: '16px',
      },
    })
    AddOverlayGroup(info)
  }

  function initFlightAreaCircle(
    name: string,
    radius: number,
    position: GeojsonCoordinate,
    data: { id: string; type: EFlightAreaType; enable: boolean }
  ) {
    const circle = new AMap.Circle({
      strokeColor: data.enable
        ? flightAreaColorMap[data.type]
        : disableColor,
      strokeOpacity: 1,
      strokeWeight: 6,
      extData: data,
      strokeStyle: 'dashed',
      strokeDasharray:
        EFlightAreaType.NFZ === data.type ? [10, 2] : [10, 1, 2],
      fillColor: flightAreaColorMap[data.type],
      fillOpacity:
        EFlightAreaType.NFZ === data.type && data.enable ? 0.3 : 0,
      radius,
      center: new AMap.LngLat(position[0], position[1]),
    })
    AddOverlayGroup(circle)
    initTextInfo(name, position, data.id)
  }

  function updateFlightAreaCircle(
    id: string,
    name: string,
    radius: number,
    position: GeojsonCoordinate,
    enable: boolean,
    type: EFlightAreaType
  ) {
    const elements = getElementFromMap(id)
    if (elements && elements.length > 0) {
      let textIndex = elements.findIndex(
        (ele: any) => ele.getExtData()?.type === 'text'
      )
      if (textIndex === -1) {
        textIndex = 1
        initTextInfo(name, position, id)
      } else {
        const text = elements[textIndex]
        text.setText(name)
        text.setPosition(position)
      }
      const element = elements[textIndex ^ 1]
      const options = element.getOptions()
      options.fillOpacity =
        EFlightAreaType.NFZ === type && enable ? 0.3 : 0
      options.strokeColor = enable
        ? flightAreaColorMap[type]
        : disableColor
      options.radius = radius
      options.center = new AMap.LngLat(position[0], position[1])
      element.setOptions(options)
    } else {
      initFlightAreaCircle(name, radius, position, { id, type, enable })
    }
  }

  function calcPolygonPosition(
    coordinate: GeojsonCoordinate[]
  ): GeojsonCoordinate {
    const index = coordinate.length - 1
    return [
      (coordinate[0][0] + coordinate[index][0]) / 2.0,
      (coordinate[0][1] + coordinate[index][1]) / 2,
    ]
  }

  function initFlightAreaPolygon(
    name: string,
    coordinates: GeojsonCoordinate[],
    data: { id: string; type: EFlightAreaType; enable: boolean }
  ) {
    const path: any[] = []
    coordinates.forEach((coordinate) => {
      path.push(new AMap.LngLat(coordinate[0], coordinate[1]))
    })
    const polygon = new AMap.Polygon({
      path,
      strokeColor: data.enable
        ? flightAreaColorMap[data.type]
        : disableColor,
      strokeOpacity: 1,
      strokeWeight: 4,
      draggable: true,
      extData: data,
      strokeStyle: 'dashed',
      strokeDasharray:
        EFlightAreaType.NFZ === data.type ? [10, 2] : [10, 1, 2],
      fillColor: flightAreaColorMap[data.type],
      fillOpacity:
        EFlightAreaType.NFZ === data.type && data.enable ? 0.3 : 0,
    })
    AddOverlayGroup(polygon)
    initTextInfo(name, calcPolygonPosition(coordinates), data.id)
  }

  function updateFlightAreaPolygon(
    id: string,
    name: string,
    coordinates: GeojsonCoordinate[],
    enable: boolean,
    type: EFlightAreaType
  ) {
    const elements = getElementFromMap(id)
    if (elements && elements.length > 0) {
      let textIndex = elements.findIndex(
        (ele: any) => ele.getExtData()?.type === 'text'
      )
      if (textIndex === -1) {
        textIndex = 1
        initTextInfo(name, calcPolygonPosition(coordinates), id)
      } else {
        const text = elements[textIndex]
        text.setText(name)
        text.setPosition(calcPolygonPosition(coordinates))
      }
      const element = elements[textIndex ^ 1]
      const options = element.getOptions()
      const path: any[] = []
      coordinates.forEach((coordinate) => {
        path.push(new AMap.LngLat(coordinate[0], coordinate[1]))
      })
      options.path = path
      options.fillOpacity =
        EFlightAreaType.NFZ === type && enable ? 0.3 : 0
      options.strokeColor = enable
        ? flightAreaColorMap[type]
        : disableColor
      element.setOptions(options)
    } else {
      initFlightAreaPolygon(name, coordinates, { id, type, enable })
    }
  }

  return {
    init2DPin,
    initPolyline,
    initPolygon,
    removeCoverFromMap,
    getElementFromMap,
    updatePinElement,
    updatePolylineElement,
    updatePolygonElement,
    initFlightAreaCircle,
    initFlightAreaPolygon,
    updateFlightAreaPolygon,
    updateFlightAreaCircle,
    calcPolygonPosition,
  }
}
