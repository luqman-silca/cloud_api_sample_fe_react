import { useEffect, useState, useCallback, useRef } from 'react'
import { Layout, Row, Col, Avatar, Drawer, Button, Divider, Modal, message, Space } from 'antd'
import { RightOutlined, CloudSyncOutlined, SyncOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { BindBody, bindDevice, getDeviceBySn, getPlatformInfo, getUserInfo } from '@/api/manage'
import apiPilot, { ApiParam, MapParam, ThingParam, WsParam } from '@/api/pilot-bridge'
import { EBizCode, EComponentName, EDownloadOwner, ELocalStorageKey, ERouterName, EStatusValue } from '@/types'
import { DeviceStatus } from '@/types/device'
import { useConnectWebSocket } from '@/hooks/use-connect-websocket'
import cloudapiIcon from '@/assets/icons/cloudapi.png'

const { Sider, Content } = Layout

interface DeviceInfoData {
  data: DeviceStatus
}

interface Module {
  name: string
  state: string
  module: EComponentName
}

function PilotHomePage() {
  const navigate = useNavigate()

  const [workspaceName, setWorkspaceName] = useState<string>(localStorage.getItem(ELocalStorageKey.WorkspaceName) || '')
  const [username, setUsername] = useState(localStorage.getItem(ELocalStorageKey.Username) || '')
  const [wsId, setWsId] = useState(localStorage.getItem(ELocalStorageKey.WorkspaceId) || '')

  const [thingState, setThingState] = useState(EStatusValue.DISCONNECT)
  const [apiState, setApiState] = useState(EStatusValue.DISCONNECT)
  const [liveState, setLiveState] = useState(EStatusValue.DISCONNECT)
  const [wsState, setWsState] = useState(EStatusValue.DISCONNECT)
  const [mapState, setMapState] = useState(EStatusValue.DISCONNECT)
  const [tsaState, setTsaState] = useState(EStatusValue.DISCONNECT)
  const [mediaState, setMediaState] = useState(EStatusValue.DISCONNECT)
  const [waylineState, setWaylineState] = useState(EStatusValue.DISCONNECT)

  const [exitVisible, setExitVisible] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)

  const [device, setDevice] = useState<DeviceInfoData>({
    data: {
      sn: '',
      online_status: false,
      device_callsign: '',
      user_id: '',
      user_callsign: '',
      bound_status: false,
      model: '',
      gateway_sn: EStatusValue.DISCONNECT,
      domain: -1
    }
  })

  const [bindParam, setBindParam] = useState<BindBody>({
    device_sn: '',
    user_id: '',
    workspace_id: wsId
  })

  // Use ref to avoid closure issues in setInterval
  const bindParamRef = useRef<BindBody>(bindParam)
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Keep ref in sync with state
  useEffect(() => {
    bindParamRef.current = bindParam
  }, [bindParam])

  const [components] = useState(() => apiPilot.init())

  const modules: Module[] = [
    { name: 'Cloud', state: thingState, module: EComponentName.Thing },
    { name: 'Api', state: apiState, module: EComponentName.Api },
    { name: 'Live', state: liveState, module: EComponentName.Liveshare },
    { name: 'Ws', state: wsState, module: EComponentName.Ws },
    { name: 'Map', state: mapState, module: EComponentName.Map },
    { name: 'Tsa', state: tsaState, module: EComponentName.Tsa },
    { name: 'Media', state: mediaState, module: EComponentName.Media },
    { name: 'Wayline', state: waylineState, module: EComponentName.Mission },
  ]

  const refreshStatus = useCallback(() => {
    setThingState(apiPilot.thingGetConnectState() ? EStatusValue.CONNECTED : EStatusValue.DISCONNECT)
    setApiState(apiPilot.isComponentLoaded(EComponentName.Api) ? EStatusValue.CONNECTED : EStatusValue.DISCONNECT)
    setLiveState(apiPilot.isComponentLoaded(EComponentName.Liveshare) ? EStatusValue.CONNECTED : EStatusValue.DISCONNECT)
    setWsState(apiPilot.isComponentLoaded(EComponentName.Ws) && apiPilot.wsGetConnectState()
      ? EStatusValue.CONNECTED
      : EStatusValue.DISCONNECT)
    setMapState(apiPilot.isComponentLoaded(EComponentName.Map) ? EStatusValue.CONNECTED : EStatusValue.DISCONNECT)
    setTsaState(apiPilot.isComponentLoaded(EComponentName.Tsa) ? EStatusValue.CONNECTED : EStatusValue.DISCONNECT)
    setMediaState(apiPilot.isComponentLoaded(EComponentName.Media) ? EStatusValue.CONNECTED : EStatusValue.DISCONNECT)
    setWaylineState(apiPilot.isComponentLoaded(EComponentName.Mission) ? EStatusValue.CONNECTED : EStatusValue.DISCONNECT)
  }, [])

  const setWorkspaceInfo = useCallback(() => {
    if (localStorage.getItem(ELocalStorageKey.WorkspaceName)) {
      apiPilot.setPlatformMessage(
        localStorage.getItem(ELocalStorageKey.PlatformName) || '',
        workspaceName,
        localStorage.getItem(ELocalStorageKey.WorkspaceDesc) || ''
      )
      apiPilot.setWorkspaceId(wsId)
      return
    }

    getPlatformInfo().then(res => {
      console.log(res)
      const newWorkspaceName = res.data.workspace_name
      const newWsId = res.data.workspace_id
      setWorkspaceName(newWorkspaceName)
      setWsId(newWsId)
      localStorage.setItem(ELocalStorageKey.PlatformName, res.data.platform_name)
      localStorage.setItem(ELocalStorageKey.WorkspaceName, newWorkspaceName)
      localStorage.setItem(ELocalStorageKey.WorkspaceDesc, res.data.workspace_desc)
      apiPilot.setPlatformMessage(
        res.data.platform_name,
        newWorkspaceName,
        res.data.workspace_desc
      )
      apiPilot.setWorkspaceId(newWsId)
    })
  }, [workspaceName, wsId])

  const getDeviceInfo = useCallback(() => {
    if (!device.data.sn || device.data.sn === EStatusValue.DISCONNECT) {
      return
    }
    getDeviceBySn(bindParam.workspace_id, device.data.sn).then(res => {
      if (res.code !== 0) {
        return
      }
      setDevice(prev => ({
        ...prev,
        data: {
          ...prev.data,
          online_status: res.data.status,
          bound_status: res.data.bound_status,
          device_callsign: res.data.nickname,
          model: res.data.device_name,
        }
      }))
      localStorage.setItem(ELocalStorageKey.Device, JSON.stringify({
        ...device.data,
        online_status: res.data.status,
        bound_status: res.data.bound_status,
        device_callsign: res.data.nickname,
        model: res.data.device_name,
      }))
    })
  }, [device.data, bindParam.workspace_id])

  const messageHandler = useCallback((payload: any) => {
    if (!payload) {
      return
    }
    switch (payload.biz_code) {
      case EBizCode.DeviceOnline: {
        console.info('online: ', payload)
        if (payload.data.sn === device.data.gateway_sn) {
          localStorage.setItem(ELocalStorageKey.GatewayOnline, 'true')
          break
        }
        if (payload.data.gateway_sn === device.data.gateway_sn) {
          setDevice({ data: payload.data })
          localStorage.setItem(ELocalStorageKey.Device, JSON.stringify(payload.data))
        }
        break
      }
      case EBizCode.DeviceOffline: {
        console.info('offline: ', payload)
        if (payload.data.sn === device.data.sn) {
          setDevice(prev => ({
            ...prev,
            data: {
              ...prev.data,
              online_status: payload.data.online_status
            }
          }))
          localStorage.setItem(ELocalStorageKey.Device, JSON.stringify({
            ...device.data,
            online_status: payload.data.online_status
          }))
        }
        break
      }
      default:
        break
    }
  }, [device.data])

  useConnectWebSocket(messageHandler)

  useEffect(() => {
    apiPilot.onBackClickReg()
    apiPilot.onStopPlatform()

    const oldDevice = localStorage.getItem(ELocalStorageKey.Device)
    if (oldDevice) {
      setDevice({ data: JSON.parse(oldDevice) })
    }

    // Set up window callbacks for apiPilot
    ;(window as any).connectCallback = (arg: any) => {
      connectCallback(arg)
    }
    ;(window as any).wsConnectCallback = (arg: any) => {
      wsConnectCallback(arg)
    }

    const gatewaySn = apiPilot.getRemoteControllerSN()
    if (gatewaySn === EStatusValue.DISCONNECT.toString()) {
      message.warning('Data is not available, please restart the remote control.')
      return
    }

    const aircraftSn = apiPilot.getAircraftSN()
    setDevice(prev => ({
      ...prev,
      data: {
        ...prev.data,
        gateway_sn: gatewaySn,
        sn: aircraftSn
      }
    }))

    setTimeout(getDeviceInfo, 0)

    const isLoaded = apiPilot.isComponentLoaded(EComponentName.Thing)
    if (isLoaded) {
      const storedUsername = localStorage.getItem(ELocalStorageKey.Username) || ''
      const storedWorkspaceName = localStorage.getItem(ELocalStorageKey.WorkspaceName) || ''
      setUsername(storedUsername)
      setWorkspaceName(storedWorkspaceName)
      refreshStatus()
      apiPilot.setPlatformMessage(
        localStorage.getItem(ELocalStorageKey.PlatformName) || '',
        storedWorkspaceName,
        localStorage.getItem(ELocalStorageKey.WorkspaceDesc) || ''
      )

      // 🔥 FIX: Set bindParam from localStorage when Thing is already loaded
      const storedUserId = localStorage.getItem(ELocalStorageKey.UserId) || ''
      const storedWorkspaceId = localStorage.getItem(ELocalStorageKey.WorkspaceId) || ''
      console.log('🔄 Thing already loaded, setting bindParam from localStorage:', {
        device_sn: gatewaySn,
        user_id: storedUserId,
        workspace_id: storedWorkspaceId
      })
      setBindParam({
        device_sn: gatewaySn,
        user_id: storedUserId,
        workspace_id: storedWorkspaceId
      })

      return
    }

    setWorkspaceInfo()

    getUserInfo().then(res => {
      const newUsername = res.data.username
      setUsername(newUsername)
      localStorage.setItem(ELocalStorageKey.Username, newUsername)

      // thing
      const param: ThingParam = {
        host: res.data.mqtt_addr,
        username: res.data.mqtt_username,
        password: res.data.mqtt_password,
        connectCallback: 'connectCallback'
      }
      console.log('🔌 MQTT credentials from getUserInfo:', {
        host: res.data.mqtt_addr,
        username: res.data.mqtt_username,
        password: res.data.mqtt_password ? '***' : 'MISSING',
        full_response: res.data
      })
      components.set(EComponentName.Thing, param)
      apiPilot.loadComponent(EComponentName.Thing, components.get(EComponentName.Thing))

      setBindParam({
        device_sn: gatewaySn,
        user_id: res.data.user_id,
        workspace_id: res.data.workspace_id
      })
    })

    return () => {
      // Cleanup window callbacks
      delete (window as any).connectCallback
      delete (window as any).wsConnectCallback
    }
  }, [])

  const connectCallback = useCallback(async (arg: any) => {
    console.log('🎯 connectCallback triggered, arg:', arg)
    if (arg) {
      console.log('✅ MQTT Connected! Loading components...')
      setThingState(EStatusValue.CONNECTED)

      // liveshare
      apiPilot.loadComponent(EComponentName.Liveshare, components.get(EComponentName.Liveshare))

      // ws
      const wsParam: WsParam = components.get(EComponentName.Ws)
      wsParam.token = apiPilot.getToken()
      apiPilot.loadComponent(EComponentName.Ws, components.get(EComponentName.Ws))

      // map
      const mapParam: MapParam = components.get(EComponentName.Map)
      mapParam.userName = username
      apiPilot.loadComponent(EComponentName.Map, components.get(EComponentName.Map))

      // tsa
      apiPilot.loadComponent(EComponentName.Tsa, components.get(EComponentName.Tsa))

      // media
      apiPilot.loadComponent(EComponentName.Media, components.get(EComponentName.Media))
      apiPilot.setDownloadOwner(EDownloadOwner.Mine.valueOf())

      // mission
      apiPilot.loadComponent(EComponentName.Mission, {})

      // Auto-bind device
      console.log('🟢 Setting up bind interval, initial bindParam:', bindParam)
      const bindInterval = setInterval(() => {
        const currentBindParam = bindParamRef.current // Use ref to get latest value
        console.log('🔄 Bind interval tick, bindParam:', currentBindParam)
        if (!currentBindParam.device_sn) {
          const gatewaySn = apiPilot.getRemoteControllerSN()
          console.log('⚠️ No device_sn, got from API:', gatewaySn)
          setDevice(prev => ({ ...prev, data: { ...prev.data, gateway_sn: gatewaySn } }))
          setBindParam(prev => ({ ...prev, device_sn: gatewaySn }))
          return
        }
        console.log('🚀 Calling bindDevice with:', currentBindParam)
        bindDevice(currentBindParam).then(bindRes => {
          console.log('📥 Bind response:', bindRes)
          if (bindRes.code !== 0) {
            message.error(bindRes.message)
            console.error(bindRes.message)
          } else {
            console.log('✅ Bind successful, clearing interval')
            clearInterval(bindInterval)
          }
        })
      }, 2000)

      setTimeout(getDeviceInfo, 3000)
    } else {
      setThingState(EStatusValue.DISCONNECT)
    }
    refreshStatus()
  }, [bindParam, components, username, refreshStatus, getDeviceInfo])

  const wsConnectCallback = useCallback(async (arg: any) => {
    if (arg) {
      setWsState(EStatusValue.CONNECTED)
    } else {
      setWsState(EStatusValue.DISCONNECT)
    }
  }, [])

  const showStatus = () => {
    // Clear any existing interval
    if (monitorIntervalRef.current) {
      clearInterval(monitorIntervalRef.current)
    }

    // Set up new interval
    monitorIntervalRef.current = setInterval(() => {
      refreshStatus()
    }, 2000)

    setDrawerVisible(true)
  }

  // Clean up interval when drawer closes
  useEffect(() => {
    if (!drawerVisible && monitorIntervalRef.current) {
      clearInterval(monitorIntervalRef.current)
      monitorIntervalRef.current = null
    }
  }, [drawerVisible])

  const confirmAgain = () => {
    setExitVisible(true)
  }

  const onBack = () => {
    setExitVisible(false)
  }

  const onExit = () => {
    localStorage.clear()
    apiPilot.stopwebview()
  }

  const bindingDevice = () => {
    navigate('/' + ERouterName.PILOT_BIND)
  }

  const onMediaSetting = () => {
    navigate('/' + ERouterName.PILOT_MEDIA)
  }

  const onLiveshareSetting = () => {
    navigate('/' + ERouterName.PILOT_LIVESHARE)
  }

  const onOpen3rdApp = () => {
    const packageName = 'com.dji.sample'
    const isInstalled = apiPilot.isAppInstalled(packageName)
    if (isInstalled) {
      window.open('https://www.dji.com')
    } else {
      message.error(packageName + ' is not installed.')
    }
  }

  const moduleInstall = (m: Module) => {
    let param
    switch (m.module) {
      case EComponentName.Thing:
        param = apiPilot.thingGetConfigs()
        break
      case EComponentName.Api: {
        const apiParam: ApiParam = {
          host: apiPilot.getHost(),
          token: apiPilot.getToken()
        }
        param = apiParam
        break
      }
      case EComponentName.Map: {
        const mapParam: MapParam = components.get(EComponentName.Map)
        mapParam.userName = localStorage.getItem(ELocalStorageKey.Username) || ''
        param = mapParam
        break
      }
      case EComponentName.Ws: {
        const wsParam: WsParam = components.get(EComponentName.Ws)
        wsParam.token = localStorage.getItem(ELocalStorageKey.Token) || ''
        param = wsParam
        break
      }
      default:
        param = components.get(m.module)
    }

    components.set(m.module, param)
    console.info(components.get(m.module))
    apiPilot.loadComponent(m.module, components.get(m.module))
    refreshStatus()
  }

  const moduleUninstall = (m: Module) => {
    message.info('uninstall ' + m.module)
    apiPilot.unloadComponent(m.module)
    refreshStatus()
  }

  return (
    <Layout style={{ height: '100vh', width: '100%', position: 'absolute' }}>
      <Sider
        width="40%"
        theme="light"
        style={{
          borderRadius: 4,
          height: '90%',
          backgroundColor: 'white',
          marginTop: '6vh',
          marginLeft: '2vh'
        }}
      >
        <div style={{ width: '90%', height: '90%', margin: '4vh' }}>
          <Layout style={{ height: '20%', marginTop: '3vh', backgroundColor: 'white' }}>
            <Sider width="25%" theme="light" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Avatar size={60} src={cloudapiIcon} />
            </Sider>
            <Content style={{ marginLeft: '1vw' }} onClick={showStatus}>
              <div style={{ height: '50%' }}>
                <span style={{ fontSize: 16, fontWeight: 'bolder' }}>{workspaceName}</span>
                <RightOutlined style={{ float: 'right', marginTop: 5, color: '#8894a0' }} />
              </div>
              <div style={{ height: '50%' }}>
                {thingState === EStatusValue.CONNECTED ? (
                  <CloudSyncOutlined style={{ color: '#75c5f6' }} />
                ) : (
                  <SyncOutlined spin />
                )}
                <span style={{ color: '#737373', marginLeft: 3 }}>{thingState}</span>
              </div>
            </Content>
          </Layout>

          {/* Drawer moved outside of clickable Content to prevent interference */}
          <Drawer
            placement="right"
            open={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            width={340}
          >
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Module State</p>
            </div>
            {modules.map((m, index) => (
              <div key={m.name}>
                <div style={{
                  width: '100%',
                  padding: '12px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: 500, color: '#000000' }}>{m.name}</span>
                    <span style={{
                      color: m.state === EStatusValue.CONNECTED ? '#52c41a' : '#ff4d4f',
                      fontSize: '12px'
                    }}>
                      {m.state}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px'
                  }}>
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => moduleInstall(m)}
                    >
                      install
                    </Button>
                    <Button
                      danger
                      size="small"
                      onClick={() => moduleUninstall(m)}
                    >
                      uninstall
                    </Button>
                  </div>
                </div>
                {index < modules.length - 1 && <Divider style={{ margin: '0' }} />}
              </div>
            ))}
          </Drawer>

          <Divider style={{ height: 2, backgroundColor: '#f5f5f5', marginTop: '3vh' }} />

          <Button
            id="exitBtn"
            onClick={confirmAgain}
            type="primary"
            style={{
              width: '10vw',
              height: '10vh',
              position: 'fixed',
              bottom: '13vh',
              left: '15vw',
              backgroundColor: '#e6e6e6',
              color: 'red',
              border: 0,
              fontSize: 18
            }}
          >
            Exit
          </Button>
          <Modal
            open={exitVisible}
            width={300}
            closable={false}
            footer={[
              <Button key="cancel" type="text" style={{ width: '48%', float: 'left' }} onClick={onBack}>
                Cancel
              </Button>,
              <Button key="exit" type="text" style={{ width: '48%' }} onClick={onExit}>
                Exit
              </Button>
            ]}
          >
            <p>Data will not be synchronized between DJI Pilot and this server after exiting.</p>
          </Modal>
        </div>
      </Sider>

      <Content style={{ height: '90%', marginTop: '6vh', marginLeft: '5vh', marginRight: '5vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 5 }}>
          <span style={{ marginLeft: 5, color: '#939393' }}>Serial Number</span>
        </div>
        <div style={{ fontSize: 16, backgroundColor: 'white', borderRadius: 4 }}>
          <Row style={{ borderBottom: '1px solid #f4f8f9', height: 45 }} align="middle">
            <Col span={1}></Col>
            <Col span={9}>Remote Control Sn</Col>
            <Col span={13} style={{ display: 'flex', alignItems: 'flex-end', flexDirection: 'column' }}>
              <span style={{ color: '#737373' }}>{device.data.gateway_sn}</span>
            </Col>
          </Row>
          {device.data.online_status && device.data.sn && (
            <Row style={{ borderBottom: '1px solid #f4f8f9', height: 45 }} align="middle">
              <Col span={1}></Col>
              <Col span={9}>Aircraft Sn</Col>
              <Col span={13} style={{ display: 'flex', alignItems: 'flex-end', flexDirection: 'column' }}>
                <span style={{ color: '#737373' }}>{device.data.sn}</span>
              </Col>
            </Row>
          )}
        </div>

        <div style={{ marginTop: 5, marginBottom: 5 }}>
          <span style={{ marginLeft: 5, color: '#939393' }}>Settings</span>
        </div>
        <div style={{ fontSize: 16, backgroundColor: 'white', borderRadius: 4 }}>
          {device.data.online_status && device.data.sn && (
            <Row style={{ borderBottom: '1px solid #f4f8f9', height: 45 }} align="middle" onClick={bindingDevice}>
              <Col span={1}></Col>
              <Col span={11}>Device Binding</Col>
              <Col span={10} style={{ textAlign: 'right' }}>
                <span style={{ color: '#737373' }}>
                  {device.data.bound_status ? 'Aircraft bound' : 'Aircraft not bound'}
                </span>
              </Col>
              <Col span={2} style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                <RightOutlined style={{ color: '#8894a0', fontSize: 20 }} />
              </Col>
            </Row>
          )}
          <Row style={{ borderBottom: '1px solid #f4f8f9', height: 45 }} align="middle" onClick={onMediaSetting}>
            <Col span={1}></Col>
            <Col span={21}>Media File Upload</Col>
            <Col span={2} style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
              <RightOutlined style={{ color: '#8894a0', fontSize: 20 }} />
            </Col>
          </Row>
          <Row style={{ borderBottom: '1px solid #f4f8f9', height: 45 }} align="middle" onClick={onLiveshareSetting}>
            <Col span={1}></Col>
            <Col span={21}>Livestream Manually</Col>
            <Col span={2} style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
              <RightOutlined style={{ color: '#8894a0', fontSize: 20 }} />
            </Col>
          </Row>
          <Row style={{ borderBottom: '1px solid #f4f8f9', height: 45 }} align="middle" onClick={onOpen3rdApp}>
            <Col span={1}></Col>
            <Col span={21}>Open 3rd Party APP</Col>
            <Col span={2} style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
              <RightOutlined style={{ color: '#8894a0', fontSize: 20 }} />
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  )
}

export default PilotHomePage
