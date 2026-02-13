import { useEffect, useState, useCallback } from 'react'
import { Table, Input, Tooltip, message } from 'antd'
import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons'
import { getAllUsersInfo, updateUserInfo } from '@/api/manage'
import { ELocalStorageKey } from '@/types'

interface Member {
  user_id: string
  username: string
  user_type: string
  workspace_name: string
  create_time: string
  mqtt_username: string
  mqtt_password: string
}

function MembersPage() {
  const workspaceId = localStorage.getItem(ELocalStorageKey.WorkspaceId)!
  const [members, setMembers] = useState<Member[]>([])
  const [editableData, setEditableData] = useState<Record<string, Member>>({})
  const [pagination, setPagination] = useState({
    pageSizeOptions: ['20', '50', '100'],
    showQuickJumper: true,
    showSizeChanger: true,
    pageSize: 50,
    current: 1,
    total: 0,
  })

  const getAllUsers = useCallback((page: number, pageSize: number) => {
    getAllUsersInfo(workspaceId, { page, page_size: pageSize, total: 0 }).then((res) => {
      if (res.code !== 0) return
      setMembers(res.data.list)
      setPagination((prev) => ({
        ...prev,
        total: res.data.pagination.total,
        current: res.data.pagination.page,
      }))
    })
  }, [workspaceId])

  useEffect(() => {
    getAllUsers(pagination.current, pagination.pageSize)
  }, [])

  const edit = (record: Member) => {
    setEditableData((prev) => ({ ...prev, [record.user_id]: { ...record } }))
  }

  const save = async (record: Member) => {
    const editedRecord = editableData[record.user_id]
    if (!editedRecord) return
    const res = await updateUserInfo(workspaceId, record.user_id, editedRecord)
    if (res.code !== 0) {
      message.error(res.message)
    } else {
      setMembers((prev) =>
        prev.map((m) => (m.user_id === record.user_id ? editedRecord : m))
      )
      setEditableData((prev) => {
        const newData = { ...prev }
        delete newData[record.user_id]
        return newData
      })
    }
  }

  const cancel = (userId: string) => {
    setEditableData((prev) => {
      const newData = { ...prev }
      delete newData[userId]
      return newData
    })
  }

  const columns = [
    {
      title: 'Account',
      dataIndex: 'username',
      width: 150,
      sorter: (a: Member, b: Member) => a.username.localeCompare(b.username),
    },
    { title: 'User Type', dataIndex: 'user_type', width: 150 },
    { title: 'Workspace Name', dataIndex: 'workspace_name', width: 150 },
    {
      title: 'Mqtt Username',
      dataIndex: 'mqtt_username',
      width: 150,
      render: (text: string, record: Member) =>
        editableData[record.user_id] ? (
          <Input
            value={editableData[record.user_id].mqtt_username}
            onChange={(e) =>
              setEditableData((prev) => ({
                ...prev,
                [record.user_id]: { ...prev[record.user_id], mqtt_username: e.target.value },
              }))
            }
            style={{ margin: '-5px 0' }}
          />
        ) : (
          text
        ),
    },
    {
      title: 'Mqtt Password',
      dataIndex: 'mqtt_password',
      width: 150,
      render: (text: string, record: Member) =>
        editableData[record.user_id] ? (
          <Input
            value={editableData[record.user_id].mqtt_password}
            onChange={(e) =>
              setEditableData((prev) => ({
                ...prev,
                [record.user_id]: { ...prev[record.user_id], mqtt_password: e.target.value },
              }))
            }
            style={{ margin: '-5px 0' }}
          />
        ) : (
          text
        ),
    },
    {
      title: 'Joined',
      dataIndex: 'create_time',
      width: 150,
      sorter: (a: Member, b: Member) => a.create_time.localeCompare(b.create_time),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 100,
      render: (_: any, record: Member) => {
        const editable = editableData[record.user_id]
        return editable ? (
          <span>
            <Tooltip title="Confirm changes">
              <span onClick={() => save(record)} style={{ color: '#28d445', cursor: 'pointer' }}>
                <CheckOutlined />
              </span>
            </Tooltip>
            <Tooltip title="Modification canceled">
              <span
                onClick={() => cancel(record.user_id)}
                style={{ color: '#e70102', marginLeft: 15, cursor: 'pointer' }}
              >
                <CloseOutlined />
              </span>
            </Tooltip>
          </span>
        ) : (
          <span style={{ fontSize: 18, color: '#2d8cf0', cursor: 'pointer' }}>
            <EditOutlined onClick={() => edit(record)} />
          </span>
        )
      },
    },
  ]

  return (
    <div style={{ backgroundColor: 'white', margin: 20, padding: 20, height: '88vh' }}>
      <Table
        columns={columns}
        dataSource={members}
        pagination={pagination}
        onChange={(p) => {
          setPagination((prev) => ({ ...prev, current: p.current || 1, pageSize: p.pageSize || 50 }))
          getAllUsers(p.current || 1, p.pageSize || 50)
        }}
        rowKey="user_id"
        rowClassName={(_, index) => ((index % 2) === 0 ? 'table-striped' : '')}
        scroll={{ x: '100%', y: 600 }}
      />
    </div>
  )
}

export default MembersPage
