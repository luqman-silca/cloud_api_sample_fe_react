import { useEffect, useState, useCallback } from 'react'
import { Drawer, Table, Button, Progress, Tooltip, Modal } from 'antd'
import { FileTextOutlined, StopOutlined, DeleteOutlined } from '@ant-design/icons'
import { Device, DOMAIN, DEVICE_NAME } from '@/types/device'
import {
  getDeviceUploadLogList,
  GetDeviceUploadLogListRsp,
  cancelDeviceLogUpload,
  deleteDeviceLogUpload,
  DeviceLogProgressInfo,
} from '@/api/device-log'
import { DeviceLogUploadStatusEnum, DeviceLogUploadStatusMap, DeviceLogUploadStatusColor, DeviceLogUploadInfo, DeviceLogUploadWsStatusMap } from '@/types/device-log'
import { useDeviceLogUploadProgressEvent } from './useDeviceLogUploadProgressEvent'
import DeviceLogUploadModal from './DeviceLogUploadModal'
import DeviceLogDetailModal from './DeviceLogDetailModal'

interface DeviceLogUploadRecordDrawerProps {
  visible: boolean
  device: Device | null
  onVisibleChange: (visible: boolean) => void
}

function DeviceLogUploadRecordDrawer({ visible, device, onVisibleChange }: DeviceLogUploadRecordDrawerProps) {
  const [uploadLogList, setUploadLogList] = useState<GetDeviceUploadLogListRsp[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    pageSizeOptions: ['20', '50', '100'],
    showQuickJumper: true,
    showSizeChanger: true,
    pageSize: 50,
    current: 1,
    total: 0,
  })
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [currentDeviceLog, setCurrentDeviceLog] = useState<GetDeviceUploadLogListRsp | null>(null)

  const fetchUploadLogs = useCallback(async () => {
    if (!device) return
    setLoading(true)
    try {
      const { code, data } = await getDeviceUploadLogList({
        device_sn: device.device_sn,
        page: pagination.current,
        page_size: pagination.pageSize,
      })
      if (code === 0) {
        setUploadLogList(data.list)
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          current: data.pagination.page,
          pageSize: data.pagination.page_size,
        }))
      }
    } finally {
      setLoading(false)
    }
  }, [device, pagination.current, pagination.pageSize])

  useEffect(() => {
    if (visible) fetchUploadLogs()
  }, [visible, fetchUploadLogs])

  const getDeviceLogUploadStatus = (item: GetDeviceUploadLogListRsp) => ({
    color: DeviceLogUploadStatusColor[item.status] || '',
    text: DeviceLogUploadStatusMap[item.status] || '',
  })

  const getLogProgress = (item: GetDeviceUploadLogListRsp) => {
    let percent = 0
    if (item.logs_progress?.length) {
      item.logs_progress.forEach((log) => { percent += (log.progress || 0) })
      percent = percent / item.logs_progress.length
    }
    return Math.floor(percent)
  }

  const onDeviceLogUploadWs = useCallback((data: DeviceLogUploadInfo) => {
    const { output } = data
    if (!output) return
    const { files, status, logs_id: logId } = output
    setUploadLogList((prev) => {
      const newList = [...prev]
      const item = newList.find((log) => log.logs_id === logId)
      if (!item) return prev
      if (status) {
        item.status = DeviceLogUploadWsStatusMap[status] as DeviceLogUploadStatusEnum
      }
      if (files?.length) {
        item.logs_progress = files.map((file) => ({
          ...file,
          status: DeviceLogUploadWsStatusMap[file.status] as DeviceLogUploadStatusEnum,
        })) as DeviceLogProgressInfo[]
      }
      return newList
    })
  }, [])

  useDeviceLogUploadProgressEvent(onDeviceLogUploadWs)

  const handleCancelUpload = (item: GetDeviceUploadLogListRsp) => {
    Modal.confirm({
      title: 'Cancel Log Upload',
      content: 'Are you sure you want to cancel log upload?',
      okType: 'danger',
      async onOk() {
        const { code } = await cancelDeviceLogUpload({
          device_sn: device?.device_sn || '',
          module_list: [DOMAIN.DOCK, DOMAIN.DRONE],
          status: 'cancel',
        })
        if (code === 0) fetchUploadLogs()
      },
    })
  }

  const handleDeleteUpload = (item: GetDeviceUploadLogListRsp) => {
    Modal.confirm({
      title: 'Delete Upload Log',
      content: 'Are you sure you want to delete this upload log?',
      okType: 'danger',
      async onOk() {
        const { code } = await deleteDeviceLogUpload({
          device_sn: device?.device_sn || '',
          logs_id: item.logs_id,
        })
        if (code === 0) fetchUploadLogs()
      },
    })
  }

  const columns = [
    { title: 'Upload Time', dataIndex: 'create_time', width: 100 },
    {
      title: 'Device Model',
      dataIndex: 'device_type',
      width: 80,
      render: (_: any, record: GetDeviceUploadLogListRsp) => {
        const topo = record.device_topo
        return (
          <div>
            {topo.parents?.map((p) => <div key={p.sn}>{DEVICE_NAME[p.device_model.key] || p.device_model.key}</div>)}
            {topo.hosts?.map((h) => <div key={h.sn}>{DEVICE_NAME[h.device_model.key] || h.device_model.key}</div>)}
          </div>
        )
      },
    },
    {
      title: 'Device SN',
      dataIndex: 'device_sn',
      width: 120,
      render: (_: any, record: GetDeviceUploadLogListRsp) => {
        const topo = record.device_topo
        return (
          <div>
            {topo.parents?.map((p) => <div key={p.sn}>{p.sn}</div>)}
            {topo.hosts?.map((h) => <div key={h.sn}>{h.sn}</div>)}
          </div>
        )
      },
    },
    {
      title: 'Upload Status',
      dataIndex: 'status',
      width: 120,
      render: (_: any, record: GetDeviceUploadLogListRsp) => {
        const status = getDeviceLogUploadStatus(record)
        return (
          <div>
            <div>
              <span style={{ display: 'inline-block', width: 12, height: 12, marginRight: 3, borderRadius: '50%', backgroundColor: status.color, verticalAlign: 'middle' }} />
              {status.text}
            </div>
            {record.status === DeviceLogUploadStatusEnum.Uploading && (
              <Progress percent={getLogProgress(record)} />
            )}
          </div>
        )
      },
    },
    {
      title: 'Actions',
      width: 80,
      render: (_: any, record: GetDeviceUploadLogListRsp) => (
        <div style={{ color: '#2d8cf0' }}>
          <Tooltip title="View Details">
            <FileTextOutlined style={{ marginRight: 10, cursor: 'pointer' }} onClick={() => { setCurrentDeviceLog(record); setDetailModalVisible(true) }} />
          </Tooltip>
          {record.status === DeviceLogUploadStatusEnum.Uploading ? (
            <Tooltip title="Cancel">
              <StopOutlined style={{ marginRight: 10, cursor: 'pointer' }} onClick={() => handleCancelUpload(record)} />
            </Tooltip>
          ) : (
            <Tooltip title="Delete">
              <DeleteOutlined style={{ cursor: 'pointer' }} onClick={() => handleDeleteUpload(record)} />
            </Tooltip>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <Drawer
        title="Device Log Upload Records"
        placement="right"
        open={visible}
        onClose={() => onVisibleChange(false)}
        width={800}
        destroyOnClose
      >
        <div>
          <Button type="primary" onClick={() => setUploadModalVisible(true)}>Upload Logs</Button>
        </div>
        <div style={{ paddingTop: 20 }}>
          <Table
            columns={columns}
            dataSource={uploadLogList}
            loading={loading}
            pagination={pagination}
            onChange={(p) => setPagination((prev) => ({ ...prev, current: p.current || 1, pageSize: p.pageSize || 50 }))}
            rowKey="logs_id"
            scroll={{ x: '100%', y: 600 }}
          />
        </div>
      </Drawer>

      <DeviceLogUploadModal
        visible={uploadModalVisible}
        device={device}
        onVisibleChange={setUploadModalVisible}
        onUploadLogOk={fetchUploadLogs}
      />

      <DeviceLogDetailModal
        visible={detailModalVisible}
        deviceLog={currentDeviceLog}
        onVisibleChange={setDetailModalVisible}
      />
    </>
  )
}

export default DeviceLogUploadRecordDrawer
