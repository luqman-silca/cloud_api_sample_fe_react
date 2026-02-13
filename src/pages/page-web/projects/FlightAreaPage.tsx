import { useCallback, useEffect, useState } from 'react'
import { Spin } from 'antd'
import Title from '@/components/workspace/Title'
import DividerLine from '@/components/workspace/DividerLine'
import FlightAreaPanel from '@/components/flight-area/FlightAreaPanel'
import FlightAreaSyncPanel from '@/components/flight-area/FlightAreaSyncPanel'
import { GetFlightArea, deleteFlightArea, getFlightAreaList } from '@/api/flight-area'
import { useGMapCover } from '@/hooks/use-g-map-cover'
import { useMapTool } from '@/hooks/use-map-tool'
import { EGeometryType, FlightAreaUpdate } from '@/types/flight-area'
import { useFlightArea } from '@/components/flight-area/useFlightArea'
import { useFlightAreaUpdateEvent } from '@/components/flight-area/useFlightAreaUpdate'

function FlightAreaPage() {
  const [loading, setLoading] = useState(false)
  const [flightAreaList, setFlightAreaList] = useState<GetFlightArea[]>([])
  const { getGcj02 } = useFlightArea()

  const getDataList = useCallback(() => {
    setLoading(true)
    getFlightAreaList()
      .then((res) => {
        setFlightAreaList(res.data)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    getDataList()
  }, [getDataList])

  const deleteAreaById = (areaId: string) => {
    deleteFlightArea(areaId)
  }

  const deleteArea = useCallback((area: FlightAreaUpdate) => {
    setFlightAreaList((prev) => prev.filter((data) => data.area_id !== area.area_id))
  }, [])

  const updateArea = useCallback((area: FlightAreaUpdate) => {
    setFlightAreaList((prev) =>
      prev.map((data) => (data.area_id === area.area_id ? (area as GetFlightArea) : data))
    )
  }, [])

  const addArea = useCallback((area: FlightAreaUpdate) => {
    setFlightAreaList((prev) => [...prev, area as GetFlightArea])
  }, [])

  useFlightAreaUpdateEvent(addArea, deleteArea, updateArea)

  const clickArea = (area: GetFlightArea) => {
    // Pan to the area location on the map
    console.info('Location area:', area)
  }

  return (
    <div className="project-flight-area-wrapper" style={{ height: '100%' }}>
      <Spin spinning={loading} delay={300} tip="loading" size="large" style={{ height: '100%' }}>
        <Title title="Custom Flight Area" />
        <FlightAreaPanel data={flightAreaList} onLocationArea={clickArea} onDeleteArea={deleteAreaById} />
        <DividerLine />
        <FlightAreaSyncPanel />
      </Spin>
    </div>
  )
}

export default FlightAreaPage
