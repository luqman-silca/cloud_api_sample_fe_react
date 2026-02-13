import { Popconfirm, Tag } from 'antd'
import { Firmware, FirmwareStatusEnum } from '@/types/device-firmware'
import { changeFirmareStatus } from '@/api/manage'
import { ELocalStorageKey } from '@/types'
import { commonColor } from '@/utils/color'

interface DeviceFirmwareStatusProps {
  firmware: Firmware
}

function DeviceFirmwareStatus({ firmware }: DeviceFirmwareStatusProps) {
  const workspaceId = localStorage.getItem(ELocalStorageKey.WorkspaceId)!

  const getTitle = () => {
    return `Are you sure to set this firmware to ${getText(!firmware.firmware_status)}?`
  }

  const getText = (status: boolean) => {
    return status ? FirmwareStatusEnum.TRUE : FirmwareStatusEnum.FALSE
  }

  const onFirmwareStatusClick = async () => {
    const res = await changeFirmareStatus(workspaceId, firmware.firmware_id, { status: !firmware.firmware_status })
    if (res.code === 0) {
      firmware.firmware_status = !firmware.firmware_status
    }
  }

  return (
    <div>
      <span>
        <Popconfirm
          title={getTitle()}
          okText="Yes"
          cancelText="No"
          placement="left"
          onConfirm={onFirmwareStatusClick}
        >
          <Tag
            color={firmware.firmware_status ? commonColor.NORMAL : commonColor.FAIL}
            style={{
              opacity: firmware.firmware_status ? 1 : 0.4,
              borderRadius: 3,
              cursor: 'pointer',
            }}
          >
            {getText(firmware.firmware_status)}
          </Tag>
        </Popconfirm>
      </span>
    </div>
  )
}

export default DeviceFirmwareStatus
