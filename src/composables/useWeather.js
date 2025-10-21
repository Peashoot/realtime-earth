import { ref, onMounted, onUnmounted } from 'vue'
import { qweatherService } from '../services/qweather.js'
import { CONFIG } from '../utils/config.js'

export function useWeather() {
  const weather = ref(null)
  const city = ref(null)
  const forecast = ref(null)
  const loading = ref(true)
  const error = ref(null)

  let updateTimer = null

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

  // 刷新天气
  const refetchWeather = () => {
    fetchWeather()
  }

  onMounted(() => {
    // 立即获取一次天气
    fetchWeather()

    // 设置定时更新（每30分钟）
    updateTimer = setInterval(fetchWeather, CONFIG.weather.updateInterval)
  })

  onUnmounted(() => {
    if (updateTimer) {
      clearInterval(updateTimer)
      updateTimer = null
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
