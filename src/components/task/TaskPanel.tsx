import { useCallback, useEffect, useState } from 'react'
import { Table, Button, Popconfirm, Progress, Tooltip, message } from 'antd'
import { ExclamationCircleOutlined, UploadOutlined } from '@ant-design/icons'
import { ELocalStorageKey } from '@/types'
import { IPage } from '@/api/http/type'
import { deleteTask, updateTaskStatus, UpdateTaskStatus, getWaylineJobs, Task, uploadMediaFileNow } from '@/api/wayline'
import { useFormatTask } from './useFormatTask'
import { useTaskWsEvent } from './useTaskWsEvent'
import { TaskStatus, TaskProgressInfo, TaskProgressStatus, TaskProgressWsStatusMap, MediaStatus, MediaStatusProgressInfo, TaskMediaHighestPriorityProgressInfo } from '@/types/task'
import { getErrorMessage } from '@/utils/error-code/index'
import { commonColor } from '@/utils/color'

function TaskPanel() {
  const workspaceId = localStorage.getItem(ELocalStorageKey.WorkspaceId)!
  const [plansData, setPlansData] = useState<Task[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
    pageSizeOptions: ['20', '50', '100'],
    showQuickJumper: true,
    showSizeChanger: true,
  })
  const bodyRef = { page: 1, total: 0, page_size: 50 } as IPage

  const { formatTaskType, formatTaskTime, formatLostAction, formatTaskStatus, formatMediaTaskStatus } = useFormatTask()

  const getPlans = useCallback(() => {
    getWaylineJobs(workspaceId, { page: pagination.current, page_size: pagination.pageSize, total: 0 }).then((res) => {
      if (res.code !== 0) return
      setPlansData(res.data.list)
      setPagination((prev) => ({
        ...prev,
        total: res.data.pagination.total,
        current: res.data.pagination.page,
      }))
    })
  }, [workspaceId, pagination.current, pagination.pageSize])

  useEffect(() => {
    getPlans()
  }, [getPlans])

  const onTaskProgressWs = useCallback((data: TaskProgressInfo) => {
    const { bid, output } = data
    if (!output) return
    const { status, progress } = output
    setPlansData((prev) => {
      const newData = [...prev]
      const taskItem = newData.find((task) => task.job_id === bid)
      if (!taskItem) return prev
      if (status) {
        taskItem.status = TaskProgressWsStatusMap[status]
        if (status === TaskProgressStatus.Sent || status === TaskProgressStatus.inProgress) {
          taskItem.progress = progress?.percent || 0
        } else if ([TaskProgressStatus.Rejected, TaskProgressStatus.Canceled, TaskProgressStatus.Timeout, TaskProgressStatus.Failed, TaskProgressStatus.OK].includes(status)) {
          getPlans()
        }
      }
      return newData
    })
  }, [getPlans])

  const onTaskMediaProgressWs = useCallback((data: MediaStatusProgressInfo) => {
    const { media_count, uploaded_count, job_id } = data
    if (isNaN(media_count) || isNaN(uploaded_count) || !job_id) return
    setPlansData((prev) => {
      const newData = [...prev]
      const taskItem = newData.find((task) => task.job_id === job_id)
      if (!taskItem) return prev
      taskItem.uploading = media_count !== uploaded_count
      taskItem.media_count = media_count
      taskItem.uploaded_count = uploaded_count
      return newData
    })
  }, [])

  const onTaskMediaHighestPriorityWs = useCallback((data: TaskMediaHighestPriorityProgressInfo) => {
    const { pre_job_id, job_id } = data
    setPlansData((prev) => {
      const newData = [...prev]
      const preTaskItem = newData.find((task) => task.job_id === pre_job_id)
      const taskItem = newData.find((task) => task.job_id === job_id)
      if (preTaskItem) preTaskItem.uploading = false
      if (taskItem) taskItem.uploading = true
      return newData
    })
  }, [])

  useTaskWsEvent({ onTaskProgressWs, onTaskMediaProgressWs, onTaskMediaHighestPriorityWs })

  const onDeleteTask = async (jobId: string) => {
    const { code } = await deleteTask(workspaceId, { job_id: jobId })
    if (code === 0) {
      message.success('Deleted successfully')
      getPlans()
    }
  }

  const onSuspendTask = async (jobId: string) => {
    const { code } = await updateTaskStatus(workspaceId, { job_id: jobId, status: UpdateTaskStatus.Suspend })
    if (code === 0) {
      message.success('Suspended successfully')
      getPlans()
    }
  }

  const onResumeTask = async (jobId: string) => {
    const { code } = await updateTaskStatus(workspaceId, { job_id: jobId, status: UpdateTaskStatus.Resume })
    if (code === 0) {
      message.success('Resumed successfully')
      getPlans()
    }
  }

  const onUploadMediaFileNow = async (jobId: string) => {
    const { code } = await uploadMediaFileNow(workspaceId, jobId)
    if (code === 0) {
      message.success('Upload Media File successfully')
      getPlans()
    }
  }

  const getCodeMessage = (code: number) => {
    return getErrorMessage(code) + ` (code: ${code})`
  }

  const columns = [
    {
      title: 'Planned/Actual Time',
      dataIndex: 'duration',
      width: 200,
      render: (_: any, record: Task) => (
        <div style={{ display: 'flex', whiteSpace: 'pre-wrap' }}>
          <div>
            <div>{formatTaskTime(record.begin_time)}</div>
            <div>{formatTaskTime(record.end_time)}</div>
          </div>
          <div style={{ marginLeft: 10 }}>
            <div>{formatTaskTime(record.execute_time)}</div>
            <div>{formatTaskTime(record.completed_time)}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 150,
      render: (_: any, record: Task) => {
        const status = formatTaskStatus(record)
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ display: 'inline-block', width: 12, height: 12, marginRight: 3, borderRadius: '50%', backgroundColor: status.color, flexShrink: 0 }} />
              {status.text}
              {!!record.code && (
                <Tooltip title={getCodeMessage(record.code)} placement="bottom">
                  <ExclamationCircleOutlined style={{ color: commonColor.WARN, fontSize: 16, marginLeft: 5 }} />
                </Tooltip>
              )}
            </div>
            {record.status === TaskStatus.Carrying && (
              <Progress percent={record.progress || 0} />
            )}
          </div>
        )
      },
    },
    { title: 'Plan Name', dataIndex: 'job_name', width: 100 },
    {
      title: 'Type',
      width: 100,
      render: (_: any, record: Task) => formatTaskType(record),
    },
    { title: 'Flight Route Name', dataIndex: 'file_name', width: 100 },
    { title: 'Dock Name', dataIndex: 'dock_name', width: 100, ellipsis: true },
    { title: 'RTH Altitude (m)', dataIndex: 'rth_altitude', width: 120 },
    {
      title: 'Lost Action',
      width: 120,
      render: (_: any, record: Task) => formatLostAction(record),
    },
    { title: 'Creator', dataIndex: 'username', width: 120 },
    {
      title: 'Media File Upload',
      key: 'media_upload',
      width: 160,
      render: (_: any, record: Task) => {
        const media = formatMediaTaskStatus(record)
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ display: 'inline-block', width: 12, height: 12, marginRight: 3, borderRadius: '50%', backgroundColor: media.color, flexShrink: 0 }} />
              {media.text}
            </div>
            <div style={{ paddingLeft: 15 }}>
              {media.number}
              {media.status === MediaStatus.ToUpload && (
                <Tooltip title="Upload now" placement="bottom">
                  <UploadOutlined style={{ color: commonColor.BLUE, fontSize: 16, marginLeft: 5, cursor: 'pointer' }} onClick={() => onUploadMediaFileNow(record.job_id)} />
                </Tooltip>
              )}
            </div>
          </div>
        )
      },
    },
    {
      title: 'Action',
      width: 120,
      render: (_: any, record: Task) => (
        <div>
          {record.status === TaskStatus.Wait && (
            <Popconfirm title="Are you sure you want to delete flight task?" okText="Yes" cancelText="No" onConfirm={() => onDeleteTask(record.job_id)}>
              <Button type="primary" size="small">Delete</Button>
            </Popconfirm>
          )}
          {record.status === TaskStatus.Carrying && (
            <Popconfirm title="Are you sure you want to suspend?" okText="Yes" cancelText="No" onConfirm={() => onSuspendTask(record.job_id)}>
              <Button type="primary" size="small">Suspend</Button>
            </Popconfirm>
          )}
          {record.status === TaskStatus.Paused && (
            <Popconfirm title="Are you sure you want to resume?" okText="Yes" cancelText="No" onConfirm={() => onResumeTask(record.job_id)}>
              <Button type="primary" size="small">Resume</Button>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ]

  const handleTableChange = (paginationConfig: any) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }))
  }

  return (
    <>
      <div style={{ width: '100%', height: 60, background: '#fff', padding: 16, fontSize: 20, fontWeight: 'bold', textAlign: 'start', color: '#000' }}>
        Task Plan Library
      </div>
      <div style={{ width: '100%', padding: 16 }}>
        <Table
          className="plan-table"
          columns={columns}
          dataSource={plansData}
          rowKey="job_id"
          pagination={pagination}
          scroll={{ x: '100%', y: 600 }}
          onChange={handleTableChange}
          style={{ background: '#fff', marginTop: 10 }}
        />
      </div>
    </>
  )
}

export default TaskPanel
