import { useState, useEffect } from 'react'
import { Switch, InputNumber } from 'antd'
import { DeviceInfoType } from '@/types/device'
import { cloneDeep } from 'lodash'
import {
  initDeviceSetting,
  initDeviceSettingFormModel,
  DeviceSettingKeyEnum,
} from '@/types/device-setting'
import {
  updateDeviceSettingInfoByOsd,
  updateDeviceSettingFormModelByOsd,
} from '@/utils/device-setting'
import { useDeviceSetting } from './useDeviceSetting'
import DeviceSettingPopover from './DeviceSettingPopover'

interface DeviceSettingBoxProps {
  sn: string
  deviceInfo: DeviceInfoType
}

function DeviceSettingBox({ sn, deviceInfo }: DeviceSettingBoxProps) {
  const [deviceSetting, setDeviceSetting] = useState(() =>
    cloneDeep(initDeviceSetting)
  )
  const [deviceSettingFormModelFromOsd, setDeviceSettingFormModelFromOsd] =
    useState(() => cloneDeep(initDeviceSettingFormModel))
  const [deviceSettingFormModel, setDeviceSettingFormModel] = useState(() =>
    cloneDeep(initDeviceSettingFormModel)
  )

  const { genDevicePropsBySettingKey, setDeviceProps } = useDeviceSetting()

  useEffect(() => {
    const newSetting = cloneDeep(deviceSetting)
    const newFormModel = cloneDeep(deviceSettingFormModelFromOsd)
    updateDeviceSettingInfoByOsd(newSetting, deviceInfo)
    updateDeviceSettingFormModelByOsd(newFormModel, deviceInfo)
    setDeviceSetting(newSetting)
    setDeviceSettingFormModelFromOsd(newFormModel)
  }, [deviceInfo]) // eslint-disable-line react-hooks/exhaustive-deps

  function onShowPopConfirm(settingKey: DeviceSettingKeyEnum) {
    const updated = cloneDeep(deviceSetting)
    updated[settingKey].popConfirm.visible = true
    setDeviceSetting(updated)
    setDeviceSettingFormModel(cloneDeep(deviceSettingFormModelFromOsd))
  }

  function onCancel(settingKey: DeviceSettingKeyEnum) {
    const updated = cloneDeep(deviceSetting)
    updated[settingKey].popConfirm.visible = false
    setDeviceSetting(updated)
  }

  async function onConfirm(settingKey: DeviceSettingKeyEnum) {
    const updated = cloneDeep(deviceSetting)
    updated[settingKey].popConfirm.loading = true
    setDeviceSetting(updated)

    const body = genDevicePropsBySettingKey(settingKey, deviceSettingFormModel)
    await setDeviceProps(sn, body)

    const final = cloneDeep(updated)
    final[settingKey].popConfirm.loading = false
    final[settingKey].popConfirm.visible = false
    setDeviceSetting(final)
  }

  const settingKeys = [
    DeviceSettingKeyEnum.NIGHT_LIGHTS_MODE_SET,
    DeviceSettingKeyEnum.HEIGHT_LIMIT_SET,
    DeviceSettingKeyEnum.DISTANCE_LIMIT_SET,
    DeviceSettingKeyEnum.OBSTACLE_AVOIDANCE_HORIZON,
    DeviceSettingKeyEnum.OBSTACLE_AVOIDANCE_UPSIDE,
    DeviceSettingKeyEnum.OBSTACLE_AVOIDANCE_DOWNSIDE,
  ]

  function renderFormContent(key: DeviceSettingKeyEnum) {
    const label = deviceSetting[key].label
    switch (key) {
      case DeviceSettingKeyEnum.NIGHT_LIGHTS_MODE_SET:
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ paddingRight: 10 }}>{label}:</span>
            <Switch
              checked={deviceSettingFormModel.nightLightsState}
              onChange={(v) =>
                setDeviceSettingFormModel({
                  ...deviceSettingFormModel,
                  nightLightsState: v,
                })
              }
            />
          </div>
        )
      case DeviceSettingKeyEnum.HEIGHT_LIMIT_SET:
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ paddingRight: 10 }}>{label}:</span>
            <InputNumber
              value={deviceSettingFormModel.heightLimit}
              min={20}
              max={1500}
              onChange={(v) =>
                setDeviceSettingFormModel({
                  ...deviceSettingFormModel,
                  heightLimit: v as number,
                })
              }
            />
            <span style={{ marginLeft: 4 }}>m</span>
          </div>
        )
      case DeviceSettingKeyEnum.DISTANCE_LIMIT_SET:
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ paddingRight: 10 }}>{label}:</span>
            <Switch
              style={{ marginRight: 10 }}
              checked={deviceSettingFormModel.distanceLimitStatus.state}
              onChange={(v) =>
                setDeviceSettingFormModel({
                  ...deviceSettingFormModel,
                  distanceLimitStatus: {
                    ...deviceSettingFormModel.distanceLimitStatus,
                    state: v,
                  },
                })
              }
            />
            <InputNumber
              value={deviceSettingFormModel.distanceLimitStatus.distanceLimit}
              min={15}
              max={8000}
              onChange={(v) =>
                setDeviceSettingFormModel({
                  ...deviceSettingFormModel,
                  distanceLimitStatus: {
                    ...deviceSettingFormModel.distanceLimitStatus,
                    distanceLimit: v as number,
                  },
                })
              }
            />
            <span style={{ marginLeft: 4 }}>m</span>
          </div>
        )
      case DeviceSettingKeyEnum.OBSTACLE_AVOIDANCE_HORIZON:
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ paddingRight: 10 }}>{label}:</span>
            <Switch
              checked={deviceSettingFormModel.obstacleAvoidanceHorizon}
              onChange={(v) =>
                setDeviceSettingFormModel({
                  ...deviceSettingFormModel,
                  obstacleAvoidanceHorizon: v,
                })
              }
            />
          </div>
        )
      case DeviceSettingKeyEnum.OBSTACLE_AVOIDANCE_UPSIDE:
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ paddingRight: 10 }}>{label}:</span>
            <Switch
              checked={deviceSettingFormModel.obstacleAvoidanceUpside}
              onChange={(v) =>
                setDeviceSettingFormModel({
                  ...deviceSettingFormModel,
                  obstacleAvoidanceUpside: v,
                })
              }
            />
          </div>
        )
      case DeviceSettingKeyEnum.OBSTACLE_AVOIDANCE_DOWNSIDE:
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ paddingRight: 10 }}>{label}:</span>
            <Switch
              checked={deviceSettingFormModel.obstacleAvoidanceDownside}
              onChange={(v) =>
                setDeviceSettingFormModel({
                  ...deviceSettingFormModel,
                  obstacleAvoidanceDownside: v,
                })
              }
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div style={{ borderBottom: '1px solid #515151' }}>
      <div style={{ fontSize: 14, fontWeight: 600, padding: '10px 10px 0px' }}>
        Device Property Set
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          padding: '4px 10px',
        }}
      >
        {settingKeys.map((key) => (
          <div
            key={key}
            style={{
              width: 220,
              height: 58,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid #666',
              margin: '4px 0',
              padding: '0 8px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 700 }}>{deviceSetting[key].label}</div>
              <div>{deviceSetting[key].value}</div>
            </div>
            <div>
              <DeviceSettingPopover
                visible={deviceSetting[key].popConfirm.visible}
                loading={deviceSetting[key].popConfirm.loading}
                onConfirm={() => onConfirm(key)}
                onCancel={() => onCancel(key)}
                formContent={renderFormContent(key)}
              >
                <a onClick={() => onShowPopConfirm(key)}>Edit</a>
              </DeviceSettingPopover>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DeviceSettingBox
