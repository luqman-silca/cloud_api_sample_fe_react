import { useEffect, useState } from 'react'
import { Select, Divider, Button, Drawer, message } from 'antd'
import { CaretRightFilled } from '@ant-design/icons'
import { Input } from 'antd'
import apiPilot from '@/api/pilot-bridge'
import { CURRENT_CONFIG } from '@/api/http/config'
import { ELiveTypeName, ELiveTypeValue, GB28181Param, LiveConfigParam, LiveStreamStatus, RTSPParam, EVideoPublishType } from '@/types/live-stream'
import { EStatusValue, ELiveStatusValue } from '@/types'

const publishModeList = [
  { value: EVideoPublishType.VideoOnDemand, label: EVideoPublishType.VideoOnDemand },
  { value: EVideoPublishType.VideoByManual, label: EVideoPublishType.VideoByManual },
  { value: EVideoPublishType.VideoDemandAuxManual, label: EVideoPublishType.VideoDemandAuxManual },
]

const liveTypeList = [
  { value: ELiveTypeValue.Agora, label: ELiveTypeName.Agora },
  { value: ELiveTypeValue.RTMP, label: ELiveTypeName.RTMP },
  { value: ELiveTypeValue.RTSP, label: ELiveTypeName.RTSP },
  { value: ELiveTypeValue.GB28181, label: ELiveTypeName.GB28181 },
]

function PilotLivesharePage() {
  const [agoraParam, setAgoraParam] = useState({
    uid: '2892130292',
    token: CURRENT_CONFIG.agoraToken,
    channelId: CURRENT_CONFIG.agoraChannel,
  })
  const [liveStreamStatus, setLiveStreamStatus] = useState<LiveStreamStatus>({
    audioBitRate: -1,
    dropRate: -1,
    fps: -1,
    jitter: -1,
    quality: -1,
    rtt: -1,
    status: -1,
    type: -1,
    videoBitRate: -1,
  })
  const [playVisible, setPlayVisible] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [liveState, setLiveState] = useState(EStatusValue.DISCONNECT)
  const [liveTypeSelected, setLiveTypeSelected] = useState<string>()
  const [publishModeSelected, setPublishModeSelected] = useState<string>()

  const rtmpParam = { url: CURRENT_CONFIG.rtmpURL + new Date().getTime() }
  const rtspParam: RTSPParam = {
    userName: CURRENT_CONFIG.rtspUserName,
    password: CURRENT_CONFIG.rtspPassword,
    port: CURRENT_CONFIG.rtspPort,
  }
  const gb28181Param: GB28181Param = {
    serverIp: CURRENT_CONFIG.gbServerIp,
    serverPort: CURRENT_CONFIG.gbServerPort,
    serverId: CURRENT_CONFIG.gbServerId,
    agentId: CURRENT_CONFIG.gbAgentId,
    password: CURRENT_CONFIG.gbPassword,
    agentPort: CURRENT_CONFIG.gbAgentPort,
    agentChannel: CURRENT_CONFIG.gbAgentChannel,
  }

  useEffect(() => {
    const config: LiveConfigParam = JSON.parse(apiPilot.getLiveshareConfig())
    setLiveStreamStatus((prev) => ({ ...prev, type: config.type }))
    refreshLiveType(config.type)

    ;(window as any).liveStatusCallback = (arg: LiveStreamStatus) => {
      liveStatusCallback(arg)
    }
  }, [])

  const liveStatusCallback = (arg: LiveStreamStatus) => {
    setLiveStreamStatus(arg)

    switch (arg.status) {
      case ELiveStatusValue.LIVING:
        setLiveState(EStatusValue.LIVING)
        break
      case ELiveStatusValue.CONNECTED:
        setLiveState(EStatusValue.CONNECTED)
        break
      default:
        setLiveState(EStatusValue.DISCONNECT)
    }
  }

  const refreshLiveType = (type: number) => {
    switch (type) {
      case ELiveTypeValue.Agora:
        setLiveTypeSelected(ELiveTypeName.Agora)
        break
      case ELiveTypeValue.RTMP:
        setLiveTypeSelected(ELiveTypeName.RTMP)
        break
      case ELiveTypeValue.RTSP:
        setLiveTypeSelected(ELiveTypeName.RTSP)
        break
      case ELiveTypeValue.GB28181:
        setLiveTypeSelected(ELiveTypeName.GB28181)
        break
      default:
        setLiveTypeSelected(ELiveTypeName.Unknown)
    }
  }

  const onLiveTypeSelect = (val: number) => {
    setLiveStreamStatus((prev) => ({ ...prev, type: val }))
    refreshLiveType(val)
  }

  const onPublishModeSelect = (val: string) => {
    setPublishModeSelected(val)
    apiPilot.setVideoPublishType(val)
  }

  const onPlay = () => {
    console.info(JSON.stringify(agoraParam))
    if (!publishModeSelected) {
      message.warn('Please select publish mode!')
      return
    }
    if (liveTypeSelected === ELiveTypeName.Unknown) {
      message.warn('Please select livestream type!')
      return
    }
    switch (liveStreamStatus.type) {
      case 1:
        apiPilot.setLiveshareConfig(ELiveTypeValue.Agora, JSON.stringify(agoraParam))
        break
      case 2:
        apiPilot.setLiveshareConfig(ELiveTypeValue.RTMP, JSON.stringify(rtmpParam))
        break
      case 3:
        apiPilot.setLiveshareConfig(ELiveTypeValue.RTSP, JSON.stringify(rtspParam))
        break
      case 4:
        apiPilot.setLiveshareConfig(ELiveTypeValue.GB28181, JSON.stringify(gb28181Param))
        break
    }
    const status = apiPilot.startLiveshare()
    if (status) {
      setPlayVisible(true)
      setDrawerVisible(true)
      message.success('success')
    }
  }

  const onStop = () => {
    const status = apiPilot.stopLiveshare()
    if (status) {
      message.success('success')
      setPlayVisible(false)
      setDrawerVisible(false)
      setTimeout(() => {
        setLiveStreamStatus((prev) => ({
          ...prev,
          audioBitRate: -1,
          dropRate: -1,
          fps: -1,
          jitter: -1,
          quality: -1,
          rtt: -1,
          status: -1,
          videoBitRate: -1,
        }))
      }, 2000)
    }
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', backgroundColor: 'white' }}>
      <p style={{ fontSize: 16, marginLeft: 10, marginTop: 15, marginBottom: 10, color: '#939393' }}>
        Before starting manually, please select the publish mode and livestream type
      </p>
      <div style={{ marginTop: 15, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <p style={{ marginLeft: 10, marginBottom: 0, fontSize: 16, color: 'black' }}>Select Video Publish Mode:</p>
        <Select style={{ width: 200, marginRight: 20 }} placeholder="Select Mode" onSelect={onPublishModeSelect}>
          {publishModeList.map((item) => (
            <Select.Option key={item.label} value={item.value}>
              {item.label}
            </Select.Option>
          ))}
        </Select>
      </div>
      <div style={{ marginLeft: 10, marginRight: 10, width: '96%', marginTop: -10 }}>
        <Divider />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: -10 }}>
        <p style={{ marginLeft: 10, marginBottom: 0, fontSize: 16 }}>Select Livestream Type:</p>
        <Select style={{ width: 200, marginRight: 20 }} placeholder="Select Live Type" value={liveStreamStatus.type} onSelect={onLiveTypeSelect}>
          {liveTypeList.map((item) => (
            <Select.Option key={item.label} value={item.value}>
              {item.label}
            </Select.Option>
          ))}
        </Select>
      </div>
      <div style={{ marginLeft: 10, marginRight: 10, width: '96%', marginTop: -10 }}>
        <Divider />
      </div>
      <div style={{ width: '100%', marginTop: -10 }}>
        <div style={{ marginLeft: 10, width: '97%' }}>
          <span style={{ fontSize: 16 }}>Param: </span>
          {liveStreamStatus.type === ELiveTypeValue.Agora && (
            <span style={{ wordBreak: 'break-all', color: '#75c5f6' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div>
                  <span style={{ marginLeft: 10 }}>Token:</span>
                  <Input
                    style={{ marginLeft: 10 }}
                    value={agoraParam.token}
                    onChange={(e) => setAgoraParam({ ...agoraParam, token: e.target.value })}
                    placeholder="Token"
                  />
                </div>
                <div>
                  <span style={{ marginLeft: 10 }}>Channel:</span>
                  <Input
                    style={{ marginLeft: 10 }}
                    value={agoraParam.channelId}
                    onChange={(e) => setAgoraParam({ ...agoraParam, channelId: e.target.value })}
                    placeholder="Channel"
                  />
                </div>
              </div>
            </span>
          )}
          {liveStreamStatus.type === ELiveTypeValue.RTMP && <span style={{ wordBreak: 'break-all', color: '#75c5f6' }}>{rtmpParam.url}</span>}
          {liveStreamStatus.type === ELiveTypeValue.RTSP && <span style={{ wordBreak: 'break-all', color: '#75c5f6' }}>{JSON.stringify(rtspParam)}</span>}
          {liveStreamStatus.type === ELiveTypeValue.GB28181 && <span style={{ wordBreak: 'break-all', color: '#75c5f6' }}>{JSON.stringify(gb28181Param)}</span>}
        </div>
      </div>
      <div style={{ marginLeft: 10, marginRight: 10, width: '96%', marginTop: -10 }}>
        <Divider />
      </div>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <Button style={{ width: 100, fontSize: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} type="ghost" onClick={onPlay}>
          Play
        </Button>
        <Button
          style={{ width: 100, fontSize: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginLeft: 40 }}
          type="ghost"
          onClick={onStop}
        >
          Stop
        </Button>
      </div>
      {playVisible && (
        <Button
          shape="circle"
          onClick={() => setDrawerVisible(!drawerVisible)}
          style={{ position: 'fixed', top: '13vh', left: '5vw', opacity: 0.8, backgroundColor: 'rgba(0,0,0,0)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <CaretRightFilled style={{ fontSize: 26 }} />
        </Button>
      )}
      <Drawer placement="right" open={drawerVisible} width={280} mask={false} onClose={() => setDrawerVisible(false)}>
        <div style={{ fontSize: 16, width: '100%' }}>
          <div style={{ marginTop: 20, marginBottom: -10 }}>
            <span style={{ fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <font color={liveState === EStatusValue.LIVING ? 'green' : liveState === EStatusValue.CONNECTED ? 'blue' : 'red'}>{liveState}</font>
            </span>
          </div>
          <Divider />
          <div style={{ marginTop: -10, marginBottom: -15 }}>
            <span>Frame Rate:</span>
            <span style={{ float: 'right', color: '#75c5f6' }}>
              {liveStreamStatus.fps}
              {liveStreamStatus.fps !== -1 && <span> fps</span>}
            </span>
          </div>
          <Divider />
          <div style={{ marginTop: -10, marginBottom: -10 }}>
            <span>Video Bit Rate:</span>
            <span style={{ float: 'right', color: '#75c5f6' }}>
              {liveStreamStatus.videoBitRate}
              {liveStreamStatus.videoBitRate !== -1 && <span> kbps</span>}
            </span>
          </div>
          <Divider />
          <div style={{ marginTop: -10, marginBottom: -10 }}>
            <span>Audio Bit Rate:</span>
            <span style={{ float: 'right', color: '#75c5f6' }}>
              {liveStreamStatus.audioBitRate}
              {liveStreamStatus.audioBitRate !== -1 && <span> kbps</span>}
            </span>
          </div>
          <Divider />
          <div style={{ marginTop: -10, marginBottom: -10 }}>
            <span>Packet Loss Rate:</span>
            <span style={{ float: 'right', color: '#75c5f6' }}>
              {liveStreamStatus.dropRate}
              {liveStreamStatus.dropRate !== -1 && <span> %</span>}
            </span>
          </div>
          <Divider />
          <div style={{ marginTop: -10, marginBottom: -10 }}>
            <span>RTT:</span>
            <span style={{ float: 'right', color: '#75c5f6' }}>
              {liveStreamStatus.rtt}
              {liveStreamStatus.rtt !== -1 && <span> ms</span>}
            </span>
          </div>
          <Divider />
          <div style={{ marginTop: -10 }}>
            <span>Jitter:</span>
            <span style={{ float: 'right', color: '#75c5f6' }}>{liveStreamStatus.jitter}</span>
          </div>
        </div>
      </Drawer>
    </div>
  )
}

export default PilotLivesharePage
