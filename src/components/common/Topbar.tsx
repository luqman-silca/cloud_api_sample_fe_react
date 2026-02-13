import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Avatar, Space, Dropdown, Menu } from 'antd'
import { UserOutlined, ExportOutlined } from '@ant-design/icons'
import { getPlatformInfo } from '@/api/manage'
import { ELocalStorageKey, ERouterName } from '@/types'
import cloudapi from '@/assets/icons/cloudapi.png'

const options = [
  { key: 0, label: 'Workspace', path: '/' + ERouterName.WORKSPACE },
  { key: 1, label: 'Members', path: '/' + ERouterName.HOME + '/' + ERouterName.MEMBERS },
  { key: 2, label: 'Devices', path: '/' + ERouterName.HOME + '/' + ERouterName.DEVICES },
  { key: 3, label: 'Firmwares', path: '/' + ERouterName.HOME + '/' + ERouterName.FIRMWARES },
]

function Topbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selected, setSelected] = useState(location.pathname)
  const [username] = useState(localStorage.getItem(ELocalStorageKey.Username) || '')
  const [workspaceName, setWorkspaceName] = useState('')

  useEffect(() => {
    getPlatformInfo().then((res: any) => {
      if (res?.data?.workspace_name) {
        setWorkspaceName(res.data.workspace_name)
      }
    })
  }, [])

  useEffect(() => {
    setSelected(location.pathname)
  }, [location.pathname])

  const logout = () => {
    localStorage.clear()
    navigate('/' + ERouterName.PROJECT)
  }

  const menuItems = [
    {
      key: 'logout',
      label: (
        <span onClick={logout}>
          <ExportOutlined style={{ marginRight: 10, fontSize: 16 }} />
          Log Out
        </span>
      ),
    },
  ]

  return (
    <div
      className="width-100 flex-row flex-justify-between flex-align-center"
      style={{ height: 60 }}
    >
      <div style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
        <Avatar size={40} shape="square" src={cloudapi} />
        <span className="ml10" style={{ fontWeight: 500, fontSize: 18 }}>
          {workspaceName}
        </span>
      </div>

      <Space className="fz16" size="large" style={{ height: '100%' }}>
        {options.map((item) => (
          <Link
            key={item.key}
            to={item.path}
            onClick={() => setSelected(item.path)}
            style={{
              color: selected === item.path ? '#2d8cf0' : 'white',
              textDecoration: 'none',
            }}
          >
            {item.label}
          </Link>
        ))}
      </Space>

      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                border: '2px solid white',
                borderRadius: '50%',
                display: 'inline-flex',
                padding: 2,
              }}
            >
              <UserOutlined style={{ fontSize: 16 }} />
            </span>
            <span className="ml10 mr10">{username}</span>
          </div>
        </Dropdown>
      </div>
    </div>
  )
}

export default Topbar
