import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface MapState {
  aMap: typeof maplibregl
  map: maplibregl.Map
  mouseTool: any
}

export function useGMapManage() {
  async function initMap(
    container: string,
    onReady: (state: MapState) => void
  ) {
    try {
      // Initialize MapLibre GL map with OpenStreetMap tiles
      const map = new maplibregl.Map({
        container: container,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: [
                'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
              ],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [
            {
              id: 'osm-tiles',
              type: 'raster',
              source: 'osm-tiles',
              minzoom: 0,
              maxzoom: 19
            }
          ]
        },
        center: [101.69, 2.84], // Malaysia (default to drone location)
        zoom: 15,
      })

      // Wait for map to load
      map.on('load', () => {
        onReady({
          aMap: maplibregl,
          map,
          mouseTool: null
        })
      })
    } catch (e) {
      console.log('Map initialization error:', e)
    }
  }

  return {
    initMap,
  }
}
