import { useEffect, useState, useCallback } from 'react'
import { Menu, Table, Input, Tooltip, Modal, message, notification } from 'antd'
import { CheckOutlined, CloseOutlined, EditOutlined, DeleteOutlined, FileSearchOutlined, CloudServerOutlined } from '@ant-design/icons'
import { getBindingDevices, unbindDevice, updateDevice } from '@/api/manage'
import { Device, DeviceFirmwareStatusEnum } from '@/types/device'
import { EDeviceTypeName, ELocalStorageKey } from '@/types'
import DeviceFirmwareUpgrade from '@/components/devices/device-upgrade/DeviceFirmwareUpgrade'
import DeviceFirmwareUpgradeModal from '@/components/devices/device-upgrade/DeviceFirmwareUpgradeModal'
import { useDeviceFirmwareUpgrade } from '@/components/devices/device-upgrade/useDeviceFirmwareUpgrade'
import { useDeviceUpgradeEvent } from '@/components/devices/device-upgrade/useDeviceUpgradeEvent'
import { DeviceCmdExecuteInfo, DeviceCmdExecuteStatus } from '@/types/device-cmd'
import DeviceLogUploadRecordDrawer from '@/components/devices/device-log/DeviceLogUploadRecordDrawer'
import DeviceHmsDrawer from '@/components/devices/device-hms/DeviceHmsDrawer'

function DevicesPage() {
  const workspaceId = localStorage.getItem(ELocalStorageKey.WorkspaceId) || ''
  const [current, setCurrent] = useState<string[]>([EDeviceTypeName.Aircraft.toString()])
  const [devices, setDevices] = useState<Device[]>([])
  const [editableData, setEditableData] = useState<Record<string, Device>>({})
  const [loading, setLoading] = useState(true)
  const [deleteTip, setDeleteTip] = useState(false)
  const [deleteSn, setDeleteSn] = useState('')
  const [expandRows, setExpandRows] = useState<string[]>([])
  const [pagination, setPagination] = useState({
    pageSizeOptions: ['20', '50', '100'],
    showQuickJumper: true,
    showSizeChanger: true,
    pageSize: 50,
    current: 1,
    total: 0,
  })

  const [deviceLogDrawerVisible, setDeviceLogDrawerVisible] = useState(false)
  const [hmsDrawerVisible, setHmsDrawerVisible] = useState(false)
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null)

  const {
    deviceFirmwareUpgradeModalVisible,
    setDeviceFirmwareUpgradeModalVisible,
    selectedDevice,
    onDeviceUpgrade,
    onUpgradeDeviceOk,
  } = useDeviceFirmwareUpgrade(workspaceId)

  const judgeCurrentType = (type: EDeviceTypeName) => {
    return current.indexOf(type.toString()) !== -1
  }

  const getDevices = useCallback((domain: number, closeLoading = false) => {
    if (!closeLoading) setLoading(true)
    getBindingDevices(workspaceId, { page: pagination.current, page_size: pagination.pageSize }, domain).then((res) => {
      if (res.code !== 0) return
      const resData: Device[] = res.data.list
      const rows: string[] = []
      resData.forEach((val: any) => {
        if (val.children) {
          val.children = [val.children]
        }
        if (judgeCurrentType(EDeviceTypeName.Dock)) {
          rows.push(val.device_sn)
        }
      })
      setExpandRows(rows)
      setDevices(resData)
      setPagination((prev) => ({
        ...prev,
        total: res.data.pagination.total,
        current: res.data.pagination.page,
        pageSize: res.data.pagination.page_size,
      }))
      setLoading(false)
    })
  }, [workspaceId, pagination.current, pagination.pageSize, current])

  useEffect(() => {
    getDevices(Number(current[0]))
  }, [])

  const edit = (record: Device) => {
    setEditableData((prev) => ({ ...prev, [record.device_sn]: { ...record } }))
  }

  const save = (record: Device) => {
    const editedRecord = editableData[record.device_sn]
    if (!editedRecord) return
    updateDevice({ nickname: editedRecord.nickname }, workspaceId, record.device_sn)
    setDevices((prev) => prev.map((d) => (d.device_sn === record.device_sn ? editedRecord : d)))
    setEditableData((prev) => {
      const newData = { ...prev }
      delete newData[record.device_sn]
      return newData
    })
  }

  const cancel = (sn: string) => {
    setEditableData((prev) => {
      const newData = { ...prev }
      delete newData[sn]
      return newData
    })
  }

  const unbind = async () => {
    setDeleteTip(false)
    const res = await unbindDevice(deleteSn)
    if (res.code === 0) {
      getDevices(Number(current[0]))
    }
  }

  const select = (item: any) => {
    setCurrent([item.key])
    getDevices(item.key)
  }

  const showDeviceLogUploadRecord = (device: Device) => {
    setCurrentDevice(device)
    setDeviceLogDrawerVisible(true)
  }

  const showHms = (device: Device) => {
    setCurrentDevice(device)
    setHmsDrawerVisible(true)
  }

  const onDeviceUpgradeWs = useCallback((payload: DeviceCmdExecuteInfo) => {
    updateDevicesByWs(devices, payload)
  }, [devices])

  const updateDevicesByWs = (devices: Device[], payload: DeviceCmdExecuteInfo) => {
    if (!devices?.length) return
    for (let i = 0; i < devices.length; i++) {
      if (devices[i].device_sn === payload.sn) {
        if (!payload.output) return
        const { status, progress, ext } = payload.output
        if (status === DeviceCmdExecuteStatus.Sent || status === DeviceCmdExecuteStatus.InProgress) {
          const rate = ext?.rate ? (ext.rate / 1024).toFixed(2) + 'kb/s' : ''
          devices[i].firmware_status = DeviceFirmwareStatusEnum.DuringUpgrade
          devices[i].firmware_progress = (progress?.percent || 0) + '% ' + rate
        } else {
          if (status === DeviceCmdExecuteStatus.Failed || status === DeviceCmdExecuteStatus.Timeout) {
            notification.error({
              message: `(${payload.sn}) Upgrade failed`,
              description: `Error Code: ${payload.result}`,
              duration: null,
            })
          }
          getDevices(Number(current[0]), true)
        }
        return
      }
      if (devices[i].children) {
        updateDevicesByWs(devices[i].children || [], payload)
      }
    }
  }

  useDeviceUpgradeEvent(onDeviceUpgradeWs)

  const expandIcon = (props: any) => {
    if (judgeCurrentType(EDeviceTypeName.Dock) && !props.expanded) {
      return (
        <div
          style={{
            borderLeft: '2px solid rgb(200,200,200)',
            borderBottom: '2px solid rgb(200,200,200)',
            height: 16,
            width: 16,
            float: 'left',
            marginTop: 5,
          }}
        />
      )
    }
    return null
  }

  const rowClassName = (record: any, index: number) => {
    const classList = []
    if ((index & 1) === 0) classList.push('table-striped')
    if (record.domain !== EDeviceTypeName.Dock) classList.push('child-row')
    return classList.join(' ')
  }

  const columns: any[] = [
    { title: 'Model', dataIndex: 'device_name', width: 100 },
    {
      title: 'SN',
      dataIndex: 'device_sn',
      width: 100,
      ellipsis: true,
      render: (text: string) => <Tooltip title={text}><span>{text}</span></Tooltip>,
    },
    {
      title: 'Name',
      dataIndex: 'nickname',
      width: 100,
      sorter: (a: Device, b: Device) => a.nickname.localeCompare(b.nickname),
      ellipsis: true,
      render: (text: string, record: Device) =>
        editableData[record.device_sn] ? (
          <Input
            value={editableData[record.device_sn].nickname}
            onChange={(e) =>
              setEditableData((prev) => ({
                ...prev,
                [record.device_sn]: { ...prev[record.device_sn], nickname: e.target.value },
              }))
            }
            style={{ margin: '-5px 0' }}
          />
        ) : (
          <Tooltip title={text}>{text}</Tooltip>
        ),
    },
    {
      title: 'Firmware Version',
      dataIndex: 'firmware_version',
      width: 150,
      render: (_: any, record: Device) =>
        judgeCurrentType(EDeviceTypeName.Dock) ? (
          <DeviceFirmwareUpgrade device={record} onDeviceUpgrade={onDeviceUpgrade} />
        ) : (
          record.firmware_version
        ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 100,
      render: (status: boolean) =>
        status ? (
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'green', marginRight: 5 }} />
            <span>Online</span>
          </span>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'red', marginRight: 5 }} />
            <span>Offline</span>
          </span>
        ),
    },
    {
      title: 'Workspace',
      dataIndex: 'workspace_name',
      width: 100,
      ellipsis: true,
      render: (text: string, record: Device) => {
        if (judgeCurrentType(EDeviceTypeName.Dock) && (record as any).domain === EDeviceTypeName.Aircraft) {
          return ''
        }
        return <Tooltip title={text}>{text}</Tooltip>
      },
    },
    {
      title: 'Joined',
      dataIndex: 'bound_time',
      width: 150,
      sorter: (a: Device, b: Device) => a.bound_time.localeCompare(b.bound_time),
    },
    {
      title: 'Last Online',
      dataIndex: 'login_time',
      width: 150,
      sorter: (a: Device, b: Device) => a.login_time.localeCompare(b.login_time),
    },
    {
      title: 'Actions',
      width: 100,
      render: (_: any, record: Device) => {
        const editable = editableData[record.device_sn]
        return editable ? (
          <div>
            <Tooltip title="Confirm changes">
              <span onClick={() => save(record)} style={{ color: '#28d445', cursor: 'pointer' }}>
                <CheckOutlined />
              </span>
            </Tooltip>
            <Tooltip title="Modification canceled">
              <span onClick={() => cancel(record.device_sn)} style={{ color: '#e70102', cursor: 'pointer' }}>
                <CloseOutlined />
              </span>
            </Tooltip>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', color: '#2d8cf0' }}>
            {current.indexOf(EDeviceTypeName.Dock.toString()) !== -1 && (
              <>
                <Tooltip title="Device Logs">
                  <CloudServerOutlined style={{ marginRight: 10, cursor: 'pointer' }} onClick={() => showDeviceLogUploadRecord(record)} />
                </Tooltip>
                <Tooltip title="Hms Info">
                  <FileSearchOutlined style={{ marginRight: 10, cursor: 'pointer' }} onClick={() => showHms(record)} />
                </Tooltip>
              </>
            )}
            <Tooltip title="Edit">
              <EditOutlined style={{ marginRight: 10, cursor: 'pointer' }} onClick={() => edit(record)} />
            </Tooltip>
            <Tooltip title="Delete">
              <DeleteOutlined style={{ cursor: 'pointer' }} onClick={() => { setDeleteTip(true); setDeleteSn(record.device_sn) }} />
            </Tooltip>
          </div>
        )
      },
    },
  ]

  return (
    <>
      <Menu
        selectedKeys={current}
        mode="horizontal"
        onSelect={select}
        style={{ marginLeft: 20 }}
        items={[
          { key: EDeviceTypeName.Aircraft.toString(), label: 'Aircraft' },
          { key: EDeviceTypeName.Dock.toString(), label: 'Dock' },
        ]}
      />
      <div style={{ backgroundColor: 'white', margin: 20, padding: 20, height: '88vh' }}>
        <Table
          columns={columns}
          dataSource={devices}
          pagination={pagination}
          onChange={(p) => {
            setPagination((prev) => ({ ...prev, current: p.current || 1, pageSize: p.pageSize || 50 }))
            getDevices(Number(current[0]))
          }}
          rowKey="device_sn"
          expandedRowKeys={expandRows}
          expandIcon={expandIcon}
          rowClassName={rowClassName}
          loading={loading}
          scroll={{ x: '100%', y: 600 }}
          rowSelection={{
            getCheckboxProps: (record: any) => ({
              disabled: judgeCurrentType(EDeviceTypeName.Dock) && record.domain !== EDeviceTypeName.Dock,
              style: judgeCurrentType(EDeviceTypeName.Dock) && record.domain !== EDeviceTypeName.Dock ? { display: 'none' } : {},
            }),
          }}
        />

        <Modal
          open={deleteTip}
          width={450}
          closable={false}
          centered
          okButtonProps={{ danger: true }}
          onOk={unbind}
          onCancel={() => setDeleteTip(false)}
          title={<div style={{ textAlign: 'center' }}>Delete devices</div>}
        >
          <p style={{ height: 50, paddingTop: 10, paddingLeft: 20 }}>Delete device from workspace?</p>
        </Modal>
      </div>

      <DeviceFirmwareUpgradeModal
        visible={deviceFirmwareUpgradeModalVisible}
        device={selectedDevice}
        onOk={onUpgradeDeviceOk}
        onVisibleChange={setDeviceFirmwareUpgradeModalVisible}
      />

      <DeviceLogUploadRecordDrawer
        visible={deviceLogDrawerVisible}
        device={currentDevice}
        onVisibleChange={setDeviceLogDrawerVisible}
      />

      <DeviceHmsDrawer
        visible={hmsDrawerVisible}
        device={currentDevice}
        onVisibleChange={setHmsDrawerVisible}
      />
    </>
  )
}

export default DevicesPage
