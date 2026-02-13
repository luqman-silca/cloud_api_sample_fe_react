import { useEffect, useRef, RefObject } from 'react'

/**
 * React hook replacement for the Vue v-drag-window directive.
 * Attaches pointer-based drag behavior to an element.
 * Looks for a child with class "drag-title" as the drag handle.
 */
export function useDragWindow(elRef: RefObject<HTMLElement | null>) {
  const posRef = useRef({ left: 0, top: 0 })

  useEffect(() => {
    const modal = elRef.current
    if (!modal) return

    const header = modal.getElementsByClassName(
      'drag-title'
    )[0] as HTMLElement | undefined
    if (!header) return

    header.style.cursor = 'move'
    posRef.current.top = posRef.current.top || modal.offsetTop

    const onPointerDown = (e: PointerEvent) => {
      const startX = e.clientX
      const startY = e.clientY
      const headerLeft = header.offsetLeft
      const headerTop = header.offsetTop
      header.setPointerCapture(e.pointerId)

      const onPointerMove = (event: PointerEvent) => {
        const endX = event.clientX
        const endY = event.clientY
        const newLeft = headerLeft + (endX - startX) + posRef.current.left
        const newTop = headerTop + (endY - startY) + posRef.current.top
        modal.style.left = newLeft + 'px'
        modal.style.top = newTop + 'px'
        ;(modal as any)._dragLeft = newLeft
        ;(modal as any)._dragTop = newTop
      }

      const onPointerUp = () => {
        posRef.current.left = (modal as any)._dragLeft || 0
        posRef.current.top = (modal as any)._dragTop || 0
        modal.removeEventListener('pointermove', onPointerMove)
        modal.removeEventListener('pointerup', onPointerUp)
        header.releasePointerCapture(e.pointerId)
      }

      modal.addEventListener('pointermove', onPointerMove)
      modal.addEventListener('pointerup', onPointerUp)
    }

    header.addEventListener('pointerdown', onPointerDown)

    return () => {
      header.removeEventListener('pointerdown', onPointerDown)
    }
  }, [elRef])
}
