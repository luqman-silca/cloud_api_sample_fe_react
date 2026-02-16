import { useEffect, useState } from 'react'
import { Form, Input, Button, Image, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { login, LoginBody, refreshToken } from '@/api/manage'
import apiPilot from '@/api/pilot-bridge'
import { CURRENT_CONFIG } from '@/api/http/config'
import { EComponentName, ELocalStorageKey, ERouterName, EUserType } from '@/types'
import djiLogo from '@/assets/icons/dji_logo.png'

function PilotLoginPage() {
  const navigate = useNavigate()
  const [isVerified, setIsVerified] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    verifyLicense()
  }, [])

  useEffect(() => {
    if (!isVerified) return

    try {
      apiPilot.setPlatformMessage('Cloud Api Platform', '', '')

      const token = localStorage.getItem(ELocalStorageKey.Token)
      if (token) {
        refreshToken({})
          .then((res) => {
            apiPilot.setComponentParam(EComponentName.Api, {
              host: CURRENT_CONFIG.baseURL,
              token: res.data.access_token,
            })
            const jsres = apiPilot.loadComponent(EComponentName.Api, apiPilot.getComponentParam(EComponentName.Api))
            if (!jsres) {
              message.error('Failed to load api module.')
              return
            }
            apiPilot.setToken(res.data.access_token)
            localStorage.setItem(ELocalStorageKey.Token, res.data.access_token)
            navigate('/' + ERouterName.PILOT_HOME)
          })
          .catch((err) => {
            message.error(err)
          })
      }
    } catch (error) {
      console.error('Pilot API error:', error)
    }
  }, [isVerified, navigate])

  const verifyLicense = () => {
    try {
      const verified =
        apiPilot.platformVerifyLicense(CURRENT_CONFIG.appId, CURRENT_CONFIG.appKey, CURRENT_CONFIG.appLicense) &&
        apiPilot.isPlatformVerifySuccess()
      setIsVerified(verified)
      if (verified) {
        message.success('The license verification is successful.')
      } else {
        message.error('Failed to verify the license. Please check license whether the license is correct, or apply again.')
      }
    } catch (error) {
      console.error('License verification error:', error)
      message.error('This page must be accessed from within the DJI Pilot app.')
      setIsVerified(false)
    }
  }

  const onSubmit = async (values: LoginBody) => {
    if (!isVerified) {
      message.error('Please verify the license firstly.')
      return
    }

    const loginBody: LoginBody = {
      username: values.username,
      password: values.password,
      flag: EUserType.Pilot,
    }

    try {
      const res = await login(loginBody)
      console.log('login res:', res)
      if (res.code === 0) {
        apiPilot.setComponentParam(EComponentName.Api, {
          host: CURRENT_CONFIG.baseURL,
          token: res.data.access_token,
        })
        const jsres = apiPilot.loadComponent(EComponentName.Api, apiPilot.getComponentParam(EComponentName.Api))
        console.log('load api module res:', jsres)
        apiPilot.setToken(res.data.access_token)
        localStorage.setItem(ELocalStorageKey.Token, res.data.access_token)
        localStorage.setItem(ELocalStorageKey.WorkspaceId, res.data.workspace_id)
        localStorage.setItem(ELocalStorageKey.WorkspaceName, res.data.workspace_name)
        localStorage.setItem(ELocalStorageKey.UserId, res.data.user_id)
        localStorage.setItem(ELocalStorageKey.Username, res.data.username)
        localStorage.setItem(ELocalStorageKey.Flag, EUserType.Pilot.toString())
        message.success('Login Success')
        navigate('/' + ERouterName.PILOT_HOME)
      }
    } catch (err: any) {
      message.error(err)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        margin: 0,
      }}
    >
      <Image
        src={djiLogo}
        preview={false}
        style={{ width: '17vw', height: '10vw', marginBottom: 50 }}
      />
      <p style={{ fontSize: 35, paddingBottom: 50, color: '#1890ff' }}>Pilot Cloud API Demo</p>
      <Form form={form} layout="inline" onFinish={onSubmit} initialValues={{ username: 'user@example.com', password: 'password123' }}>
        <Form.Item name="username" rules={[{ required: true }]}>
          <Input prefix={<UserOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />} placeholder="Username" />
        </Form.Item>
        <Form.Item name="password" rules={[{ required: true }]}>
          <Input.Password prefix={<LockOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />} placeholder="Password" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Login
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default PilotLoginPage
