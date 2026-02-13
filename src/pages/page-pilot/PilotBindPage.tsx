import { useState } from 'react'
import { Layout, Row, Col, Button, message } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { bindDevice, BindBody } from '@/api/manage'
import { ELocalStorageKey } from '@/types'
import { DeviceStatus } from '@/types/device'

function PilotBindPage() {
  const deviceData = JSON.parse(localStorage.getItem(ELocalStorageKey.Device) || '{}') as DeviceStatus
  const [drone, setDrone] = useState<DeviceStatus>(deviceData)

  const onBindDevice = async () => {
    const bindParam: BindBody = {
      device_sn: drone.sn,
      user_id: localStorage.getItem(ELocalStorageKey.UserId)!,
      workspace_id: localStorage.getItem(ELocalStorageKey.WorkspaceId)!,
    }
    try {
      const bindRes = await bindDevice(bindParam)
      if (bindRes.code !== 0) {
        message.error('bind failed:' + bindRes.message)
        console.error(bindRes.message)
        return
      }
      const updatedDrone = { ...drone, bound_status: true }
      setDrone(updatedDrone)
      localStorage.setItem(ELocalStorageKey.Device, JSON.stringify(updatedDrone))
    } catch (err) {
      message.error('Bind failed')
    }
  }

  return (
    <Layout style={{ height: '100vh', backgroundColor: 'white' }}>
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
        <Row align="middle" style={{ paddingTop: 20, paddingLeft: 20, height: 45, width: '100vw' }}>
          <Col span={1}>
            <span style={{ color: '#1fa3f6', fontSize: 26 }}>
              <SendOutlined rotate={90} />
            </span>
          </Col>
          <Col span={20}>
            <span style={{ fontSize: 20, paddingLeft: 5 }}>{drone.model}</span>
          </Col>
          <Col span={3}>
            {drone.bound_status ? (
              <span style={{ fontSize: 16, color: '#737373' }}>Bound</span>
            ) : (
              <Button type="primary" onClick={onBindDevice}>
                Bind
              </Button>
            )}
          </Col>
        </Row>
      </div>
    </Layout>
  )
}

export default PilotBindPage
