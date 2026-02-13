import { useRef, useState } from 'react'
import { Form, Input, Button, Radio, DatePicker, TimePicker, InputNumber, Tooltip } from 'antd'
import { CloseOutlined, RocketOutlined, CameraFilled, UserOutlined, PlusCircleOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs, { Dayjs } from 'dayjs'
import { ELocalStorageKey, ERouterName } from '@/types'
import { useWaylineStore } from '@/store/useWaylineStore'
import { WaylineFile } from '@/types/wayline'
import { Device, DEVICE_NAME } from '@/types/device'
import { createPlan, CreatePlan as CreatePlanBody } from '@/api/wayline'
import { TaskType, OutOfControlActionOptions, OutOfControlAction, TaskTypeOptions } from '@/types/task'
import WaylinePage from '@/pages/page-web/projects/WaylinePage'
import DockPage from '@/pages/page-web/projects/DockPage'

const { RangePicker } = DatePicker

function CreatePlanComponent() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const workspaceId = localStorage.getItem(ELocalStorageKey.WorkspaceId)!

  const wayline = useWaylineStore((s) => s.waylineInfo) as WaylineFile
  const dock = useWaylineStore((s) => s.dockInfo) as Device

  const [disabled, setDisabled] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [routeName, setRouteName] = useState('')
  const [taskType, setTaskType] = useState(TaskType.Immediate)
  const [selectTimeNumber, setSelectTimeNumber] = useState(1)
  const [selectTimes, setSelectTimes] = useState<(Dayjs | null)[][]>([[]])

  const closePlan = () => {
    navigate('/' + ERouterName.WORKSPACE + '/' + ERouterName.TASK)
  }

  const closePanel = () => {
    setDrawerVisible(false)
    setRouteName('')
  }

  const selectRoute = () => {
    setDrawerVisible(true)
    setRouteName('WaylinePanel')
  }

  const selectDevice = () => {
    setDrawerVisible(true)
    setRouteName('DockPanel')
  }

  const addTime = () => {
    setSelectTimeNumber((prev) => prev + 1)
    setSelectTimes((prev) => [...prev, []])
  }

  const removeTime = () => {
    if (selectTimeNumber === 1) return
    setSelectTimeNumber((prev) => prev - 1)
    setSelectTimes((prev) => prev.slice(0, -1))
  }

  const onSubmit = () => {
    form.validateFields().then((values) => {
      setDisabled(true)
      const body: any = {
        name: values.name,
        file_id: wayline.id,
        dock_sn: dock.device_sn,
        task_type: taskType,
        rth_altitude: Number(values.rth_altitude),
        out_of_control_action: values.out_of_control_action,
      }

      if (values.select_execute_date?.length === 2) {
        body.task_days = []
        let current = values.select_execute_date[0].startOf('day')
        const end = values.select_execute_date[1].startOf('day')
        while (current.isBefore(end) || current.isSame(end, 'day')) {
          body.task_days.push(current.unix())
          current = current.add(1, 'day')
        }
      }

      body.task_periods = []
      if (taskType !== TaskType.Immediate) {
        for (let i = 0; i < selectTimes.length; i++) {
          const result: number[] = []
          if (selectTimes[i][0]) result.push(selectTimes[i][0]!.unix())
          if (taskType === TaskType.Condition && selectTimes[i][1]) {
            result.push(selectTimes[i][1]!.unix())
          }
          body.task_periods.push(result)
        }
      }

      if (wayline.template_types?.length > 0) {
        body.wayline_type = wayline.template_types[0]
      }

      if (taskType === TaskType.Condition) {
        body.min_battery_capacity = values.min_battery_capacity
        body.min_storage_capacity = values.min_storage_capacity
      }

      createPlan(workspaceId, body as CreatePlanBody)
        .then(() => setDisabled(false))
        .finally(() => closePlan())
    }).catch((e) => console.log('validate err', e))
  }

  return (
    <>
      <div style={{ backgroundColor: '#232323', color: '#fff', paddingBottom: 0, height: '100vh', display: 'flex', flexDirection: 'column', width: 285 }}>
        <div style={{ height: 52, borderBottom: '1px solid #4f4f4f', fontWeight: 700, fontSize: 16, paddingLeft: 10, display: 'flex', alignItems: 'center' }}>
          Create Plan
        </div>
        <div style={{ height: 'calc(100% - 54px)', overflowY: 'auto' }}>
          <Form form={form} layout="horizontal" requiredMark={false} labelAlign="left" style={{ margin: 10 }}>
            <Form.Item label="Plan Name" name="name" labelCol={{ span: 23 }} rules={[{ required: true, message: 'Please enter plan name.' }, { max: 20, message: 'Length should be 1 to 20' }]}>
              <Input style={{ background: 'black', color: '#fff' }} placeholder="Please enter plan name" />
            </Form.Item>

            <Form.Item label="Flight Route" wrapperCol={{ offset: 7 }}>
              <a onClick={selectRoute} style={{ color: '#1890ff' }}>Select Route</a>
            </Form.Item>
            {wayline.id && (
              <Form.Item style={{ marginTop: -15 }}>
                <div style={{ background: '#3c3c3c', marginTop: 10, height: 90, width: '95%', fontSize: 13, borderRadius: 2, paddingTop: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', height: 30, fontWeight: 'bold', margin: '0 10px', color: 'white' }}>
                    <Tooltip title={wayline.name}>
                      <div style={{ width: 120, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', paddingRight: 10 }}>{wayline.name}</div>
                    </Tooltip>
                    <div style={{ marginLeft: 10 }}><UserOutlined /></div>
                    <Tooltip title={wayline.user_name}>
                      <div style={{ marginLeft: 5, width: 80, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', paddingRight: 10 }}>{wayline.user_name}</div>
                    </Tooltip>
                  </div>
                  <div style={{ marginLeft: 10, marginTop: 5, color: 'hsla(0,0%,100%,0.65)' }}>
                    <span><RocketOutlined /></span>
                    <span style={{ marginLeft: 5 }}>{DEVICE_NAME[wayline.drone_model_key]}</span>
                    <span style={{ marginLeft: 10 }}><CameraFilled /></span>
                    {wayline.payload_model_keys?.map((payload: string) => (
                      <span key={payload} style={{ marginLeft: 5 }}>{DEVICE_NAME[payload]}</span>
                    ))}
                  </div>
                  <div style={{ marginTop: 5, marginLeft: 10, color: 'hsla(0,0%,100%,0.35)' }}>
                    <span>Update at {new Date(wayline.update_time).toLocaleString()}</span>
                  </div>
                </div>
              </Form.Item>
            )}

            <Form.Item label="Device" wrapperCol={{ offset: 10 }}>
              <a onClick={selectDevice} style={{ color: '#1890ff' }}>Select Device</a>
            </Form.Item>
            {dock.device_sn && (
              <Form.Item style={{ marginTop: -15 }}>
                <div style={{ background: '#3c3c3c', marginTop: 10, height: 70, width: '95%', fontSize: 13, borderRadius: 2, paddingTop: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', height: 30, fontWeight: 'bold', margin: '0 10px', color: 'white' }}>
                    <Tooltip title={dock.nickname}>
                      <div style={{ width: 120, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', paddingRight: 10 }}>{dock.nickname}</div>
                    </Tooltip>
                  </div>
                  <div style={{ marginLeft: 10, marginTop: 5, color: 'hsla(0,0%,100%,0.65)' }}>
                    <span><RocketOutlined /></span>
                    <span style={{ marginLeft: 5 }}>{dock.children?.[0]?.nickname ?? 'No drone'}</span>
                  </div>
                </div>
              </Form.Item>
            )}

            <Form.Item label="Plan Timer">
              <div style={{ whiteSpace: 'nowrap' }}>
                <Radio.Group value={taskType} onChange={(e) => setTaskType(e.target.value)} buttonStyle="solid">
                  {TaskTypeOptions.map((type) => (
                    <Radio.Button key={type.value} value={type.value}>{type.label}</Radio.Button>
                  ))}
                </Radio.Group>
              </div>
            </Form.Item>

            {(taskType === TaskType.Timed || taskType === TaskType.Condition) && (
              <>
                <Form.Item label="Date" name="select_execute_date" labelCol={{ span: 23 }} rules={[{ required: true, message: 'Select date' }]}>
                  <RangePicker
                    disabledDate={(current) => current && current < dayjs().subtract(1, 'day')}
                    format="YYYY-MM-DD"
                    placeholder={['Start Time', 'End Time']}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="Time" labelCol={{ span: 23 }}>
                  {Array.from({ length: selectTimeNumber }).map((_, n) => (
                    <div key={n} style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                      <TimePicker
                        value={selectTimes[n]?.[0]}
                        onChange={(val) => {
                          const newTimes = [...selectTimes]
                          if (!newTimes[n]) newTimes[n] = []
                          newTimes[n][0] = val
                          setSelectTimes(newTimes)
                        }}
                        format="HH:mm:ss"
                        placeholder="Start Time"
                        style={{ width: taskType === TaskType.Condition ? '40%' : '82%' }}
                      />
                      {taskType === TaskType.Condition && (
                        <>
                          <span style={{ color: 'white' }}>-</span>
                          <TimePicker
                            value={selectTimes[n]?.[1]}
                            onChange={(val) => {
                              const newTimes = [...selectTimes]
                              if (!newTimes[n]) newTimes[n] = []
                              newTimes[n][1] = val
                              setSelectTimes(newTimes)
                            }}
                            format="HH:mm:ss"
                            placeholder="End Time"
                            style={{ width: '40%' }}
                          />
                        </>
                      )}
                      <div style={{ marginLeft: 5, fontSize: 18 }}>
                        <PlusCircleOutlined style={{ color: '#1890ff', marginRight: 5, cursor: 'pointer' }} onClick={addTime} />
                        <MinusCircleOutlined style={{ color: selectTimeNumber === 1 ? 'gray' : 'red', cursor: 'pointer' }} onClick={removeTime} />
                      </div>
                    </div>
                  ))}
                </Form.Item>
              </>
            )}

            {taskType === TaskType.Condition && (
              <>
                <Form.Item label="Start task when battery level reaches" labelCol={{ span: 23 }} name="min_battery_capacity" initialValue={90}>
                  <InputNumber min={50} max={100} style={{ width: '100%' }} formatter={(v) => `${v}%`} parser={(v) => Number(v?.replace('%', '') || 0) as any} />
                </Form.Item>
                <Form.Item label="Start task when storage level reaches (MB)" labelCol={{ span: 23 }} name="min_storage_capacity">
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </>
            )}

            <Form.Item
              label="RTH Altitude Relative to Dock (m)"
              labelCol={{ span: 23 }}
              name="rth_altitude"
              rules={[{ validator: async (_, value) => { if (!/^[0-9]+$/.test(value)) throw new Error('RTH Altitude requires a number') } }]}
            >
              <InputNumber min={20} max={1500} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Lost Action" labelCol={{ span: 23 }} name="out_of_control_action" initialValue={OutOfControlAction.ReturnToHome} rules={[{ required: true, message: 'Select Lost Action' }]}>
              <div style={{ whiteSpace: 'nowrap' }}>
                <Radio.Group buttonStyle="solid" defaultValue={OutOfControlAction.ReturnToHome} onChange={(e) => form.setFieldValue('out_of_control_action', e.target.value)}>
                  {OutOfControlActionOptions.map((action) => (
                    <Radio.Button key={action.value} value={action.value}>{action.label}</Radio.Button>
                  ))}
                </Radio.Group>
              </div>
            </Form.Item>

            <Form.Item style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', padding: '10px 0' }}>
                <Button style={{ width: '45%', color: '#fff', border: 0, background: '#3c3c3c', marginRight: 10 }} onClick={closePlan}>Cancel</Button>
                <Button type="primary" style={{ width: '45%', color: '#fff', border: 0 }} onClick={onSubmit} disabled={disabled}>OK</Button>
              </div>
            </Form.Item>
          </Form>
        </div>
      </div>

      {drawerVisible && (
        <div style={{ position: 'absolute', left: 335, width: 280, height: '100vh', top: 0, zIndex: 1000, color: 'white', background: '#282828' }}>
          <div>
            {routeName === 'WaylinePanel' ? <WaylinePage /> : <DockPage />}
          </div>
          <div style={{ position: 'absolute', top: 15, right: 10 }}>
            <a style={{ color: 'white' }} onClick={closePanel}><CloseOutlined /></a>
          </div>
        </div>
      )}

      <style>{`
        .create-plan-wrapper .ant-form label,
        .create-plan-wrapper .ant-input,
        .create-plan-wrapper .ant-input:hover { background-color: #232323; color: #fff; }
        .create-plan-wrapper .ant-radio-button-wrapper { background-color: #232323; color: #fff; width: 33%; text-align: center; }
        .create-plan-wrapper .ant-radio-button-wrapper-checked { background-color: #1890ff; }
      `}</style>
    </>
  )
}

export default CreatePlanComponent
