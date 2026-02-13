import { useState, useEffect } from 'react'
import { Button, Switch } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { useDockControl } from './useDockControl'
import { DeviceInfoType, EDockModeCode } from '@/types/device'
import { cmdList as baseCmdList, DeviceCmdItem } from '@/types/device-cmd'
import { useDeviceStore } from '@/store/useDeviceStore'
import {
  updateDeviceCmdInfoByOsd,
  updateDeviceCmdInfoByExecuteInfo,
} from '@/utils/device-cmd'
import DeviceSettingBox from './DeviceSettingBox'

interface DockControlPanelProps {
  sn: string
  deviceInfo: DeviceInfoType
  onCloseControlPanel?: (sn: string, debugging: boolean) => void
}

function DockControlPanel({
  sn,
  deviceInfo,
  onCloseControlPanel,
}: DockControlPanelProps) {
  const [cmdList, setCmdList] = useState(() =>
    baseCmdList.map((item) => ({ ...item }))
  )
  const [debugStatus, setDebugStatus] = useState(
    deviceInfo.dock?.basic_osd?.mode_code === EDockModeCode.Remote_Debugging
  )

  const devicesCmdExecuteInfo = useDeviceStore((s) => s.devicesCmdExecuteInfo)
  const { sendDockControlCmd, dockDebugOnOff } = useDockControl()

  useEffect(() => {
    if (sn && devicesCmdExecuteInfo[sn]) {
      const newList = cmdList.map((item) => ({ ...item }))
      updateDeviceCmdInfoByExecuteInfo(newList, devicesCmdExecuteInfo[sn])
      setCmdList(newList)
    }
  }, [devicesCmdExecuteInfo, sn]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const newList = cmdList.map((item) => ({ ...item }))
    updateDeviceCmdInfoByOsd(newList, deviceInfo)
    setCmdList(newList)
  }, [deviceInfo]) // eslint-disable-line react-hooks/exhaustive-deps

  function closeControlPanel() {
    onCloseControlPanel?.(sn, debugStatus)
  }

  async function onDeviceStatusChange(status: boolean) {
    let result = false
    if (status) {
      result = await dockDebugOnOff(sn, true)
    } else {
      result = await dockDebugOnOff(sn, false)
    }
    if (!result) {
      setDebugStatus(!status)
    } else {
      setDebugStatus(status)
    }
  }

  async function sendControlCmd(cmdItem: DeviceCmdItem) {
    await sendDockControlCmd(
      { sn, cmd: cmdItem.cmdKey, action: cmdItem.action },
      true
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: 'calc(100% + 10px)',
        top: 0,
        width: 480,
        padding: 0,
        background: '#000',
        color: '#fff',
        borderRadius: 2,
      }}
    >
      <div
        style={{
          borderBottom: '1px solid #515151',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 5px',
          fontSize: 16,
        }}
      >
        <span>
          Device Control
          <span style={{ fontSize: 12, paddingLeft: 15 }}>{sn}</span>
        </span>
        <span onClick={closeControlPanel} style={{ cursor: 'pointer' }}>
          <CloseOutlined />
        </span>
      </div>
      <DeviceSettingBox sn={sn} deviceInfo={deviceInfo} />
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            padding: '10px 10px 0px',
          }}
        >
          Device Remote Debug
          <Switch
            style={{ marginLeft: 10, border: '1px solid #585858' }}
            checked={debugStatus}
            onChange={onDeviceStatusChange}
          />
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            padding: '4px 10px',
          }}
        >
          {cmdList.map((cmdItem) => (
            <div
              key={cmdItem.cmdKey}
              style={{
                width: 220,
                height: 58,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid #666',
                margin: '4px 0',
                padding: '0 8px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 700 }}>{cmdItem.label}</div>
                <div>{cmdItem.status}</div>
              </div>
              <div>
                <Button
                  disabled={!debugStatus || cmdItem.disabled}
                  loading={cmdItem.loading}
                  size="small"
                  type="primary"
                  onClick={() => sendControlCmd(cmdItem)}
                >
                  {cmdItem.operateText}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DockControlPanel
