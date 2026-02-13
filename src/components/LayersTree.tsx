import { useMemo } from 'react'
import { Tree } from 'antd'
import type { TreeProps } from 'antd'
import { getLayerTreeKey } from '@/utils/layer-tree'
import { Layer } from '@/types/map.d'

interface LayersTreeProps {
  layerData: Layer[]
  className?: string
  checkedKeys?: string[]
  selectedKeys?: string[]
  onCheck?: (keys: string[]) => void
  onSelect?: TreeProps['onSelect']
}

function LayersTree({ layerData, className, checkedKeys, selectedKeys, onCheck, onSelect }: LayersTreeProps) {
  const treeData = useMemo(() => {
    return layerData.map((layer, layerIndex) => ({
      title: layer.name,
      key: layer.id || `layer-${layerIndex}`,
      children: layer.elements?.map((resource: any, resourceIndex: number) => ({
        title: resource.name,
        key: resource.id ? getLayerTreeKey('resource', resource.id) : `resource-${layerIndex}-${resourceIndex}`,
      })) || [],
    }))
  }, [layerData])

  return (
    <span>
      <Tree
        draggable
        defaultExpandAll
        className={`device-map-layers ${className || ''}`}
        treeData={treeData}
        checkable
        checkedKeys={checkedKeys}
        selectedKeys={selectedKeys}
        onCheck={(keys) => onCheck?.(keys as string[])}
        onSelect={onSelect}
      />
      <style>{`
        .device-map-layers.ant-tree { color: #fff; }
        .device-map-layers .ant-tree-node-content-wrapper { color: #fff; }
        .device-map-layers .ant-tree-node-content-wrapper:hover { background-color: transparent; }
        .device-map-layers .ant-tree-node-content-wrapper.ant-tree-node-selected { background-color: transparent; color: #2d8cf0; }
        .device-map-layers .ant-tree-checkbox:not(.ant-tree-checkbox-checked) .ant-tree-checkbox-inner { background-color: unset; }
      `}</style>
    </span>
  )
}

export default LayersTree
