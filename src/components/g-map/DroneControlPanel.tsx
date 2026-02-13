import { useState, useEffect, useRef } from 'react'
import { Select, message, Button, InputNumber } from 'antd'
import {
  DownOutlined,
  UpOutlined,
  LeftOutlined,
  RightOutlined,
  PauseCircleOutlined,
  UndoOutlined,
  RedoOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import {
  PayloadInfo,
  DeviceInfoType,
  ControlSource,
  DeviceOsdCamera,
} from '@/types/device'
import { useMqttStore } from '@/store/useMqttStore'
import { postDrcEnter, postDrcExit } from '@/api/drc'
import { DeviceTopicInfo } from './useMqtt'
import { useMqtt } from './useMqtt'
import { useManualControl, KeyCode } from './useManualControl'
import { usePayloadControl } from './usePayloadControl'
import { CameraMode } from '@/types/live-stream'
import { useDroneControlWsEvent } from './useDroneControlWsEvent'
import { useDroneControlMqttEvent } from './useDroneControlMqttEvent'
import {
  postFlightAuth,
  LostControlActionInCommandFLight,
  WaylineLostControlActionInCommandFlight,
  ERthMode,
  ECommanderModeLostAction,
  ECommanderFlightMode,
} from '@/api/drone-control/drone'
import { useDroneControl } from './useDroneControl'
import {
  GimbalResetMode,
  GimbalResetModeOptions,
  LostControlActionInCommandFLightOptions,
  WaylineLostControlActionInCommandFlightOptions,
  RthModeInCommandFlightOptions,
  CommanderModeLostActionInCommandFlightOptions,
  CommanderFlightModeInCommandFlightOptions,
} from '@/types/drone-control'
import DroneControlPopover from './DroneControlPopover'
import DroneControlInfoPanel from './DroneControlInfoPanel'
import {
  noDebugCmdList as baseCmdList,
  DeviceCmdItem,
} from '@/types/device-cmd'
import { useDockControl } from './useDockControl'
import { useLivestreamStore } from '@/store/useLivestreamStore'

interface DroneControlPanelProps {
  sn: string
  deviceInfo: DeviceInfoType
  payloads: null | PayloadInfo[]
}

function DroneControlPanel({
  sn,
  deviceInfo,
  payloads,
}: DroneControlPanelProps) {
  const clientId = useMqttStore((s) => s.clientId)
  const setLivestreamOthersVisible = useLivestreamStore(
    (s) => s.setLivestreamOthersVisible
  )
  const setLivestreamAgoraVisible = useLivestreamStore(
    (s) => s.setLivestreamAgoraVisible
  )

  const [cmdList] = useState(() =>
    baseCmdList.map((item) => ({ ...item }))
  )
  const { sendDockControlCmd } = useDockControl()
  const { flyToPoint, stopFlyToPoint, takeoffToPoint } = useDroneControl()
  const MAX_SPEED = 14

  // Flight control state
  const [flightController, setFlightController] = useState(false)
  const [deviceTopicInfo, setDeviceTopicInfo] = useState<DeviceTopicInfo>({
    sn,
    pubTopic: '',
    subTopic: '',
  })

  useMqtt(deviceTopicInfo)

  // DRC MQTT events
  const { drcInfo, errorInfo, setErrorInfo } = useDroneControlMqttEvent(sn)

  const { handleKeyup, handleEmergencyStop, resetControlState } =
    useManualControl(deviceTopicInfo, flightController)

  // Payload control
  const [payloadSelectValue, setPayloadSelectValue] = useState<string | null>(null)
  const [payloadOptions, setPayloadOptions] = useState<any[]>([])
  const [payloadIndex, setPayloadIndex] = useState('')
  const [payloadControlSourceLocal, setPayloadControlSourceLocal] = useState<ControlSource | undefined>(undefined)

  useEffect(() => {
    if (payloads && payloads.length > 0) {
      setPayloadSelectValue(payloads[0].payload_sn)
      setPayloadControlSourceLocal(payloads[0].control_source || ControlSource.B)
      setPayloadIndex(payloads[0].payload_index || '')
      setPayloadOptions(
        payloads.map((item) => ({
          label: item.payload_name,
          value: item.payload_sn,
        }))
      )
    } else {
      setPayloadSelectValue(null)
      setPayloadControlSourceLocal(undefined)
      setPayloadOptions([])
      setPayloadIndex('')
    }
  }, [payloads])

  const handlePayloadChange = (value: string) => {
    const payload = payloads?.find((item) => item.payload_sn === value)
    if (payload) {
      setPayloadIndex(payload.payload_index || '')
      setPayloadControlSourceLocal(payload.control_source)
      setPayloadSelectValue(value)
    }
  }

  // WS events
  const {
    droneControlSource,
    payloadControlSource,
    setPayloadControlSource,
  } = useDroneControlWsEvent(sn, payloadSelectValue || '')

  useEffect(() => {
    setPayloadControlSourceLocal(payloadControlSource)
  }, [payloadControlSource])

  const {
    checkPayloadAuth,
    authPayload,
    resetGimbal,
    switchCameraMode,
    takeCameraPhoto,
    startCameraRecording,
    stopCameraRecording,
    changeCameraFocalLength,
    cameraAim,
  } = usePayloadControl()

  // Fly to point
  const [flyToVisible, setFlyToVisible] = useState(false)
  const [flyToLat, setFlyToLat] = useState<number | null>(null)
  const [flyToLng, setFlyToLng] = useState<number | null>(null)
  const [flyToHeight, setFlyToHeight] = useState<number | null>(null)

  // Takeoff to point
  const [takeoffVisible, setTakeoffVisible] = useState(false)
  const [takeoffLat, setTakeoffLat] = useState<number | null>(null)
  const [takeoffLng, setTakeoffLng] = useState<number | null>(null)
  const [takeoffHeight, setTakeoffHeight] = useState<number | null>(null)
  const [takeoffSecurityHeight, setTakeoffSecurityHeight] = useState<number | null>(null)
  const [takeoffRthAltitude, setTakeoffRthAltitude] = useState<number | null>(null)
  const [takeoffRcLostAction, setTakeoffRcLostAction] = useState(LostControlActionInCommandFLight.RETURN_HOME)
  const [takeoffExitWayline, setTakeoffExitWayline] = useState(WaylineLostControlActionInCommandFlight.EXEC_LOST_ACTION)
  const [takeoffRthMode, setTakeoffRthMode] = useState(ERthMode.SETTING)
  const [takeoffCmdLostAction, setTakeoffCmdLostAction] = useState(ECommanderModeLostAction.CONTINUE)
  const [takeoffCmdFlightMode, setTakeoffCmdFlightMode] = useState(ECommanderFlightMode.SETTING)
  const [takeoffCmdFlightHeight, setTakeoffCmdFlightHeight] = useState<number | null>(null)

  // Gimbal reset
  const [gimbalResetVisible, setGimbalResetVisible] = useState(false)
  const [gimbalResetMode, setGimbalResetMode] = useState<GimbalResetMode | null>(null)

  // Zoom
  const [zoomVisible, setZoomVisible] = useState(false)
  const [zoomCameraType, setZoomCameraType] = useState<any>(null)
  const [zoomFactor, setZoomFactor] = useState<number | null>(null)

  // Camera aim
  const [cameraAimVisible, setCameraAimVisible] = useState(false)
  const [cameraAimType, setCameraAimType] = useState<any>(null)
  const [cameraAimLocked, setCameraAimLocked] = useState(false)
  const [cameraAimX, setCameraAimX] = useState<number | null>(null)
  const [cameraAimY, setCameraAimY] = useState<number | null>(null)

  useEffect(() => {
    if (errorInfo) {
      message.error(errorInfo)
      console.error(errorInfo)
      setErrorInfo('')
    }
  }, [errorInfo]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onClickFightControl() {
    if (flightController) {
      exitFlightControl()
      return
    }
    enterFlightControl()
  }

  async function enterFlightControl() {
    try {
      const { code, data } = await postDrcEnter({
        client_id: clientId,
        dock_sn: sn,
      })
      if (code === 0) {
        setFlightController(true)
        const newTopicInfo = { ...deviceTopicInfo }
        if (data.sub && data.sub.length > 0) {
          newTopicInfo.subTopic = data.sub[0]
        }
        if (data.pub && data.pub.length > 0) {
          newTopicInfo.pubTopic = data.pub[0]
        }
        setDeviceTopicInfo(newTopicInfo)
        if (droneControlSource !== ControlSource.A) {
          await postFlightAuth(sn)
        }
        message.success('Get flight control successfully')
      }
    } catch (error) {}
  }

  async function exitFlightControl() {
    try {
      const { code } = await postDrcExit({
        client_id: clientId,
        dock_sn: sn,
      })
      if (code === 0) {
        setFlightController(false)
        setDeviceTopicInfo({ ...deviceTopicInfo, subTopic: '', pubTopic: '' })
        message.success('Exit flight control')
      }
    } catch (error) {}
  }

  async function sendControlCmd(cmdItem: DeviceCmdItem) {
    cmdItem.loading = true
    const result = await sendDockControlCmd(
      { sn, cmd: cmdItem.cmdKey, action: cmdItem.action },
      false
    )
    if (result) {
      message.success('Return home successful')
      if (flightController) {
        exitFlightControl()
      }
    } else {
      message.error('Failed to return home')
    }
    cmdItem.loading = false
  }

  async function onFlyToConfirm(confirm: boolean) {
    if (confirm) {
      if (!flyToHeight || !flyToLat || !flyToLng) {
        message.error('Input error')
        return
      }
      try {
        await flyToPoint(sn, {
          max_speed: MAX_SPEED,
          points: [
            { latitude: flyToLat, longitude: flyToLng, height: flyToHeight },
          ],
        })
      } catch (error) {}
    }
    setFlyToVisible(false)
  }

  async function onTakeoffConfirm(confirm: boolean) {
    if (confirm) {
      if (
        !takeoffHeight ||
        !takeoffLat ||
        !takeoffLng ||
        !takeoffSecurityHeight ||
        !takeoffRthAltitude ||
        !takeoffCmdFlightHeight
      ) {
        message.error('Input error')
        return
      }
      try {
        await takeoffToPoint(sn, {
          target_latitude: takeoffLat,
          target_longitude: takeoffLng,
          target_height: takeoffHeight,
          security_takeoff_height: takeoffSecurityHeight,
          rth_altitude: takeoffRthAltitude,
          max_speed: MAX_SPEED,
          rc_lost_action: takeoffRcLostAction,
          exit_wayline_when_rc_lost: takeoffExitWayline,
          rth_mode: takeoffRthMode,
          commander_mode_lost_action: takeoffCmdLostAction,
          commander_flight_mode: takeoffCmdFlightMode,
          commander_flight_height: takeoffCmdFlightHeight,
        })
      } catch (error) {}
    }
    setTakeoffVisible(false)
  }

  async function onAuthPayload() {
    const result = await authPayload(sn, payloadIndex)
    if (result) {
      setPayloadControlSource(ControlSource.A)
    }
  }

  async function onGimbalResetConfirm(confirm: boolean) {
    if (confirm) {
      if (gimbalResetMode === null) {
        message.error('Please select reset mode')
        return
      }
      try {
        await resetGimbal(sn, {
          payload_index: payloadIndex,
          reset_mode: gimbalResetMode,
        })
      } catch (err) {}
    }
    setGimbalResetVisible(false)
  }

  async function onSwitchCameraMode() {
    if (!checkPayloadAuth(payloadControlSourceLocal)) return
    const currentCameraMode = (deviceInfo.device as any)?.cameras?.find(
      (item: any) => item.payload_index === payloadIndex
    )?.camera_mode
    await switchCameraMode(sn, {
      payload_index: payloadIndex,
      camera_mode:
        currentCameraMode === CameraMode.Photo
          ? CameraMode.Video
          : CameraMode.Photo,
    })
  }

  async function onZoomFactorConfirm(confirm: boolean) {
    if (confirm) {
      if (!zoomFactor || zoomCameraType === null) {
        message.error('Please input Zoom Factor')
        return
      }
      try {
        await changeCameraFocalLength(sn, {
          payload_index: payloadIndex,
          camera_type: zoomCameraType,
          zoom_factor: zoomFactor,
        })
      } catch (err) {}
    }
    setZoomVisible(false)
  }

  async function onCameraAimConfirm(confirm: boolean) {
    if (confirm) {
      if (
        cameraAimType === null ||
        cameraAimX === null ||
        cameraAimY === null
      ) {
        message.error('Input error')
        return
      }
      try {
        await cameraAim(sn, {
          payload_index: payloadIndex,
          camera_type: cameraAimType,
          locked: cameraAimLocked,
          x: cameraAimX,
          y: cameraAimY,
        })
      } catch (error) {}
    }
    setCameraAimVisible(false)
  }

  return (
    <div>
      <div
        style={{ fontSize: 14, fontWeight: 600, padding: '10px 10px 0px' }}
      >
        Drone Flight Control
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap' as const }}>
        {/* Left box - Flight control */}
        <div
          style={{
            width: '50%',
            padding: 5,
            border: '0.5px solid rgba(255,255,255,0.3)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', padding: 2 }}>
            <Button
              ghost={!flightController}
              size="small"
              onClick={onClickFightControl}
              style={{ fontSize: 12, padding: '0px 4px', marginRight: 5 }}
            >
              {flightController
                ? 'Exit Remote Control'
                : 'Enter Remote Control'}
            </Button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', padding: 2 }}>
            <div style={{ marginRight: 10 }}>
              <Button size="small" ghost onMouseDown={() => handleKeyup(KeyCode.KEY_Q)} onMouseUp={() => resetControlState()} style={{ fontSize: 12, marginRight: 0 }}>
                <UndoOutlined /><span style={{ width: 12, marginLeft: 2, fontSize: 12, color: '#aaa' }}>Q</span>
              </Button>
              <Button size="small" ghost onMouseDown={() => handleKeyup(KeyCode.KEY_W)} onMouseUp={() => resetControlState()} style={{ fontSize: 12, marginRight: 0 }}>
                <UpOutlined /><span style={{ width: 12, marginLeft: 2, fontSize: 12, color: '#aaa' }}>W</span>
              </Button>
              <Button size="small" ghost onMouseDown={() => handleKeyup(KeyCode.KEY_E)} onMouseUp={() => resetControlState()} style={{ fontSize: 12, marginRight: 0 }}>
                <RedoOutlined /><span style={{ width: 12, marginLeft: 2, fontSize: 12, color: '#aaa' }}>E</span>
              </Button>
              <Button size="small" ghost onMouseDown={() => handleKeyup(KeyCode.ARROW_UP)} onMouseUp={() => resetControlState()} style={{ fontSize: 12, marginRight: 0 }}>
                <ArrowUpOutlined />
              </Button>
              <br />
              <Button size="small" ghost onMouseDown={() => handleKeyup(KeyCode.KEY_A)} onMouseUp={() => resetControlState()} style={{ fontSize: 12, marginRight: 0 }}>
                <LeftOutlined /><span style={{ width: 12, marginLeft: 2, fontSize: 12, color: '#aaa' }}>A</span>
              </Button>
              <Button size="small" ghost onMouseDown={() => handleKeyup(KeyCode.KEY_S)} onMouseUp={() => resetControlState()} style={{ fontSize: 12, marginRight: 0 }}>
                <DownOutlined /><span style={{ width: 12, marginLeft: 2, fontSize: 12, color: '#aaa' }}>S</span>
              </Button>
              <Button size="small" ghost onMouseDown={() => handleKeyup(KeyCode.KEY_D)} onMouseUp={() => resetControlState()} style={{ fontSize: 12, marginRight: 0 }}>
                <RightOutlined /><span style={{ width: 12, marginLeft: 2, fontSize: 12, color: '#aaa' }}>D</span>
              </Button>
              <Button size="small" ghost onMouseDown={() => handleKeyup(KeyCode.ARROW_DOWN)} onMouseUp={() => resetControlState()} style={{ fontSize: 12, marginRight: 0 }}>
                <ArrowDownOutlined />
              </Button>
            </div>
            <Button
              type="primary"
              size="small"
              danger
              ghost
              onClick={handleEmergencyStop}
              style={{ fontSize: 12, padding: '0px 4px' }}
            >
              <PauseCircleOutlined />
              <span>Break</span>
            </Button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', padding: 2 }}>
            <DroneControlPopover
              visible={flyToVisible}
              onConfirm={() => onFlyToConfirm(true)}
              onCancel={() => onFlyToConfirm(false)}
              formContent={
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', marginBottom: 5 }}>
                    <span style={{ flex: '1 0 60px', marginRight: 10 }}>latitude:</span>
                    <InputNumber value={flyToLat} onChange={(v) => setFlyToLat(v)} />
                  </div>
                  <div style={{ display: 'flex', marginBottom: 5 }}>
                    <span style={{ flex: '1 0 60px', marginRight: 10 }}>longitude:</span>
                    <InputNumber value={flyToLng} onChange={(v) => setFlyToLng(v)} />
                  </div>
                  <div style={{ display: 'flex', marginBottom: 5 }}>
                    <span style={{ flex: '1 0 60px', marginRight: 10 }}>height(m):</span>
                    <InputNumber value={flyToHeight} onChange={(v) => setFlyToHeight(v)} />
                  </div>
                </div>
              }
            >
              <Button
                size="small"
                ghost
                onClick={() => {
                  setFlyToVisible(!flyToVisible)
                  setFlyToLat(null)
                  setFlyToLng(null)
                  setFlyToHeight(null)
                }}
                style={{ fontSize: 12, padding: '0px 4px', marginRight: 5 }}
              >
                Fly to
              </Button>
            </DroneControlPopover>
            <Button
              size="small"
              ghost
              onClick={() => stopFlyToPoint(sn)}
              style={{ fontSize: 12, padding: '0px 4px', marginRight: 5 }}
            >
              Stop Fly to
            </Button>
            <DroneControlPopover
              visible={takeoffVisible}
              onConfirm={() => onTakeoffConfirm(true)}
              onCancel={() => onTakeoffConfirm(false)}
              formContent={
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', marginBottom: 5 }}>
                    <span style={{ flex: '1 0 60px', marginRight: 10 }}>latitude:</span>
                    <InputNumber value={takeoffLat} onChange={(v) => setTakeoffLat(v)} />
                  </div>
                  <div style={{ display: 'flex', marginBottom: 5 }}>
                    <span style={{ flex: '1 0 60px', marginRight: 10 }}>longitude:</span>
                    <InputNumber value={takeoffLng} onChange={(v) => setTakeoffLng(v)} />
                  </div>
                  <div style={{ display: 'flex', marginBottom: 5 }}>
                    <span style={{ flex: '1 0 60px', marginRight: 10 }}>height(m):</span>
                    <InputNumber value={takeoffHeight} onChange={(v) => setTakeoffHeight(v)} />
                  </div>
                  <div style={{ display: 'flex', marginBottom: 5 }}>
                    <span style={{ flex: '1 0 60px', marginRight: 10 }}>Safe Takeoff Altitude(m):</span>
                    <InputNumber value={takeoffSecurityHeight} onChange={(v) => setTakeoffSecurityHeight(v)} />
                  </div>
                  <div style={{ display: 'flex', marginBottom: 5 }}>
                    <span style={{ flex: '1 0 60px', marginRight: 10 }}>Return-to-Home Altitude(m):</span>
                    <InputNumber value={takeoffRthAltitude} onChange={(v) => setTakeoffRthAltitude(v)} />
                  </div>
                  <div style={{ display: 'flex', marginBottom: 5 }}>
                    <span style={{ flex: '1 0 60px', marginRight: 10 }}>Lost Action:</span>
                    <Select value={takeoffRcLostAction} onChange={(v) => setTakeoffRcLostAction(v)} style={{ width: 120 }} options={LostControlActionInCommandFLightOptions} />
                  </div>
                  <div style={{ display: 'flex', marginBottom: 5 }}>
                    <span style={{ flex: '1 0 60px', marginRight: 10 }}>Wayline Lost Action:</span>
                    <Select value={takeoffExitWayline} onChange={(v) => setTakeoffExitWayline(v)} style={{ width: 120 }} options={WaylineLostControlActionInCommandFlightOptions} />
                  </div>
                  <div style={{ display: 'flex', marginBottom: 5 }}>
                    <span style={{ flex: '1 0 60px', marginRight: 10 }}>Return-to-Home Mode:</span>
                    <Select value={takeoffRthMode} onChange={(v) => setTakeoffRthMode(v)} style={{ width: 120 }} options={RthModeInCommandFlightOptions} />
                  </div>
                  <div style={{ display: 'flex', marginBottom: 5 }}>
                    <span style={{ flex: '1 0 60px', marginRight: 10 }}>Commander Mode Lost Action:</span>
                    <Select value={takeoffCmdLostAction} onChange={(v) => setTakeoffCmdLostAction(v)} style={{ width: 120 }} options={CommanderModeLostActionInCommandFlightOptions} />
                  </div>
                  <div style={{ display: 'flex', marginBottom: 5 }}>
                    <span style={{ flex: '1 0 60px', marginRight: 10 }}>Commander Flight Mode:</span>
                    <Select value={takeoffCmdFlightMode} onChange={(v) => setTakeoffCmdFlightMode(v)} style={{ width: 120 }} options={CommanderFlightModeInCommandFlightOptions} />
                  </div>
                  <div style={{ display: 'flex', marginBottom: 5 }}>
                    <span style={{ flex: '1 0 60px', marginRight: 10 }}>Commander Flight Height(m):</span>
                    <InputNumber value={takeoffCmdFlightHeight} onChange={(v) => setTakeoffCmdFlightHeight(v)} />
                  </div>
                </div>
              }
            >
              <Button
                size="small"
                ghost
                onClick={() => setTakeoffVisible(!takeoffVisible)}
                style={{ fontSize: 12, padding: '0px 4px', marginRight: 5 }}
              >
                Take off
              </Button>
            </DroneControlPopover>
            {cmdList.map((cmdItem) => (
              <Button
                key={cmdItem.cmdKey}
                loading={cmdItem.loading}
                size="small"
                ghost
                onClick={() => sendControlCmd(cmdItem)}
                style={{ fontSize: 12, padding: '0px 4px', marginRight: 5 }}
              >
                {cmdItem.operateText}
              </Button>
            ))}
            <div>
              <Button
                size="small"
                ghost
                onClick={() => setLivestreamAgoraVisible(true)}
                style={{ fontSize: 12, padding: '0px 4px', marginRight: 5 }}
              >
                Agora Live
              </Button>
              <Button
                size="small"
                ghost
                onClick={() => setLivestreamOthersVisible(true)}
                style={{ fontSize: 12, padding: '0px 4px', marginRight: 5 }}
              >
                RTMP/GB28181 Live
              </Button>
            </div>
          </div>
        </div>

        {/* Right box - Payload control */}
        <div
          style={{
            width: '50%',
            padding: 5,
            border: '0.5px solid rgba(255,255,255,0.3)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', padding: 2 }}>
            <Select
              value={payloadSelectValue}
              style={{ width: 110, marginRight: 5 }}
              options={payloadOptions}
              onChange={handlePayloadChange}
            />
            <Button type="primary" size="small" onClick={onAuthPayload}>
              Payload Control
            </Button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', padding: 2 }}>
            <DroneControlPopover
              visible={gimbalResetVisible}
              onConfirm={() => onGimbalResetConfirm(true)}
              onCancel={() => onGimbalResetConfirm(false)}
              formContent={
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', marginBottom: 5 }}>
                    <span style={{ flex: '1 0 60px', marginRight: 10 }}>reset mode:</span>
                    <Select value={gimbalResetMode} onChange={(v) => setGimbalResetMode(v)} style={{ width: 180 }} options={GimbalResetModeOptions} />
                  </div>
                </div>
              }
            >
              <Button
                size="small"
                ghost
                onClick={() => {
                  setGimbalResetVisible(!gimbalResetVisible)
                  setGimbalResetMode(null)
                }}
                style={{ fontSize: 12, padding: '0px 4px', marginRight: 5 }}
              >
                Gimbal Reset
              </Button>
            </DroneControlPopover>
            <Button
              size="small"
              ghost
              onClick={onSwitchCameraMode}
              style={{ fontSize: 12, padding: '0px 4px', marginRight: 5 }}
            >
              Camera Mode Switch
            </Button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', padding: 2 }}>
            <Button
              size="small"
              ghost
              onClick={() => {
                if (!checkPayloadAuth(payloadControlSourceLocal)) return
                startCameraRecording(sn, payloadIndex)
              }}
              style={{ fontSize: 12, padding: '0px 4px', marginRight: 5 }}
            >
              Start Recording
            </Button>
            <Button
              size="small"
              ghost
              onClick={() => {
                if (!checkPayloadAuth(payloadControlSourceLocal)) return
                stopCameraRecording(sn, payloadIndex)
              }}
              style={{ fontSize: 12, padding: '0px 4px', marginRight: 5 }}
            >
              Stop Recording
            </Button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', padding: 2 }}>
            <Button
              size="small"
              ghost
              onClick={() => {
                if (!checkPayloadAuth(payloadControlSourceLocal)) return
                takeCameraPhoto(sn, payloadIndex)
              }}
              style={{ fontSize: 12, padding: '0px 4px', marginRight: 5 }}
            >
              Take Photo
            </Button>
            <DroneControlPopover
              visible={zoomVisible}
              onConfirm={() => onZoomFactorConfirm(true)}
              onCancel={() => onZoomFactorConfirm(false)}
              formContent={
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', marginBottom: 5 }}>
                    <span style={{ flex: '1 0 60px', marginRight: 10 }}>zoom factor:</span>
                    <InputNumber value={zoomFactor} min={2} max={200} onChange={(v) => setZoomFactor(v)} />
                  </div>
                </div>
              }
            >
              <Button
                size="small"
                ghost
                onClick={() => {
                  setZoomVisible(!zoomVisible)
                  setZoomFactor(null)
                  setZoomCameraType(null)
                }}
                style={{ fontSize: 12, padding: '0px 4px', marginRight: 5 }}
              >
                Zoom
              </Button>
            </DroneControlPopover>
            <DroneControlPopover
              visible={cameraAimVisible}
              onConfirm={() => onCameraAimConfirm(true)}
              onCancel={() => onCameraAimConfirm(false)}
              formContent={
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', marginBottom: 5 }}>
                    <span style={{ flex: '1 0 60px', marginRight: 10 }}>x:</span>
                    <InputNumber value={cameraAimX} min={0} max={1} onChange={(v) => setCameraAimX(v)} />
                  </div>
                  <div style={{ display: 'flex', marginBottom: 5 }}>
                    <span style={{ flex: '1 0 60px', marginRight: 10 }}>y:</span>
                    <InputNumber value={cameraAimY} min={0} max={1} onChange={(v) => setCameraAimY(v)} />
                  </div>
                </div>
              }
            >
              <Button
                size="small"
                ghost
                onClick={() => {
                  setCameraAimVisible(!cameraAimVisible)
                  setCameraAimX(null)
                  setCameraAimY(null)
                  setCameraAimType(null)
                  setCameraAimLocked(false)
                }}
                style={{ fontSize: 12, padding: '0px 4px', marginRight: 5 }}
              >
                AIM
              </Button>
            </DroneControlPopover>
          </div>
        </div>
      </div>
      <DroneControlInfoPanel message={drcInfo} />
    </div>
  )
}

export default DroneControlPanel
