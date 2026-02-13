import { useEffect, useState, useCallback } from 'react'
import { Drawer, Table, DatePicker, Select, Input, Tooltip } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { Device, DeviceHms } from '@/types/device'
import { getDeviceHms, HmsQueryBody } from '@/api/manage'
import { EDeviceTypeName, EHmsLevel, ELocalStorageKey } from '@/types'

const { RangePicker } = DatePicker

interface DeviceHmsDrawerProps {
  visible: boolean
  device: Device | null
  onVisibleChange: (visible: boolean) => void
}

const levels = [
  { label: 'All', value: '' },
  { label: 'NOTICE', value: EHmsLevel.NOTICE },
  { label: 'CAUTION', value: EHmsLevel.CAUTION },
  { label: 'WARN', value: EHmsLevel.WARN },
]

const deviceTypes = [
  { label: 'All', value: -1 },
  { label: 'Aircraft', value: EDeviceTypeName.Aircraft },
  { label: 'Dock', value: EDeviceTypeName.Dock },
]

function DeviceHmsDrawer({ visible, device, onVisibleChange }: DeviceHmsDrawerProps) {
  const workspaceId = localStorage.getItem(ELocalStorageKey.WorkspaceId) || ''
  const [loading, setLoading] = useState(false)
  const [hmsData, setHmsData] = useState<DeviceHms[]>([])
  const [pagination, setPagination] = useState({
    pageSizeOptions: ['20', '50', '100'],
    showQuickJumper: true,
    showSizeChanger: true,
    pageSize: 50,
    current: 1,
    total: 0,
  })

  const [param, setParam] = useState<HmsQueryBody>({
    sns: [],
    device_sn: '',
    children_sn: '',
    language: 'en',
    begin_time: new Date(new Date().setDate(new Date().getDate() - 7)).setHours(0, 0, 0, 0),
    end_time: new Date().setHours(23, 59, 59, 999),
    domain: -1,
    level: '',
    message: '',
  })

  const [timeRange, setTimeRange] = useState<[Dayjs, Dayjs]>([
    dayjs(param.begin_time),
    dayjs(param.end_time),
  ])

  const getHms = useCallback((currentParam: HmsQueryBody, page: number, pageSize: number) => {
    setLoading(true)
    getDeviceHms(currentParam, workspaceId, { page, page_size: pageSize, total: 0 })
      .then((res) => {
        setPagination((prev) => ({
          ...prev,
          total: res.data.pagination.total,
          current: res.data.pagination.page,
        }))
        const list = res.data.list as DeviceHms[]
        list.forEach((hms: any) => {
          hms.domain = hms.sn === currentParam.children_sn ? EDeviceTypeName.Aircraft : EDeviceTypeName.Dock
        })
        setHmsData(list)
      })
      .finally(() => setLoading(false))
  }, [workspaceId])

  useEffect(() => {
    if (visible && device) {
      let newParam = { ...param }
      if ((device as any).domain === EDeviceTypeName.Dock) {
        newParam = {
          ...newParam,
          device_sn: device.device_sn,
          children_sn: device.children?.[0]?.device_sn ?? '',
          sns: [device.device_sn, device.children?.[0]?.device_sn ?? ''],
        }
      } else {
        newParam = {
          ...newParam,
          device_sn: '',
          children_sn: device.device_sn,
          domain: EDeviceTypeName.Aircraft,
          sns: ['', device.device_sn],
        }
      }
      setParam(newParam)
      getHms(newParam, 1, pagination.pageSize)
    }
  }, [visible, device])

  const onTimeChange = (dates: [Dayjs, Dayjs] | null) => {
    if (!dates) return
    setTimeRange(dates)
    const newParam = { ...param, begin_time: dates[0].valueOf(), end_time: dates[1].valueOf() }
    setParam(newParam)
    getHms(newParam, pagination.current, pagination.pageSize)
  }

  const onLevelSelect = (val: any) => {
    const newParam = { ...param, level: val }
    setParam(newParam)
    getHms(newParam, pagination.current, pagination.pageSize)
  }

  const onDeviceTypeSelect = (val: number) => {
    const newParam = { ...param, domain: val }
    newParam.sns = [param.device_sn, param.children_sn]
    if (val === EDeviceTypeName.Dock) {
      newParam.sns = [param.device_sn, '']
    }
    if (val === EDeviceTypeName.Aircraft) {
      newParam.sns = ['', param.children_sn]
    }
    setParam(newParam)
    getHms(newParam, pagination.current, pagination.pageSize)
  }

  const onSearch = (searchMsg: string) => {
    const newParam = { ...param, message: searchMsg }
    setParam(newParam)
    getHms(newParam, pagination.current, pagination.pageSize)
  }

  const rowClassName = (_record: any, index: number) => {
    return (index & 1) === 0 ? 'table-striped' : ''
  }

  const hmsColumns = [
    {
      title: 'Alarm Begin | End Time',
      dataIndex: 'create_time',
      width: '25%',
      render: (_: any, record: any) => (
        <div>
          <div>{record.create_time}</div>
          <div style={
            record.update_time ? {} :
            record.level === EHmsLevel.CAUTION ? { color: 'orange' } :
            record.level === EHmsLevel.WARN ? { color: 'red' } :
            { color: '#28d445' }
          }>
            {record.update_time ?? 'It is happening...'}
          </div>
        </div>
      ),
    },
    {
      title: 'Level',
      dataIndex: 'level',
      width: '120px',
      render: (text: number) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            backgroundColor: text === EHmsLevel.CAUTION ? 'orange' : text === EHmsLevel.WARN ? 'red' : '#28d445',
          }} />
          <div style={{ marginLeft: 3 }}>{EHmsLevel[text]}</div>
        </div>
      ),
    },
    {
      title: 'Device',
      dataIndex: 'domain',
      width: '12%',
      render: (text: number) => (
        <Tooltip title={EDeviceTypeName[text]}>
          <div>{EDeviceTypeName[text]}</div>
        </Tooltip>
      ),
    },
    {
      title: 'Error Code',
      dataIndex: 'key',
      width: '20%',
      ellipsis: true,
      render: (text: string) => <Tooltip title={text}><div>{text}</div></Tooltip>,
    },
    {
      title: 'Hms Message (EN)',
      dataIndex: 'message_en',
      ellipsis: true,
      render: (text: string) => <Tooltip title={text}><div>{text}</div></Tooltip>,
    },
    {
      title: 'Hms Message (ZH)',
      dataIndex: 'message_zh',
      ellipsis: true,
      render: (text: string) => <Tooltip title={text}><div>{text}</div></Tooltip>,
    },
  ]

  return (
    <Drawer
      title="Hms Info"
      placement="right"
      open={visible}
      onClose={() => onVisibleChange(false)}
      destroyOnClose
      width={800}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ width: 240 }}>
          <RangePicker
            value={timeRange}
            format="YYYY-MM-DD"
            placeholder={['Start Time', 'End Time']}
            onChange={onTimeChange as any}
          />
        </div>
        <div style={{ marginLeft: 5 }}>
          <Select
            style={{ width: 150 }}
            value={param.level}
            onChange={onLevelSelect}
            options={levels}
          />
        </div>
        <div style={{ marginLeft: 5 }}>
          <Select
            style={{ width: 150 }}
            value={param.domain}
            disabled={!param.children_sn && !param.device_sn}
            onChange={onDeviceTypeSelect}
            options={deviceTypes}
          />
        </div>
        <div style={{ marginLeft: 5 }}>
          <Input.Search
            placeholder="input search message"
            style={{ width: 200 }}
            onSearch={onSearch}
          />
        </div>
      </div>
      <Table
        columns={hmsColumns}
        dataSource={hmsData}
        pagination={pagination}
        onChange={(p) => {
          setPagination((prev) => ({ ...prev, current: p.current || 1, pageSize: p.pageSize || 50 }))
          getHms(param, p.current || 1, p.pageSize || 50)
        }}
        rowKey="hms_id"
        rowClassName={rowClassName}
        loading={loading}
        scroll={{ x: '100%', y: 600 }}
      />
    </Drawer>
  )
}

export default DeviceHmsDrawer
