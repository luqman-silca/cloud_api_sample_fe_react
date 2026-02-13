import { useEffect } from 'react'
import { EFlightAreaUpdate, FlightAreaUpdate } from '@/types/flight-area'
import EventBus from '@/event-bus'

const doNothing = (_data: FlightAreaUpdate) => {}

export function useFlightAreaUpdateEvent(
  addFunc = doNothing,
  deleteFunc = doNothing,
  updateFunc = doNothing
): void {
  useEffect(() => {
    function handleEvent(data: FlightAreaUpdate) {
      switch (data.operation) {
        case EFlightAreaUpdate.ADD:
          addFunc(data)
          break
        case EFlightAreaUpdate.UPDATE:
          updateFunc(data)
          break
        case EFlightAreaUpdate.DELETE:
          deleteFunc(data)
          break
      }
    }

    EventBus.on('flightAreasUpdateWs', handleEvent)
    return () => {
      EventBus.off('flightAreasUpdateWs', handleEvent)
    }
  }, [addFunc, deleteFunc, updateFunc])
}
