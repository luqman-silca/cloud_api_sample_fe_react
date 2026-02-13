import { Link, Outlet, useLocation } from 'react-router-dom'
import { Row, Col } from 'antd'
import { PlusOutlined, MinusOutlined } from '@ant-design/icons'
import { ERouterName } from '@/types'

function TaskPage() {
  const location = useLocation()
  const isTaskRoute = location.pathname === '/' + ERouterName.WORKSPACE + '/' + ERouterName.TASK

  return (
    <div>
      <div style={{ height: 50, lineHeight: '50px', borderBottom: '1px solid #4f4f4f', fontWeight: 450 }}>
        <Row>
          <Col span={1} />
          <Col span={20}>Task Plan Library</Col>
          <Col span={2}>
            {isTaskRoute ? (
              <Link to={ERouterName.CREATE_PLAN}>
                <PlusOutlined style={{ color: '#fff', fontSize: 16 }} />
              </Link>
            ) : (
              <Link to="..">
                <MinusOutlined style={{ color: '#fff', fontSize: 16 }} />
              </Link>
            )}
          </Col>
          <Col span={1} />
        </Row>
      </div>
      {!isTaskRoute && (
        <div>
          <Outlet />
        </div>
      )}
    </div>
  )
}

export default TaskPage
