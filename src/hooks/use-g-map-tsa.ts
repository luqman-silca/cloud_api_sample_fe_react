import { ELocalStorageKey, EDeviceTypeName } from '@/types'
import { getDeviceBySn } from '@/api/manage'
import { message } from 'antd'
import dockIcon from '@/assets/icons/dock.png'
import rcIcon from '@/assets/icons/rc.png'
import droneIcon from '@/assets/icons/drone.png'
import { useDeviceStore } from '@/store/useDeviceStore'
import { useMapContext } from '@/contexts/MapContext'

export function useGMapTsa() {
  const { aMap: AMap, map } = useMapContext()
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
    if (!trackLine) {
      trackLine = new AMap.Polyline({
        map: map,
        strokeColor: '#939393',
      })
    }
    return trackLine
  }

  function initIcon(type: number) {
    return new AMap.Icon({
      image: icons.get(type),
      imageSize: new AMap.Size(40, 40),
      size: new AMap.Size(40, 40),
    })
  }

  function initMarker(
    type: number,
    name: string,
    sn: string,
    lng?: number,
    lat?: number
  ) {
    if (markers[sn]) {
      return
    }
    if (AMap === undefined || AMap === null) {
      return
    }
    markers[sn] = new AMap.Marker({
      position: new AMap.LngLat(lng || 113.943225499, lat || 22.577673716),
      icon: initIcon(type),
      title: name,
      anchor: 'top-center',
      offset: [0, -20],
    })
    map.add(markers[sn])
  }

  function removeMarker(sn: string) {
    if (!markers[sn]) {
      return
    }
    map.remove(markers[sn])
    getTrackLineInstance().setPath([])
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
    let marker = markers[sn]
    if (!marker) {
      // Try to get device info from store first (no API call needed!)
      const device = deviceInfo[sn] || dockInfo[sn] || gatewayInfo[sn]

      if (device) {
        // Use domain from OSD data
        const domain = device.mode_code !== undefined ? EDeviceTypeName.Aircraft :
                      device.basic_osd ? EDeviceTypeName.Dock :
                      EDeviceTypeName.Gateway

        // Use sn as nickname if not available (will be populated later)
        addMarker(sn, lng, lat, domain, sn)
      } else {
        // Fallback to API call if device not in store yet
        addMarker(sn, lng, lat)
      }

      marker = markers[sn]
      return
    }
    marker.moveTo([lng, lat], {
      duration: 1800,
      autoRotation: true,
    })
  }

  return {
    marker: markers,
    initMarker,
    removeMarker,
    moveTo,
  }
}
