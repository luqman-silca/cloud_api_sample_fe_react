import { useCallback, useEffect, useRef, useState } from 'react'
import { Row, Col, Tooltip, Dropdown, Modal, Spin, Empty, Upload, Button, message } from 'antd'
import {
  EllipsisOutlined,
  RocketOutlined,
  CameraFilled,
  UserOutlined,
  SelectOutlined,
} from '@ant-design/icons'
import { ELocalStorageKey } from '@/types'
import { DEVICE_NAME } from '@/types/device'
import { WaylineFile } from '@/types/wayline'
import { useWaylineStore } from '@/store/useWaylineStore'
import { getWaylineFiles, deleteWaylineFile, downloadWaylineFile, importKmzFile } from '@/api/wayline'
import { downloadFile } from '@/utils/common'
import { IPage } from '@/api/http/type'

function WaylinePage() {
  const workspaceId = localStorage.getItem(ELocalStorageKey.WorkspaceId)!
  const [waylinesData, setWaylinesData] = useState<WaylineFile[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteTip, setDeleteTip] = useState(false)
  const [deleteWaylineId, setDeleteWaylineId] = useState('')
  const [height, setHeight] = useState(0)
  const setSelectWaylineInfo = useWaylineStore((s) => s.setSelectWaylineInfo)
  const canRefreshRef = useRef(true)
  const paginationRef = useRef<IPage>({ page: 1, total: -1, page_size: 10 })
  const dataRef = useRef<WaylineFile[]>([])

  const getWaylines = useCallback(() => {
    if (!canRefreshRef.current) return
    canRefreshRef.current = false
    const p = paginationRef.current
    getWaylineFiles(workspaceId, {
      page: p.page,
      page_size: p.page_size,
      order_by: 'update_time desc',
    })
      .then((res) => {
        if (res.code !== 0) return
        const newData = [...dataRef.current, ...res.data.list]
        dataRef.current = newData
        setWaylinesData(newData)
        paginationRef.current.total = res.data.pagination.total
        paginationRef.current.page = res.data.pagination.page
      })
      .finally(() => {
        canRefreshRef.current = true
      })
  }, [workspaceId])

  useEffect(() => {
    const parent = document.querySelector('.project-wayline-wrapper .scrollbar')?.parentNode as HTMLDivElement
    if (parent) {
      setHeight(document.body.clientHeight - (parent.firstElementChild?.clientHeight || 0))
    }
    getWaylines()

    const key = setInterval(() => {
      const dataEl = document.getElementById('wayline-data')?.lastElementChild as HTMLDivElement
      const p = paginationRef.current
      if (p.total === 0 || Math.ceil(p.total / p.page_size) <= p.page || (height && dataEl && height <= dataEl.clientHeight + dataEl.offsetTop)) {
        clearInterval(key)
        return
      }
      paginationRef.current.page++
      getWaylines()
    }, 1000)

    return () => clearInterval(key)
  }, [getWaylines])

  const showWaylineTip = (waylineId: string) => {
    setDeleteWaylineId(waylineId)
    setDeleteTip(true)
  }

  const deleteWayline = () => {
    deleteWaylineFile(workspaceId, deleteWaylineId).then((res) => {
      if (res.code === 0) {
        message.success('Wayline file deleted')
      }
      setDeleteWaylineId('')
      setDeleteTip(false)
      paginationRef.current = { page: 1, total: 0, page_size: 10 }
      dataRef.current = []
      setWaylinesData([])
      getWaylines()
    })
  }

  const handleDownloadWayline = (waylineId: string, fileName: string) => {
    setLoading(true)
    downloadWaylineFile(workspaceId, waylineId)
      .then((res) => {
        if (!res) return
        const data = new Blob([res], { type: 'application/zip' })
        downloadFile(data, fileName + '.kmz')
      })
      .finally(() => setLoading(false))
  }

  const selectRoute = (wayline: WaylineFile) => {
    setSelectWaylineInfo(wayline)
  }

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const p = paginationRef.current
    if (
      element.scrollTop + element.clientHeight >= element.scrollHeight - 5 &&
      Math.ceil(p.total / p.page_size) > p.page &&
      canRefreshRef.current
    ) {
      paginationRef.current.page++
      getWaylines()
    }
  }

  const uploadFile = async (options: any) => {
    setLoading(true)
    const fileData = new FormData()
    fileData.append('file', options.file, options.file.name)
    importKmzFile(workspaceId, fileData)
      .then((res) => {
        if (res.code === 0) {
          message.success(`${options.file.name} file uploaded successfully`)
          canRefreshRef.current = true
          paginationRef.current = { page: 1, total: 0, page_size: 10 }
          dataRef.current = []
          setWaylinesData([])
          getWaylines()
        }
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className="project-wayline-wrapper" style={{ height: '100%' }}>
      <Spin spinning={loading} delay={300} tip="downloading" size="large">
        <div style={{ height: 50, lineHeight: '50px', borderBottom: '1px solid #4f4f4f', fontWeight: 450 }}>
          <Row>
            <Col span={1} />
            <Col span={15}>Flight Route Library</Col>
            <Col span={8} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Upload
                name="file"
                multiple={false}
                beforeUpload={() => true}
                showUploadList={false}
                customRequest={uploadFile}
              >
                <Button type="text" style={{ color: 'white' }}>
                  <SelectOutlined />
                </Button>
              </Upload>
            </Col>
          </Row>
        </div>
        <div className="scrollbar" style={{ height: height || 'calc(100% - 50px)', overflow: 'auto' }}>
          {waylinesData.length !== 0 ? (
            <div id="wayline-data" className="uranus-scrollbar" style={{ height: '100%', overflow: 'auto' }} onScroll={onScroll}>
              {waylinesData.map((wayline) => (
                <div key={wayline.id}>
                  <div
                    style={{
                      background: '#3c3c3c',
                      marginLeft: 'auto',
                      marginRight: 'auto',
                      marginTop: 10,
                      height: 90,
                      width: '95%',
                      fontSize: 13,
                      borderRadius: 2,
                      cursor: 'pointer',
                      paddingTop: 5,
                    }}
                    onClick={() => selectRoute(wayline)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', height: 30, fontWeight: 'bold', margin: '0 10px' }}>
                      <Tooltip title={wayline.name}>
                        <div style={{ width: 120, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', paddingRight: 10 }}>
                          {wayline.name}
                        </div>
                      </Tooltip>
                      <div style={{ marginLeft: 10 }}><UserOutlined /></div>
                      <Tooltip title={wayline.user_name}>
                        <div style={{ marginLeft: 5, width: 80, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', paddingRight: 10 }}>
                          {wayline.user_name}
                        </div>
                      </Tooltip>
                      <div style={{ fontSize: 20 }}>
                        <Dropdown
                          menu={{
                            items: [
                              { key: 'download', label: 'Download', onClick: () => handleDownloadWayline(wayline.id, wayline.name) },
                              { key: 'delete', label: 'Delete', onClick: () => showWaylineTip(wayline.id) },
                            ],
                            style: { background: '#3c3c3c' },
                            theme: 'dark',
                          }}
                        >
                          <a style={{ color: 'white' }}><EllipsisOutlined /></a>
                        </Dropdown>
                      </div>
                    </div>
                    <div style={{ marginLeft: 10, marginTop: 5, color: 'hsla(0,0%,100%,0.65)' }}>
                      <span><RocketOutlined /></span>
                      <span style={{ marginLeft: 5 }}>{DEVICE_NAME[wayline.drone_model_key]}</span>
                      <span style={{ marginLeft: 10 }}><CameraFilled style={{ borderTop: '1px solid', paddingTop: -3 }} /></span>
                      {wayline.payload_model_keys?.map((payload: string) => (
                        <span key={payload} style={{ marginLeft: 5 }}>{DEVICE_NAME[payload]}</span>
                      ))}
                    </div>
                    <div style={{ marginTop: 5, marginLeft: 10, color: 'hsla(0,0%,100%,0.35)' }}>
                      <span style={{ marginRight: 10 }}>Update at {new Date(wayline.update_time).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty imageStyle={{ height: 60, marginTop: 60 }} />
          )}
          <Modal
            open={deleteTip}
            width={450}
            closable={false}
            centered
            okButtonProps={{ danger: true }}
            onOk={deleteWayline}
            onCancel={() => setDeleteTip(false)}
            title={<div style={{ display: 'flex', justifyContent: 'center' }}>Delete</div>}
          >
            <p style={{ paddingTop: 10, paddingLeft: 20, height: 50 }}>
              Wayline file is unrecoverable once deleted. Continue?
            </p>
          </Modal>
        </div>
      </Spin>
    </div>
  )
}

export default WaylinePage
