import { useState } from 'react'
import {
  postFlyToPoint,
  PostFlyToPointBody,
  deleteFlyToPoint,
  postTakeoffToPoint,
  PostTakeoffToPointBody,
} from '@/api/drone-control/drone'
import { message } from 'antd'

export function useDroneControl() {
  const [droneControlPanelVisible, setDroneControlPanelVisible] =
    useState(false)

  async function flyToPoint(sn: string, body: PostFlyToPointBody) {
    const { code } = await postFlyToPoint(sn, body)
    if (code === 0) {
      message.success('Fly to')
    }
  }

  async function stopFlyToPoint(sn: string) {
    const { code } = await deleteFlyToPoint(sn)
    if (code === 0) {
      message.success('Stop fly to')
    }
  }

  async function takeoffToPoint(sn: string, body: PostTakeoffToPointBody) {
    const { code } = await postTakeoffToPoint(sn, body)
    if (code === 0) {
      message.success('Take off successfully')
    }
  }

  return {
    droneControlPanelVisible,
    setDroneControlPanelVisible,
    flyToPoint,
    stopFlyToPoint,
    takeoffToPoint,
  }
}
