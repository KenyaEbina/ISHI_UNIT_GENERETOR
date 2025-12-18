import { useState } from 'react'
import Canvas from './components/Canvas'
import { Undo2, RotateCcw, Download } from 'lucide-react'

function App() {
  const [shapes, setShapes] = useState([])
  const [currentPath, setCurrentPath] = useState([])
  const [history, setHistory] = useState([])

  const handleUndo = () => {
    if (currentPath.length > 0) {
      // 描画中: 直前のポイントを取り消す
      setCurrentPath(prev => prev.slice(0, -1))
    } else if (shapes.length > 0) {
      // 待機時: 最後に作成したシェイプを削除
      const newShapes = shapes.slice(0, -1)
      setHistory(prev => [...prev, shapes])
      setShapes(newShapes)
    }
  }

  const handleReset = () => {
    setShapes([])
    setCurrentPath([])
    setHistory([])
  }

  const handleExportSVG = () => {
    const allShapes = [...shapes]
    if (currentPath.length > 0) {
      allShapes.push([...currentPath])
    }

    if (allShapes.length === 0) {
      alert('エクスポートするシェイプがありません。')
      return
    }

    // SVGのviewBoxはグリッド座標に合わせる (0,0)から(10,14)
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 14" width="1000" height="1400">\n`

    allShapes.forEach(shape => {
      if (shape.length < 3) return // 三角形未満は無視

      const pathData = shape.map((point, index) => {
        if (index === 0) {
          return `M ${point.x} ${point.y}`
        }
        return `L ${point.x} ${point.y}`
      })
      pathData.push('Z') // パスを閉じる

      svgContent += `  <path d="${pathData.join(' ')}" fill="#000000" />\n`
    })

    svgContent += `</svg>`

    // ダウンロード
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ishi-unit.svg'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePointClick = (point) => {
    if (currentPath.length === 0) {
      // 新しいパスを開始
      setCurrentPath([point])
    } else {
      const firstPoint = currentPath[0]
      const isSamePoint = firstPoint.x === point.x && firstPoint.y === point.y

      if (isSamePoint && currentPath.length >= 3) {
        // 始点を再度クリック: パスを閉じてシェイプを完成
        setHistory(prev => [...prev, shapes])
        setShapes(prev => [...prev, [...currentPath]])
        setCurrentPath([])
      } else if (!isSamePoint) {
        // 新しいポイントを追加
        setCurrentPath(prev => [...prev, point])
      }
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左側: コントロールパネル */}
          <div className="lg:w-64 flex-shrink-0">
            <h1 className="text-3xl font-bold mb-8 text-black">ISHI(14) GRID</h1>

            <div className="space-y-4">
              <button
                onClick={handleUndo}
                disabled={currentPath.length === 0 && shapes.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Undo2 size={20} />
                <span>Undo</span>
              </button>

              <button
                onClick={handleReset}
                disabled={shapes.length === 0 && currentPath.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <RotateCcw size={20} />
                <span>Reset</span>
              </button>

              <button
                onClick={handleExportSVG}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white hover:bg-gray-800 transition-colors"
              >
                <Download size={20} />
                <span>Export SVG</span>
              </button>
            </div>

            <div className="mt-8 text-sm text-gray-600">
              <p className="mb-2">使い方:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>グリッドの交差点をクリックしてパスを作成</li>
                <li>始点を再度クリックでシェイプを完成</li>
                <li>複数のシェイプを描くことができます</li>
              </ul>
            </div>
          </div>

          {/* 中央: キャンバスエリア */}
          <div className="flex-1 flex items-center justify-center">
            <Canvas
              shapes={shapes}
              currentPath={currentPath}
              onPointClick={handlePointClick}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
