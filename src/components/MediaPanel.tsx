import { useEffect, useState } from 'react'
import { Table, Tooltip, Spin } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { ELocalStorageKey } from '@/types'
import { downloadFile } from '@/utils/common'
import { downloadMediaFile, getMediaFiles } from '@/api/media'
import { IPage } from '@/api/http/type'

interface MediaFile {
  fingerprint: string
  drone: string
  payload: string
  is_original: string
  file_name: string
  file_path: string
  create_time: string
  file_id: string
}

function MediaPanel() {
  const workspaceId = localStorage.getItem(ELocalStorageKey.WorkspaceId)!
  const [loading, setLoading] = useState(false)
  const [mediaData, setMediaData] = useState<MediaFile[]>([])
  const [pagination, setPagination] = useState({
    pageSizeOptions: ['20', '50', '100'],
    showQuickJumper: true,
    showSizeChanger: true,
    pageSize: 50,
    current: 1,
    total: 0,
  })

  const columns: TableProps<MediaFile>['columns'] = [
    {
      title: 'File Name',
      dataIndex: 'file_name',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <a>{text}</a>
        </Tooltip>
      ),
    },
    {
      title: 'File Path',
      dataIndex: 'file_path',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Drone',
      dataIndex: 'drone',
    },
    {
      title: 'Payload Type',
      dataIndex: 'payload',
    },
    {
      title: 'Original',
      dataIndex: 'is_original',
    },
    {
      title: 'Created',
      dataIndex: 'create_time',
    },
    {
      title: 'Action',
      render: (_: any, record: MediaFile) => (
        <Tooltip title="download">
          <a style={{ fontSize: 18 }} onClick={() => downloadMedia(record)}>
            <DownloadOutlined />
          </a>
        </Tooltip>
      ),
    },
  ]

  useEffect(() => {
    getFiles(1, pagination.pageSize)
  }, [])

  const getFiles = (page: number, pageSize: number) => {
    const body: IPage = {
      page,
      total: 0,
      page_size: pageSize,
    }
    getMediaFiles(workspaceId, body).then((res) => {
      setMediaData(res.data.list)
      setPagination((prev) => ({
        ...prev,
        total: res.data.pagination.total,
        current: res.data.pagination.page,
      }))
    })
  }

  const handleTableChange: TableProps<MediaFile>['onChange'] = (newPagination) => {
    const page = newPagination.current || 1
    const pageSize = newPagination.pageSize || 50
    setPagination((prev) => ({
      ...prev,
      current: page,
      pageSize,
    }))
    getFiles(page, pageSize)
  }

  const downloadMedia = (media: MediaFile) => {
    setLoading(true)
    downloadMediaFile(workspaceId, media.file_id)
      .then((res) => {
        if (!res) {
          return
        }
        const data = new Blob([res])
        downloadFile(data, media.file_name)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <>
      <div
        style={{
          width: '100%',
          height: 60,
          background: '#fff',
          padding: 16,
          fontSize: 20,
          fontWeight: 'bold',
          textAlign: 'start',
          color: '#000',
        }}
      >
        Media Files
      </div>
      <Spin spinning={loading} delay={1000} tip="downloading" size="large">
        <div style={{ width: '100%', padding: 16 }}>
          <Table
            columns={columns}
            dataSource={mediaData}
            rowKey="fingerprint"
            pagination={pagination}
            scroll={{ x: '100%', y: 600 }}
            onChange={handleTableChange}
            style={{ background: '#fff', marginTop: 10 }}
          />
        </div>
      </Spin>
    </>
  )
}

export default MediaPanel
