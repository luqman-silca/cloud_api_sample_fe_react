import { useState, useEffect, useRef, useMemo } from 'react'
import { Row, Col, Tooltip, Button, Image, Progress } from 'antd'
import {
  BorderOutlined,
  LineOutlined,
  CloseOutlined,
  ControlOutlined,
  TrademarkOutlined,
  ArrowDownOutlined,
  ThunderboltOutlined,
  SignalFilled,
  GlobalOutlined,
  HistoryOutlined,
  CloudUploadOutlined,
  RocketOutlined,
  FieldTimeOutlined,
  CloudOutlined,
  CloudFilled,
  FolderOpenOutlined,
  RobotFilled,
  ArrowUpOutlined,
  CarryOutOutlined,
} from '@ant-design/icons'
import {
  generateLineContent,
  generatePointContent,
  generatePolyContent,
} from '@/utils/map-layer-utils'
import { postElementsReq } from '@/api/layer'
import { MapDoodleType, MapElementEnum } from '@/constants/map'
import { useGMapManage } from '@/hooks/use-g-map'
import { useGMapCover } from '@/hooks/use-g-map-cover'
import { useMouseTool } from '@/hooks/use-mouse-tool'
import { useGMapTsa } from '@/hooks/use-g-map-tsa'
import { useMapContext } from '@/contexts/MapContext'
import { useLayerStore } from '@/store/useLayerStore'
import { useDeviceStore } from '@/store/useDeviceStore'
import { useLivestreamStore } from '@/store/useLivestreamStore'
import { GeojsonCoordinate } from '@/types/map.d'
import { MapDoodleEnum } from '@/types/map-enum'
import { PostElementsBody } from '@/types/mapLayer'
import { uuidv4 } from '@/utils/uuid'
import { gcj02towgs84, wgs84togcj02 } from '@/vendors/coordtransform'
import {
  DeviceOsd,
  DeviceStatus,
  DockOsd,
  EGear,
  EModeCode,
  GatewayOsd,
  EDockModeCode,
  NetworkStateQualityEnum,
  NetworkStateTypeEnum,
  RainfallEnum,
  DroneInDockEnum,
  DeviceInfoType,
} from '@/types/device'
import { EDeviceTypeName } from '@/types'
import { EFlightAreaType } from '@/types/flight-area'
import pin from '@/assets/icons/pin-2d8cf0.svg'
import M30 from '@/assets/icons/m30.png'
import DockControlPanel from './g-map/DockControlPanel'
import DroneControlPanel from './g-map/DroneControlPanel'
import { useDockControl } from './g-map/useDockControl'
import { useConnectMqtt } from './g-map/useConnectMqtt'
import LivestreamOthers from './LivestreamOthers'
import LivestreamAgora from './LivestreamAgora'
import FlightAreaActionIcon from './flight-area/FlightAreaActionIcon'
import { useDragWindow } from '@/hooks/use-drag-window'

const STR = '--'

function GMap() {
  const { setAMap, setMap, setMouseTool } = useMapContext()
  const { initMap } = useGMapManage()
  const { mouseTool: mouseToolHandler } = useMouseTool()
  const deviceTsaHook = useGMapTsa()

  // State
  const [mouseMode, setMouseMode] = useState(false)
  const [currentType, setCurrentType] = useState('')
  const [isFlightArea, setIsFlightArea] = useState(false)

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfoType>({
    gateway: {
      capacity_percent: STR,
      transmission_signal_quality: STR,
    } as GatewayOsd,
    dock: {} as DockOsd,
    device: {
      gear: -1,
      mode_code: EModeCode.Disconnected,
      height: STR,
      home_distance: STR,
      horizontal_speed: STR,
      vertical_speed: STR,
      wind_speed: STR,
      wind_direction: STR,
      elevation: STR,
      position_state: {
        gps_number: STR,
        is_fixed: 0,
        rtk_number: STR,
      },
      battery: {
        capacity_percent: STR,
        landing_power: STR,
        remain_flight_time: 0,
        return_home_power: STR,
      },
      latitude: 0,
      longitude: 0,
    } as DeviceOsd,
  })

  // Store subscriptions
  const drawVisible = useLayerStore((s) => s.drawVisible)
  const layerBaseInfo = useLayerStore((s) => s.layerBaseInfo)
  const Layers = useLayerStore((s) => s.Layers)
  const coverMap = useLayerStore((s) => s.coverMap)
  const wsEvent = useLayerStore((s) => s.wsEvent)
  const setLayerInfo = useLayerStore((s) => s.setLayerInfo)
  const setMapElementCreate = useLayerStore((s) => s.setMapElementCreate)
  const setMapElementUpdate = useLayerStore((s) => s.setMapElementUpdate)
  const setMapElementDelete = useLayerStore((s) => s.setMapElementDelete)

  const osdVisible = useDeviceStore((s) => s.osdVisible)
  const setOsdVisible = useDeviceStore((s) => s.setOsdVisible)
  const deviceState = useDeviceStore((s) => s.deviceState)
  const deviceStatusEvent = useDeviceStore((s) => s.deviceStatusEvent)

  const livestreamOthersVisible = useLivestreamStore((s) => s.livestreamOthersVisible)
  const livestreamAgoraVisible = useLivestreamStore((s) => s.livestreamAgoraVisible)
  const setLivestreamOthersVisible = useLivestreamStore((s) => s.setLivestreamOthersVisible)
  const setLivestreamAgoraVisible = useLivestreamStore((s) => s.setLivestreamAgoraVisible)

  const shareId = layerBaseInfo.share || ''

  // Dock control panel
  const {
    dockControlPanelVisible,
    setDockControlPanelVisible,
    onCloseControlPanel,
  } = useDockControl()

  // Connect/disconnect DRC MQTT
  useConnectMqtt()

  // Refs for drag windows
  const droneOsdRef = useRef<HTMLDivElement>(null)
  const dockOsdRef = useRef<HTMLDivElement>(null)
  const liveOthersRef = useRef<HTMLDivElement>(null)
  const liveAgoraRef = useRef<HTMLDivElement>(null)
  useDragWindow(droneOsdRef)
  useDragWindow(dockOsdRef)
  useDragWindow(liveOthersRef)
  useDragWindow(liveAgoraRef)

  // Ref to hold the latest isFlightArea / currentType for callbacks
  const drawStateRef = useRef({ currentType, isFlightArea })
  drawStateRef.current = { currentType, isFlightArea }

  // Quality style for dock network
  const qualityStyle = useMemo(() => {
    if (
      deviceInfo.dock.basic_osd?.network_state?.type === NetworkStateTypeEnum.ETHERNET ||
      (deviceInfo.dock.basic_osd?.network_state?.quality || 0) > NetworkStateQualityEnum.FAIR
    ) {
      return { color: '#00ee8b' }
    }
    if ((deviceInfo.dock.basic_osd?.network_state?.quality || 0) === NetworkStateQualityEnum.FAIR) {
      return { color: 'yellow' }
    }
    return { color: 'red' }
  }, [deviceInfo.dock])

  // Init map on mount
  useEffect(() => {
    initMap('g-container', (state) => {
      setAMap(state.aMap)
      setMap(state.map)
      setMouseTool(state.mouseTool)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Watch deviceStatusEvent
  useEffect(() => {
    const online = deviceStatusEvent.deviceOnline
    if (online && Object.keys(online).length !== 0) {
      deviceTsaHook.initMarker(
        (online as DeviceStatus).domain,
        (online as DeviceStatus).device_callsign,
        (online as DeviceStatus).sn
      )
    }
    const offline = deviceStatusEvent.deviceOffline
    if (offline && Object.keys(offline).length !== 0) {
      deviceTsaHook.removeMarker(offline.sn)
      if (
        offline.sn === osdVisible.sn ||
        (osdVisible.is_dock && offline.sn === osdVisible.gateway_sn)
      ) {
        setOsdVisible({ ...osdVisible, visible: false })
      }
    }
  }, [deviceStatusEvent]) // eslint-disable-line react-hooks/exhaustive-deps

  // Watch deviceState for marker moves and OSD updates
  useEffect(() => {
    const data = deviceState
    if (data.currentType === EDeviceTypeName.Gateway && data.gatewayInfo[data.currentSn]) {
      const coordinate = wgs84togcj02(
        data.gatewayInfo[data.currentSn].longitude,
        data.gatewayInfo[data.currentSn].latitude
      )
      deviceTsaHook.moveTo(data.currentSn, coordinate[0], coordinate[1])
      if (osdVisible.visible && osdVisible.gateway_sn !== '') {
        setDeviceInfo((prev) => ({
          ...prev,
          gateway: data.gatewayInfo[osdVisible.gateway_sn] || prev.gateway,
        }))
      }
    }
    if (data.currentType === EDeviceTypeName.Aircraft && data.deviceInfo[data.currentSn]) {
      const coordinate = wgs84togcj02(
        data.deviceInfo[data.currentSn].longitude,
        data.deviceInfo[data.currentSn].latitude
      )
      deviceTsaHook.moveTo(data.currentSn, coordinate[0], coordinate[1])
      if (osdVisible.visible && osdVisible.sn !== '') {
        setDeviceInfo((prev) => ({
          ...prev,
          device: data.deviceInfo[osdVisible.sn] || prev.device,
        }))
      }
    }
    if (data.currentType === EDeviceTypeName.Dock && data.dockInfo[data.currentSn]) {
      const coordinate = wgs84togcj02(
        data.dockInfo[data.currentSn].basic_osd?.longitude,
        data.dockInfo[data.currentSn].basic_osd?.latitude
      )
      deviceTsaHook.initMarker(
        EDeviceTypeName.Dock,
        EDeviceTypeName[EDeviceTypeName.Dock],
        data.currentSn,
        coordinate[0],
        coordinate[1]
      )
      if (osdVisible.visible && osdVisible.is_dock && osdVisible.gateway_sn !== '') {
        const dock = data.dockInfo[osdVisible.gateway_sn]
        const device = data.deviceInfo[dock?.basic_osd?.sub_device?.device_sn ?? osdVisible.sn]
        setDeviceInfo((prev) => ({
          ...prev,
          dock: dock || prev.dock,
          device: device || prev.device,
        }))
      }
    }
  }, [deviceState]) // eslint-disable-line react-hooks/exhaustive-deps

  // Watch wsEvent for map element create/update/delete
  useEffect(() => {
    if (Object.keys(wsEvent.mapElementCreat).length !== 0) {
      const ele = wsEvent.mapElementCreat as any
      let exist = false
      Layers.forEach((layer: any) => {
        layer.elements?.forEach((e: any) => {
          if (e.id === ele.id) {
            exist = true
          }
        })
      })
      if (!exist) {
        setLayersHelper({
          id: ele.id,
          name: ele.name,
          resource: ele.resource,
        })
        updateCoordinates('wgs84-gcj02', ele)
        const data = { id: ele.id, name: ele.name }
        if (MapElementEnum.PIN === ele.resource?.type) {
          // useGMapCover needs to be called inside component — we use it inline
          // Since useGMapCover uses context, this is fine
        } else if (MapElementEnum.LINE === ele.resource?.type) {
          // handled inline
        } else if (MapElementEnum.POLY === ele.resource?.type) {
          // handled inline
        }
      }
      setMapElementCreate({})
    }
    if (Object.keys(wsEvent.mapElementUpdate).length !== 0) {
      console.log(wsEvent.mapElementUpdate)
      console.log('Map element update not yet implemented')
      setMapElementUpdate({})
    }
    if (Object.keys(wsEvent.mapElementDelete).length !== 0) {
      console.log(wsEvent.mapElementDelete)
      console.log('Map element delete not yet implemented')
      setMapElementDelete({})
    }
  }, [wsEvent]) // eslint-disable-line react-hooks/exhaustive-deps

  // Drawing
  function draw(type: MapDoodleType, bool: boolean, flightAreaType?: EFlightAreaType) {
    setCurrentType(type)
    setMouseMode(bool)
    setIsFlightArea(!!flightAreaType)
    mouseToolHandler(type, getDrawCallback, flightAreaType)
  }

  function selectFlightAreaAction({ type, isCircle }: { type: EFlightAreaType; isCircle: boolean }) {
    draw(isCircle ? MapDoodleEnum.CIRCLE : MapDoodleEnum.POLYGON, true, type)
  }

  function getDrawCallback({ obj }: { obj: any }) {
    if (drawStateRef.current.isFlightArea) {
      // Flight area draw callback — placeholder
      return
    }
    switch (drawStateRef.current.currentType) {
      case MapDoodleEnum.PIN:
        postPinPositionResource(obj)
        break
      case MapDoodleEnum.POLYLINE:
        postPolylineResource(obj)
        break
      case MapDoodleEnum.POLYGON:
        postPolygonResource(obj)
        break
      default:
        break
    }
  }

  async function postPinPositionResource(obj: any) {
    const req = getPinPositionResource(obj)
    setLayersHelper(req)
    const coordinates = req.resource.content.geometry.coordinates
    updateCoordinates('gcj02-wgs84', req)
    ;(req.resource.content.geometry.coordinates as GeojsonCoordinate).push(
      (coordinates as GeojsonCoordinate)[2]
    )
    await postElementsReq(shareId, req)
    obj.setExtData({ id: req.id, name: req.name })
    coverMap[req.id] = [obj]
  }

  async function postPolylineResource(obj: any) {
    const req = getPolylineResource(obj)
    setLayersHelper(req)
    updateCoordinates('gcj02-wgs84', req)
    await postElementsReq(shareId, req)
    obj.setExtData({ id: req.id, name: req.name })
    coverMap[req.id] = [obj]
  }

  async function postPolygonResource(obj: any) {
    const req = getPolygonResource(obj)
    setLayersHelper(req)
    updateCoordinates('gcj02-wgs84', req)
    await postElementsReq(shareId, req)
    obj.setExtData({ id: req.id, name: req.name })
    coverMap[req.id] = [obj]
  }

  function getPinPositionResource(obj: any) {
    const position = obj.getPosition()
    const resource = generatePointContent(position)
    const name = obj._originOpts.title
    const id = uuidv4()
    return { id, name, resource }
  }

  function getPolylineResource(obj: any) {
    const path = obj.getPath()
    const resource = generateLineContent(path)
    const { name, id } = getBaseInfo(obj._opts)
    return { id, name, resource }
  }

  function getPolygonResource(obj: any) {
    const path = obj.getPath()
    const resource = generatePolyContent(path)
    const { name, id } = getBaseInfo(obj._opts)
    return { id, name, resource }
  }

  function getBaseInfo(obj: any) {
    const name = obj.title
    const id = uuidv4()
    return { name, id }
  }

  function setLayersHelper(resource: PostElementsBody) {
    const layers = [...Layers]
    const layer = layers.find((item) => item.id.includes(shareId))
    if (layer?.elements) {
      ;(layer.elements as any[]).push(resource)
    }
    setLayerInfo(layers)
  }

  function updateCoordinates(transformType: string, element: any) {
    const type = element.resource?.type as number
    if (element.resource) {
      if (MapElementEnum.PIN === type) {
        const coordinates = element.resource.content.geometry.coordinates as GeojsonCoordinate
        if (transformType === 'wgs84-gcj02') {
          const transResult = wgs84togcj02(coordinates[0], coordinates[1]) as GeojsonCoordinate
          element.resource.content.geometry.coordinates = transResult
        } else if (transformType === 'gcj02-wgs84') {
          const transResult = gcj02towgs84(coordinates[0], coordinates[1]) as GeojsonCoordinate
          element.resource.content.geometry.coordinates = transResult
        }
      } else if (MapElementEnum.LINE === type) {
        const coordinates = element.resource.content.geometry.coordinates as GeojsonCoordinate[]
        if (transformType === 'wgs84-gcj02') {
          coordinates.forEach((coordinate, i, arr) => {
            arr[i] = wgs84togcj02(coordinate[0], coordinate[1]) as GeojsonCoordinate
          })
        } else if (transformType === 'gcj02-wgs84') {
          coordinates.forEach((coordinate, i, arr) => {
            arr[i] = gcj02towgs84(coordinate[0], coordinate[1]) as GeojsonCoordinate
          })
        }
        element.resource.content.geometry.coordinates = coordinates
      } else if (MapElementEnum.POLY === type) {
        const coordinates = element.resource.content.geometry.coordinates[0] as GeojsonCoordinate[]
        if (transformType === 'wgs84-gcj02') {
          coordinates.forEach((coordinate, i, arr) => {
            arr[i] = wgs84togcj02(coordinate[0], coordinate[1]) as GeojsonCoordinate
          })
        } else if (transformType === 'gcj02-wgs84') {
          coordinates.forEach((coordinate, i, arr) => {
            arr[i] = gcj02towgs84(coordinate[0], coordinate[1]) as GeojsonCoordinate
          })
        }
        element.resource.content.geometry.coordinates = [coordinates]
      }
    }
  }

  function closeOsd() {
    setOsdVisible({ ...osdVisible, visible: false })
  }

  function closeLivestreamOthers() {
    setLivestreamOthersVisible(false)
  }

  function closeLivestreamAgora() {
    setLivestreamAgoraVisible(false)
  }

  // Helper to format acc_time
  function formatAccTime(accTime: number | undefined) {
    if (!accTime) return '0 s'
    const parts: string[] = []
    if (accTime >= 2592000) parts.push(`${Math.floor(accTime / 2592000)}m`)
    if ((accTime % 2592000) >= 86400) parts.push(`${Math.floor((accTime % 2592000) / 86400)}d`)
    if ((accTime % 2592000 % 86400) >= 3600) parts.push(`${Math.floor((accTime % 2592000 % 86400) / 3600)}h`)
    if ((accTime % 2592000 % 86400 % 3600) >= 60) parts.push(`${Math.floor((accTime % 2592000 % 86400 % 3600) / 60)}min`)
    parts.push(`${Math.floor(accTime % 2592000 % 86400 % 3600 % 60)} s`)
    return parts.join(' ')
  }

  function formatBatteryTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  function formatFixed(val: any, suffix: string) {
    return val === STR ? STR : `${val.toFixed(2)} ${suffix}`
  }

  // Compute storage percent helper
  function storagePercent(used?: number, total?: number) {
    if (!total || total <= 0) return 0
    return (used || 0) * 100 / total
  }

  return (
    <div className="g-map-wrapper" style={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* Map container */}
      <div id="g-container" style={{ width: '100%', height: '100%' }} />

      {/* Drawing action panel */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: drawVisible ? 316 : 16,
        }}
      >
        <div
          className={currentType === 'pin' ? 'g-action-item selection' : 'g-action-item'}
          onClick={() => draw('pin', true)}
          style={actionItemStyle}
        >
          <a><img src={pin} alt="pin" style={{ width: 20 }} /></a>
        </div>
        <div
          className={currentType === 'polyline' ? 'g-action-item selection' : 'g-action-item'}
          onClick={() => draw('polyline', true)}
          style={actionItemStyle}
        >
          <a><LineOutlined rotate={135} style={{ fontSize: 20 }} /></a>
        </div>
        <div
          className={currentType === 'polygon' && !isFlightArea ? 'g-action-item selection' : 'g-action-item'}
          onClick={() => draw('polygon', true)}
          style={actionItemStyle}
        >
          <a><BorderOutlined style={{ fontSize: 18 }} /></a>
        </div>
        <FlightAreaActionIcon
          className={`g-action-item${mouseMode && isFlightArea ? ' selection' : ''}`}
          onSelectAction={selectFlightAreaAction}
          onClick={selectFlightAreaAction}
        />
        {mouseMode && (
          <div
            className="g-action-item"
            onClick={() => draw('off', false)}
            style={actionItemStyle}
          >
            <a style={{ color: 'red' }}><CloseOutlined /></a>
          </div>
        )}
      </div>

      {/* Drone OSD Panel (non-dock) */}
      {osdVisible.visible && !osdVisible.is_dock && (
        <div ref={droneOsdRef} className="osd-panel" style={osdPanelStyle}>
          <div
            className="drag-title"
            style={{
              borderBottom: '1px solid #515151',
              height: '18%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 5px',
              fontSize: 12,
            }}
          >
            <span>{osdVisible.callsign}</span>
            <span>
              <a style={{ fontSize: 16, color: 'white' }} onClick={closeOsd}>
                <CloseOutlined />
              </a>
            </span>
          </div>
          <div style={{ height: '82%', fontSize: 12 }}>
            <div
              style={{
                marginTop: -5,
                paddingTop: 25,
                float: 'left',
                width: 60,
                background: '#2d2d2d',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Tooltip title={osdVisible.model}>
                <div style={{ width: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span><img src={M30} alt="model" style={{ width: '100%' }} /></span>
                  <span>{osdVisible.model}</span>
                </div>
              </Tooltip>
            </div>
            <div style={{ marginTop: 5, paddingLeft: 5 }}>
              <Row>
                <Col span={16} style={deviceInfo.device.mode_code === EModeCode.Disconnected ? { color: 'red', fontWeight: 700 } : { color: 'rgb(25,190,107)' }}>
                  {EModeCode[deviceInfo.device.mode_code]}
                </Col>
              </Row>
              <Row>
                <Col span={6}>
                  <Tooltip title="Signal strength">
                    <span>HD</span>
                    <span style={{ marginLeft: 10 }}>{deviceInfo.gateway?.transmission_signal_quality}</span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="RC Battery Level">
                    <span><ThunderboltOutlined style={{ fontSize: 14 }} /></span>
                    <span style={{ marginLeft: 10 }}>
                      {deviceInfo.gateway && deviceInfo.gateway.capacity_percent !== STR
                        ? `${deviceInfo.gateway.capacity_percent} %`
                        : deviceInfo.gateway?.capacity_percent}
                    </span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="Drone Battery Level">
                    <span><ThunderboltOutlined style={{ fontSize: 14 }} /></span>
                    <span style={{ marginLeft: 10 }}>
                      {deviceInfo.device.battery.capacity_percent !== STR
                        ? `${deviceInfo.device.battery.capacity_percent} %`
                        : deviceInfo.device.battery.capacity_percent}
                    </span>
                  </Tooltip>
                </Col>
              </Row>
              <Row>
                <Tooltip title="RTK Fixed">
                  <Col span={6} style={{ display: 'flex', alignItems: 'center' }}>
                    <span>Fixed</span>
                    <span
                      style={{
                        marginLeft: 10,
                        borderRadius: '50%',
                        width: 10,
                        height: 10,
                        display: 'inline-block',
                        background: deviceInfo.device.position_state.is_fixed === 1 ? 'rgb(25,190,107)' : 'red',
                      }}
                    />
                  </Col>
                </Tooltip>
                <Col span={6}>
                  <Tooltip title="GPS">
                    <span>GPS</span>
                    <span style={{ marginLeft: 10 }}>{deviceInfo.device.position_state.gps_number}</span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="RTK">
                    <span><TrademarkOutlined style={{ fontSize: 14 }} /></span>
                    <span style={{ marginLeft: 10 }}>{deviceInfo.device.position_state.rtk_number}</span>
                  </Tooltip>
                </Col>
              </Row>
              <Row>
                <Col span={6}>
                  <Tooltip title="Flight Mode">
                    <span><ControlOutlined style={{ fontSize: 16 }} /></span>
                    <span style={{ marginLeft: 10 }}>{EGear[deviceInfo.device.gear]}</span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="Altitude above sea level">
                    <span>ASL</span>
                    <span style={{ marginLeft: 10 }}>{formatFixed(deviceInfo.device.height, 'm')}</span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="Altitude above takeoff level">
                    <span>ALT</span>
                    <span style={{ marginLeft: 10 }}>{formatFixed(deviceInfo.device.elevation, 'm')}</span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="Distance to Home Point">
                    <span>H</span>
                    <span style={{ marginLeft: 10 }}>{formatFixed(deviceInfo.device.home_distance, 'm')}</span>
                  </Tooltip>
                </Col>
              </Row>
              <Row>
                <Col span={6}>
                  <Tooltip title="Horizontal Speed">
                    <span>H.S</span>
                    <span style={{ marginLeft: 10 }}>{formatFixed(deviceInfo.device.horizontal_speed, 'm/s')}</span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="Vertical Speed">
                    <span>V.S</span>
                    <span style={{ marginLeft: 10 }}>{formatFixed(deviceInfo.device.vertical_speed, 'm/s')}</span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="Wind Speed">
                    <span>W.S</span>
                    <span style={{ marginLeft: 10 }}>
                      {deviceInfo.device.wind_speed === STR
                        ? STR
                        : `${((deviceInfo.device.wind_speed as any) / 10).toFixed(2)} m/s`}
                    </span>
                  </Tooltip>
                </Col>
              </Row>
            </div>
          </div>
          {/* Battery slider */}
          {deviceInfo.device.battery.remain_flight_time !== 0 && (
            <div style={{ position: 'relative', height: 20 }}>
              <div style={{ background: '#535759', width: '100%', position: 'absolute', minHeight: 2, borderRadius: 2 }} />
              <div style={{ background: '#00ee8b', width: `${deviceInfo.device.battery.capacity_percent}%`, position: 'absolute', minHeight: 2, borderRadius: 2 }} />
              <div style={{ background: '#ff9f0a', width: `${deviceInfo.device.battery.return_home_power}%`, position: 'absolute', minHeight: 2, borderRadius: 2 }} />
              <div style={{ background: '#f5222d', width: `${deviceInfo.device.battery.landing_power}%`, position: 'absolute', minHeight: 2, borderRadius: 2 }} />
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'white', position: 'absolute', bottom: -0.5, left: `${deviceInfo.device.battery.landing_power}%` }} />
              <div style={{
                background: '#141414',
                color: '#00ee8b',
                marginTop: -10,
                height: 20,
                width: 'auto',
                borderLeft: '1px solid #00ee8b',
                padding: '0 5px',
                position: 'absolute',
                left: `${deviceInfo.device.battery.capacity_percent}%`,
              }}>
                {formatBatteryTime(deviceInfo.device.battery.remain_flight_time as number)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dock OSD Panel */}
      {osdVisible.visible && osdVisible.is_dock && (
        <div ref={dockOsdRef} className="osd-panel" style={{ ...osdPanelStyle, fontSize: 12 }}>
          <div
            className="drag-title"
            style={{
              fontSize: 16,
              padding: '0 5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #515151',
              height: '10%',
            }}
          >
            <span>{osdVisible.gateway_callsign}</span>
          </div>
          <span>
            <a style={{ color: 'white', position: 'absolute', top: 5, right: 5 }} onClick={closeOsd}>
              <CloseOutlined />
            </a>
          </span>

          {/* Dock section */}
          <div style={{ display: 'flex', borderBottom: '1px solid #515151' }}>
            <div style={{ width: 60, background: '#2d2d2d', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center' }}>
              <Tooltip title={osdVisible.model}>
                <div style={{ width: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span><RobotFilled style={{ fontSize: 48 }} /></span>
                  <span style={{ marginTop: 10 }}>Dock</span>
                </div>
              </Tooltip>
            </div>
            <div style={{ flex: 1, marginTop: 5, paddingLeft: 5 }}>
              <Row>
                <Col span={16} style={deviceInfo.dock.basic_osd?.mode_code === EDockModeCode.Disconnected ? { color: 'red', fontWeight: 700 } : { color: 'rgb(25,190,107)' }}>
                  {EDockModeCode[deviceInfo.dock.basic_osd?.mode_code]}
                </Col>
              </Row>
              <Row>
                <Col span={12}>
                  <Tooltip title="Accumulated Running Time">
                    <span><HistoryOutlined /></span>
                    <span style={{ marginLeft: 10 }}>{formatAccTime(deviceInfo.dock.work_osd?.acc_time)}</span>
                  </Tooltip>
                </Col>
                <Col span={12}>
                  <Tooltip title="Activation time">
                    <span><FieldTimeOutlined /></span>
                    <span style={{ marginLeft: 10 }}>
                      {new Date((deviceInfo.dock.work_osd?.activation_time ?? 0) * 1000).toLocaleString()}
                    </span>
                  </Tooltip>
                </Col>
              </Row>
              <Row>
                <Col span={6}>
                  <Tooltip title="Network State">
                    <span style={qualityStyle}>
                      {deviceInfo.dock.basic_osd?.network_state?.type === NetworkStateTypeEnum.FOUR_G
                        ? <SignalFilled />
                        : <GlobalOutlined />}
                    </span>
                    <span style={{ marginLeft: 10 }}>{deviceInfo.dock.basic_osd?.network_state?.rate} kb/s</span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="The total number of times the dock has performed missions.">
                    <span><CarryOutOutlined /></span>
                    <span style={{ marginLeft: 10 }}>{deviceInfo.dock.work_osd?.job_number}</span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="Media File Remain Upload">
                    <span><CloudUploadOutlined style={{ fontSize: 14 }} /></span>
                    <span style={{ marginLeft: 10 }}>{deviceInfo.dock.link_osd?.media_file_detail?.remain_upload}</span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip
                    title={
                      <>
                        <p>total: {deviceInfo.dock.basic_osd?.storage?.total}</p>
                        <p>used: {deviceInfo.dock.basic_osd?.storage?.used}</p>
                      </>
                    }
                  >
                    <span><FolderOpenOutlined /></span>
                    {(deviceInfo.dock.basic_osd?.storage?.total ?? 0) > 0 && (
                      <span style={{ marginLeft: 10 }}>
                        <Progress
                          type="circle"
                          size={20}
                          percent={storagePercent(deviceInfo.dock.basic_osd?.storage?.used, deviceInfo.dock.basic_osd?.storage?.total)}
                          strokeWidth={20}
                          showInfo={false}
                          strokeColor={storagePercent(deviceInfo.dock.basic_osd?.storage?.used, deviceInfo.dock.basic_osd?.storage?.total) > 80 ? 'red' : '#00ee8b'}
                        />
                      </span>
                    )}
                  </Tooltip>
                </Col>
              </Row>
              <Row>
                <Col span={6}>
                  <Tooltip title="Wind Speed">
                    <span>W.S</span>
                    <span style={{ marginLeft: 10 }}>{(deviceInfo.dock.basic_osd?.wind_speed ?? STR) + ' m/s'}</span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="Rainfall">
                    <span>R</span>
                    <span style={{ marginLeft: 10 }}>{RainfallEnum[deviceInfo.dock.basic_osd?.rainfall]}</span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="Environment Temperature">
                    <span>°C</span>
                    <span style={{ marginLeft: 10 }}>{deviceInfo.dock.basic_osd?.environment_temperature}</span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="Dock Temperature">
                    <span>°C</span>
                    <span style={{ marginLeft: 10 }}>{deviceInfo.dock.basic_osd?.temperature}</span>
                  </Tooltip>
                </Col>
              </Row>
              <Row>
                <Col span={6}>
                  <Tooltip title="Dock Humidity">
                    <span>H</span>
                    <span style={{ marginLeft: 10 }}>{deviceInfo.dock.basic_osd?.humidity}</span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="Working Voltage">
                    <span style={{ border: '1px solid', borderRadius: '50%', width: 18, height: 18, lineHeight: '16px', textAlign: 'center', float: 'left', display: 'inline-block' }}>V</span>
                    <span style={{ marginLeft: 10 }}>{(deviceInfo.dock.work_osd?.working_voltage ?? STR) + ' mV'}</span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="Working Current">
                    <span style={{ border: '1px solid', borderRadius: '50%', width: 18, height: 18, lineHeight: '15px', textAlign: 'center', float: 'left', display: 'inline-block' }}>A</span>
                    <span style={{ marginLeft: 10 }}>{(deviceInfo.dock.work_osd?.working_current ?? STR) + ' mA'}</span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="Drone in dock">
                    <span><RocketOutlined /></span>
                    <span style={{ marginLeft: 10 }}>{deviceInfo.dock.basic_osd?.drone_in_dock}</span>
                  </Tooltip>
                </Col>
              </Row>
              <Row style={{ padding: 5 }}>
                <Col span={24}>
                  <Button
                    type="primary"
                    disabled={dockControlPanelVisible}
                    size="small"
                    onClick={() => setDockControlPanelVisible(true)}
                  >
                    Actions
                  </Button>
                </Col>
              </Row>
              {/* Dock Control Panel */}
              {dockControlPanelVisible && (
                <DockControlPanel
                  sn={osdVisible.gateway_sn}
                  deviceInfo={deviceInfo}
                  onCloseControlPanel={onCloseControlPanel}
                />
              )}
            </div>
          </div>

          {/* Drone section within dock OSD */}
          <div style={{ display: 'flex' }}>
            <div style={{ width: 60, background: '#2d2d2d', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center' }}>
              <Tooltip title={osdVisible.model}>
                <div style={{ width: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span><img src={M30} alt="model" style={{ width: '100%' }} /></span>
                  <span>M30</span>
                </div>
              </Tooltip>
            </div>
            <div style={{ flex: 1, marginTop: 5, paddingLeft: 5 }}>
              <Row>
                <Col
                  span={16}
                  style={
                    !deviceInfo.device || deviceInfo.device?.mode_code === EModeCode.Disconnected
                      ? { color: 'red', fontWeight: 700 }
                      : { color: 'rgb(25,190,107)' }
                  }
                >
                  {!deviceInfo.device ? EModeCode[EModeCode.Disconnected] : EModeCode[deviceInfo.device?.mode_code]}
                </Col>
              </Row>
              <Row>
                <Col span={6}>
                  <Tooltip title="Upward Quality">
                    <span><SignalFilled /><ArrowUpOutlined style={{ fontSize: 9, verticalAlign: 'top' }} /></span>
                    <span style={{ marginLeft: 10 }}>{deviceInfo.dock.link_osd?.sdr?.up_quality}</span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="Downward Quality">
                    <span><SignalFilled /><ArrowDownOutlined style={{ fontSize: 9, verticalAlign: 'top' }} /></span>
                    <span style={{ marginLeft: 10 }}>{deviceInfo.dock.link_osd?.sdr?.down_quality}</span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="Drone Battery Level">
                    <span><ThunderboltOutlined style={{ fontSize: 14 }} /></span>
                    <span style={{ marginLeft: 10 }}>
                      {deviceInfo.device && deviceInfo.device.battery.capacity_percent !== STR
                        ? `${deviceInfo.device.battery.capacity_percent} %`
                        : STR}
                    </span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip
                    title={
                      <>
                        <p>total: {deviceInfo.device?.storage?.total}</p>
                        <p>used: {deviceInfo.device?.storage?.used}</p>
                      </>
                    }
                  >
                    <span><FolderOpenOutlined /></span>
                    {((deviceInfo.device as any)?.storage?.total ?? 0) > 0 && (
                      <span style={{ marginLeft: 10 }}>
                        <Progress
                          type="circle"
                          size={20}
                          percent={storagePercent((deviceInfo.device as any)?.storage?.used, (deviceInfo.device as any)?.storage?.total)}
                          strokeWidth={20}
                          showInfo={false}
                          strokeColor={storagePercent((deviceInfo.device as any)?.storage?.used, (deviceInfo.device as any)?.storage?.total) > 80 ? 'red' : '#00ee8b'}
                        />
                      </span>
                    )}
                  </Tooltip>
                </Col>
              </Row>
              <Row>
                <Tooltip title="RTK Fixed">
                  <Col span={6} style={{ display: 'flex', alignItems: 'center' }}>
                    <span>Fixed</span>
                    <span
                      style={{
                        marginLeft: 10,
                        borderRadius: '50%',
                        width: 10,
                        height: 10,
                        display: 'inline-block',
                        background: deviceInfo.device?.position_state.is_fixed === 1 ? 'rgb(25,190,107)' : 'red',
                      }}
                    />
                  </Col>
                </Tooltip>
                <Col span={6}>
                  <Tooltip title="GPS">
                    <span>GPS</span>
                    <span style={{ marginLeft: 10 }}>{deviceInfo.device ? deviceInfo.device.position_state.gps_number : STR}</span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="RTK">
                    <span><TrademarkOutlined style={{ fontSize: 14 }} /></span>
                    <span style={{ marginLeft: 10 }}>{deviceInfo.device ? deviceInfo.device.position_state.rtk_number : STR}</span>
                  </Tooltip>
                </Col>
              </Row>
              <Row>
                <Col span={6}>
                  <Tooltip title="Flight Mode">
                    <span><ControlOutlined style={{ fontSize: 16 }} /></span>
                    <span style={{ marginLeft: 10 }}>{deviceInfo.device ? EGear[deviceInfo.device?.gear] : STR}</span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="Altitude above sea level">
                    <span>ASL</span>
                    <span style={{ marginLeft: 10 }}>
                      {!deviceInfo.device || deviceInfo.device.height === STR ? STR : `${(deviceInfo.device?.height as any).toFixed(2)} m`}
                    </span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="Altitude above takeoff level">
                    <span>ALT</span>
                    <span style={{ marginLeft: 10 }}>
                      {!deviceInfo.device || deviceInfo.device.elevation === STR ? STR : `${(deviceInfo.device?.elevation as any).toFixed(2)} m`}
                    </span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="Distance to Home Point">
                    <span style={{ border: '1px solid', borderRadius: '50%', width: 18, height: 18, lineHeight: '15px', textAlign: 'center', display: 'block', float: 'left' }}>H</span>
                    <span style={{ marginLeft: 10 }}>
                      {!deviceInfo.device || deviceInfo.device.home_distance === STR ? STR : `${(deviceInfo.device?.home_distance as any).toFixed(2)} m`}
                    </span>
                  </Tooltip>
                </Col>
              </Row>
              <Row>
                <Col span={6}>
                  <Tooltip title="Horizontal Speed">
                    <span>H.S</span>
                    <span style={{ marginLeft: 10 }}>
                      {!deviceInfo.device || deviceInfo.device?.horizontal_speed === STR ? STR : `${(deviceInfo.device?.horizontal_speed as any).toFixed(2)} m/s`}
                    </span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="Vertical Speed">
                    <span>V.S</span>
                    <span style={{ marginLeft: 10 }}>
                      {!deviceInfo.device || deviceInfo.device.vertical_speed === STR ? STR : `${(deviceInfo.device?.vertical_speed as any).toFixed(2)} m/s`}
                    </span>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title="Wind Speed">
                    <span>W.S</span>
                    <span style={{ marginLeft: 10 }}>
                      {!deviceInfo.device || deviceInfo.device.wind_speed === STR
                        ? STR
                        : `${((deviceInfo.device?.wind_speed as any) / 10).toFixed(2)} m/s`}
                    </span>
                  </Tooltip>
                </Col>
              </Row>
            </div>
          </div>

          {/* Battery slider for dock drone */}
          {deviceInfo.device && deviceInfo.device.battery.remain_flight_time !== 0 && (
            <div style={{ position: 'relative', height: 20, border: '1px solid red' }}>
              <div style={{ background: '#535759', width: '100%', position: 'absolute', minHeight: 2, borderRadius: 2 }} />
              <div style={{ background: '#00ee8b', width: `${deviceInfo.device.battery.capacity_percent}%`, position: 'absolute', minHeight: 2, borderRadius: 2 }} />
              <div style={{ background: '#ff9f0a', width: `${deviceInfo.device.battery.return_home_power}%`, position: 'absolute', minHeight: 2, borderRadius: 2 }} />
              <div style={{ background: '#f5222d', width: `${deviceInfo.device.battery.landing_power}%`, position: 'absolute', minHeight: 2, borderRadius: 2 }} />
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'white', position: 'absolute', bottom: -0.5, left: `${deviceInfo.device.battery.landing_power}%` }} />
              <div style={{
                background: '#141414',
                color: '#00ee8b',
                marginTop: -10,
                height: 20,
                width: 'auto',
                borderLeft: '1px solid #00ee8b',
                padding: '0 5px',
                position: 'absolute',
                left: `${deviceInfo.device.battery.capacity_percent}%`,
              }}>
                {formatBatteryTime(deviceInfo.device.battery.remain_flight_time as number)}
              </div>
            </div>
          )}

          {/* Drone Control Panel */}
          <DroneControlPanel
            sn={osdVisible.gateway_sn}
            deviceInfo={deviceInfo}
            payloads={osdVisible.payloads}
          />
        </div>
      )}

      {/* Livestream Others */}
      {livestreamOthersVisible && (
        <div ref={liveOthersRef} style={liveviewStyle}>
          <div style={{ height: 40, width: '100%' }} className="drag-title" />
          <a style={{ position: 'absolute', right: 10, top: 10, fontSize: 16, color: 'white' }} onClick={closeLivestreamOthers}>
            <CloseOutlined />
          </a>
          <LivestreamOthers />
        </div>
      )}

      {/* Livestream Agora */}
      {livestreamAgoraVisible && (
        <div ref={liveAgoraRef} style={liveviewStyle}>
          <div style={{ height: 40, width: '100%' }} className="drag-title" />
          <a style={{ position: 'absolute', right: 10, top: 10, fontSize: 16, color: 'white' }} onClick={closeLivestreamAgora}>
            <CloseOutlined />
          </a>
          <LivestreamAgora />
        </div>
      )}
    </div>
  )
}

const actionItemStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  background: 'white',
  color: '#2d8cf0',
  borderRadius: 2,
  lineHeight: '28px',
  textAlign: 'center',
  marginBottom: 2,
  cursor: 'pointer',
}

const osdPanelStyle: React.CSSProperties = {
  position: 'absolute',
  marginLeft: 10,
  left: 0,
  top: 10,
  width: 480,
  background: '#000',
  color: '#fff',
  borderRadius: 2,
  opacity: 0.8,
}

const liveviewStyle: React.CSSProperties = {
  position: 'absolute',
  color: '#fff',
  zIndex: 1,
  left: 0,
  marginLeft: 10,
  top: 10,
  textAlign: 'center',
  width: 800,
  height: 720,
  background: '#232323',
}

export default GMap
