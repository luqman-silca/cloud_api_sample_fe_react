import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Image, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { login, LoginBody } from '@/api/manage'
import { ELocalStorageKey, ERouterName, EUserType } from '@/types'
import djiLogo from '@/assets/icons/dji_logo.png'

function LoginPage() {
  const navigate = useNavigate()
  const [formState, setFormState] = useState<LoginBody>({
    username: 'adminPC',
    password: 'adminPC',
    flag: EUserType.Web,
  })

  const loginBtnDisabled = useMemo(() => {
    return !formState.username || !formState.password
  }, [formState.username, formState.password])

  const onSubmit = async () => {
    const result = await login(formState)
    if (result.code === 0) {
      localStorage.setItem(ELocalStorageKey.Token, result.data.access_token)
      localStorage.setItem(ELocalStorageKey.WorkspaceId, result.data.workspace_id)
      localStorage.setItem(ELocalStorageKey.Username, result.data.username)
      localStorage.setItem(ELocalStorageKey.UserId, result.data.user_id)
      localStorage.setItem(ELocalStorageKey.Flag, EUserType.Web.toString())
      navigate('/' + ERouterName.HOME + '/' + ERouterName.MEMBERS)
    } else {
      message.error(result.message)
    }
  }

  return (
    <div
      className="flex-column flex-justify-center flex-align-center m0"
      style={{
        backgroundColor: '#232323',
        height: '100vh',
      }}
    >
      <Image
        style={{ width: '17vw', height: '10vw', marginBottom: 50 }}
        src={djiLogo}
        preview={false}
      />
      <p className="fz35 pb50" style={{ color: '#2d8cf0' }}>
        Cloud API Demo
      </p>
      <Form
        layout="inline"
        className="flex-row flex-justify-center flex-align-center"
      >
        <Form.Item>
          <Input
            value={formState.username}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, username: e.target.value }))
            }
            placeholder="Username"
            prefix={<UserOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />}
          />
        </Form.Item>
        <Form.Item>
          <Input
            value={formState.password}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, password: e.target.value }))
            }
            type="password"
            placeholder="Password"
            prefix={<LockOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />}
          />
        </Form.Item>
        <Form.Item>
          <Button
            className="m0"
            type="primary"
            htmlType="submit"
            disabled={loginBtnDisabled}
            onClick={onSubmit}
          >
            Login
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default LoginPage
