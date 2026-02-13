import { message } from 'antd'
import { putDeviceProps, PutDevicePropsBody } from '@/api/device-setting'
import {
  DeviceSettingKeyEnum,
  DeviceSettingFormModel,
  ObstacleAvoidanceStatusEnum,
  NightLightsStateEnum,
  DistanceLimitStatusEnum,
} from '@/types/device-setting'

export function useDeviceSetting() {
  function genDevicePropsBySettingKey(
    key: DeviceSettingKeyEnum,
    fromModel: DeviceSettingFormModel
  ) {
    const body = {} as PutDevicePropsBody
    if (key === DeviceSettingKeyEnum.NIGHT_LIGHTS_MODE_SET) {
      body.night_lights_state = fromModel.nightLightsState
        ? NightLightsStateEnum.OPEN
        : NightLightsStateEnum.CLOSE
    } else if (key === DeviceSettingKeyEnum.HEIGHT_LIMIT_SET) {
      body.height_limit = fromModel.heightLimit
    } else if (key === DeviceSettingKeyEnum.DISTANCE_LIMIT_SET) {
      body.distance_limit_status = {}
      if (fromModel.distanceLimitStatus.state) {
        body.distance_limit_status.state = DistanceLimitStatusEnum.SET
        body.distance_limit_status.distance_limit =
          fromModel.distanceLimitStatus.distanceLimit
      } else {
        body.distance_limit_status.state = DistanceLimitStatusEnum.UNSET
      }
    } else if (key === DeviceSettingKeyEnum.OBSTACLE_AVOIDANCE_HORIZON) {
      body.obstacle_avoidance = {
        horizon: fromModel.obstacleAvoidanceHorizon
          ? ObstacleAvoidanceStatusEnum.OPEN
          : ObstacleAvoidanceStatusEnum.CLOSE,
      }
    } else if (key === DeviceSettingKeyEnum.OBSTACLE_AVOIDANCE_UPSIDE) {
      body.obstacle_avoidance = {
        upside: fromModel.obstacleAvoidanceUpside
          ? ObstacleAvoidanceStatusEnum.OPEN
          : ObstacleAvoidanceStatusEnum.CLOSE,
      }
    } else if (key === DeviceSettingKeyEnum.OBSTACLE_AVOIDANCE_DOWNSIDE) {
      body.obstacle_avoidance = {
        downside: fromModel.obstacleAvoidanceDownside
          ? ObstacleAvoidanceStatusEnum.OPEN
          : ObstacleAvoidanceStatusEnum.CLOSE,
      }
    }
    return body
  }

  async function setDeviceProps(sn: string, body: PutDevicePropsBody) {
    try {
      const { code, message: msg } = await putDeviceProps(sn, body)
      if (code === 0) {
        return true
      }
      throw msg
    } catch (e) {
      message.error('Failed to set device properties')
      return false
    }
  }

  return {
    genDevicePropsBySettingKey,
    setDeviceProps,
  }
}
