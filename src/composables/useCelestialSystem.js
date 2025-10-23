import * as THREE from 'three'
import { CONFIG } from '../utils/config.js'
import { CELESTIAL_BODIES, TIME_SCALE } from '../utils/celestialBodies.js'

/**
 * 天体系统管理器
 * 负责创建和管理月球、行星、彗星等天体
 */
export function useCelestialSystem(scene, earthGroup, sunLight) {
  const celestialGroup = new THREE.Group()
  scene.add(celestialGroup)

  const bodies = {}
  const orbits = {}
  let timeScale = TIME_SCALE.default
  let elapsedTime = 0

  // 缓存向量对象以避免每帧创建临时对象（性能优化）
  const _tempVector1 = new THREE.Vector3()
  const _tempVector2 = new THREE.Vector3()
  const _tempVector3 = new THREE.Vector3()

  /**
   * 生成月球纹理（程序化Canvas贴图）
   */
  function createMoonTexture(size = 512) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    // 1. 基础月球表面（灰色渐变）
    const baseGradient = ctx.createRadialGradient(
      size * 0.4, size * 0.4, 0,
      size * 0.5, size * 0.5, size * 0.6
    )
    baseGradient.addColorStop(0, '#e0e0e0')    // 中心亮区
    baseGradient.addColorStop(0.5, '#c9c9c9')  // 中间灰色
    baseGradient.addColorStop(1, '#999999')    // 边缘暗区

    ctx.fillStyle = baseGradient
    ctx.fillRect(0, 0, size, size)

    // 2. 添加月球暗色区域（月海）
    const seaRegions = [
      { x: 0.3, y: 0.35, radius: 0.15, opacity: 0.4 },
      { x: 0.6, y: 0.5, radius: 0.12, opacity: 0.35 },
      { x: 0.45, y: 0.65, radius: 0.1, opacity: 0.3 },
      { x: 0.7, y: 0.3, radius: 0.08, opacity: 0.25 }
    ]

    seaRegions.forEach(region => {
      const seaGradient = ctx.createRadialGradient(
        size * region.x, size * region.y, 0,
        size * region.x, size * region.y, size * region.radius
      )
      seaGradient.addColorStop(0, `rgba(80, 80, 80, ${region.opacity})`)
      seaGradient.addColorStop(1, 'rgba(80, 80, 80, 0)')

      ctx.fillStyle = seaGradient
      ctx.fillRect(0, 0, size, size)
    })

    // 3. 添加陨石坑（大中小三种尺寸）
    ctx.globalCompositeOperation = 'multiply'

    // 大陨石坑
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * size
      const y = Math.random() * size
      const radius = Math.random() * 15 + 10
      const opacity = Math.random() * 0.4 + 0.3

      const craterGradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      craterGradient.addColorStop(0, `rgba(60, 60, 60, ${opacity})`)
      craterGradient.addColorStop(0.6, `rgba(100, 100, 100, ${opacity * 0.5})`)
      craterGradient.addColorStop(1, 'rgba(100, 100, 100, 0)')

      ctx.fillStyle = craterGradient
      ctx.fillRect(0, 0, size, size)
    }

    // 中等陨石坑
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * size
      const y = Math.random() * size
      const radius = Math.random() * 8 + 4
      const opacity = Math.random() * 0.3 + 0.2

      const craterGradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      craterGradient.addColorStop(0, `rgba(70, 70, 70, ${opacity})`)
      craterGradient.addColorStop(1, 'rgba(70, 70, 70, 0)')

      ctx.fillStyle = craterGradient
      ctx.fillRect(0, 0, size, size)
    }

    // 小陨石坑（细节）
    ctx.globalCompositeOperation = 'source-over'
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * size
      const y = Math.random() * size
      const radius = Math.random() * 3 + 1

      ctx.fillStyle = `rgba(80, 80, 80, ${Math.random() * 0.2 + 0.1})`
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    // 创建纹理
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }

  /**
   * 创建月球（静态贴图版，性能优化）
   */
  function createMoon() {
    const config = CELESTIAL_BODIES.moon
    if (!config.enabled) return

    // 月球几何体
    const geometry = new THREE.SphereGeometry(config.radius, 32, 32)
    const moonTexture = createMoonTexture(512)

    // 使用 MeshBasicMaterial 减少光照计算
    const material = new THREE.MeshBasicMaterial({
      map: moonTexture
    })
    const moon = new THREE.Mesh(geometry, material)

    // 创建月球轨道组（跟随地球旋转）
    const moonOrbit = new THREE.Group()
    earthGroup.add(moonOrbit)

    // 设置初始位置
    moon.position.x = config.orbitRadius
    moonOrbit.add(moon)

    bodies.moon = {
      mesh: moon,
      orbit: moonOrbit,
      config: config,
      angle: 0
    }

    console.log('月球已创建（静态贴图优化版）')
  }

  /**
   * 生成太阳纹理（程序化Canvas贴图）
   */
  function createSunTexture(size = 512) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    // 创建径向渐变（太阳表面）
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    )

    // 太阳核心到边缘的颜色渐变
    gradient.addColorStop(0, '#ffffff')    // 中心：白色
    gradient.addColorStop(0.3, '#ffee44')  // 内层：亮黄色
    gradient.addColorStop(0.6, '#ffaa00')  // 中层：橙黄色
    gradient.addColorStop(0.85, '#ff8800') // 外层：橙色
    gradient.addColorStop(1, '#ff6600')    // 边缘：深橙色

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    // 添加太阳黑子和纹理细节（随机噪点）
    ctx.globalCompositeOperation = 'multiply'
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * size
      const y = Math.random() * size
      const radius = Math.random() * 8 + 2
      const opacity = Math.random() * 0.3 + 0.1

      const spotGradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      spotGradient.addColorStop(0, `rgba(80, 40, 0, ${opacity})`)
      spotGradient.addColorStop(1, 'rgba(80, 40, 0, 0)')

      ctx.fillStyle = spotGradient
      ctx.fillRect(0, 0, size, size)
    }

    // 创建纹理
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }

  /**
   * 生成光晕纹理（透明渐变圆形）
   */
  function createGlowTexture(size = 256) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    // 创建径向渐变（中心亮，边缘透明）
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    )

    gradient.addColorStop(0, 'rgba(255, 220, 100, 0.8)')
    gradient.addColorStop(0.4, 'rgba(255, 180, 80, 0.4)')
    gradient.addColorStop(0.7, 'rgba(255, 140, 60, 0.15)')
    gradient.addColorStop(1, 'rgba(255, 100, 40, 0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }

  /**
   * 创建太阳（静态贴图版，性能优化）
   */
  function createSun() {
    const config = CELESTIAL_BODIES.sun
    if (!config.enabled) return

    const sunGroup = new THREE.Group()

    // 1. 太阳核心球体（使用程序化纹理）
    const coreGeometry = new THREE.SphereGeometry(config.radius, 32, 32)
    const sunTexture = createSunTexture(512)

    const coreMaterial = new THREE.MeshBasicMaterial({
      map: sunTexture,
      emissive: new THREE.Color(0xffaa00),
      emissiveIntensity: 0.8
    })
    const sunCore = new THREE.Mesh(coreGeometry, coreMaterial)
    sunGroup.add(sunCore)

    // 2. 光晕层（单层透明贴图，性能优化）
    let corona = null
    if (CONFIG.earth.celestial?.sun?.enableCorona !== false) {
      const glowTexture = createGlowTexture(256)
      const glowGeometry = new THREE.SphereGeometry(config.radius * 1.8, 24, 24)
      const glowMaterial = new THREE.MeshBasicMaterial({
        map: glowTexture,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false
      })
      corona = new THREE.Mesh(glowGeometry, glowMaterial)
      sunGroup.add(corona)
    }

    // 添加到场景
    celestialGroup.add(sunGroup)

    bodies.sun = {
      mesh: sunGroup,
      core: sunCore,
      corona: corona,
      config: config
    }

    console.log('太阳已创建（静态贴图优化版）')
  }

  /**
   * 创建行星
   */
  function createPlanet(key) {
    const config = CELESTIAL_BODIES[key]
    if (!config.enabled || config.type !== 'planet') return

    // 行星几何体 - 降低细分度以提升性能
    const geometry = new THREE.SphereGeometry(config.radius, 32, 32)
    const material = new THREE.MeshPhongMaterial({
      color: config.color,
      emissive: config.emissive || 0x000000,
      specular: config.specular || 0x333333,
      shininess: config.shininess || 30
    })
    const planet = new THREE.Mesh(geometry, material)

    // 如果是土星，添加光环
    if (config.hasRings) {
      const ringGeometry = new THREE.RingGeometry(
        config.ringInnerRadius,
        config.ringOuterRadius,
        64 // 降低细分度
      )
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: config.ringColor || 0xccaa88,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      })
      const ring = new THREE.Mesh(ringGeometry, ringMaterial)
      ring.rotation.x = Math.PI / 2
      planet.add(ring)
    }

    // 创建轨道组
    const orbitGroup = new THREE.Group()
    celestialGroup.add(orbitGroup)

    // 设置初始位置
    planet.position.x = config.orbitRadius
    orbitGroup.add(planet)

    bodies[key] = {
      mesh: planet,
      orbit: orbitGroup,
      config: config,
      angle: Math.random() * Math.PI * 2 // 随机初始角度
    }

    console.log(`${config.name}已创建`)
  }

  /**
   * 创建彗星（改进版，双尾效果）
   */
  function createComet() {
    const config = CELESTIAL_BODIES.comet
    if (!config.enabled) return

    const cometGroup = new THREE.Group()

    // 1. 彗核（暗淡的岩石核心）
    const coreGeometry = new THREE.SphereGeometry(config.radius, 32, 32)
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: config.color,
      emissive: 0x111111,
      specular: 0x222222,
      shininess: 5
    })
    const core = new THREE.Mesh(coreGeometry, coreMaterial)
    cometGroup.add(core)

    // 2. 彗发（coma）- 围绕彗核的气体云
    const comaGeometry = new THREE.SphereGeometry(config.radius * 3, 32, 32)
    const comaMaterial = new THREE.MeshBasicMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    })
    const coma = new THREE.Mesh(comaGeometry, comaMaterial)
    cometGroup.add(coma)

    // 3. 离子尾（蓝色，细长，笔直）
    const ionTailGeometry = new THREE.BufferGeometry()
    const ionParticles = 200
    const ionPositions = new Float32Array(ionParticles * 3)
    const ionSizes = new Float32Array(ionParticles)

    for (let i = 0; i < ionParticles; i++) {
      const t = i / ionParticles
      ionPositions[i * 3] = -t * config.tailLength * 1.5 // 离子尾更长
      ionPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.01 * t // 渐渐散开
      ionPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.01 * t
      ionSizes[i] = 0.03 * (1 - t * 0.7) // 渐变大小
    }

    ionTailGeometry.setAttribute('position', new THREE.BufferAttribute(ionPositions, 3))
    ionTailGeometry.setAttribute('size', new THREE.BufferAttribute(ionSizes, 1))

    const ionTailMaterial = new THREE.PointsMaterial({
      color: config.tailColor, // 蓝白色
      size: 0.025,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    })

    const ionTail = new THREE.Points(ionTailGeometry, ionTailMaterial)
    cometGroup.add(ionTail)

    // 4. 尘埃尾（黄白色，较宽，弯曲）
    const dustTailGeometry = new THREE.BufferGeometry()
    const dustParticles = 300
    const dustPositions = new Float32Array(dustParticles * 3)
    const dustSizes = new Float32Array(dustParticles)

    for (let i = 0; i < dustParticles; i++) {
      const t = i / dustParticles
      dustPositions[i * 3] = -t * config.tailLength
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.05 * t // 更宽
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.05 * t
      dustSizes[i] = 0.04 * (1 - t * 0.5) // 渐变大小
    }

    dustTailGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))
    dustTailGeometry.setAttribute('size', new THREE.BufferAttribute(dustSizes, 1))

    const dustTailMaterial = new THREE.PointsMaterial({
      color: 0xffeeaa, // 黄白色
      size: 0.035,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    })

    const dustTail = new THREE.Points(dustTailGeometry, dustTailMaterial)
    cometGroup.add(dustTail)

    // 创建轨道组
    const orbitGroup = new THREE.Group()
    celestialGroup.add(orbitGroup)

    // 设置初始位置
    cometGroup.position.x = config.orbitRadius
    orbitGroup.add(cometGroup)

    bodies.comet = {
      mesh: cometGroup,
      core: core,
      coma: coma,
      ionTail: ionTail,
      dustTail: dustTail,
      orbit: orbitGroup,
      config: config,
      angle: 0
    }

    console.log('彗星已创建（双尾效果）')
  }

  /**
   * 创建轨道线
   */
  function createOrbitLine(radius, color = 0x444444, segments = 128) {
    const curve = new THREE.EllipseCurve(
      0, 0,              // 中心
      radius, radius,    // 半径
      0, 2 * Math.PI,    // 起始角度和结束角度
      false,             // 是否逆时针
      0                  // 旋转
    )

    const points = curve.getPoints(segments)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3
    })

    const orbitLine = new THREE.Line(geometry, material)
    orbitLine.rotation.x = Math.PI / 2 // 旋转到水平面
    return orbitLine
  }

  /**
   * 初始化所有天体
   */
  function init(showOrbits = false) {
    // 创建月球
    createMoon()

    // 创建太阳
    createSun()

    // 创建行星
    createPlanet('mercury')
    createPlanet('venus')
    createPlanet('mars')
    createPlanet('jupiter')
    createPlanet('saturn')
    createPlanet('uranus')
    createPlanet('neptune')

    // 创建彗星
    createComet()

    // 创建轨道线
    if (showOrbits) {
      Object.keys(bodies).forEach(key => {
        const body = bodies[key]
        if (body.config.orbitRadius && key !== 'sun') {
          const orbitLine = createOrbitLine(body.config.orbitRadius)
          celestialGroup.add(orbitLine)
          orbits[key] = orbitLine
        }
      })
    }

    console.log('天体系统初始化完成')
  }

  /**
   * 更新天体位置（性能优化版）
   */
  function update(deltaTime) {
    // 累计时间（加速）
    elapsedTime += deltaTime * timeScale

    // 更新月球（优化版，添加潮汐锁定）
    if (bodies.moon) {
      const moon = bodies.moon
      const period = moon.config.orbitPeriod * 24 * 3600 // 转换为秒
      moon.angle = (elapsedTime / period) * Math.PI * 2

      // 更新轨道位置
      moon.mesh.position.x = Math.cos(moon.angle) * moon.config.orbitRadius
      moon.mesh.position.z = Math.sin(moon.angle) * moon.config.orbitRadius

      // 潮汐锁定：自转周期 = 公转周期，月球始终以同一面对着地球
      // 自转角度需要抵消公转带来的旋转，使月球正面始终朝向地球
      moon.mesh.rotation.y = -moon.angle
    }

    // 更新太阳位置（在光源方向上，但距离固定为可视距离）
    if (bodies.sun && sunLight) {
      const sunVisualDistance = bodies.sun.config.visualDistance || 12
      // 重用 _tempVector1 避免创建新对象
      _tempVector1.copy(sunLight.position).normalize().multiplyScalar(sunVisualDistance)
      bodies.sun.mesh.position.copy(_tempVector1)

      // 添加太阳核心的微妙脉动效果
      if (bodies.sun.core && CONFIG.earth.celestial?.sun?.enablePulsate !== false) {
        const pulsate = 1.0 + Math.sin(elapsedTime * 0.5) * 0.02 // 轻微脉动（2%）
        bodies.sun.core.scale.setScalar(pulsate)
      }

      // 缓慢旋转太阳（模拟表面活动）
      if (bodies.sun.core) {
        bodies.sun.core.rotation.y += deltaTime * 0.05 // 缓慢自转
      }

      // 光晕也轻微脉动（营造动态效果）
      if (bodies.sun.corona && CONFIG.earth.celestial?.sun?.enableCorona !== false) {
        const coronaPulsate = 1.0 + Math.sin(elapsedTime * 0.3) * 0.03 // 稍慢的脉动
        bodies.sun.corona.scale.setScalar(coronaPulsate)
      }
    }

    // 更新行星（批量处理，减少函数调用开销）
    Object.keys(bodies).forEach(key => {
      const body = bodies[key]
      if (body.config.type === 'planet') {
        const period = body.config.orbitPeriod * 24 * 3600
        body.angle += (deltaTime * timeScale / period) * Math.PI * 2
        // 直接计算，避免三角函数缓存不命中
        const cosAngle = Math.cos(body.angle)
        const sinAngle = Math.sin(body.angle)
        body.mesh.position.x = cosAngle * body.config.orbitRadius
        body.mesh.position.z = sinAngle * body.config.orbitRadius
      }
    })

    // 更新彗星（椭圆轨道 + 动态彗尾）
    if (bodies.comet && sunLight) {
      const comet = bodies.comet
      const period = comet.config.orbitPeriod * 24 * 3600
      comet.angle += (deltaTime * timeScale / period) * Math.PI * 2

      // 椭圆轨道计算
      const e = comet.config.orbitEccentricity
      const a = comet.config.orbitRadius
      const b = a * Math.sqrt(1 - e * e)

      comet.mesh.position.x = a * Math.cos(comet.angle)
      comet.mesh.position.z = b * Math.sin(comet.angle)

      // 计算彗星到太阳的距离 - 重用 _tempVector1
      _tempVector1.subVectors(comet.mesh.position, sunLight.position)
      const distanceToSun = _tempVector1.length()

      // 根据距离调整彗尾亮度和彗发大小（越近越亮越大）
      const maxDistance = 15 // 最远距离
      const minDistance = 5  // 最近距离
      const intensity = 1 - Math.min(Math.max((distanceToSun - minDistance) / (maxDistance - minDistance), 0), 1)

      // 更新彗发大小和透明度
      if (comet.coma) {
        const comaScale = 1 + intensity * 2 // 靠近太阳时彗发更大
        comet.coma.scale.setScalar(comaScale)
        comet.coma.material.opacity = 0.15 + intensity * 0.2
      }

      // 更新离子尾和尘埃尾的透明度
      if (comet.ionTail) {
        comet.ionTail.material.opacity = 0.5 + intensity * 0.3
      }
      if (comet.dustTail) {
        comet.dustTail.material.opacity = 0.3 + intensity * 0.4
      }

      // 彗尾始终背向太阳 - 重用 _tempVector1（已包含方向信息）
      _tempVector1.normalize()

      // 离子尾（笔直指向远离太阳）
      if (comet.ionTail) {
        // 重用 _tempVector2 作为基准向量
        _tempVector2.set(-1, 0, 0)
        comet.ionTail.quaternion.setFromUnitVectors(_tempVector2, _tempVector1)
      }

      // 尘埃尾（稍微偏离，模拟轨道弯曲效果）
      if (comet.dustTail) {
        // 重用 _tempVector3 作为尘埃方向
        _tempVector3.copy(_tempVector1)
        // 添加轨道切线方向的偏移 - 重用 _tempVector2
        _tempVector2.set(-Math.sin(comet.angle), 0, Math.cos(comet.angle))
        _tempVector3.add(_tempVector2.multiplyScalar(0.3)).normalize()

        // 重用 _tempVector2 作为基准向量
        _tempVector2.set(-1, 0, 0)
        comet.dustTail.quaternion.setFromUnitVectors(_tempVector2, _tempVector3)
      }
    }
  }

  /**
   * 设置时间缩放
   */
  function setTimeScale(scale) {
    timeScale = scale
    console.log('时间缩放已设置为:', scale)
  }

  /**
   * 显示/隐藏轨道线
   */
  function toggleOrbits(show) {
    Object.values(orbits).forEach(orbit => {
      orbit.visible = show
    })
  }

  /**
   * 清理资源
   */
  function cleanup() {
    Object.values(bodies).forEach(body => {
      if (body.mesh) {
        if (body.mesh.geometry) body.mesh.geometry.dispose()
        if (body.mesh.material) body.mesh.material.dispose()
      }
    })
    Object.values(orbits).forEach(orbit => {
      if (orbit.geometry) orbit.geometry.dispose()
      if (orbit.material) orbit.material.dispose()
    })
    scene.remove(celestialGroup)
  }

  return {
    init,
    update,
    setTimeScale,
    toggleOrbits,
    cleanup,
    bodies
  }
}
