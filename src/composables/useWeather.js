import { ref, onMounted, onUnmounted } from 'vue'
import { qweatherService } from '../services/qweather.js'
import { getClientIP } from '../services/location.js'
import { CONFIG } from '../utils/config.js'

export function useWeather() {
  const weather = ref(null)
  const city = ref(null)
  const forecast = ref(null)
  const loading = ref(true)
  const error = ref(null)

  let updateTimer = null
  let ipCheckTimer = null
  let lastIP = null

  // 获取天气数据
  const fetchWeather = async () => {
    loading.value = true
    error.value = null

    try {
      console.log('正在获取天气数据...')

      // 调用和风天气API（三步定位流程）
      const data = await qweatherService.getCompleteWeather()

      // 更新数据
      city.value = data.location
      forecast.value = data.forecast

      // 格式化当前天气数据供UI使用
      weather.value = {
        icon: data.current.icon,
        temp: data.current.temp,
        tempMin: data.forecast[0]?.tempMin || '--',
        tempMax: data.forecast[0]?.tempMax || '--',
        desc: data.current.text,
        humidity: data.current.humidity,
        feelsLike: data.current.feelsLike,
        windDir: data.current.windDir,
        windScale: data.current.windScale,
        cityName: data.location.address || data.location.name,
        updateTime: new Date(data.current.obsTime).toLocaleTimeString('zh-CN'),
        // 添加位置信息（经纬度）
        location: {
          lat: data.location.lat,
          lon: data.location.lon
        }
      }

      loading.value = false
      console.log('天气数据获取成功:', weather.value)
    } catch (err) {
      error.value = err.message
      loading.value = false
      console.error('获取天气数据失败:', err)

      // 使用模拟数据作为降级方案
      weather.value = {
        icon: '⛅',
        temp: '--',
        tempMin: '--',
        tempMax: '--',
        desc: '天气数据获取失败',
        humidity: '--',
        cityName: '未知',
        updateTime: new Date().toLocaleTimeString('zh-CN')
      }
    }
  }

  // 检查IP是否变化
  const checkIPChange = async () => {
    try {
      console.log('检查IP是否变化...')
      const currentIP = await getClientIP()

      if (!lastIP) {
        // 第一次获取IP
        lastIP = currentIP
        console.log('首次记录IP:', lastIP)
        return
      }

      if (currentIP !== lastIP) {
        console.log(`IP已变化: ${lastIP} → ${currentIP}`)
        lastIP = currentIP

        // 清除位置缓存
        qweatherService.clearLocationCache()

        // 重新获取天气
        console.log('IP变化，重新获取天气数据')
        await fetchWeather()
      } else {
        console.log('IP未变化，跳过更新')
      }
    } catch (err) {
      console.error('检查IP失败:', err)
      // IP检查失败不影响现有数据，静默失败
    }
  }

  // 刷新天气
  const refetchWeather = () => {
    fetchWeather()
  }

  onMounted(async () => {
    // 首次获取IP并记录
    try {
      lastIP = await getClientIP()
      console.log('初始IP:', lastIP)
    } catch (err) {
      console.error('获取初始IP失败:', err)
    }

    // 立即获取一次天气
    fetchWeather()

    // 设置定时更新天气（每30分钟）
    updateTimer = setInterval(fetchWeather, CONFIG.weather.updateInterval)

    // 设置定时检查IP（每15分钟）
    ipCheckTimer = setInterval(checkIPChange, 15 * 60 * 1000)
  })

  onUnmounted(() => {
    if (updateTimer) {
      clearInterval(updateTimer)
      updateTimer = null
    }
    if (ipCheckTimer) {
      clearInterval(ipCheckTimer)
      ipCheckTimer = null
    }
  })

  return {
    weather,
    city,
    forecast,
    loading,
    error,
    refetch: refetchWeather
  }
}
