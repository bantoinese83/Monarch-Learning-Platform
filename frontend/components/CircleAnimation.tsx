'use client'

import { useEffect, useMemo, useRef } from 'react'

const clamp = (value: number) => Math.max(0, Math.min(1, value))

const hexToRgb = (hex: string) => {
  let sanitized = hex.replace('#', '')
  if (sanitized.length === 3) {
    sanitized = sanitized
      .split('')
      .map(c => c + c)
      .join('')
  }
  const num = parseInt(sanitized, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `${r}, ${g}, ${b}`
}

const normalizeColor = (color: string) => {
  if (color.startsWith('#')) {
    return hexToRgb(color)
  }
  if (color.startsWith('rgb')) {
    const matches = color.match(/(\d+\.?\d*)/g)
    if (!matches) return '56, 189, 248'
    return matches.slice(0, 3).join(', ')
  }
  return color
}

interface ColorFns {
  fillColor: (opacity: number) => string
  strokeColor: (opacity: number) => string
}

interface CircleAnimationProps {
  type?: 'sphere-scan' | 'crystalline-refraction' | 'sonar-sweep' | 'helix-scanner' | 'interconnecting-waves' | 'cylindrical-analysis' | 'voxel-matrix-morph' | 'phased-array-emitter' | 'crystalline-cube-refraction'
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
  title?: string
  color?: string
}

const CANVAS_SIZES = {
  sm: { width: 120, height: 120 },
  md: { width: 180, height: 180 },
  lg: { width: 220, height: 220 }
}

export default function CircleAnimation({
  type = 'sphere-scan',
  size = 'md',
  text,
  fullScreen = false,
  title,
  color = '#38bdf8'
}: CircleAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  const canvasSize = CANVAS_SIZES[size]
  const colorRgb = useMemo(() => normalizeColor(color), [color])

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvasSize.width
    canvas.height = canvasSize.height

    const colorFns: ColorFns = {
      fillColor: opacity => `rgba(${colorRgb}, ${clamp(opacity)})`,
      strokeColor: opacity => `rgba(${colorRgb}, ${clamp(opacity)})`
    }

    // Initialize animation based on type
    const cleanup = initializeAnimation(type, ctx, canvasSize.width, canvasSize.height, colorFns)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      cleanup?.()
    }
  }, [type, size, colorRgb])

  const initializeAnimation = (animationType: string, ctx: CanvasRenderingContext2D, width: number, height: number, colors: ColorFns) => {
    const GLOBAL_SPEED = 0.5
    let time = 0
    let lastTime = 0

    const centerX = width / 2
    const centerY = height / 2

    function easeInOutCubic(t: number) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    }

    function animate(timestamp: number) {
      if (!lastTime) lastTime = timestamp
      const deltaTime = timestamp - lastTime
      lastTime = timestamp
      time += deltaTime * 0.0005 * GLOBAL_SPEED

      ctx.clearRect(0, 0, width, height)

      switch (animationType) {
        case 'sphere-scan':
          drawSphereScan(ctx, time, centerX, centerY, width, height, colors, easeInOutCubic)
          break
        case 'crystalline-refraction':
          drawCrystallineRefraction(ctx, time, centerX, centerY, width, height, colors, easeInOutCubic)
          break
        case 'sonar-sweep':
          drawSonarSweep(ctx, time, centerX, centerY, colors)
          break
        case 'helix-scanner':
          drawHelixScanner(ctx, time, centerX, centerY, width, height, colors, easeInOutCubic)
          break
        case 'interconnecting-waves':
          drawInterconnectingWaves(ctx, time, centerX, centerY, width, height, colors)
          break
        case 'cylindrical-analysis':
          drawCylindricalAnalysis(ctx, time, centerX, centerY, width, height, colors, easeInOutCubic)
          break
        case 'voxel-matrix-morph':
          drawVoxelMatrixMorph(ctx, time, centerX, centerY, width, height, colors, easeInOutCubic)
          break
        case 'phased-array-emitter':
          drawPhasedArrayEmitter(ctx, time, centerX, centerY, width, height, colors, easeInOutCubic)
          break
        case 'crystalline-cube-refraction':
          drawCrystallineCubeRefraction(ctx, time, centerX, centerY, width, height, colors, easeInOutCubic)
          break
        default:
          drawSphereScan(ctx, time, centerX, centerY, width, height, colors, easeInOutCubic)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }

  // Animation drawing functions
  const drawSphereScan = (
    ctx: CanvasRenderingContext2D,
    time: number,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    colors: ColorFns,
    easeInOutCubic: (t: number) => number
  ) => {
    const radius = width * 0.4
    const numDots = 250
    const dots = []

    for (let i = 0; i < numDots; i++) {
      const theta = Math.acos(1 - 2 * (i / numDots))
      const phi = Math.sqrt(numDots * Math.PI) * theta
      dots.push({
        x: radius * Math.sin(theta) * Math.cos(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(theta)
      })
    }

    const rotX = Math.sin(time * 0.3) * 0.5
    const rotY = time * 0.5
    const easedTime = easeInOutCubic((Math.sin(time * 2.5) + 1) / 2)
    const scanLine = (easedTime * 2 - 1) * radius
    const scanWidth = 25

    dots.forEach((dot: any) => {
      let { x, y, z } = dot
      let nX = x * Math.cos(rotY) - z * Math.sin(rotY)
      let nZ = x * Math.sin(rotY) + z * Math.cos(rotY)
      x = nX
      z = nZ
      let nY = y * Math.cos(rotX) - z * Math.sin(rotX)
      nZ = y * Math.sin(rotX) + z * Math.cos(rotX)
      y = nY
      z = nZ

      const scale = (z + radius * 1.5) / (radius * 2.5)
      const pX = centerX + x
      const pY = centerY + y
      const distToScan = Math.abs(y - scanLine)
      let scanInfluence = distToScan < scanWidth ? Math.cos((distToScan / scanWidth) * (Math.PI / 2)) : 0
      const size = Math.max(0, scale * 2.0 + scanInfluence * 2.5)
      const opacity = Math.max(0, scale * 0.6 + scanInfluence * 0.4)

      ctx.beginPath()
      ctx.arc(pX, pY, size, 0, Math.PI * 2)
      ctx.fillStyle = colors.fillColor(opacity)
      ctx.fill()
    })
  }

  const drawCrystallineRefraction = (
    ctx: CanvasRenderingContext2D,
    time: number,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    colors: ColorFns,
    easeInOutCubic: (t: number) => number
  ) => {
    const gridSize = 15
    const spacing = width / (gridSize - 1)
    const dots = []

    for (let r = 0; r < gridSize; r++)
      for (let c = 0; c < gridSize; c++)
        dots.push({ x: c * spacing, y: r * spacing })

    const waveRadius = time % (width * 1.2)
    const waveWidth = 60

    dots.forEach((dot: any) => {
      const dist = Math.hypot(dot.x - centerX, dot.y - centerY)
      const distToWave = Math.abs(dist - waveRadius)
      let displacement = 0

      if (distToWave < waveWidth / 2) {
        const wavePhase = (distToWave / (waveWidth / 2)) * Math.PI
        displacement = easeInOutCubic(Math.sin(wavePhase)) * 10
      }

      const angleToCenter = Math.atan2(dot.y - centerY, dot.x - centerX)
      const dx = Math.cos(angleToCenter) * displacement
      const dy = Math.sin(angleToCenter) * displacement
      const opacity = 0.2 + (Math.abs(displacement) / 10) * 0.8
      const size = 1.2 + (Math.abs(displacement) / 10) * 2

      ctx.beginPath()
      ctx.arc(dot.x + dx, dot.y + dy, size, 0, Math.PI * 2)
      ctx.fillStyle = colors.fillColor(opacity)
      ctx.fill()
    })
  }

  const drawSonarSweep = (
    ctx: CanvasRenderingContext2D,
    time: number,
    centerX: number,
    centerY: number,
    colors: ColorFns
  ) => {
    const scanAngle = (time * 0.001 * (Math.PI / 2) * 0.5) % (Math.PI * 2)

    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(centerX + 85 * Math.cos(scanAngle), centerY + 85 * Math.sin(scanAngle))
    ctx.strokeStyle = colors.strokeColor(0.5)
    ctx.lineWidth = 1
    ctx.stroke()

    // Simple dot pattern for sonar
    for (let r = 20; r <= 80; r += 15) {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const x = centerX + r * Math.cos(angle)
        const y = centerY + r * Math.sin(angle)
        const opacity = 0.3 + Math.sin(time * 2 + i) * 0.4

        ctx.beginPath()
        ctx.arc(x, y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = colors.fillColor(opacity)
        ctx.fill()
      }
    }
  }

  const drawHelixScanner = (
    ctx: CanvasRenderingContext2D,
    time: number,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    colors: ColorFns,
    easeInOutCubic: (t: number) => number
  ) => {
    const numDots = 50
    const radius = 35
    const height_range = 120
    const dots = []

    for (let i = 0; i < numDots; i++)
      dots.push({ angle: i * 0.3, y: (i / numDots) * height_range - height_range / 2 })

    const rotation = time
    const scanY = Math.sin(time * 2) * (height_range / 2)
    const scanWidth = 25

    dots.forEach((dot: any) => {
      const x = radius * Math.cos(dot.angle + rotation)
      const z = radius * Math.sin(dot.angle + rotation)
      const pX = centerX + x
      const pY = centerY + dot.y
      const scale = (z + radius) / (radius * 2)
      const distToScan = Math.abs(dot.y - scanY)
      const scanInfluence = distToScan < scanWidth ? Math.cos((distToScan / scanWidth) * (Math.PI / 2)) : 0
      const size = Math.max(0, scale * 1.8 + scanInfluence * 2.8)
      const opacity = Math.max(0, scale * 0.4 + scanInfluence * 0.6)

      ctx.beginPath()
      ctx.arc(pX, pY, size, 0, Math.PI * 2)
      ctx.fillStyle = colors.fillColor(opacity)
      ctx.fill()
    })
  }

  const drawInterconnectingWaves = (
    ctx: CanvasRenderingContext2D,
    time: number,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    colors: ColorFns
  ) => {
    const dotRings = [
      { radius: 20, count: 12 },
      { radius: 45, count: 24 },
      { radius: 70, count: 36 }
    ]

    dotRings.forEach((ring, ringIndex) => {
      if (ringIndex >= dotRings.length - 1) return
      const nextRing = dotRings[ringIndex + 1]

      for (let i = 0; i < ring.count; i++) {
        const angle = (i / ring.count) * Math.PI * 2
        const radiusPulse1 = Math.sin(time * 2 - ringIndex * 0.4) * 3
        const x1 = centerX + Math.cos(angle) * (ring.radius + radiusPulse1)
        const y1 = centerY + Math.sin(angle) * (ring.radius + radiusPulse1)

        const nextRingRatio = nextRing.count / ring.count
        for (let j = 0; j < nextRingRatio; j++) {
          const nextAngle = ((i * nextRingRatio + j) / nextRing.count) * Math.PI * 2
          const radiusPulse2 = Math.sin(time * 2 - (ringIndex + 1) * 0.4) * 3
          const x2 = centerX + Math.cos(nextAngle) * (nextRing.radius + radiusPulse2)
          const y2 = centerY + Math.sin(nextAngle) * (nextRing.radius + radiusPulse2)

          const lineOpacity = 0.1 + ((Math.sin(time * 3 - ringIndex * 0.5 + i * 0.3) + 1) / 2) * 0.4
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.lineWidth = 0.75
          ctx.strokeStyle = colors.strokeColor(lineOpacity)
          ctx.stroke()
        }
      }
    })

    dotRings.forEach((ring, ringIndex) => {
      for (let i = 0; i < ring.count; i++) {
        const angle = (i / ring.count) * Math.PI * 2
        const radiusPulse = Math.sin(time * 2 - ringIndex * 0.4) * 3
        const x = centerX + Math.cos(angle) * (ring.radius + radiusPulse)
        const y = centerY + Math.sin(angle) * (ring.radius + radiusPulse)
        const dotOpacity = 0.4 + Math.sin(time * 2 - ringIndex * 0.4 + i * 0.2) * 0.6

        ctx.beginPath()
        ctx.arc(x, y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = colors.fillColor(dotOpacity)
        ctx.fill()
      }
    })
  }

  const drawCylindricalAnalysis = (
    ctx: CanvasRenderingContext2D,
    time: number,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    colors: ColorFns,
    easeInOutCubic: (t: number) => number
  ) => {
    const radius = 60
    const height_range = 100
    const numLayers = 15
    const dotsPerLayer = 25

    const easedTime = easeInOutCubic((Math.sin(time * 2) + 1) / 2)
    const scanY = centerY + (easedTime * 2 - 1) * (height_range / 2)
    const scanWidth = 15

    for (let i = 0; i < numLayers; i++) {
      const layerY = centerY + (i / (numLayers - 1) - 0.5) * height_range
      const rot = time * (0.2 + (i % 2) * 0.1)

      for (let j = 0; j < dotsPerLayer; j++) {
        const angle = (j / dotsPerLayer) * Math.PI * 2 + rot
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        const scale = (z + radius) / (radius * 2)
        const pX = centerX + x * scale
        const pY = layerY
        const distToScan = Math.abs(pY - scanY)
        const scanInfluence = distToScan < scanWidth ? Math.cos((distToScan / scanWidth) * (Math.PI / 2)) : 0
        const size = Math.max(0, scale * 1.5 + scanInfluence * 2)
        const opacity = Math.max(0, scale * 0.5 + scanInfluence * 0.5)

        ctx.beginPath()
        ctx.arc(pX, pY, size, 0, Math.PI * 2)
        ctx.fillStyle = colors.fillColor(opacity)
        ctx.fill()
      }
    }
  }

  const drawVoxelMatrixMorph = (
    ctx: CanvasRenderingContext2D,
    time: number,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    colors: ColorFns,
    easeInOutCubic: (t: number) => number
  ) => {
    const points = []
    const gridSize = 5
    const spacing = 20
    const cubeHalfSize = ((gridSize - 1) * spacing) / 2

    for (let x = 0; x < gridSize; x++)
      for (let y = 0; y < gridSize; y++)
        for (let z = 0; z < gridSize; z++)
          points.push({
            x: x * spacing - cubeHalfSize,
            y: y * spacing - cubeHalfSize,
            z: z * spacing - cubeHalfSize
          })

    const rotX = time * 0.4
    const rotY = time * 0.6
    const easedTime = easeInOutCubic((Math.sin(time * 2) + 1) / 2)
    const scanLine = (easedTime * 2 - 1) * (cubeHalfSize + 10)
    const scanWidth = 30

    points.forEach((p: any) => {
      let { x, y, z } = p
      let nX = x * Math.cos(rotY) - z * Math.sin(rotY)
      let nZ = x * Math.sin(rotY) + z * Math.cos(rotY)
      x = nX
      z = nZ
      let nY = y * Math.cos(rotX) - z * Math.sin(rotX)
      nZ = y * Math.sin(rotX) + z * Math.cos(rotX)
      y = nY
      z = nZ

      const distToScan = Math.abs(y - scanLine)
      let scanInfluence = 0
      let displacement = 1

      if (distToScan < scanWidth) {
        scanInfluence = Math.cos((distToScan / scanWidth) * (Math.PI / 2))
        displacement = 1 + scanInfluence * 0.4
      }

      const scale = (z + 80) / 160
      const pX = centerX + x * displacement
      const pY = centerY + y * displacement
      const size = Math.max(0, scale * 2 + scanInfluence * 2)
      const opacity = Math.max(0.1, scale * 0.7 + scanInfluence * 0.3)

      ctx.beginPath()
      ctx.arc(pX, pY, size, 0, Math.PI * 2)
      ctx.fillStyle = colors.fillColor(opacity)
      ctx.fill()
    })
  }

  const drawPhasedArrayEmitter = (
    ctx: CanvasRenderingContext2D,
    time: number,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    colors: ColorFns,
    easeInOutCubic: (t: number) => number
  ) => {
    const fov = 300
    const points: Array<{ x: number; y: number; z: number; radius: number }> = []
    const ringRadii = [20, 40, 60, 80]
    const pointsPerRing = [12, 18, 24, 30]
    const maxRadius = ringRadii[ringRadii.length - 1]

    ringRadii.forEach((radius, i) => {
      for (let j = 0; j < pointsPerRing[i]; j++) {
        const angle = (j / pointsPerRing[i]) * Math.PI * 2
        points.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          z: 0,
          radius: radius
        })
      }
    })

    const rotX = 1.0
    const rotY = time * 0.2
    const waveRadius = (time * 120) % (maxRadius * 1.8)
    const waveWidth = 50
    const waveHeight = 18

    const pointsToDraw: Array<{ x: number; y: number; z: number; size: number; opacity: number }> = []

    points.forEach((p_orig: { x: number; y: number; z: number; radius: number }) => {
      let { x, y, z } = p_orig
      const distFromCenter = Math.hypot(x, y)
      const distToWave = Math.abs(distFromCenter - waveRadius)
      let waveInfluence = 0

      if (distToWave < waveWidth / 2) {
        const wavePhase = (1 - distToWave / (waveWidth / 2)) * Math.PI
        z = easeInOutCubic(Math.sin(wavePhase)) * waveHeight
        waveInfluence = z / waveHeight
      }

      const cY = Math.cos(rotY)
      const sY = Math.sin(rotY)
      let tX = x * cY - z * sY
      let tZ = x * sY + z * cY
      x = tX
      z = tZ

      const cX = Math.cos(rotX)
      const sX = Math.sin(rotX)
      let tY = y * cX - z * sX
      tZ = y * sX + z * cX
      y = tY
      z = tZ

      const scale = fov / (fov + z + 100)
      const pX = centerX + x * scale
      const pY = centerY + y * scale
      const size = (1.5 + waveInfluence * 2.5) * scale
      const opacity = 0.4 + waveInfluence * 0.6

      pointsToDraw.push({ x: pX, y: pY, z, size, opacity })
    })

      pointsToDraw
        .sort((a: any, b: any) => a.z - b.z)
        .forEach((p: any) => {
          if (p.size < 0.1) return
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = colors.fillColor(p.opacity)
          ctx.fill()
        })
  }

  const drawCrystallineCubeRefraction = (
    ctx: CanvasRenderingContext2D,
    time: number,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    colors: ColorFns,
    easeInOutCubic: (t: number) => number
  ) => {
    const fov = 250
    const points = []
    const gridSize = 7
    const spacing = 15
    const cubeHalfSize = ((gridSize - 1) * spacing) / 2
    const maxDist = Math.hypot(cubeHalfSize, cubeHalfSize, cubeHalfSize)

    for (let x = 0; x < gridSize; x++)
      for (let y = 0; y < gridSize; y++)
        for (let z = 0; z < gridSize; z++)
          points.push({
            x: x * spacing - cubeHalfSize,
            y: y * spacing - cubeHalfSize,
            z: z * spacing - cubeHalfSize
          })

    const rotX = time * 2
    const rotY = time * 3
    const waveRadius = (time * 120) % (maxDist * 1.5)
    const waveWidth = 40
    const displacementMagnitude = 10

    const pointsToDraw: Array<{ x: number; y: number; z: number; size: number; opacity: number }> = []

    points.forEach((p_orig) => {
      let { x, y, z } = p_orig
      const distFromCenter = Math.hypot(x, y, z)
      const distToWave = Math.abs(distFromCenter - waveRadius)
      let displacementAmount = 0

      if (distToWave < waveWidth / 2) {
        const wavePhase = (distToWave / (waveWidth / 2)) * (Math.PI / 2)
        displacementAmount = easeInOutCubic(Math.cos(wavePhase)) * displacementMagnitude
      }

      if (displacementAmount > 0 && distFromCenter > 0) {
        const ratio = (distFromCenter + displacementAmount) / distFromCenter
        x *= ratio
        y *= ratio
        z *= ratio
      }

      const cY = Math.cos(rotY)
      const sY = Math.sin(rotY)
      let tX = x * cY - z * sY
      let tZ = x * sY + z * cY
      x = tX
      z = tZ

      const cX = Math.cos(rotX)
      const sX = Math.sin(rotX)
      let tY = y * cX - z * sX
      tZ = y * sX + z * cX
      y = tY
      z = tZ

      const scale = fov / (fov + z)
      const pX = centerX + x * scale
      const pY = centerY + y * scale
      const waveInfluence = displacementAmount / displacementMagnitude
      const size = (1.5 + waveInfluence * 2.5) * scale
      const opacity = Math.max(0.1, scale * 0.7 + waveInfluence * 0.4)

      if (size > 0.1) pointsToDraw.push({ x: pX, y: pY, z, size, opacity })
    })

      pointsToDraw
        .sort((a: any, b: any) => a.z - b.z)
        .forEach((p: any) => {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = colors.fillColor(p.opacity)
          ctx.fill()
        })
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        ref={containerRef}
        className="relative flex items-center justify-center rounded-2xl bg-gradient-to-b from-primary-50/30 to-white/10 shadow-inner"
        style={{ width: canvasSize.width, height: canvasSize.height }}
      >
        <canvas
          ref={canvasRef}
          className="rounded-[1.25rem]"
          style={{ background: 'transparent' }}
        />
        {title && (
          <div className="absolute bottom-2 left-2 right-2 text-center">
            <div className="text-xs text-primary-600 uppercase tracking-wide">{title}</div>
          </div>
        )}
      </div>
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return <div className="flex min-h-screen items-center justify-center">{content}</div>
  }

  return content
}
