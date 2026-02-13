import { useEffect, useState, useMemo } from 'react'
import { Modal, Table, Button, message } from 'antd'
import { Device, DOMAIN } from '@/types/device'
import { getDeviceLogList, postDeviceUpgrade, DeviceLogFileInfo, DeviceLogItem } from '@/api/device-log'
import { useDeviceLogUploadDetail } from './useDeviceLogUploadDetail'

interface DeviceLogUploadModalProps {
  visible: boolean
  device: Device | null
  onVisibleChange: (visible: boolean) => void
  onUploadLogOk?: () => void
}

function DeviceLogUploadModal({ visible, device, onVisibleChange, onUploadLogOk }: DeviceLogUploadModalProps) {
  const [airportLogList, setAirportLogList] = useState<DeviceLogFileInfo>({} as DeviceLogFileInfo)
  const [droneLogList, setDroneLogList] = useState<DeviceLogFileInfo>({} as DeviceLogFileInfo)
  const [airportLoading, setAirportLoading] = useState(false)
  const [droneLoading, setDroneLoading] = useState(false)
  const [airportSelectedKeys, setAirportSelectedKeys] = useState<number[]>([])
  const [airportSelectedRows, setAirportSelectedRows] = useState<DeviceLogItem[]>([])
  const [droneSelectedKeys, setDroneSelectedKeys] = useState<number[]>([])
  const [droneSelectedRows, setDroneSelectedRows] = useState<DeviceLogItem[]>([])

  const { getLogTime, getLogSize } = useDeviceLogUploadDetail()

  useEffect(() => {
    if (visible && device) {
      setAirportLoading(true)
      setDroneLoading(true)
      getDeviceLogList({
        device_sn: device.device_sn,
        domain: [DOMAIN.DOCK, DOMAIN.DRONE],
      }).then(({ code, data }) => {
        if (code === 0 && data?.files) {
          data.files.forEach((file) => {
            if (file.module === DOMAIN.DOCK) setAirportLogList(file)
            else if (file.module === DOMAIN.DRONE) setDroneLogList(file)
          })
        }
      }).finally(() => {
        setAirportLoading(false)
        setDroneLoading(false)
      })
    }
  }, [visible, device])

  const handleClose = () => {
    onVisibleChange(false)
    setAirportLogList({} as DeviceLogFileInfo)
    setDroneLogList({} as DeviceLogFileInfo)
    setAirportSelectedKeys([])
    setAirportSelectedRows([])
    setDroneSelectedKeys([])
    setDroneSelectedRows([])
  }

  const uploadDisabled = useMemo(() => {
    return airportSelectedKeys.length === 0 && droneSelectedKeys.length === 0
  }, [airportSelectedKeys, droneSelectedKeys])

  const handleUpload = async () => {
    const body: any = {
      device_sn: device?.device_sn || '',
      files: [],
    }
    if (airportSelectedRows.length > 0) {
      body.files.push({
        list: airportSelectedRows,
        device_sn: airportLogList.device_sn,
        module: airportLogList.module,
      })
    }
    if (droneSelectedRows.length > 0) {
      body.files.push({
        list: droneSelectedRows,
        device_sn: droneLogList.device_sn,
        module: droneLogList.module,
      })
    }
    const { code } = await postDeviceUpgrade(body)
    if (code === 0) {
      message.success('Log upload task started')
      onUploadLogOk?.()
      handleClose()
    }
  }

  const logColumns = (title: string) => [
    { title, dataIndex: 'time', width: '70%', render: (_: any, record: DeviceLogItem) => getLogTime(record) },
    { title: 'File Size', dataIndex: 'size', width: '30%', render: (_: any, record: DeviceLogItem) => getLogSize(record.size) },
  ]

  return (
    <Modal
      open={visible}
      title="Device Log Upload"
      width={900}
      footer={null}
      onCancel={handleClose}
    >
      <div>
        <Button type="primary" disabled={uploadDisabled} onClick={handleUpload}>Upload Logs</Button>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
          <div style={{ width: 420 }}>
            <Table
              columns={logColumns('Dock Logs')}
              dataSource={airportLogList.list}
              loading={airportLoading}
              rowKey="boot_index"
              pagination={false}
              scroll={{ x: '100%', y: 600 }}
              rowSelection={{
                columnWidth: 15,
                selectedRowKeys: airportSelectedKeys,
                onChange: (keys, rows) => {
                  setAirportSelectedKeys(keys as number[])
                  setAirportSelectedRows(rows)
                },
              }}
            />
          </div>
          <div style={{ width: 420 }}>
            <Table
              columns={logColumns('Drone Logs')}
              dataSource={droneLogList.list}
              loading={droneLoading}
              rowKey="boot_index"
              pagination={false}
              scroll={{ x: '100%', y: 600 }}
              rowSelection={{
                columnWidth: 15,
                selectedRowKeys: droneSelectedKeys,
                onChange: (keys, rows) => {
                  setDroneSelectedKeys(keys as number[])
                  setDroneSelectedRows(rows)
                },
              }}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default DeviceLogUploadModal
