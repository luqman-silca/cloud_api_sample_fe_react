import { ELocalStorageKey, EDeviceTypeName } from '@/types'
import { getDeviceBySn } from '@/api/manage'
import { message } from 'antd'
import dockIcon from '@/assets/icons/dock.png'
import rcIcon from '@/assets/icons/rc.png'
import droneIcon from '@/assets/icons/drone.png'
import { useDeviceStore } from '@/store/useDeviceStore'
import { useMapContext } from '@/contexts/MapContext'
import type { LngLatLike } from 'maplibre-gl'

export function useGMapTsa() {
  const mapContext = useMapContext() // Get the whole context object
  const markerInfo = useDeviceStore((s) => s.markerInfo)
  const deviceInfo = useDeviceStore((s) => s.deviceState.deviceInfo)
  const dockInfo = useDeviceStore((s) => s.deviceState.dockInfo)
  const gatewayInfo = useDeviceStore((s) => s.deviceState.gatewayInfo)

  const icons = new Map([
    [EDeviceTypeName.Aircraft, droneIcon],
    [EDeviceTypeName.Gateway, rcIcon],
    [EDeviceTypeName.Dock, dockIcon],
  ])
  const markers = markerInfo.coverMap
  const paths = markerInfo.pathMap

  let trackLine = null as any
  function getTrackLineInstance() {
    // Track line implementation will be added later if needed
    // MapLibre uses sources and layers for polylines
    return trackLine
  }

  function createMarkerElement(iconUrl: string, title: string): HTMLDivElement {
    const el = document.createElement('div')
    el.className = 'custom-marker'
    el.style.backgroundImage = `url(${iconUrl})`
    el.style.width = '40px'
    el.style.height = '40px'
    el.style.backgroundSize = 'contain'
    el.style.backgroundRepeat = 'no-repeat'
    el.style.cursor = 'pointer'
    el.title = title
    return el
  }

  function initMarker(
    type: number,
    name: string,
    sn: string,
    lng?: number,
    lat?: number
  ) {
    // Read current values from context (not captured closure)
    const { map, aMap: maplibregl } = mapContext
    console.log('initMarker called:', { sn, type, name, lng, lat, hasMap: !!map, hasMaplibregl: !!maplibregl })

    if (markers[sn]) {
      console.log('Marker already exists for:', sn)
      return
    }
    if (!map || !maplibregl) {
      console.warn('Map or maplibregl not available:', { map: !!map, maplibregl: !!maplibregl })
      return
    }

    const iconUrl = icons.get(type)
    if (!iconUrl) {
      console.warn('No icon URL for type:', type)
      return
    }

    console.log('Creating marker element with icon:', iconUrl)
    const el = createMarkerElement(iconUrl, name)

    // Create MapLibre marker
    console.log('Creating MapLibre marker at:', [lng || 101.69, lat || 2.84])
    markers[sn] = new maplibregl.Marker({ element: el })
      .setLngLat([lng || 101.69, lat || 2.84] as LngLatLike)
      .addTo(map)

    console.log('Marker created successfully for:', sn)
  }

  function removeMarker(sn: string) {
    if (!markers[sn]) {
      return
    }
    markers[sn].remove()
    delete markers[sn]
    delete paths[sn]
  }

  function addMarker(sn: string, lng?: number, lat?: number, domain?: number, nickname?: string) {
    // If domain and nickname provided, use them directly (from device store)
    if (domain !== undefined && nickname) {
      initMarker(domain, nickname, sn, lng, lat)
      return
    }

    // Fallback: fetch from API (only if data not available)
    getDeviceBySn(
      localStorage.getItem(ELocalStorageKey.WorkspaceId)!,
      sn
    ).then((data) => {
      if (data.code !== 0) {
        message.error(data.message)
        return
      }
      initMarker(data.data.domain, data.data.nickname, sn, lng, lat)
    })
  }

  function moveTo(sn: string, lng: number, lat: number) {
    // Read current values from context (not captured closure)
    const { map } = mapContext
    console.log('moveTo called:', { sn, lng, lat, markerExists: !!markers[sn], hasMap: !!map })

    let marker = markers[sn]
    if (!marker) {
      console.log('  → Marker does not exist, creating new marker...')
      // Try to get device info from store first (no API call needed!)
      const device = deviceInfo[sn] || dockInfo[sn] || gatewayInfo[sn]

      if (device) {
        // Use domain from OSD data
        const domain = device.mode_code !== undefined ? EDeviceTypeName.Aircraft :
                      device.basic_osd ? EDeviceTypeName.Dock :
                      EDeviceTypeName.Gateway

        console.log('  → Device found in store, domain:', domain)
        // Use sn as nickname if not available (will be populated later)
        addMarker(sn, lng, lat, domain, sn)
      } else {
        console.log('  → Device not in store, calling API...')
        // Fallback to API call if device not in store yet
        addMarker(sn, lng, lat)
      }

      marker = markers[sn]
      console.log('  → After addMarker, marker:', !!marker)
      return
    }

    console.log('  → Marker exists, updating position')
    // MapLibre markers update position instantly
    // For smooth animation, we could use map.flyTo or custom animation
    marker.setLngLat([lng, lat] as LngLatLike)
  }

  return {
    marker: markers,
    initMarker,
    removeMarker,
    moveTo,
  }
}
