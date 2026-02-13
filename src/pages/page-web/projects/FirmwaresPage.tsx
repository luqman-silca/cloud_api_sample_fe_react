import { useEffect, useState, useCallback, useRef } from 'react'
import { Table, Button, Select, Input, Modal, Form, Switch, Upload, Tooltip, notification, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import { getFirmwares, importFirmareFile } from '@/api/manage'
import { Firmware, FirmwareQueryParam, FirmwareStatusEnum, DeviceNameEnum } from '@/types/device-firmware'
import DeviceFirmwareStatus from '@/components/devices/DeviceFirmwareStatus'
import { ELocalStorageKey } from '@/types'
import { bytesToSize } from '@/utils/bytes'
import { commonColor } from '@/utils/color'
import dayjs from 'dayjs'

const { TextArea } = Input

function FirmwaresPage() {
  const workspaceId = localStorage.getItem(ELocalStorageKey.WorkspaceId)!
  const [firmwares, setFirmwares] = useState<Firmware[]>([])
  const [pagination, setPagination] = useState({
    pageSizeOptions: ['20', '50', '100'],
    showQuickJumper: true,
    showSizeChanger: true,
    pageSize: 50,
    current: 1,
    total: 0,
  })
  const [param, setParam] = useState<FirmwareQueryParam>({
    product_version: '',
    device_name: '',
    firmware_status: FirmwareStatusEnum.NONE,
  })
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [form] = Form.useForm()

  const deviceNameList = [
    { label: 'All', value: '' },
    ...Object.values(DeviceNameEnum).map((name) => ({ label: name, value: name })),
  ]

  const getAllFirmwares = useCallback((page: number, pageSize: number) => {
    getFirmwares(workspaceId, { page, page_size: pageSize, total: 0 }, param).then((res) => {
      if (res.code !== 0) return
      setFirmwares(res.data.list)
      setPagination((prev) => ({
        ...prev,
        total: res.data.pagination.total,
        current: res.data.pagination.page,
      }))
    })
  }, [workspaceId, param])

  useEffect(() => {
    getAllFirmwares(pagination.current, pagination.pageSize)
  }, [])

  const beforeUpload = (file: UploadFile) => {
    if (!file.name?.endsWith('.zip')) {
      message.error('Format error. Please select zip file.')
      return false
    }
    setFileList([file])
    return false
  }

  const removeFile = () => {
    setFileList([])
  }

  const onCancel = () => {
    form.resetFields()
    setFileList([])
    setUploadModalVisible(false)
  }

  const uploadFile = async () => {
    if (fileList.length === 0) {
      message.error('Please select at least one file.')
      return
    }
    try {
      await form.validateFields()
      const values = form.getFieldsValue()
      const file = fileList[0]
      const fileData = new FormData()
      fileData.append('file', file as any, file.name)
      fileData.append('status', values.status ? 'true' : 'false')
      fileData.append('release_note', values.release_note)
      values.device_name.forEach((name: string) => {
        fileData.append('device_name', name)
      })

      const timestamp = Date.now()
      const uploading = `${file.name || 'uploading'}_${timestamp}`
      notification.open({
        key: uploading,
        message: `Uploading ${dayjs().format()}`,
        description: `[${file.name}] is uploading...`,
        duration: null,
      })

      importFirmareFile(workspaceId, fileData)
        .then((res) => {
          if (res.code === 0) {
            notification.success({
              message: `Uploaded ${dayjs().format()}`,
              description: `[${file.name}] file uploaded successfully. Duration: ${((Date.now() - timestamp) / 1000).toFixed(1)}s`,
              duration: null,
            })
            getAllFirmwares(pagination.current, pagination.pageSize)
          } else {
            notification.error({
              message: `Failed to upload [${file.name}]. Check and try again.`,
              description: `Error message: ${res.message} ${dayjs().format()}`,
              style: { color: commonColor.FAIL },
              duration: null,
            })
          }
        })
        .finally(() => {
          notification.close(uploading)
        })

      setFileList([])
      form.resetFields()
      setUploadModalVisible(false)
    } catch (e) {
      console.log('validate err', e)
    }
  }

  const columns = [
    {
      title: 'Model',
      dataIndex: 'device_name',
      width: 120,
      ellipsis: true,
      render: (names: string[]) => (
        <div>
          {names?.map((name) => <div key={name}>{name}</div>)}
        </div>
      ),
    },
    {
      title: 'File Name',
      dataIndex: 'file_name',
      width: 220,
      ellipsis: true,
      render: (text: string) => <Tooltip title={text}>{text}</Tooltip>,
    },
    { title: 'Firmware Version', dataIndex: 'product_version', width: 180 },
    {
      title: 'File Size',
      dataIndex: 'file_size',
      width: 150,
      render: (size: number) => bytesToSize(size),
    },
    { title: 'Creator', dataIndex: 'username', width: 100 },
    {
      title: 'Release Date',
      dataIndex: 'released_time',
      width: 160,
      sorter: (a: Firmware, b: Firmware) => a.released_time.localeCompare(b.released_time),
    },
    {
      title: 'Release Note',
      dataIndex: 'release_note',
      width: 300,
      ellipsis: true,
      render: (text: string) => <Tooltip title={text}>{text}</Tooltip>,
    },
    {
      title: 'Status',
      dataIndex: 'firmware_status',
      width: 100,
      render: (_: any, record: Firmware) => <DeviceFirmwareStatus firmware={record} />,
    },
  ]

  return (
    <>
      <div style={{ marginLeft: 20, marginTop: 20, marginRight: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button type="primary" onClick={() => setUploadModalVisible(true)}>
          Click to Upload
        </Button>
        <div style={{ display: 'flex' }}>
          <Select
            style={{ width: 150, marginLeft: 5 }}
            value={param.firmware_status}
            onChange={(val) => {
              setParam({ ...param, firmware_status: val })
              getAllFirmwares(pagination.current, pagination.pageSize)
            }}
          >
            {Object.entries(FirmwareStatusEnum).map(([key, value]) => (
              <Select.Option key={value} value={value}>
                {key}
              </Select.Option>
            ))}
          </Select>
          <Select
            style={{ width: 150, marginLeft: 5 }}
            value={param.device_name}
            onChange={(val) => {
              setParam({ ...param, device_name: val })
              getAllFirmwares(pagination.current, pagination.pageSize)
            }}
            options={deviceNameList}
          />
          <Input.Search
            placeholder="input search version"
            style={{ width: 250, marginLeft: 5 }}
            onSearch={(val) => {
              setParam({ ...param, product_version: val })
              getAllFirmwares(pagination.current, pagination.pageSize)
            }}
          />
        </div>
      </div>
      <div style={{ backgroundColor: 'white', margin: 20, padding: 20, height: '88vh' }}>
        <Table
          columns={columns}
          dataSource={firmwares}
          pagination={pagination}
          onChange={(p) => {
            setPagination((prev) => ({ ...prev, current: p.current || 1, pageSize: p.pageSize || 50 }))
            getAllFirmwares(p.current || 1, p.pageSize || 50)
          }}
          rowKey="firmware_id"
          rowClassName={(_, index) => ((index % 2) === 0 ? 'table-striped' : '')}
          scroll={{ x: '100%', y: 600 }}
        />
      </div>

      <Modal
        open={uploadModalVisible}
        title="Import Firmware File"
        closable={false}
        centered
        onCancel={onCancel}
        onOk={uploadFile}
      >
        <Form form={form} labelCol={{ span: 6 }}>
          <Form.Item name="status" label="Available" initialValue={true} required>
            <Switch />
          </Form.Item>
          <Form.Item
            name="device_name"
            label="Device Name"
            required
            rules={[{ required: true, message: 'Please select which models this firmware belongs to.' }]}
          >
            <Select mode="multiple" placeholder="can choose multiple" style={{ width: 220 }}>
              {Object.values(DeviceNameEnum).map((name) => (
                <Select.Option key={name} value={name}>
                  {name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="release_note"
            label="Release Note"
            required
            rules={[{ required: true, message: 'Please input release note.' }]}
          >
            <TextArea showCount maxLength={300} />
          </Form.Item>
          <Form.Item label="File" required>
            <Upload
              multiple={false}
              beforeUpload={beforeUpload}
              showUploadList={true}
              fileList={fileList}
              onRemove={removeFile}
            >
              <Button type="primary">
                <UploadOutlined />
                Import Firmware File
              </Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default FirmwaresPage
