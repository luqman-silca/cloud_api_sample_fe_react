import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Row, Col, Collapse, Empty, Tooltip, Popover, Image } from 'antd'
import {
  RocketOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  RobotOutlined,
  DoubleRightOutlined,
} from '@ant-design/icons'
import { EDeviceTypeName, ELocalStorageKey, EHmsLevel } from '@/types'
import { OnlineDevice, EModeCode, EDockModeCode, DeviceHms } from '@/types/device'
import { useDeviceStore } from '@/store/useDeviceStore'
import { getDeviceTopo, getUnreadDeviceHms, updateDeviceHms } from '@/api/manage'
import noData from '@/assets/icons/no-data.png'
import rc from '@/assets/icons/rc.png'

function TsaPage() {
  const username = localStorage.getItem(ELocalStorageKey.Username)
  const workspaceId = localStorage.getItem(ELocalStorageKey.WorkspaceId)!

  const [onlineDevices, setOnlineDevices] = useState<OnlineDevice[]>([])
  const [onlineDocks, setOnlineDocks] = useState<OnlineDevice[]>([])
  const [hmsVisible, setHmsVisible] = useState<Record<string, boolean>>({})
  const [scrollHeight, setScrollHeight] = useState<number>(0)

  const deviceInfo = useDeviceStore((s) => s.deviceState.deviceInfo)
  const dockInfo = useDeviceStore((s) => s.deviceState.dockInfo)
  const osdVisible = useDeviceStore((s) => s.osdVisible)
  const hmsInfo = useDeviceStore((s) => s.hmsInfo)
  const deviceStatusEvent = useDeviceStore((s) => s.deviceStatusEvent)
  const setOsdVisible = useDeviceStore((s) => s.setOsdVisible)

  const scrollRef = useRef<HTMLDivElement>(null)

  const getOnlineTopo = useCallback(() => {
    getDeviceTopo(workspaceId).then((res) => {
      if (res.code !== 0) return
      const devices: OnlineDevice[] = []
      const docks: OnlineDevice[] = []
      res.data.forEach((gateway: any) => {
        const child = gateway.children
        const device: OnlineDevice = {
          model: child?.device_name,
          callsign: child?.nickname,
          sn: child?.device_sn,
          mode: EModeCode.Disconnected,
          gateway: {
            model: gateway?.device_name,
            callsign: gateway?.nickname,
            sn: gateway?.device_sn,
            domain: gateway?.domain,
          },
          payload: [],
        }
        child?.payloads_list?.forEach((payload: any) => {
          device.payload.push({
            index: payload.index,
            model: payload.model,
            payload_name: payload.payload_name,
            payload_sn: payload.payload_sn,
            control_source: payload.control_source,
            payload_index: payload.payload_index,
          })
        })
        if (EDeviceTypeName.Dock === gateway.domain) {
          docks.push(device)
        }
        if (gateway.status && EDeviceTypeName.Gateway === gateway.domain) {
          devices.push(device)
        }
      })
      setOnlineDevices(devices)
      setOnlineDocks(docks)
    })
  }, [workspaceId])

  const getUnreadHms = useCallback(
    (sn: string) => {
      getUnreadDeviceHms(workspaceId, sn).then((res) => {
        if (res.data?.length) {
          useDeviceStore.getState().setDeviceHmsInfo({ sn, host: res.data })
        }
      })
    },
    [workspaceId]
  )

  useEffect(() => {
    getOnlineTopo()
    const timer = setTimeout(() => {
      // Get HMS for all known devices
      const snList = Object.keys(useDeviceStore.getState().deviceState.dockInfo)
      snList.forEach((sn) => getUnreadHms(sn))
      const deviceSnList = Object.keys(useDeviceStore.getState().deviceState.deviceInfo)
      deviceSnList.forEach((sn) => getUnreadHms(sn))
    }, 3000)
    return () => clearTimeout(timer)
  }, [getOnlineTopo, getUnreadHms])

  // React to device status events
  useEffect(() => {
    getOnlineTopo()
    if (deviceStatusEvent.deviceOnline && 'sn' in deviceStatusEvent.deviceOnline && deviceStatusEvent.deviceOnline.sn) {
      getUnreadHms(deviceStatusEvent.deviceOnline.sn)
    }
  }, [deviceStatusEvent, getOnlineTopo, getUnreadHms])

  // Calculate scroll height
  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      const parent = el.parentNode as HTMLDivElement
      const firstChild = parent?.firstElementChild as HTMLElement
      if (parent && firstChild) {
        setScrollHeight(parent.clientHeight - firstChild.clientHeight)
      }
    }
  }, [])

  const switchVisible = (e: React.MouseEvent, device: OnlineDevice, isDock: boolean, isOnline: boolean) => {
    if (!isOnline) {
      ;(e.target as HTMLElement).style.cursor = 'not-allowed'
      return
    }
    if (device.sn === osdVisible.sn) {
      setOsdVisible({ ...osdVisible, visible: !osdVisible.visible })
    } else {
      setOsdVisible({
        sn: device.sn,
        callsign: device.callsign,
        model: device.model,
        visible: true,
        gateway_sn: device.gateway.sn,
        is_dock: isDock,
        gateway_callsign: device.gateway.callsign,
        payloads: device.payload,
      })
    }
  }

  const readHms = (visible: boolean, sn: string) => {
    if (!visible) {
      updateDeviceHms(workspaceId, sn).then((res) => {
        if (res.code === 0) {
          const store = useDeviceStore.getState()
          const newHmsInfo = { ...store.hmsInfo }
          delete newHmsInfo[sn]
          useDeviceStore.setState({ hmsInfo: newHmsInfo })
        }
      })
    }
  }

  const handleHmsVisibleChange = (sn: string, visible: boolean) => {
    setHmsVisible((prev) => ({ ...prev, [sn]: visible }))
    readHms(visible, sn)
  }

  const getHmsLevelClass = (level: number) => {
    if (level === EHmsLevel.CAUTION) return 'caution'
    if (level === EHmsLevel.WARN) return 'warn'
    return 'notice'
  }

  const getHmsBlinkClass = (level: number) => {
    if (level === EHmsLevel.CAUTION) return 'caution-blink'
    if (level === EHmsLevel.WARN) return 'warn-blink'
    return 'notice-blink'
  }

  const renderHmsPopover = (sn: string, hmsList: DeviceHms[]) => (
    <Popover
      trigger="click"
      placement="bottom"
      color="black"
      open={hmsVisible[sn]}
      onOpenChange={(v) => handleHmsVisibleChange(sn, v)}
      overlayStyle={{ width: 200, height: 300 }}
      content={
        <Collapse
          style={{ background: 'black', height: 300, overflowY: 'auto' }}
          bordered={false}
          expandIconPosition="end"
          accordion
          items={hmsList.map((hms) => ({
            key: hms.hms_id,
            showArrow: false,
            className: getHmsLevelClass(hms.level),
            style: { margin: '0 auto 3px auto', border: 0, width: 140, borderRadius: 3 },
            label: (
              <div style={{ display: 'flex', alignItems: 'center', width: 130 }}>
                <div style={{ width: 110 }}>
                  <span className="word-loop">{hms.message_en}</span>
                </div>
              </div>
            ),
            children: (
              <Tooltip title={hms.create_time}>
                <div style={{ color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hms.create_time}</div>
              </Tooltip>
            ),
          }))}
        />
      }
    >
      <div className={getHmsLevelClass(hmsList[0].level)} style={{ marginLeft: 3, width: 62, height: 16, cursor: 'pointer', overflow: 'hidden' }}>
        <span className="word-loop">{hmsList[0].message_en}</span>
      </div>
    </Popover>
  )

  const renderHmsSection = (sn: string) => {
    const hmsList = hmsInfo[sn]
    if (hmsList?.length) {
      return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            className={getHmsBlinkClass(hmsList[0].level)}
            style={{ width: 18, height: 16, textAlign: 'center' }}
          >
            <span style={{ fontSize: hmsList.length > 99 ? 11 : 12 }}>{hmsList.length}</span>
            <span style={{ fontSize: 10 }}>{hmsList.length > 99 ? '+' : ''}</span>
          </div>
          {renderHmsPopover(sn, hmsList)}
        </div>
      )
    }
    return <div style={{ width: '100%', height: '90%', background: 'rgba(0, 0, 0, 0.35)' }} />
  }

  const renderDockItem = (dock: OnlineDevice) => {
    const dockOsd = dockInfo[dock.gateway.sn]
    const droneOsd = deviceInfo[dock.sn]
    const dockOnline = dockOsd && dockOsd.basic_osd?.mode_code !== EDockModeCode.Disconnected
    const droneOnline = droneOsd && droneOsd.mode_code !== EModeCode.Disconnected

    return (
      <div key={dock.sn} style={{ background: '#3c3c3c', height: 90, width: 250, marginBottom: 10 }}>
        <div style={{ borderRadius: 2, height: '100%', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ padding: '0px 5px 8px 8px', width: '88%' }}>
            <div style={{ width: '80%', height: 30, lineHeight: '30px', fontSize: 16 }}>
              <Tooltip title={`${dock.gateway.callsign} - ${dock.callsign ?? 'No Drone'}`}>
                <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {dock.gateway.callsign} - {dock.callsign ?? 'No Drone'}
                </div>
              </Tooltip>
            </div>
            {/* Dock status row */}
            <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#595959' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ margin: '0 5px' }}><RobotOutlined /></span>
                <div style={{ fontWeight: 700, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: dockOnline ? '#00ee8b' : 'red' }}>
                  {dockOsd ? EDockModeCode[dockOsd.basic_osd?.mode_code] : EDockModeCode[EDockModeCode.Disconnected]}
                </div>
              </div>
              <div style={{ width: 85, marginRight: 0, height: 18, display: 'flex', alignItems: 'center' }}>
                {renderHmsSection(dock.gateway.sn)}
              </div>
            </div>
            {/* Drone status row */}
            <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#595959' }}>
              <div style={{ display: 'flex' }}>
                <span style={{ margin: '0 5px' }}><RocketOutlined /></span>
                <div style={{ fontWeight: 700, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: droneOnline ? '#00ee8b' : 'red' }}>
                  {droneOsd ? EModeCode[droneOsd.mode_code] : EModeCode[EModeCode.Disconnected]}
                </div>
              </div>
              <div style={{ width: 85, marginRight: 0, height: 18, display: 'flex', alignItems: 'center' }}>
                {renderHmsSection(dock.sn)}
              </div>
            </div>
          </div>
          <div
            style={{ background: '#595959', height: '100%', width: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', fontSize: 16 }}
            onClick={(e) => switchVisible(e, dock, true, dockOnline)}
          >
            {osdVisible.gateway_sn === dock.gateway.sn && osdVisible.visible
              ? <a><EyeOutlined /></a>
              : <a><EyeInvisibleOutlined /></a>
            }
          </div>
        </div>
      </div>
    )
  }

  const renderDeviceItem = (device: OnlineDevice) => {
    const droneOsd = deviceInfo[device.sn]
    const droneOnline = droneOsd && droneOsd.mode_code !== EModeCode.Disconnected

    return (
      <div key={device.sn} style={{ background: '#3c3c3c', height: 90, width: 250, marginBottom: 10 }}>
        {/* Battery slide */}
        {droneOsd && (
          <div style={{ width: '100%' }}>
            <div style={{ position: 'relative', marginTop: -2, minHeight: 2, borderRadius: 2, background: '#535759', width: '100%' }} />
            <div style={{ position: 'relative', marginTop: -2, minHeight: 2, borderRadius: 2, background: '#00ee8b', width: `${droneOsd.battery.capacity_percent}%` }} />
            <div style={{ position: 'relative', marginTop: -2, minHeight: 2, borderRadius: 2, background: '#ff9f0a', width: `${droneOsd.battery.return_home_power}%` }} />
            <div style={{ position: 'relative', marginTop: -2, minHeight: 2, borderRadius: 2, background: '#f5222d', width: `${droneOsd.battery.landing_power}%` }} />
            <div style={{ position: 'relative', marginTop: -3, background: 'white', borderRadius: 1, width: 8, height: 4, left: `${droneOsd.battery.capacity_percent}%` }} />
          </div>
        )}
        <div style={{ borderBottom: '1px solid #515151', borderRadius: 2, height: 50, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ padding: '5px 5px 8px 8px', width: '88%' }}>
            <div style={{ width: '100%' }}>
              <Tooltip title={device.model ? `${device.model} - ${device.callsign}` : 'No Drone'}>
                <span style={{ maxWidth: 200, display: 'block', height: 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {device.model ? `${device.model} - ${device.callsign}` : 'No Drone'}
                </span>
              </Tooltip>
            </div>
            <div style={{ marginTop: 5, background: '#595959' }}>
              <span style={{ margin: '0 5px' }}><RocketOutlined /></span>
              <span style={{ fontWeight: 700, color: droneOnline ? '#00ee8b' : 'red' }}>
                {droneOsd ? EModeCode[droneOsd.mode_code] : EModeCode[EModeCode.Disconnected]}
              </span>
            </div>
          </div>
          <div
            style={{ background: '#595959', height: 50, width: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', fontSize: 16 }}
            onClick={(e) => switchVisible(e, device, false, droneOnline)}
          >
            {osdVisible.sn === device.sn && osdVisible.visible
              ? <a><EyeOutlined /></a>
              : <a><EyeInvisibleOutlined /></a>
            }
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 40 }}>
          <div style={{ display: 'flex', height: 20, background: '#595959', width: '94%' }}>
            <span style={{ marginRight: 5 }}>
              <img style={{ marginLeft: 2, marginTop: -2, height: 20, width: 20 }} src={rc} />
            </span>
            <Tooltip title={`${device.gateway.model} - ${device.gateway.callsign}`}>
              <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {device.gateway.model} - {device.gateway.callsign}
              </div>
            </Tooltip>
          </div>
        </div>
      </div>
    )
  }

  const dockItems = useMemo(() => [{
    key: 'dock',
    label: 'Dock',
    style: { borderBottom: '1px solid #4f4f4f' },
    children: onlineDocks.length === 0
      ? <div style={{ height: 150, color: 'white' }}><Empty image={noData} imageStyle={{ height: 60 }} /></div>
      : <div style={{ fontSize: 12, color: 'white' }}>{onlineDocks.map(renderDockItem)}</div>,
  }], [onlineDocks, dockInfo, deviceInfo, hmsInfo, osdVisible, hmsVisible])

  const deviceItems = useMemo(() => [{
    key: 'aircraft',
    label: 'Online Devices',
    style: { borderBottom: '1px solid #4f4f4f' },
    children: onlineDevices.length === 0
      ? <div style={{ height: 150, color: 'white' }}><Empty image={noData} imageStyle={{ height: 60 }} /></div>
      : <div style={{ fontSize: 12, color: 'white' }}>{onlineDevices.map(renderDeviceItem)}</div>,
  }], [onlineDevices, deviceInfo, osdVisible])

  return (
    <div className="project-tsa-wrapper" style={{ height: '100%' }}>
      <div style={{ height: 50, lineHeight: '50px', alignItems: 'center', borderBottom: '1px solid #4f4f4f' }}>
        <Row>
          <Col span={1} />
          <Col span={11}>My Username</Col>
          <Col span={11} style={{ textAlign: 'right', fontWeight: 700 }}>{username}</Col>
          <Col span={1} />
        </Row>
      </div>
      <div ref={scrollRef} className="scrollbar" style={{ height: scrollHeight || 'calc(100% - 50px)', overflow: 'auto' }}>
        <Collapse bordered={false} expandIconPosition="end" accordion style={{ background: '#232323' }} items={dockItems} />
        <Collapse bordered={false} expandIconPosition="end" accordion style={{ background: '#232323' }} items={deviceItems} />
      </div>
      <style>{`
        .project-tsa-wrapper .scrollbar::-webkit-scrollbar { display: none; }
        .project-tsa-wrapper .ant-collapse > .ant-collapse-item > .ant-collapse-header { color: white; border: 0; padding-left: 14px; }
        .notice-blink { background: #19be6b; animation: blink 500ms infinite; }
        .caution-blink { background: orange; animation: blink 500ms infinite; }
        .warn-blink { background: red; animation: blink 500ms infinite; }
        .notice { background: #19be6b; overflow: hidden; cursor: pointer; }
        .caution { background: orange; cursor: pointer; overflow: hidden; }
        .warn { background: red; cursor: pointer; overflow: hidden; }
        .word-loop { white-space: nowrap; display: inline-block; animation: 10s loop linear infinite normal; }
        @keyframes blink { from { opacity: 1; } 50% { opacity: 0.35; } to { opacity: 1; } }
        @keyframes loop { 0% { transform: translateX(20px); } 100% { transform: translateX(-100%); } }
      `}</style>
    </div>
  )
}

export default TsaPage
