import { CONFIG } from './config'

/**
 * 地理坐标工具函数
 *
 * 应用经度偏移量来修正地球贴图旋转
 */

/**
 * 将经纬度转换为3D球面坐标
 *
 * @param {number} lat - 纬度（-90 到 90，北纬为正）
 * @param {number} lon - 经度（-180 到 180，东经为正）
 * @param {number} radius - 球体半径
 * @param {boolean} applyOffset - 是否应用经度偏移量（默认false，仅经线标签需要true）
 * @returns {{x: number, y: number, z: number}} 3D坐标
 */
export function latLonToVector3(lat, lon, radius = 1, applyOffset = false) {
  const latRad = lat * (Math.PI / 180)

  // 仅在绘制经线标签时应用偏移量
  let adjustedLon = lon
  if (applyOffset) {
    const offset = CONFIG.earth.longitudeOffset || 0
    adjustedLon = lon + offset
  }

  // 经度取负，使得从北极看逆时针为西经到东经
  const lonRad = -adjustedLon * (Math.PI / 180)

  // 球面坐标转换
  const x = -radius * Math.cos(latRad) * Math.sin(lonRad)
  const y = radius * Math.sin(latRad)
  const z = radius * Math.cos(latRad) * Math.cos(lonRad)

  return { x, y, z }
}

/**
 * 将3D坐标转换为经纬度
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} z - Z坐标
 * @returns {{lat: number, lon: number}} 经纬度
 */
export function vector3ToLatLon(x, y, z) {
  const radius = Math.sqrt(x * x + y * y + z * z)
  const lat = Math.asin(y / radius) * (180 / Math.PI)
  const lon = Math.atan2(-x, z) * (180 / Math.PI)

  return { lat, lon }
}
