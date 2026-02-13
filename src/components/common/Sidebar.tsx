import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Tooltip } from 'antd'
import {
  TeamOutlined,
  VideoCameraOutlined,
  EnvironmentOutlined,
  PictureOutlined,
  NodeIndexOutlined,
  CalendarOutlined,
  GroupOutlined,
  ImportOutlined,
} from '@ant-design/icons'
import { ERouterName } from '@/types'

const iconMap: Record<string, React.ReactNode> = {
  TeamOutlined: <TeamOutlined style={{ fontSize: 20 }} />,
  VideoCameraOutlined: <VideoCameraOutlined style={{ fontSize: 20 }} />,
  EnvironmentOutlined: <EnvironmentOutlined style={{ fontSize: 20 }} />,
  PictureOutlined: <PictureOutlined style={{ fontSize: 20 }} />,
  NodeIndexOutlined: <NodeIndexOutlined style={{ fontSize: 20 }} />,
  CalendarOutlined: <CalendarOutlined style={{ fontSize: 20 }} />,
  GroupOutlined: <GroupOutlined style={{ fontSize: 20 }} />,
}

const options = [
  { key: 0, label: 'Tsa', path: '/' + ERouterName.WORKSPACE + '/' + ERouterName.TSA, icon: 'TeamOutlined' },
  { key: 1, label: 'Livestream', path: '/' + ERouterName.WORKSPACE + '/' + ERouterName.LIVESTREAM, icon: 'VideoCameraOutlined' },
  { key: 2, label: 'Annotations', path: '/' + ERouterName.WORKSPACE + '/' + ERouterName.LAYER, icon: 'EnvironmentOutlined' },
  { key: 3, label: 'Media Files', path: '/' + ERouterName.WORKSPACE + '/' + ERouterName.MEDIA, icon: 'PictureOutlined' },
  { key: 4, label: 'Flight Route Library', path: '/' + ERouterName.WORKSPACE + '/' + ERouterName.WAYLINE, icon: 'NodeIndexOutlined' },
  { key: 5, label: 'Task Plan Library', path: '/' + ERouterName.WORKSPACE + '/' + ERouterName.TASK, icon: 'CalendarOutlined' },
  { key: 6, label: 'Flight Area', path: '/' + ERouterName.WORKSPACE + '/' + ERouterName.FLIGHT_AREA, icon: 'GroupOutlined' },
]

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  const isSelected = (path: string) => {
    return location.pathname.indexOf(path) === 0
  }

  const goHome = () => {
    navigate('/' + ERouterName.HOME + '/' + ERouterName.MEMBERS)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: 50,
        borderRight: '1px solid #4f4f4f',
        color: '#fff',
        overflow: 'hidden',
      }}
    >
      <div>
        {options.map((item) => (
          <Link
            key={item.key}
            to={item.path}
            style={{
              width: '100%',
              padding: '16px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: isSelected(item.path) ? '#2d8cf0' : '#fff',
              backgroundColor: isSelected(item.path) ? '#101010' : 'transparent',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            <Tooltip title={item.label} placement="right">
              <span style={{ width: 50, display: 'flex', justifyContent: 'center' }}>
                {iconMap[item.icon]}
              </span>
            </Tooltip>
          </Link>
        ))}
      </div>
      <div className="mb20 flex-display flex-column flex-align-center flex-justify-between">
        <Tooltip title="Back to home" placement="right">
          <a onClick={goHome} style={{ cursor: 'pointer' }}>
            <ImportOutlined style={{ fontSize: 22, color: 'white' }} />
          </a>
        </Tooltip>
      </div>
    </div>
  )
}

export default Sidebar
