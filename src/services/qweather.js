import { CONFIG, getWeatherIcon } from '../utils/config.js'
import { getCurrentLocation } from './location.js'

/**
 * 和风天气API服务（整合三步定位流程）
 */
class QWeatherService {
  constructor() {
    this.apiKey = CONFIG.weather.apiKey
    this.baseUrl = CONFIG.weather.baseUrl
    this.cachedLocation = null // 缓存位置信息
  }

  /**
   * 通过经纬度获取城市信息（中文名称）
   * @param {number} lat - 纬度
   * @param {number} lon - 经度
   */
  async getCityInfo(lat, lon) {
    try {
      // 和风天气 GeoAPI 格式：经度,纬度
      const location = `${lon},${lat}`
      const url = `${this.baseUrl}/geo/v2/city/lookup?key=${this.apiKey}&location=${location}`

      console.log('请求和风天气 GeoAPI:', url.replace(this.apiKey, 'KEY_HIDDEN'))
      const response = await fetch(url)
      const data = await response.json()

      if (data.code === '200' && data.location && data.location.length > 0) {
        const city = data.location[0]
        console.log('GeoAPI返回城市信息:', city)

        return {
          name: city.name,           // 城市名称（中文）
          adm2: city.adm2,           // 上级行政区划（地级市）
          adm1: city.adm1,           // 一级行政区划（省份）
          country: city.country,     // 国家
          fullName: `${city.adm1} ${city.adm2} ${city.name}`.trim()  // 完整地址
        }
      }

      console.warn('GeoAPI未返回有效城市信息，使用原始数据')
      return null
    } catch (error) {
      console.error('获取城市信息失败:', error)
      return null
    }
  }

  /**
   * 获取当前位置（三步流程）
   * 步骤1: 获取IP (myip.ipip.net 或 ipconfig.me)
   * 步骤2: IP→坐标 (ip-api.com)
   * 步骤3: 通过和风天气GeoAPI获取中文城市名称
   */
  async getLocation() {
    // 如果已有缓存位置，直接返回
    if (this.cachedLocation) {
      console.log('使用缓存的位置信息')
      return this.cachedLocation
    }

    try {
      if (CONFIG.location.enableIPLocation) {
        console.log('开始三步定位流程...')

        // 步骤1+2: 通过IP获取位置（英文）
        const location = await getCurrentLocation()
        console.log('IP定位结果（英文）:', location)

        // 步骤3: 通过和风天气GeoAPI获取中文城市名称
        const cityInfo = await this.getCityInfo(location.lat, location.lon)

        // 缓存位置信息（优先使用中文名称）
        if (cityInfo) {
          this.cachedLocation = {
            lat: location.lat,
            lon: location.lon,
            name: cityInfo.name,           // 中文城市名称
            province: cityInfo.adm1,       // 中文省份
            city: cityInfo.adm2,           // 中文地级市
            address: cityInfo.fullName,    // 完整中文地址
            country: cityInfo.country      // 国家
          }
          console.log('定位成功（中文）:', this.cachedLocation)
        } else {
          // 如果GeoAPI失败，使用ip-api的英文名称
          this.cachedLocation = {
            lat: location.lat,
            lon: location.lon,
            name: location.city || location.district,
            province: location.province,
            address: location.address
          }
          console.log('定位成功（英文）:', this.cachedLocation)
        }

        return this.cachedLocation
      }

      // 使用默认位置
      console.warn('使用默认位置（已禁用IP定位）')
      this.cachedLocation = CONFIG.weather.defaultLocation
      return this.cachedLocation
    } catch (error) {
      console.error('定位失败，使用默认位置:', error)
      this.cachedLocation = CONFIG.weather.defaultLocation
      return this.cachedLocation
    }
  }

  /**
   * 步骤3: 根据经纬度获取实时天气
   * @param {number} lat - 纬度
   * @param {number} lon - 经度
   */
  async getCurrentWeather(lat, lon) {
    try {
      // 使用经纬度查询（格式：经度,纬度）
      const location = `${lon},${lat}`
      const url = `${this.baseUrl}/v7/weather/now?key=${this.apiKey}&location=${location}`

      console.log('请求天气API:', url)
      const response = await fetch(url)
      const data = await response.json()

      if (data.code === '200' && data.now) {
        const weather = data.now
        return {
          temp: parseInt(weather.temp),              // 温度
          feelsLike: parseInt(weather.feelsLike),    // 体感温度
          icon: getWeatherIcon(weather.icon),        // 天气图标
          iconCode: weather.icon,                     // 图标代码
          text: weather.text,                        // 天气状况
          windDir: weather.windDir,                  // 风向
          windScale: weather.windScale,              // 风力等级
          humidity: parseInt(weather.humidity),      // 湿度
          precip: parseFloat(weather.precip),        // 降水量
          pressure: parseInt(weather.pressure),      // 大气压强
          vis: parseInt(weather.vis),                // 能见度
          obsTime: weather.obsTime                   // 观测时间
        }
      }

      throw new Error(`API返回错误: code=${data.code}`)
    } catch (error) {
      console.error('获取实时天气失败:', error)
      throw error
    }
  }

  /**
   * 获取7天天气预报
   * @param {number} lat - 纬度
   * @param {number} lon - 经度
   */
  async getWeatherForecastBeforeDays(lat, lon, days) {
    try {
      const location = `${lon},${lat}`
      const url = `${this.baseUrl}/v7/weather/${days}d?key=${this.apiKey}&location=${location}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.code === '200' && data.daily) {
        return data.daily.map(day => ({
          date: day.fxDate,                       // 日期
          tempMax: parseInt(day.tempMax),         // 最高温度
          tempMin: parseInt(day.tempMin),         // 最低温度
          iconDay: getWeatherIcon(day.iconDay),   // 白天图标
          textDay: day.textDay,                   // 白天天气
          iconNight: getWeatherIcon(day.iconNight), // 夜间图标
          textNight: day.textNight,               // 夜间天气
          humidity: parseInt(day.humidity),       // 湿度
          precip: parseFloat(day.precip),         // 降水量
          windDirDay: day.windDirDay,             // 白天风向
          windScaleDay: day.windScaleDay          // 白天风力
        }))
      }

      throw new Error(`API返回错误: code=${data.code}`)
    } catch (error) {
      console.error('获取天气预报失败:', error)
      throw error
    }
  }

  /**
   * 获取完整天气信息（三步定位流程）
   */
  async getCompleteWeather() {
    try {
      console.log('=== 开始获取天气信息 ===')

      // 步骤1+2: 获取位置（IP → 坐标）
      const location = await this.getLocation()
      console.log('位置信息:', location)

      // 步骤3: 根据坐标获取天气
      const current = await this.getCurrentWeather(location.lat, location.lon)
      const forecast = await this.getWeatherForecastBeforeDays(location.lat, location.lon, 7)

      return {
        location,
        current,
        forecast,
        updateTime: new Date().toISOString()
      }
    } catch (error) {
      console.error('获取完整天气信息失败:', error)
      throw error
    }
  }

  /**
   * 清除位置缓存（用于重新定位）
   */
  clearLocationCache() {
    this.cachedLocation = null
    console.log('位置缓存已清除')
  }
}

// 导出单例
export const qweatherService = new QWeatherService()
