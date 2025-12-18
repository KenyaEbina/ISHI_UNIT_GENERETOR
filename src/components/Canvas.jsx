import { useRef, useEffect, useState, useLayoutEffect } from 'react'

const GRID_COLS = 10
const GRID_ROWS = 14
const INTERSECTION_COLS = GRID_COLS + 1 // 11
const INTERSECTION_ROWS = GRID_ROWS + 1 // 15

function Canvas({ shapes, currentPath, onPointClick }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [canvasSize, setCanvasSize] = useState({ width: 480, height: 672 })
  const [hoveredPoint, setHoveredPoint] = useState(null)

  // キャンバスサイズの計算（10:14のアスペクト比を維持）
  useLayoutEffect(() => {
    const updateSize = () => {
      const container = containerRef.current
      if (!container) return

      const maxWidth = Math.min(800, container.clientWidth - 40)
      const aspectRatio = 10 / 14
      const width = maxWidth * 0.8
      const height = width / aspectRatio

      setCanvasSize({ width, height })
    }

    // 少し遅延させて確実にDOMがレンダリングされた後に実行
    const timer = setTimeout(updateSize, 0)
    window.addEventListener('resize', updateSize)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  // グリッド座標から画面座標への変換
  const gridToScreen = (gridX, gridY) => {
    const cellWidth = canvasSize.width / GRID_COLS
    const cellHeight = canvasSize.height / GRID_ROWS
    return {
      x: gridX * cellWidth,
      y: gridY * cellHeight,
    }
  }

  // 画面座標から最も近いグリッド交差点を検出
  const screenToGrid = (screenX, screenY) => {
    const cellWidth = canvasSize.width / GRID_COLS
    const cellHeight = canvasSize.height / GRID_ROWS

    const gridX = Math.round(screenX / cellWidth)
    const gridY = Math.round(screenY / cellHeight)

    // 範囲チェック
    const clampedX = Math.max(0, Math.min(INTERSECTION_COLS - 1, gridX))
    const clampedY = Math.max(0, Math.min(INTERSECTION_ROWS - 1, gridY))

    return { x: clampedX, y: clampedY }
  }

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const gridPoint = screenToGrid(x, y)
    setHoveredPoint(gridPoint)
  }

  const handleClick = (e) => {
    if (!canvasRef.current || !hoveredPoint) return

    onPointClick(hoveredPoint)
  }

  const handleMouseLeave = () => {
    setHoveredPoint(null)
  }

  // グリッド線の描画
  const renderGrid = () => {
    const lines = []

    // 縦線
    for (let i = 0; i <= GRID_COLS; i++) {
      const { x } = gridToScreen(i, 0)
      lines.push(
        <line
          key={`v-${i}`}
          x1={x}
          y1={0}
          x2={x}
          y2={canvasSize.height}
          stroke="#e5e5e5"
          strokeWidth="1"
        />
      )
    }

    // 横線
    for (let i = 0; i <= GRID_ROWS; i++) {
      const { y } = gridToScreen(0, i)
      lines.push(
        <line
          key={`h-${i}`}
          x1={0}
          y1={y}
          x2={canvasSize.width}
          y2={y}
          stroke="#e5e5e5"
          strokeWidth="1"
        />
      )
    }

    return lines
  }

  // 交差点の描画
  const renderIntersections = () => {
    const points = []

    for (let y = 0; y < INTERSECTION_ROWS; y++) {
      for (let x = 0; x < INTERSECTION_COLS; x++) {
        const { x: screenX, y: screenY } = gridToScreen(x, y)
        const isHovered = hoveredPoint && hoveredPoint.x === x && hoveredPoint.y === y
        const isInCurrentPath = currentPath.some(p => p.x === x && p.y === y)
        const isFirstPoint = currentPath.length > 0 && currentPath[0].x === x && currentPath[0].y === y

        let fill = '#d1d1d1'
        let r = 3

        if (isHovered) {
          fill = '#000000'
          r = 5
        } else if (isFirstPoint && currentPath.length >= 3) {
          fill = '#4a4a4a'
          r = 4
        } else if (isInCurrentPath) {
          fill = '#666666'
          r = 4
        }

        points.push(
          <circle
            key={`point-${x}-${y}`}
            cx={screenX}
            cy={screenY}
            r={r}
            fill={fill}
            className="cursor-pointer"
          />
        )
      }
    }

    return points
  }

  // 完成したシェイプの描画
  const renderShapes = () => {
    return shapes.map((shape, shapeIndex) => {
      if (shape.length < 3) return null

      const pathData = shape.map((point, index) => {
        const { x, y } = gridToScreen(point.x, point.y)
        if (index === 0) {
          return `M ${x} ${y}`
        }
        return `L ${x} ${y}`
      })
      pathData.push('Z')

      return (
        <path
          key={`shape-${shapeIndex}`}
          d={pathData.join(' ')}
          fill="#000000"
        />
      )
    })
  }

  // 現在描画中のパスの描画
  const renderCurrentPath = () => {
    if (currentPath.length === 0) return null

    const pathData = currentPath.map((point, index) => {
      const { x, y } = gridToScreen(point.x, point.y)
      if (index === 0) {
        return `M ${x} ${y}`
      }
      return `L ${x} ${y}`
    })

    // ホバー中のポイントがある場合は、そこまでの線を表示
    if (hoveredPoint && currentPath.length > 0) {
      const lastPoint = currentPath[currentPath.length - 1]
      if (hoveredPoint.x !== lastPoint.x || hoveredPoint.y !== lastPoint.y) {
        const { x, y } = gridToScreen(hoveredPoint.x, hoveredPoint.y)
        pathData.push(`L ${x} ${y}`)
      }
    }

    return (
      <path
        d={pathData.join(' ')}
        stroke="#000000"
        strokeWidth="2"
        fill="none"
        strokeDasharray="4 4"
      />
    )
  }

  return (
    <div ref={containerRef} className="w-full flex items-center justify-center">
      <svg
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="border border-gray-300 bg-white"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={handleMouseLeave}
      >
        {renderGrid()}
        {renderShapes()}
        {renderCurrentPath()}
        {renderIntersections()}
      </svg>
    </div>
  )
}

export default Canvas
