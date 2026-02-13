import { useRef } from 'react'
import pin2d8cf0 from '@/assets/icons/pin-2d8cf0.svg'
import { MapDoodleType } from '@/constants/map'
import { useMapContext } from '@/contexts/MapContext'
import { MapDoodleEnum } from '@/types/map-enum'
import { EFlightAreaType } from '@/types/flight-area'
import { message } from 'antd'

export function useMouseTool() {
  const { mouseTool } = useMapContext()

  const stateRef = useRef({
    pinNum: 0,
    polylineNum: 0,
    PolygonNum: 0,
    currentType: '',
  })

  const flightAreaColorMap: Record<string, string> = {
    [EFlightAreaType.DFENCE]: '#19be6b',
    [EFlightAreaType.NFZ]: '#ff0000',
  }

  function drawPin(type: MapDoodleType, getDrawCallback: Function) {
    mouseTool?.marker({
      title: type + stateRef.current.pinNum,
      icon: pin2d8cf0,
    })
    stateRef.current.pinNum++
    mouseTool?.on('draw', getDrawCallback)
  }

  function drawPolyline(type: MapDoodleType, getDrawCallback: Function) {
    mouseTool?.polyline({
      strokeColor: '#2d8cf0',
      strokeOpacity: 1,
      strokeWeight: 2,
      strokeStyle: 'solid',
      title: type + stateRef.current.polylineNum++,
    })
    mouseTool?.on('draw', getDrawCallback)
  }

  function drawPolygon(type: MapDoodleType, getDrawCallback: Function) {
    mouseTool?.polygon({
      strokeColor: '#2d8cf0',
      strokeOpacity: 1,
      strokeWeight: 2,
      fillColor: '#1791fc',
      fillOpacity: 0.4,
      title: type + stateRef.current.PolygonNum++,
    })
    mouseTool?.on('draw', getDrawCallback)
  }

  function drawOff(type: MapDoodleType) {
    mouseTool?.close()
    mouseTool?.off('draw')
  }

  function drawFlightAreaPolygon(
    type: EFlightAreaType,
    getDrawFlightAreaCallback: Function
  ) {
    mouseTool?.polygon({
      strokeColor: flightAreaColorMap[type],
      strokeOpacity: 1,
      strokeWeight: 4,
      extData: {
        type: type,
        mapType: 'polygon',
      },
      strokeStyle: 'dashed',
      strokeDasharray:
        EFlightAreaType.NFZ === type ? [10, 2] : [10, 1, 2],
      fillColor: flightAreaColorMap[type],
      fillOpacity: EFlightAreaType.NFZ === type ? 0.3 : 0,
    })
    mouseTool?.on('draw', getDrawFlightAreaCallback)
  }

  function drawFlightAreaCircle(
    type: EFlightAreaType,
    getDrawFlightAreaCallback: Function
  ) {
    mouseTool?.circle({
      strokeColor: flightAreaColorMap[type],
      strokeOpacity: 1,
      strokeWeight: 6,
      extData: {
        type: type,
        mapType: 'circle',
      },
      strokeStyle: 'dashed',
      strokeDasharray:
        EFlightAreaType.NFZ === type ? [10, 2] : [10, 1, 2],
      fillColor: flightAreaColorMap[type],
      fillOpacity: EFlightAreaType.NFZ === type ? 0.3 : 0,
    })
    mouseTool?.on('draw', getDrawFlightAreaCallback)
  }

  function mouseToolHandler(
    type: MapDoodleType,
    getDrawCallback: Function,
    flightAreaType?: EFlightAreaType
  ) {
    stateRef.current.currentType = type
    if (flightAreaType) {
      switch (type) {
        case MapDoodleEnum.POLYGON:
          drawFlightAreaPolygon(flightAreaType, getDrawCallback)
          return
        case MapDoodleEnum.CIRCLE:
          drawFlightAreaCircle(flightAreaType, getDrawCallback)
          return
        default:
          message.error(`Invalid type: ${flightAreaType}`)
          return
      }
    }
    switch (type) {
      case MapDoodleEnum.PIN:
        drawPin(type, getDrawCallback)
        break
      case MapDoodleEnum.POLYLINE:
        drawPolyline(type, getDrawCallback)
        break
      case MapDoodleEnum.POLYGON:
        drawPolygon(type, getDrawCallback)
        break
      case MapDoodleEnum.Close:
        drawOff(type)
        break
    }
  }

  return {
    mouseTool: mouseToolHandler,
  }
}
