<template>
  <div class="info-panel panel-blur">
    <!-- 日期显示 -->
    <div class="date-section">
      <div class="date">{{ currentDate }}</div>
      <div class="weekday">{{ currentWeekday }}</div>
      <div class="lunar" v-if="showLunar">{{ lunarDate }}</div>
    </div>

    <!-- 分隔线 -->
    <div class="divider"></div>

    <!-- 时间显示 -->
    <div class="time-section">
      <div class="time">{{ currentTime }}</div>
      <div class="timezone">{{ timezone }}</div>
    </div>

    <!-- 分隔线 -->
    <div class="divider"></div>

    <!-- 天气显示 -->
    <div class="weather-section">
      <div class="weather-location" v-if="cityName">
        <span class="location-icon">📍</span>
        <span class="location-name">{{ cityName }}</span>
      </div>
      <div class="weather-main">
        <div class="weather-icon">{{ weatherIcon }}</div>
        <div class="temperature">{{ temperature }}°C</div>
      </div>
      <div class="weather-desc">{{ weatherDesc }}</div>
      <div class="weather-detail">
        <span>{{ tempRange }}</span>
        <span>湿度 {{ humidity }}%</span>
      </div>
    </div>

    <!-- 未来三天天气预报 -->
    <div class="forecast-section" v-if="forecastDays && forecastDays.length > 0">
      <div class="divider"></div>
      <div class="forecast-title">未来三天天气</div>
      <div class="forecast-days">
        <div
          v-for="(day, index) in forecastDays"
          :key="index"
          class="forecast-day"
        >
          <div class="forecast-date">{{ day.dateLabel }}</div>
          <div class="forecast-icon">{{ day.icon }}</div>
          <div class="forecast-temp">
            <span class="temp-high">{{ day.tempMax }}°</span>
            <span class="temp-separator">/</span>
            <span class="temp-low">{{ day.tempMin }}°</span>
          </div>
          <div class="forecast-desc">{{ day.desc }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useTime } from '../composables/useTime.js'

// 时间数据
const { currentDate, currentWeekday, currentTime, timezone, lunarDate } = useTime()

// 从父组件注入天气数据（不再重复调用 useWeather）
const weather = inject('weather')
const forecast = inject('forecast')
const loading = inject('weatherLoading')
const error = inject('weatherError')

// 配置项
const showLunar = ref(false) // 是否显示农历

// 计算属性 - 当前天气
const cityName = computed(() => weather.value?.cityName || '')
const weatherIcon = computed(() => weather.value?.icon || '⛅')
const temperature = computed(() => weather.value?.temp || '--')
const weatherDesc = computed(() => weather.value?.desc || '加载中...')
const tempRange = computed(() => {
  if (!weather.value) return '--°C / --°C'
  return `${weather.value.tempMin}°C / ${weather.value.tempMax}°C`
})
const humidity = computed(() => weather.value?.humidity || '--')

// 计算属性 - 未来三天天气（排除今天）
const forecastDays = computed(() => {
  if (!forecast.value || forecast.value.length === 0) return []

  const today = new Date()
  today.setHours(0, 0, 0, 0) // 重置时间为00:00:00

  return forecast.value
    .filter((day) => {
      // 过滤掉今天，只保留未来的天气
      const dayDate = new Date(day.date)
      dayDate.setHours(0, 0, 0, 0)
      return dayDate > today
    })
    .slice(0, 3) // 只取前3天
    .map((day, index) => {
      // 格式化日期
      const date = new Date(day.date)
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)

      let dateLabel
      if (date.toDateString() === tomorrow.toDateString()) {
        dateLabel = '明天'
      } else {
        // 显示星期几
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        dateLabel = weekdays[date.getDay()]
      }

      return {
        dateLabel,
        icon: day.iconDay,
        tempMax: day.tempMax,
        tempMin: day.tempMin,
        desc: day.textDay
      }
    })
})
</script>

<style scoped>
.info-panel {
  position: fixed;
  top: 40px;
  right: 40px;
  width: 320px;
  min-height: 200px;
  padding: 24px;
  background-color: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  color: #F1F5F9;
  z-index: 100;
}

/* 日期部分 */
.date-section {
  margin-bottom: 12px;
}

.date {
  font-size: 20px;
  font-weight: 600;
  color: #F1F5F9;
  margin-bottom: 4px;
}

.weekday {
  font-size: 16px;
  font-weight: 400;
  color: #CBD5E1;
}

.lunar {
  font-size: 14px;
  font-weight: 300;
  color: #94A3B8;
  font-style: italic;
  margin-top: 4px;
}

/* 分隔线 */
.divider {
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 12px 0;
}

/* 时间部分 */
.time-section {
  margin-bottom: 12px;
  text-align: center;
}

.time {
  font-family: 'JetBrains Mono', monospace;
  font-size: 42px;
  font-weight: 700;
  background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.3;
  letter-spacing: 0.05em;
}

.timezone {
  font-size: 12px;
  font-weight: 300;
  color: #94A3B8;
  margin-top: 4px;
}

/* 天气部分 */
.weather-section {
  margin-top: 12px;
}

.weather-location {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 6px 0;
}

.location-icon {
  font-size: 16px;
  margin-right: 6px;
}

.location-name {
  font-size: 14px;
  font-weight: 500;
  color: #94A3B8;
}

.weather-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.weather-icon {
  font-size: 64px;
  line-height: 1;
}

.temperature {
  font-size: 48px;
  font-weight: 700;
  color: #FFFFFF;
  line-height: 1.2;
}

.weather-desc {
  font-size: 16px;
  font-weight: 400;
  color: #CBD5E1;
  margin-bottom: 8px;
}

.weather-detail {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 300;
  color: #94A3B8;
}

/* 未来天气预报 */
.forecast-section {
  margin-top: 12px;
}

.forecast-title {
  font-size: 14px;
  font-weight: 500;
  color: #CBD5E1;
  margin-bottom: 12px;
  text-align: left;
}

.forecast-days {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.forecast-day {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px 8px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: default;
}

.forecast-day:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.forecast-date {
  font-size: 12px;
  font-weight: 500;
  color: #94A3B8;
  margin-bottom: 6px;
}

.forecast-icon {
  font-size: 32px;
  margin: 6px 0;
  line-height: 1;
}

.forecast-temp {
  font-size: 14px;
  font-weight: 600;
  margin: 6px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.temp-high {
  color: #F87171; /* 红色 - 最高温 */
}

.temp-separator {
  color: #64748B;
  font-weight: 300;
}

.temp-low {
  color: #60A5FA; /* 蓝色 - 最低温 */
}

.forecast-desc {
  font-size: 11px;
  color: #94A3B8;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 响应式调整 */
@media (max-width: 1366px) {
  .info-panel {
    width: 280px;
    padding: 20px;
    font-size: 14px;
  }

  .time {
    font-size: 36px;
  }

  .temperature {
    font-size: 42px;
  }

  .forecast-icon {
    font-size: 28px;
  }

  .forecast-temp {
    font-size: 13px;
  }
}

/* 悬停效果 */
.info-panel:hover {
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-color: rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}
</style>
