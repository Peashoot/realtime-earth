import { ref, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import weekday from 'dayjs/plugin/weekday'

// 扩展 dayjs 插件
dayjs.extend(weekday)
dayjs.locale('zh-cn')

export function useTime() {
  const currentDate = ref('')
  const currentWeekday = ref('')
  const currentTime = ref('')
  const timezone = ref('北京时间 (UTC+8)')
  const lunarDate = ref('') // 农历日期，后续集成

  let timer = null

  // 更新时间
  const updateTime = () => {
    const now = dayjs()

    // 格式化日期：2025年10月17日
    currentDate.value = now.format('YYYY年MM月DD日')

    // 格式化星期：星期五
    currentWeekday.value = now.format('dddd')

    // 格式化时间：HH:mm:ss
    currentTime.value = now.format('HH:mm:ss')

    // TODO: 集成农历计算
    // lunarDate.value = toLunar(now)
  }

  onMounted(() => {
    updateTime()
    // 每秒更新一次时间
    timer = setInterval(updateTime, 1000)
  })

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  })

  return {
    currentDate,
    currentWeekday,
    currentTime,
    timezone,
    lunarDate
  }
}
