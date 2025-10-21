/**
 * 位置服务 - 通过IP获取地理位置
 */

// 检测是否为开发环境
const isDev = import.meta.env.DEV

/**
 * 步骤1: 获取客户端IP地址
 */
export async function getClientIP() {
  // 尝试方法1: myip.ipip.net
  try {
    const response = await fetch('https://myip.ipip.net')
    const text = await response.text()

    // myip.ipip.net 返回格式：当前 IP：36.28.83.119  来自于：中国 浙江   电信
    // 使用正则表达式提取IP地址
    const ipMatch = text.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)

    if (ipMatch) {
      const ip = ipMatch[0]
      console.log('获取到IP地址 (myip.ipip.net):', ip)
      return ip
    }

    throw new Error('无法从响应中提取IP地址')
  } catch (error) {
    console.warn('方法1获取IP失败 (myip.ipip.net):', error.message)

    // 尝试备用方法2: ipconfig.me
    try {
      console.log('尝试备用方法获取IP (ipconfig.me)...')
      const response = await fetch('https://ipconfig.me/ip')
      const ip = (await response.text()).trim()

      // 验证IP格式
      const ipMatch = ip.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)
      if (ipMatch) {
        console.log('获取到IP地址 (ipconfig.me):', ip)
        return ip
      }

      throw new Error('无法从响应中提取IP地址')
    } catch (backupError) {
      console.error('备用方法获取IP也失败 (ipconfig.me):', backupError.message)
      throw new Error('无法获取IP地址，所有方法均已失败')
    }
  }
}

/**
 * 步骤2: 通过IP地址获取地理位置（ip-api.com）
 * @param {string} ip - IP地址
 */
export async function getLocationByIP(ip) {
  try {
    const url = `http://ip-api.com/json/${ip}`
    console.log('请求 ip-api.com:', url)

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'success') {
      console.log('IP定位成功:', data)

      return {
        lat: data.lat,
        lon: data.lon,
        country: data.country,
        province: data.regionName || data.region,
        city: data.city,
        district: '',
        address: `${data.regionName || data.region} ${data.city}`,
        timezone: data.timezone,
        isp: data.isp
      }
    }

    throw new Error(`ip-api.com 返回错误: ${data.message || 'Unknown error'}`)
  } catch (error) {
    console.error('通过IP获取位置失败:', error)
    throw error
  }
}

/**
 * 完整的位置获取流程
 */
export async function getCurrentLocation() {
  try {
    console.log('开始获取位置信息...')

    // 步骤1: 获取IP
    const ip = await getClientIP()

    // 步骤2: 通过IP获取位置
    const location = await getLocationByIP(ip)

    console.log('位置信息获取成功:', location)
    return location
  } catch (error) {
    console.error('获取位置信息失败:', error)
    throw error
  }
}
