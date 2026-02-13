import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface MapContextType {
  aMap: any
  map: any
  mouseTool: any
  setAMap: (aMap: any) => void
  setMap: (map: any) => void
  setMouseTool: (mouseTool: any) => void
}

const MapContext = createContext<MapContextType>({
  aMap: null,
  map: null,
  mouseTool: null,
  setAMap: () => {},
  setMap: () => {},
  setMouseTool: () => {},
})

export function MapProvider({ children }: { children: ReactNode }) {
  const [aMap, setAMap] = useState<any>(null)
  const [map, setMap] = useState<any>(null)
  const [mouseTool, setMouseTool] = useState<any>(null)

  return (
    <MapContext.Provider
      value={{
        aMap,
        map,
        mouseTool,
        setAMap,
        setMap,
        setMouseTool,
      }}
    >
      {children}
    </MapContext.Provider>
  )
}

export function useMapContext() {
  return useContext(MapContext)
}

export default MapContext
