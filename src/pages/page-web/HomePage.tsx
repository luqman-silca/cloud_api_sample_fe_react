import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Layout } from 'antd'
import Topbar from '@/components/common/Topbar'
import { ELocalStorageKey, ERouterName } from '@/types'

const { Header, Content } = Layout

function HomePage() {
  const navigate = useNavigate()

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem(ELocalStorageKey.Token)
    if (!token) {
      navigate('/' + ERouterName.PROJECT)
    }
  }, [navigate])

  return (
    <Layout className="width-100 flex-display" style={{ height: '100vh' }}>
      <Header
        style={{
          backgroundColor: 'black',
          color: 'white',
          height: 60,
          fontSize: 15,
          padding: '0 20px',
          lineHeight: '60px',
        }}
      >
        <Topbar />
      </Header>
      <Content>
        <Outlet />
      </Content>
    </Layout>
  )
}

export default HomePage
