import { useState, useEffect, ReactNode } from 'react'
import { Popover, Button } from 'antd'

interface DeviceSettingPopoverProps {
  visible?: boolean
  loading?: boolean
  disabled?: boolean
  okText?: string
  cancelText?: string
  formContent?: ReactNode
  onConfirm?: (e: React.MouseEvent) => void
  onCancel?: (e: React.MouseEvent) => void
  children?: ReactNode
}

function DeviceSettingPopover({
  visible,
  loading,
  disabled,
  okText,
  cancelText,
  formContent,
  onConfirm,
  onCancel,
  children,
}: DeviceSettingPopoverProps) {
  const [sVisible, setSVisible] = useState(false)

  useEffect(() => {
    setSVisible(visible || false)
  }, [visible])

  function handleConfirm(e: React.MouseEvent) {
    if (disabled) return
    onConfirm?.(e)
  }

  function handleCancel(e: React.MouseEvent) {
    setSVisible(false)
    onCancel?.(e)
  }

  const content = (
    <div>
      <div className="title-content" />
      {formContent}
      <div
        style={{
          display: 'flex',
          padding: '10px 0px',
          justifyContent: 'flex-end',
        }}
      >
        <Button size="small" onClick={handleCancel}>
          {cancelText || 'Cancel'}
        </Button>
        <Button
          size="small"
          loading={loading}
          type="primary"
          style={{ marginLeft: 10 }}
          onClick={handleConfirm}
        >
          {okText || 'OK'}
        </Button>
      </div>
    </div>
  )

  return (
    <Popover
      open={sVisible}
      trigger="click"
      overlayClassName="device-setting-popconfirm"
      placement="bottom"
      content={content}
    >
      {children}
    </Popover>
  )
}

export default DeviceSettingPopover
