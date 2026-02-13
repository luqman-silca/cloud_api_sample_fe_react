import { useEffect, useState } from 'react'
import { Modal, Table, Button } from 'antd'
import { DOMAIN } from '@/types/device'
import { DeviceLogFileInfo, DeviceLogItem, GetDeviceUploadLogListRsp, getUploadDeviceLogUrl } from '@/api/device-log'
import { useDeviceLogUploadDetail } from './useDeviceLogUploadDetail'
import { download } from '@/utils/download'

interface DeviceLogDetailModalProps {
  visible: boolean
  deviceLog: GetDeviceUploadLogListRsp | null
  onVisibleChange: (visible: boolean) => void
}

function DeviceLogDetailModal({ visible, deviceLog, onVisibleChange }: DeviceLogDetailModalProps) {
  const [airportLogList, setAirportLogList] = useState<DeviceLogFileInfo>({} as DeviceLogFileInfo)
  const [droneLogList, setDroneLogList] = useState<DeviceLogFileInfo>({} as DeviceLogFileInfo)

  const { getLogTime, getLogSize } = useDeviceLogUploadDetail()

  useEffect(() => {
    if (visible && deviceLog) {
      const { device_logs } = deviceLog
      const { files } = device_logs || {}
      if (files?.length) {
        files.forEach((file) => {
          if (file.module === DOMAIN.DOCK) setAirportLogList(file)
          else if (file.module === DOMAIN.DRONE) setDroneLogList(file)
        })
      }
    }
  }, [visible, deviceLog])

  const handleClose = () => {
    onVisibleChange(false)
  }

  const onDownloadLog = async (fileId: string) => {
    const { data } = await getUploadDeviceLogUrl({
      file_id: fileId,
      logs_id: deviceLog?.logs_id || '',
    })
    if (data) {
      download(data)
    }
  }

  const logColumns = (title: string) => [
    { title, dataIndex: 'time', width: '70%', render: (_: any, record: DeviceLogItem) => getLogTime(record) },
    { title: 'File Size', dataIndex: 'size', width: '30%', render: (_: any, record: DeviceLogItem) => getLogSize(record.size) },
  ]

  return (
    <Modal
      open={visible}
      title="Log Upload Details"
      width={900}
      footer={null}
      onCancel={handleClose}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
        <div style={{ width: 420 }}>
          <Button
            type="primary"
            size="small"
            disabled={!airportLogList.file_id || !airportLogList.object_key}
            onClick={() => onDownloadLog(airportLogList.file_id)}
            style={{ marginBottom: 10 }}
          >
            Download Dock Logs
          </Button>
          <Table
            columns={logColumns('Dock Logs')}
            dataSource={airportLogList.list}
            rowKey="boot_index"
            pagination={false}
            scroll={{ x: '100%', y: 600 }}
          />
        </div>
        <div style={{ width: 420 }}>
          <Button
            type="primary"
            size="small"
            disabled={!droneLogList.file_id || !droneLogList.object_key}
            onClick={() => onDownloadLog(droneLogList.file_id)}
            style={{ marginBottom: 10 }}
          >
            Download Drone Logs
          </Button>
          <Table
            columns={logColumns('Drone Logs')}
            dataSource={droneLogList.list}
            rowKey="boot_index"
            pagination={false}
            scroll={{ x: '100%', y: 600 }}
          />
        </div>
      </div>
    </Modal>
  )
}

export default DeviceLogDetailModal
