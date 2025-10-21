import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { useSunPosition } from './useSunPosition.js'
import { useCelestialSystem } from './useCelestialSystem.js'
import { CONFIG } from '../utils/config.js'
import { latLonToVector3 } from '../utils/geoUtils.js'

export function useEarthScene(canvas) {
  if (!canvas) {
    console.error('Canvas element is required')
    return
  }

  // 场景、相机、渲染器
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  })

  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // 2D标签渲染器
  const labelRenderer = new CSS2DRenderer()
  labelRenderer.setSize(window.innerWidth, window.innerHeight)
  labelRenderer.domElement.style.position = 'absolute'
  labelRenderer.domElement.style.top = '0px'
  labelRenderer.domElement.style.pointerEvents = 'none' // 允许鼠标穿透
  document.getElementById('label-container').appendChild(labelRenderer.domElement)

  // 相机位置：从配置读取距离
  const cameraDistance = CONFIG.earth.camera?.distance || 3.0
  camera.position.set(0, 0.5, cameraDistance)
  camera.lookAt(0, 0, 0)

  // 添加轨道控制器 - 用户可以旋转观察角度
  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true // 启用阻尼（惯性）
  controls.dampingFactor = 0.05 // 阻尼系数
  controls.enableRotate = CONFIG.earth.camera?.enableRotate !== false // 从配置读取
  controls.enableZoom = CONFIG.earth.camera?.enableZoom !== false // 从配置读取
  controls.minDistance = 1.5 // 最小距离
  controls.maxDistance = 5 // 最大距离
  controls.enablePan = false // 禁用平移
  controls.autoRotate = CONFIG.earth.camera?.autoRotate || false // 自动旋转
  controls.autoRotateSpeed = CONFIG.earth.camera?.autoRotateSpeed || 1.0 // 自动旋转速度

  // 创建地球
  const earthGroup = new THREE.Group()
  scene.add(earthGroup)

  // 地球几何体和材质
  const earthGeometry = new THREE.SphereGeometry(1, 64, 64)

  // 纹理加载器
  const textureLoader = new THREE.TextureLoader()

  // 加载纹理（从配置读取质量设置）
  const quality = CONFIG.earth.textureQuality || '2k'

  // 加载所有需要的纹理
  const dayTexture = textureLoader.load(`/textures/${quality}_earth_daymap.jpg`)
  const nightTexture = textureLoader.load(`/textures/${quality}_earth_nightmap.jpg`)
  const normalTexture = textureLoader.load(`/textures/${quality}_earth_normal_map.png`)
  const specularTexture = textureLoader.load(`/textures/${quality}_earth_specular_map.jpg`)

  // 创建自定义Shader材质实现昼夜过渡
  const earthMaterial = new THREE.ShaderMaterial({
    uniforms: {
      dayTexture: { value: dayTexture },
      nightTexture: { value: nightTexture },
      normalMap: { value: normalTexture },
      specularMap: { value: specularTexture },
      sunDirection: { value: new THREE.Vector3(0, 0, 1) }, // 太阳方向，会动态更新
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vUv = uv;
        // 将法线转换到世界空间（而不是视图空间）
        vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D dayTexture;
      uniform sampler2D nightTexture;
      uniform sampler2D normalMap;
      uniform sampler2D specularMap;
      uniform vec3 sunDirection;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        // 采样纹理
        vec4 dayColor = texture2D(dayTexture, vUv);
        vec4 nightColor = texture2D(nightTexture, vUv);

        // 计算太阳光照强度
        vec3 normal = normalize(vNormal);
        vec3 sunDir = normalize(sunDirection);
        float sunIntensity = dot(normal, sunDir);

        // 昼夜混合系数
        // sunIntensity > 0.1: 完全白天
        // sunIntensity < -0.1: 完全夜晚
        // -0.1 到 0.1: 晨昏过渡区（约12度宽）
        float dayMix = smoothstep(-0.1, 0.1, sunIntensity);

        // 混合昼夜纹理
        vec4 finalColor = mix(nightColor, dayColor, dayMix);

        // 添加高光效果（仅白天，海洋反射）
        vec4 specular = texture2D(specularMap, vUv);
        float specularStrength = specular.r * dayMix * max(0.0, sunIntensity);

        // 输出最终颜色
        gl_FragColor = finalColor + specularStrength;
      }
    `,
  })

  // 创建地球
  const earth = new THREE.Mesh(earthGeometry, earthMaterial)
  earthGroup.add(earth)

  // Three.js球体贴图默认：UV中心(0.5)在-X方向
  // 我们的贴图：UV中心是本初子午线(0度经线)
  // 旋转180度让0度经线到+Z方向（与坐标系统一致）
  earth.rotation.y = -Math.PI / 2 // Correct rotation to align texture with coordinates

  // 云层
  const cloudsGeometry = new THREE.SphereGeometry(1.015, 32, 32) // 略大于地球
  const cloudsTexture = textureLoader.load(`/textures/${quality}_earth_clouds.jpg`)
  const cloudsMaterial = new THREE.MeshLambertMaterial({
    map: cloudsTexture,
    transparent: true,
    opacity: 0.4
  })
  const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial)
  clouds.rotation.y = earth.rotation.y // 云层跟随地球旋转
  earthGroup.add(clouds)

  // 大气层效果
  const atmosphereGeometry = new THREE.SphereGeometry(1.1, 32, 32)
  const atmosphereMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
        gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true
  })
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
  earthGroup.add(atmosphere)

  // 星空背景（程序化生成星点）
  const starsGeometry = new THREE.BufferGeometry()
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xFFFFFF,
    size: 0.01,
    sizeAttenuation: true
  })

  const starsVertices = []
  for (let i = 0; i < 2000; i++) {
    const x = (Math.random() - 0.5) * 200
    const y = (Math.random() - 0.5) * 200
    const z = (Math.random() - 0.5) * 200
    starsVertices.push(x, y, z)
  }

  starsGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(starsVertices, 3)
  )

  const stars = new THREE.Points(starsGeometry, starsMaterial)
  scene.add(stars)

  // 太阳光源（模拟阳光）
  const sunLight = new THREE.DirectionalLight(0xffffff, 1)
  sunLight.position.set(50, 0, 50)
  scene.add(sunLight)

  // 环境光（模拟散射光）
  const ambientLight = new THREE.AmbientLight(0x404040, 0.3)
  scene.add(ambientLight)

  // 经纬度和标签
  const meridianGroup = new THREE.Group()
  earthGroup.add(meridianGroup)
  meridianGroup.rotation.y = -Math.PI / 2 // 与地球贴图的旋转保持一致

  /**
   * 添加经线和标签
   */
  const addMeridianLines = () => {
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xFFD700, // 金色
      transparent: true,
      opacity: 0.6, // 提高不透明度
      depthTest: false // 禁用深度测试，确保经线始终可见
    })

    for (let lon = -180; lon < 180; lon += 30) {
      // 创建经线
      const points = []
      for (let lat = -90; lat <= 90; lat += 5) {
        const pos = latLonToVector3(lat, lon, 1.015, true) // 应用偏移量
        points.push(new THREE.Vector3(pos.x, pos.y, pos.z))
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const line = new THREE.Line(geometry, lineMaterial)
      meridianGroup.add(line)

      // 创建标签
      if (lon !== -180) { // 180和-180是同一条线，避免重复
        const labelDiv = document.createElement('div')
        let labelText = ''
        if (lon === 0) {
          labelText = '0°'
        } else if (lon > 0) {
          labelText = `${lon}°E`
        } else {
          labelText = `${-lon}°W`
        }
        labelDiv.textContent = labelText
        labelDiv.style.color = 'white'
        labelDiv.style.fontSize = '10px'
        labelDiv.style.textShadow = '1px 1px 2px black'

        const label = new CSS2DObject(labelDiv)
        const labelPos = latLonToVector3(0, lon, 1.04, true) // 应用偏移量
        label.position.set(labelPos.x, labelPos.y, labelPos.z)
        meridianGroup.add(label)
      }
    }
  }

  // 根据配置决定是否显示经线
  if (CONFIG.earth.showMeridianLines) {
    addMeridianLines()
  }

  // 用户位置标记
  let locationMarker = null

  /**
   * 在地球上添加位置标记
   * @param {number} lat - 纬度
   * @param {number} lon - 经度
   */
  const addLocationMarker = (lat, lon) => {
    // 如果已经存在标记，先移除
    if (locationMarker) {
      earthGroup.remove(locationMarker)
      locationMarker.geometry.dispose()
      locationMarker.material.dispose()
    }

    // 计算标记在地球表面的位置
    const markerRadius = 1.02 // 略高于地球表面和云层
    const position = latLonToVector3(lat, lon, markerRadius) // 不应用偏移量，使用真实地理坐标

    // 创建标记点（发光的小球）
    const markerGeometry = new THREE.SphereGeometry(0.015, 16, 16)
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF3333, // 红色
      transparent: true,
      opacity: 0.9
    })
    locationMarker = new THREE.Mesh(markerGeometry, markerMaterial)

    // 设置标记位置
    locationMarker.position.set(position.x, position.y, position.z)

    // 添加光晕效果
    const glowGeometry = new THREE.SphereGeometry(0.025, 16, 16)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF6666,
      transparent: true,
      opacity: 0.4
    })
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    locationMarker.add(glow)

    // 添加到地球组（会随地球一起旋转）
    earthGroup.add(locationMarker)

    console.log(`位置标记已添加: 纬度 ${lat}°, 经度 ${lon}°`)
  }

  // 地球旋转轴倾斜 23.44 度（地球实际倾角 23°26'）
  // 绕X轴倾斜，使北极略微倾向观察者
  earthGroup.rotation.x = 0 // (23.44 * Math.PI) / 180

  // 获取太阳位置计算函数
  const { updateSunLight } = useSunPosition(sunLight)

  // 初始化天体系统（月球、行星、彗星等）
  let celestialSystem = null
  if (CONFIG.earth.celestial?.enabled !== false) {
    celestialSystem = useCelestialSystem(scene, earthGroup, sunLight)
    const showOrbits = CONFIG.earth.celestial?.showOrbits || false
    celestialSystem.init(showOrbits)
  }

  const clock = new THREE.Clock()
  let markerBlinkTime = 0 // 标记闪烁时间

  // 动画循环
  const animate = () => {
    requestAnimationFrame(animate)

    const delta = clock.getDelta() // 获取自上一帧以来的时间差

    // 更新轨道控制器
    controls.update()

    // 更新天体系统（月球、行星、彗星）
    if (celestialSystem) {
      celestialSystem.update(delta)
    }

    // 标记闪烁效果
    if (locationMarker) {
      markerBlinkTime += delta
      // 使用sin函数实现平滑闪烁，周期约2秒
      const opacity = 0.5 + 0.5 * Math.sin(markerBlinkTime * Math.PI) // 0.0 到 1.0
      locationMarker.material.opacity = opacity
      // 光晕也同步闪烁
      if (locationMarker.children[0]) {
        locationMarker.children[0].material.opacity = opacity * 0.4
      }
    }

    // 更新着色器中的太阳方向
    // 因为着色器中的法线也在世界空间，这样太阳照射的经纬度区域保持固定
    earthMaterial.uniforms.sunDirection.value.copy(sunLight.position).normalize()

    // 渲染场景
    renderer.render(scene, camera)
    labelRenderer.render(scene, camera)
  }

  animate()

  // 窗口大小调整
  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    labelRenderer.setSize(window.innerWidth, window.innerHeight)
  }

  window.addEventListener('resize', handleResize)

  // Wallpaper Engine 属性变化监听
  const handleCameraDistanceChange = (event) => {
    const distance = event.detail.distance
    const currentPosition = camera.position.clone()
    const direction = currentPosition.normalize()
    camera.position.copy(direction.multiplyScalar(distance))
    console.log('相机距离已更新到:', distance)
  }

  const handleEnableRotateChange = (event) => {
    controls.enableRotate = event.detail.enabled
    console.log('鼠标拖动旋转已', event.detail.enabled ? '启用' : '禁用')
  }

  const handleEnableZoomChange = (event) => {
    controls.enableZoom = event.detail.enabled
    console.log('滚轮缩放已', event.detail.enabled ? '启用' : '禁用')
  }

  const handleAutoRotateChange = (event) => {
    controls.autoRotate = event.detail.enabled
    console.log('自动旋转已', event.detail.enabled ? '启用' : '禁用')
  }

  const handleAutoRotateSpeedChange = (event) => {
    controls.autoRotateSpeed = event.detail.speed
    console.log('自动旋转速度已更新到:', event.detail.speed)
  }

  const handleShowOrbitsChange = (event) => {
    if (celestialSystem) {
      celestialSystem.toggleOrbits(event.detail.enabled)
      console.log('轨道线已', event.detail.enabled ? '显示' : '隐藏')
    }
  }

  const handleCelestialTimeScaleChange = (event) => {
    if (celestialSystem) {
      celestialSystem.setTimeScale(event.detail.timeScale)
      console.log('天体运动速度已更新到:', event.detail.timeScale)
    }
  }

  window.addEventListener('cameraDistanceChanged', handleCameraDistanceChange)
  window.addEventListener('enableRotateChanged', handleEnableRotateChange)
  window.addEventListener('enableZoomChanged', handleEnableZoomChange)
  window.addEventListener('autoRotateChanged', handleAutoRotateChange)
  window.addEventListener('autoRotateSpeedChanged', handleAutoRotateSpeedChange)
  window.addEventListener('showOrbitsChanged', handleShowOrbitsChange)
  window.addEventListener('celestialTimeScaleChanged', handleCelestialTimeScaleChange)

  // 清理函数
  return {
    cleanup: () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('cameraDistanceChanged', handleCameraDistanceChange)
      window.removeEventListener('enableRotateChanged', handleEnableRotateChange)
      window.removeEventListener('enableZoomChanged', handleEnableZoomChange)
      window.removeEventListener('autoRotateChanged', handleAutoRotateChange)
      window.removeEventListener('autoRotateSpeedChanged', handleAutoRotateSpeedChange)
      window.removeEventListener('showOrbitsChanged', handleShowOrbitsChange)
      window.removeEventListener('celestialTimeScaleChanged', handleCelestialTimeScaleChange)
      controls.dispose()
      renderer.dispose()
      // 清理经线
      meridianGroup.children.forEach(child => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) child.material.dispose()
      })
      earthGroup.remove(meridianGroup)

      earthGeometry.dispose()
      earthMaterial.dispose()
      cloudsGeometry.dispose()
      cloudsMaterial.dispose()
      atmosphereGeometry.dispose()
      atmosphereMaterial.dispose()
      starsGeometry.dispose()
      starsMaterial.dispose()
      if (locationMarker) {
        locationMarker.geometry.dispose()
        locationMarker.material.dispose()
      }
      // 清理天体系统
      if (celestialSystem) {
        celestialSystem.cleanup()
      }
    },
    addLocationMarker // 导出添加位置标记的函数
  }
}
