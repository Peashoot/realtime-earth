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

  const updateSunLight = () => {
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

    // 将经度和赤纬角转换为Three.js世界坐标
    const x = -Math.sin(lonRad) * Math.cos(decRad) * sunDistance
    const y = Math.sin(decRad) * sunDistance // Y坐标由赤纬角决定
    const z = Math.cos(lonRad) * Math.cos(decRad) * sunDistance

    sunLight.position.set(x, y, z)

    // 调试输出（显示北京时间和照射经度）
    const localHours = (utcHours + 8) % 24
    const declinationMode = CONFIG.earth.sunDeclination === 'auto' ? '(自动)' : '(手动)'
    console.log(`UTC ${String(utcHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')} (北京${String(localHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}) - 太阳照射: 东经${longitude.toFixed(1)}°, 赤纬${declination.toFixed(1)}°${declinationMode} - 位置: (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`)
  }

  // 设置光照强度和颜色
  sunLight.intensity = 1.0
  sunLight.color.setHex(0xFFF5E6)

  // 初始化太阳位置
  updateSunLight()

  // 每10秒更新一次太阳位置（24小时360度，60秒约0.24度，视觉上足够平滑）
  const interval = setInterval(updateSunLight, 60000)

  return {
    updateSunLight,
    cleanup: () => clearInterval(interval)
  }
}
