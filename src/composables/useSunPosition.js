import { CONFIG } from '../utils/config'

/**
 * 太阳光照管理
 * 太阳光的位置根据当前真实UTC时间实时更新，围绕地球旋转
 */

/**
 * 计算太阳赤纬角（基于日期）
 * 公式：δ = -23.44° × cos(360°/365 × (N + 10))
 * @param {Date} date - 日期对象
 * @returns {number} 赤纬角（度）
 */
function calculateSolarDeclination(date = new Date()) {
  // 计算当前是一年中的第几天（1-365/366）
  const startOfYear = new Date(date.getFullYear(), 0, 0)
  const diff = date - startOfYear
  const oneDay = 1000 * 60 * 60 * 24
  const dayOfYear = Math.floor(diff / oneDay)

  // 计算太阳赤纬角
  // N + 10 是因为冬至大约在每年的第355天（12月21日左右）
  const declination = -23.44 * Math.cos((360 / 365) * (dayOfYear + 10) * (Math.PI / 180))

  return declination
}

export function useSunPosition(sunLight) {
  const sunDistance = 5 // 太阳与地球的距离
  let lastUpdateTime = 0 // 上次更新的时间戳
  let lastLogTime = 0 // 上次日志输出时间
  const updateInterval = 1000 // 每秒更新一次太阳位置（毫秒）
  const logInterval = 5000 // 每5秒输出一次日志（毫秒）

  // 缓存上次计算的太阳位置，避免重复计算
  let cachedSunPosition = { x: 0, y: 0, z: 0 }

  const updateSunLight = (currentTime = Date.now(), verbose = false) => {
    // 性能优化：只在需要时更新（每秒一次）
    if (!verbose && currentTime - lastUpdateTime < updateInterval) {
      return
    }

    const now = new Date()
    const utcHours = now.getUTCHours()
    const utcMinutes = now.getUTCMinutes()
    const utcSeconds = now.getUTCSeconds()
    const totalUTCHours = utcHours + utcMinutes / 60 + utcSeconds / 3600

    // 计算太阳照射的经度
    // UTC 12:00 → 0°经线（本初子午线）
    // UTC 00:00 → 180°经线（国际日期变更线）
    // UTC 06:00 → 90°E
    // UTC 18:00 → 90°W (270°E)
    // 公式：照射经度 = 180° - UTC时间 * 15°/小时
    const longitude = 180 - totalUTCHours * 15 // 度数
    const lonRad = -longitude * (Math.PI / 180) // 经度取负，与坐标系统一致

    // 获取配置的太阳赤纬角（季节）
    let declination
    if (CONFIG.earth.sunDeclination === 'auto') {
      // 自动根据日期计算赤纬角
      declination = calculateSolarDeclination(now)
    } else {
      // 使用配置的固定值
      declination = CONFIG.earth.sunDeclination || 0
    }
    const decRad = declination * (Math.PI / 180)

    // 预计算三角函数值
    const cosLon = Math.cos(lonRad)
    const sinLon = Math.sin(lonRad)
    const cosDec = Math.cos(decRad)
    const sinDec = Math.sin(decRad)

    // 将经度和赤纬角转换为Three.js世界坐标
    cachedSunPosition.x = -sinLon * cosDec * sunDistance
    cachedSunPosition.y = sinDec * sunDistance // Y坐标由赤纬角决定
    cachedSunPosition.z = cosLon * cosDec * sunDistance

    sunLight.position.set(cachedSunPosition.x, cachedSunPosition.y, cachedSunPosition.z)

    lastUpdateTime = currentTime

    // 调试输出（限制频率，避免控制台刷屏）
    if (verbose || currentTime - lastLogTime >= logInterval) {
      const localHours = (utcHours + 8) % 24
      const declinationMode = CONFIG.earth.sunDeclination === 'auto' ? '(自动)' : '(手动)'
      console.log(`UTC ${String(utcHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')} (北京${String(localHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}) - 太阳照射: 东经${longitude.toFixed(1)}°, 赤纬${declination.toFixed(1)}°${declinationMode} - 位置: (${cachedSunPosition.x.toFixed(2)}, ${cachedSunPosition.y.toFixed(2)}, ${cachedSunPosition.z.toFixed(2)})`)
      lastLogTime = currentTime
    }
  }

  // 设置光照强度和颜色
  sunLight.intensity = 1.0
  sunLight.color.setHex(0xFFF5E6)

  // 初始化太阳位置（首次调用，显示日志）
  updateSunLight(Date.now(), true)

  return {
    updateSunLight,
    cleanup: () => {} // 不再需要清理 interval
  }
}
