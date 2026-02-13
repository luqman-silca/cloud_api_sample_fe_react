import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Row, Col, Drawer, Input, Button } from 'antd'
import type { TreeProps } from 'antd'
import LayersTree from '@/components/LayersTree'
import { useLayerStore } from '@/store/useLayerStore'
import { useGMapCover } from '@/hooks/use-g-map-cover'
import { getElementGroupsReq, updateElementsReq, deleteElementReq } from '@/api/layer'
import { MapDoodleColor, MapElementEnum } from '@/constants/map'
import { GeojsonCoordinate, LayerResource } from '@/types/map'
import { GeoType, Color } from '@/types/mapLayer'
import { generatePoint } from '@/utils/genjson'
import { gcj02towgs84, wgs84togcj02 } from '@/vendors/coordtransform'

const COLORS: Color[] = [
  { id: 1, name: 'BLUE', color: '#2D8CF0', selected: true },
  { id: 2, name: 'GREEN', color: '#19BE6B', selected: false },
  { id: 3, name: 'YELLOW', color: '#FFBB00', selected: false },
  { id: 4, name: 'ORANGE', color: '#B620E0', selected: false },
  { id: 5, name: 'RED', color: '#E23C39', selected: false },
  { id: 6, name: 'NAME_DEFAULT', color: '#212121', selected: false },
]

function LayerPage() {
  const mapLayers = useLayerStore((s) => s.Layers)
  const setLayerInfo = useLayerStore((s) => s.setLayerInfo)
  const setDrawVisible = useLayerStore((s) => s.setDrawVisible)

  const [checkedKeys, setCheckedKeys] = useState<string[]>([])
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [visible, setVisible] = useState(false)
  const [scrollHeight, setScrollHeight] = useState(0)
  const [layerState, setLayerState] = useState({
    layerName: '',
    layerId: '',
    longitude: 0,
    latitude: 0,
    currentType: '',
    color: '#212121',
  })
  const selectedLayerRef = useRef<any>(null)

  const getCurrentLayer = useCallback(
    (id: string) => {
      const key = id.replaceAll('resource__', '')
      let found: any = null
      const findLayer = (items: any[]) => {
        items.forEach((item) => {
          if (item.id === key) found = item
          if (item.elements) findLayer(item.elements)
        })
      }
      findLayer(mapLayers)
      return found
    },
    [mapLayers]
  )

  const setBaseInfo = useCallback((layer: any) => {
    if (!layer) return
    const geoType = layer.resource?.content.geometry.type
    const state: any = {
      currentType: geoType,
      layerName: layer.name,
      layerId: layer.id,
      color: layer.resource?.content.properties.color,
      longitude: 0,
      latitude: 0,
    }
    if (geoType === GeoType.Point) {
      const coordinate = gcj02towgs84(
        layer.resource?.content.geometry.coordinates[0],
        layer.resource?.content.geometry.coordinates[1]
      )
      state.longitude = coordinate[0]
      state.latitude = coordinate[1]
    }
    setLayerState(state)
  }, [])

  const getElementGroups = useCallback(
    async (type?: string) => {
      const result = await getElementGroupsReq({ groupId: '', isDistributed: true })
      let layers = result.data
      // Transform coordinates from WGS84 to GCJ02
      layers?.forEach((item: any) => {
        if (item.elements) {
          item.elements.forEach((ele: any) => {
            updateCoordinates('wgs84-gcj02', ele)
          })
        }
      })
      if (type === 'init') {
        setLayerInfo(layers)
      }
      useLayerStore.setState({ Layers: layers })
    },
    [setLayerInfo]
  )

  useEffect(() => {
    const element = document.querySelector('.project-layer-wrapper .scrollbar')
    const parent = element?.parentNode as HTMLDivElement
    if (parent) {
      setScrollHeight(parent.clientHeight - (parent.firstElementChild?.clientHeight || 0))
    }
    getElementGroups('init')
  }, [getElementGroups])

  const selectLayer: TreeProps['onSelect'] = (keys, info) => {
    if (info.selected) {
      const layer = getCurrentLayer(info.node.key as string)
      selectedLayerRef.current = layer
      setBaseInfo(layer)
    }
    setVisible(info.selected)
    setDrawVisible(info.selected)
    if (!info.selected) {
      setSelectedKeys([])
    }
  }

  const closeDrawer = () => {
    setDrawVisible(false)
    setVisible(false)
    setSelectedKeys([])
  }

  const changeColor = (color: Color) => {
    setLayerState((prev) => ({ ...prev, color: color.color }))
    updateElements({ ...layerState, color: color.color })
  }

  const changeLayer = () => {
    updateElements(layerState)
  }

  const deleteElement = async () => {
    const elementId = selectedLayerRef.current?.id
    if (!elementId) return
    const res = await deleteElementReq(elementId, {})
    if (res.code !== 0) return
    setVisible(false)
    setDrawVisible(false)
    getElementGroups()
  }

  const updateElements = async (state: typeof layerState) => {
    let content = null
    if (state.currentType === GeoType.Point) {
      const position = {
        height: 0,
        latitude: Number(state.latitude || 0),
        longitude: Number(state.longitude || 0),
      }
      const cxt = generatePoint(position, {
        color: state.color || MapDoodleColor.PinColor,
        clampToGround: true,
      })
      content = {
        type: MapElementEnum.PIN,
        geometry: cxt.geometry,
        properties: cxt.properties,
      }
    } else {
      content = selectedLayerRef.current?.resource?.content
      if (content) {
        content.properties.color = state.color
      }
    }

    await updateElementsReq(state.layerId, {
      name: state.layerName,
      content: content,
    })
    getElementGroups()
  }

  return (
    <div className="project-layer-wrapper" style={{ height: '100%' }}>
      <div style={{ height: 50, lineHeight: '50px', borderBottom: '1px solid #4f4f4f', fontWeight: 450 }}>
        <Row>
          <Col span={1} />
          <Col span={22}>Annotations</Col>
          <Col span={1} />
        </Row>
      </div>
      <div className="scrollbar" style={{ height: scrollHeight || 'calc(100% - 50px)', overflow: 'auto' }}>
        <LayersTree
          layerData={mapLayers}
          className="project-layer-content"
          checkedKeys={checkedKeys}
          selectedKeys={selectedKeys}
          onCheck={(keys) => setCheckedKeys(keys)}
          onSelect={selectLayer}
        />
      </div>
      <Drawer
        title="Map Element"
        placement="right"
        closable
        open={visible}
        mask={false}
        onClose={closeDrawer}
        width={300}
        rootClassName="drawer-element-wrapper"
      >
        <div>
          <div style={{ marginBottom: 10 }}>
            <span style={{ display: 'inline-flex', width: 80 }}>Name:</span>
            <Input
              value={layerState.layerName}
              style={{ width: 120 }}
              placeholder="element name"
              onChange={(e) => {
                setLayerState((prev) => ({ ...prev, layerName: e.target.value }))
                changeLayer()
              }}
            />
          </div>
          {layerState.currentType === GeoType.Point && (
            <>
              <div style={{ marginBottom: 10 }}>
                <span style={{ display: 'inline-flex', width: 80 }}>Longitude:</span>
                <Input
                  value={layerState.longitude}
                  style={{ width: 120 }}
                  placeholder="longitude"
                  onChange={(e) => {
                    setLayerState((prev) => ({ ...prev, longitude: Number(e.target.value) }))
                    changeLayer()
                  }}
                />
              </div>
              <div style={{ marginBottom: 10 }}>
                <span style={{ display: 'inline-flex', width: 80 }}>Latitude:</span>
                <Input
                  value={layerState.latitude}
                  style={{ width: 120 }}
                  placeholder="latitude"
                  onChange={(e) => {
                    setLayerState((prev) => ({ ...prev, latitude: Number(e.target.value) }))
                    changeLayer()
                  }}
                />
              </div>
            </>
          )}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
            <span style={{ marginRight: 30 }}>Color: </span>
            {COLORS.map((item) => (
              <div
                key={item.id}
                style={{
                  cursor: 'pointer',
                  width: 18,
                  height: 18,
                  lineHeight: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: 5,
                  background: item.color,
                }}
                onClick={() => changeColor(item)}
              >
                {item.color === layerState.color && (
                  <span style={{ color: '#fff', fontSize: 14, margin: 'auto' }}>&#10003;</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: 20 }}>
          <Button type="primary" onClick={deleteElement}>
            Delete
          </Button>
        </div>
      </Drawer>
      <style>{`
        .drawer-element-wrapper .ant-drawer-content { background-color: #3c3c3c; color: #fff; }
        .drawer-element-wrapper .ant-drawer-header { background-color: #3c3c3c; }
        .drawer-element-wrapper .ant-drawer-title { color: #fff; }
        .drawer-element-wrapper .ant-drawer-close { color: #fff; }
        .drawer-element-wrapper .ant-input { background-color: #101010; border-color: #4f4f4f; color: #fff; }
      `}</style>
    </div>
  )
}

function updateCoordinates(transformType: string, element: any) {
  const geoType = element.resource?.content.geometry.type
  const type = element.resource?.type
  if (!element.resource) return

  if (MapElementEnum.PIN === type) {
    const coordinates = element.resource.content.geometry.coordinates
    if (transformType === 'wgs84-gcj02') {
      element.resource.content.geometry.coordinates = wgs84togcj02(coordinates[0], coordinates[1])
    } else if (transformType === 'gcj02-wgs84') {
      element.resource.content.geometry.coordinates = gcj02towgs84(coordinates[0], coordinates[1])
    }
  } else if (MapElementEnum.LINE === type) {
    const coordinates = element.resource.content.geometry.coordinates
    coordinates.forEach((coordinate: number[], i: number, arr: any[]) => {
      if (transformType === 'wgs84-gcj02') {
        arr[i] = wgs84togcj02(coordinate[0], coordinate[1])
      } else if (transformType === 'gcj02-wgs84') {
        arr[i] = gcj02towgs84(coordinate[0], coordinate[1])
      }
    })
  } else if (MapElementEnum.POLY === type) {
    const coordinates = element.resource.content.geometry.coordinates[0]
    coordinates.forEach((coordinate: number[], i: number, arr: any[]) => {
      if (transformType === 'wgs84-gcj02') {
        arr[i] = wgs84togcj02(coordinate[0], coordinate[1])
      } else if (transformType === 'gcj02-wgs84') {
        arr[i] = gcj02towgs84(coordinate[0], coordinate[1])
      }
    })
    element.resource.content.geometry.coordinates = [coordinates]
  }
}

export default LayerPage
