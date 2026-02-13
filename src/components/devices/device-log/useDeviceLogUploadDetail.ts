import { DeviceLogItem } from '@/api/device-log'
import { bytesToSize } from '@/utils/bytes'
import dayjs from 'dayjs'

const DATE_FORMAT_MINUTE = 'YYYY-MM-DD HH:mm'

export function useDeviceLogUploadDetail() {
  function getLogTime(deviceLog: DeviceLogItem): string {
    const startTime = deviceLog.start_time ? dayjs.unix(deviceLog.start_time).format(DATE_FORMAT_MINUTE) : '--'
    const endTime = deviceLog.end_time ? dayjs.unix(deviceLog.end_time).format(DATE_FORMAT_MINUTE) : '--'
    return `${startTime} — ${endTime}`
  }

  function getLogSize(size: number) {
    return bytesToSize(size)
  }

  return {
    getLogTime,
    getLogSize,
  }
}
