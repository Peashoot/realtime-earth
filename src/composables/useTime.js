import { ref, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import weekday from 'dayjs/plugin/weekday'
import { Lunar } from 'lunar-javascript'

// 扩展 dayjs 插件
dayjs.extend(weekday)
dayjs.locale('zh-cn')

export function useTime() {
  const currentDate = ref('')
  const currentWeekday = ref('')
  const currentTime = ref('')
  const timezone = ref('北京时间 (UTC+8)')
  const lunarDate = ref('')

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

    // 计算农历日期
    try {
      const lunar = Lunar.fromDate(now.toDate())
      // 获取农历月日，例如：九月初八
      const lunarMonth = lunar.getMonthInChinese()  // 返回"九"
      const lunarDay = lunar.getDayInChinese()      // 返回"初八"
      lunarDate.value = `${lunarMonth}月${lunarDay}`
    } catch (error) {
      console.warn('农历计算失败:', error)
      lunarDate.value = ''
    }
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
