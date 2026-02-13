import { useEffect } from 'react'
import EventBus from '@/event-bus'
import { TaskProgressInfo, MediaStatusProgressInfo, TaskMediaHighestPriorityProgressInfo } from '@/types/task'
import { EBizCode } from '@/types'

export interface UseTaskWsEventParams {
  onTaskProgressWs: (data: TaskProgressInfo) => void
  onTaskMediaProgressWs: (data: MediaStatusProgressInfo) => void
  onTaskMediaHighestPriorityWs: (data: TaskMediaHighestPriorityProgressInfo) => void
}

export function useTaskWsEvent(funcs: UseTaskWsEventParams): void {
  useEffect(() => {
    function handleTaskWsEvent(payload: any) {
      if (!payload) return

      switch (payload.biz_code) {
        case EBizCode.FlightTaskProgress:
          funcs.onTaskProgressWs(payload.data)
          break
        case EBizCode.FlightTaskMediaProgress:
          funcs.onTaskMediaProgressWs(payload.data)
          break
        case EBizCode.FlightTaskMediaHighestPriority:
          funcs.onTaskMediaHighestPriorityWs(payload.data)
          break
      }
    }

    EventBus.on('flightTaskWs', handleTaskWsEvent)
    return () => {
      EventBus.off('flightTaskWs', handleTaskWsEvent)
    }
  }, [funcs])
}
