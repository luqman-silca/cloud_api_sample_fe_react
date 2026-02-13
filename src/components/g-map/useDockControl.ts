import { useState } from 'react'
import { message } from 'antd'
import { postSendCmd } from '@/api/device-cmd'
import { DeviceCmd, DeviceCmdItemAction } from '@/types/device-cmd'

export function useDockControl() {
  const [dockControlPanelVisible, setDockControlPanelVisible] = useState(false)

  async function dockDebugOnOff(sn: string, on: boolean) {
    const result = await sendDockControlCmd(
      {
        sn: sn,
        cmd: on ? DeviceCmd.DebugModeOpen : DeviceCmd.DebugModeClose,
      },
      false
    )
    return result
  }

  async function sendDockControlCmd(
    params: {
      sn: string
      cmd: DeviceCmd
      action?: DeviceCmdItemAction
    },
    tip = true
  ) {
    try {
      let body = undefined as any
      if (params.action !== undefined) {
        body = { action: params.action }
      }
      const { code, message: msg } = await postSendCmd(
        { dock_sn: params.sn, device_cmd: params.cmd },
        body
      )
      if (code === 0) {
        tip && message.success('Command sent successfully')
        return true
      }
      throw msg
    } catch (e) {
      tip && message.error('Failed to send command')
      return false
    }
  }

  async function onCloseControlPanel(sn: string, debugging: boolean) {
    if (debugging) {
      await dockDebugOnOff(sn, false)
    }
    setDockControlPanelVisible(false)
  }

  return {
    dockControlPanelVisible,
    setDockControlPanelVisible,
    sendDockControlCmd,
    dockDebugOnOff,
    onCloseControlPanel,
  }
}
