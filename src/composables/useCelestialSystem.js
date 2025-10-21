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

  /**
   * 创建月球
   */
  function createMoon() {
    const config = CELESTIAL_BODIES.moon
    if (!config.enabled) return

    // 月球几何体
    const geometry = new THREE.SphereGeometry(config.radius, 64, 64) // 提高细分度
    const material = new THREE.MeshPhongMaterial({
      color: config.color,
      emissive: config.emissive || 0x000000,
      specular: config.specular || 0x222222,
      shininess: config.shininess || 5
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

    console.log('月球已创建')
  }

  /**
   * 创建太阳（改进版，更真实的视觉效果）
   */
  function createSun() {
    const config = CELESTIAL_BODIES.sun
    if (!config.enabled) return

    const sunGroup = new THREE.Group()

    // 1. 太阳核心球体（主体）
    const coreGeometry = new THREE.SphereGeometry(config.radius, 64, 64)
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: config.color,
      emissive: config.color,
      emissiveIntensity: 1.0
    })
    const sunCore = new THREE.Mesh(coreGeometry, coreMaterial)
    sunGroup.add(sunCore)

    // 2. 内层光晕（强光）
    const innerGlowGeometry = new THREE.SphereGeometry(config.radius * 1.2, 64, 64)
    const innerGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.5,
      side: THREE.BackSide, // 从内部发光
      blending: THREE.AdditiveBlending
    })
    const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial)
    sunGroup.add(innerGlow)

    // 3. 中层光晕（日冕效果）
    const midGlowGeometry = new THREE.SphereGeometry(config.radius * 1.5, 64, 64)
    const midGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd88,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    })
    const midGlow = new THREE.Mesh(midGlowGeometry, midGlowMaterial)
    sunGroup.add(midGlow)

    // 4. 外层光晕（柔和扩散）
    const outerGlowGeometry = new THREE.SphereGeometry(config.radius * 2.0, 64, 64)
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa44,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    })
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial)
    sunGroup.add(outerGlow)

    // 5. 径向光晕（使用自定义着色器）
    const coronaGeometry = new THREE.SphereGeometry(config.radius * 2.5, 64, 64)
    const coronaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0xffbb55) },
        viewVector: { value: new THREE.Vector3() }
      },
      vertexShader: `
        uniform vec3 viewVector;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          vec3 vNormel = normalize(normalMatrix * viewVector);
          intensity = pow(0.7 - dot(vNormal, vNormel), 3.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4(glow, intensity * 0.3);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide
    })
    const corona = new THREE.Mesh(coronaGeometry, coronaMaterial)
    sunGroup.add(corona)

    // 添加到场景
    celestialGroup.add(sunGroup)

    bodies.sun = {
      mesh: sunGroup,
      core: sunCore,
      corona: corona,
      config: config
    }

    console.log('太阳已创建（增强视觉效果）')
  }

  /**
   * 创建行星
   */
  function createPlanet(key) {
    const config = CELESTIAL_BODIES[key]
    if (!config.enabled || config.type !== 'planet') return

    // 行星几何体
    const geometry = new THREE.SphereGeometry(config.radius, 64, 64) // 提高细分度
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
        128 // 提高细分度
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
   * 更新天体位置
   */
  function update(deltaTime) {
    // 累计时间（加速）
    elapsedTime += deltaTime * timeScale

    // 更新月球
    if (bodies.moon) {
      const moon = bodies.moon
      const period = moon.config.orbitPeriod * 24 * 3600 // 转换为秒
      moon.angle = (elapsedTime / period) * Math.PI * 2
      moon.mesh.position.x = Math.cos(moon.angle) * moon.config.orbitRadius
      moon.mesh.position.z = Math.sin(moon.angle) * moon.config.orbitRadius
    }

    // 更新太阳位置（在光源方向上，但距离固定为可视距离）
    if (bodies.sun && sunLight) {
      const sunVisualDistance = bodies.sun.config.visualDistance || 12
      const direction = new THREE.Vector3()
        .copy(sunLight.position)
        .normalize() // 获取光源方向
      bodies.sun.mesh.position.copy(direction.multiplyScalar(sunVisualDistance))

      // 更新日冕着色器的视图向量（边缘光效果）
      if (bodies.sun.corona && CONFIG.earth.celestial?.sun?.enableCorona !== false) {
        const viewVector = new THREE.Vector3()
          .subVectors(scene.children[0].position, bodies.sun.mesh.position) // 相机到太阳的方向
          .normalize()
        bodies.sun.corona.material.uniforms.viewVector.value = viewVector
      }

      // 可选：添加太阳核心的微妙脉动效果
      if (bodies.sun.core && CONFIG.earth.celestial?.sun?.enablePulsate !== false) {
        const pulsate = 1.0 + Math.sin(elapsedTime * 0.5) * 0.02 // 轻微脉动
        bodies.sun.core.scale.setScalar(pulsate)
      }
    }

    // 更新行星
    Object.keys(bodies).forEach(key => {
      const body = bodies[key]
      if (body.config.type === 'planet') {
        const period = body.config.orbitPeriod * 24 * 3600
        body.angle += (deltaTime * timeScale / period) * Math.PI * 2
        body.mesh.position.x = Math.cos(body.angle) * body.config.orbitRadius
        body.mesh.position.z = Math.sin(body.angle) * body.config.orbitRadius
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

      // 计算彗星到太阳的距离
      const distanceToSun = new THREE.Vector3()
        .subVectors(comet.mesh.position, sunLight.position)
        .length()

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

      // 彗尾始终背向太阳
      const direction = new THREE.Vector3()
        .subVectors(comet.mesh.position, sunLight.position)
        .normalize()

      // 离子尾（笔直指向远离太阳）
      if (comet.ionTail) {
        comet.ionTail.quaternion.setFromUnitVectors(
          new THREE.Vector3(-1, 0, 0),
          direction
        )
      }

      // 尘埃尾（稍微偏离，模拟轨道弯曲效果）
      if (comet.dustTail) {
        const dustDirection = direction.clone()
        // 添加轨道切线方向的偏移
        const tangent = new THREE.Vector3(-Math.sin(comet.angle), 0, Math.cos(comet.angle))
        dustDirection.add(tangent.multiplyScalar(0.3)).normalize()

        comet.dustTail.quaternion.setFromUnitVectors(
          new THREE.Vector3(-1, 0, 0),
          dustDirection
        )
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
