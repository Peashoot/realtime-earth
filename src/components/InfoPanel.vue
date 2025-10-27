<template>
  <div class="info-panel">
    <!-- 第一区：顶部信息条（日期 + 位置） -->
    <div class="header-bar">
      <div class="date-section">
        <div class="date">{{ currentDate }}</div>
        <div class="weekday">{{ currentWeekday }}</div>
        <div class="lunar" v-if="showLunar">{{ lunarDate }}</div>
      </div>
      <div class="location-section" v-if="cityName">
        <span class="location-icon">📍</span>
        <span class="location-name">{{ cityName }}</span>
      </div>
    </div>

    <!-- 第二区：时间显示区 -->
    <div class="time-section">
      <div
        class="time"
        :class="{ 'animate': timeChanged }"
        ref="timeRef"
      >
        {{ currentTime }}
      </div>
      <div class="timezone">{{ timezone }}</div>
    </div>

    <!-- 第三区：当前天气区 -->
    <div class="weather-section">
      <div class="weather-main">
        <div class="weather-icon">{{ weatherIcon }}</div>
        <div class="temperature">{{ temperature }}°C</div>
      </div>
      <div class="weather-details">
        <span class="weather-desc">{{ weatherDesc }}</span>
        <span class="weather-separator">•</span>
        <span class="weather-detail-item">{{ tempRange }}</span>
        <span class="weather-separator">•</span>
        <span class="weather-detail-item">湿度 {{ humidity }}%</span>
      </div>
    </div>

    <!-- 第四区：未来天气预报区（2列3行紧凑布局） -->
    <div class="forecast-section" v-if="forecastDays && forecastDays.length > 0">
      <div class="forecast-grid">
        <div
          v-for="(day, index) in forecastDays"
          :key="index"
          class="forecast-card"
        >
          <span class="forecast-date">{{ day.dateLabel }}</span>
          <span class="forecast-icon">{{ day.icon }}</span>
          <span class="forecast-temp">{{ day.tempMax }}°</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, watch } from 'vue'
import { useTime } from '../composables/useTime.js'

// 时间数据
const { currentDate, currentWeekday, currentTime, timezone, lunarDate } = useTime()

// 从父组件注入天气数据
const weather = inject('weather')
const forecast = inject('forecast')
const loading = inject('weatherLoading')
const error = inject('weatherError')

// 配置项
const showLunar = ref(false) // 是否显示农历

// 时间变化动画控制
const timeChanged = ref(false)
const timeRef = ref(null)

// 监听时间变化，触发动画
watch(currentTime, (newTime, oldTime) => {
  if (oldTime && newTime !== oldTime) {
    timeChanged.value = true
    setTimeout(() => {
      timeChanged.value = false
    }, 150)
  }
})

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

// 计算属性 - 未来六天天气（排除今天）
const forecastDays = computed(() => {
  if (!forecast.value || forecast.value.length === 0) return []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return forecast.value
    .filter((day) => {
      const dayDate = new Date(day.date)
      dayDate.setHours(0, 0, 0, 0)
      return dayDate > today
    })
    .slice(0, 6)
    .map((day, index) => {
      const date = new Date(day.date)
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)

      let dateLabel
      if (date.toDateString() === tomorrow.toDateString()) {
        dateLabel = '明天'
      } else {
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
/* ========== CSS变量系统 ========== */
:root {
  --text-primary: #FFFFFF;
  --text-secondary: #F8FAFC;
  --text-tertiary: #E2E8F0;
  --text-quaternary: #CBD5E1;
  --bg-panel: rgba(15, 23, 42, 0.55);
  --bg-section: rgba(255, 255, 255, 0.1);
  --bg-hover: rgba(255, 255, 255, 0.15);
  --border-main: rgba(255, 255, 255, 0.3);
  --border-section: rgba(255, 255, 255, 0.15);
  --shadow-panel: 0 12px 48px rgba(0, 0, 0, 0.6);
  --shadow-hover: 0 16px 64px rgba(0, 0, 0, 0.7);
  --shadow-text: 0 2px 12px rgba(0, 0, 0, 0.6);
  --shadow-text-strong: 0 4px 16px rgba(102, 126, 234, 0.5);
  --gradient-time: linear-gradient(135deg, #667EEA 0%, #764BA2 50%, #F093FB 100%);
  --transition-smooth: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-fast: all 0.2s ease;
}

/* ========== 主面板 ========== */
.info-panel {
  position: fixed;
  top: 40px;
  right: 40px;
  width: 360px;
  padding: 28px;
  background-color: var(--bg-panel);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--border-main);
  border-radius: 20px;
  box-shadow: var(--shadow-panel);
  color: #FFFFFF;
  z-index: 100;
  transition: var(--transition-smooth);
}

.info-panel:hover {
  backdrop-filter: blur(32px) saturate(180%);
  -webkit-backdrop-filter: blur(32px) saturate(180%);
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: var(--shadow-hover);
}

/* ========== 第一区：顶部信息条 ========== */
.header-bar {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  background: var(--bg-section);
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 20px;
}

.date-section {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0;
}

.date {
  font-size: 15px;
  font-weight: 600;
  color: #F8FAFC;
  letter-spacing: 0.01em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
}

.weekday {
  font-size: 14px;
  font-weight: 400;
  color: #E2E8F0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
}

.lunar {
  font-size: 12px;
  font-weight: 300;
  color: #CBD5E1;
  font-style: italic;
  margin-left: 4px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
}

.location-section {
  display: flex;
  align-items: center;
  gap: 4px;
}

.location-icon {
  font-size: 14px;
  opacity: 0.8;
}

.location-name {
  font-size: 14px;
  font-weight: 500;
  color: #E2E8F0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
}

/* ========== 第二区：时间显示区 ========== */
.time-section {
  text-align: center;
  margin-bottom: 20px;
}

.time {
  font-family: 'JetBrains Mono', 'SF Mono', 'Courier New', monospace;
  font-size: 56px;
  font-weight: 800;
  color: #FFFFFF;
  text-shadow: 0 4px 16px rgba(102, 126, 234, 0.5), 0 2px 8px rgba(0, 0, 0, 0.6);
  line-height: 1.2;
  letter-spacing: 0.08em;
  transition: transform 0.15s ease;
}

@keyframes timeChange {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.time.animate {
  animation: timeChange 0.15s ease;
}

.timezone {
  font-size: 13px;
  font-weight: 400;
  color: #E2E8F0;
  margin-top: 6px;
  letter-spacing: 0.02em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
}

/* ========== 第三区：当前天气区 ========== */
.weather-section {
  margin-bottom: 16px;
}

.weather-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
}

.weather-icon {
  font-size: 72px;
  line-height: 1;
  flex-shrink: 0;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
}

.temperature {
  font-size: 40px;
  font-weight: 700;
  color: #FFFFFF;
  line-height: 1.2;
  text-shadow: var(--shadow-text);
  flex-shrink: 0;
  text-align: right;
}

.weather-details {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 14px;
  color: #CBD5E1;
  line-height: 1.4;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
}

.weather-desc {
  font-weight: 500;
  color: #E2E8F0;
}

.weather-separator {
  color: #CBD5E1;
  opacity: 0.6;
}

.weather-detail-item {
  white-space: nowrap;
}

/* ========== 第四区：未来天气预报区（2列3行紧凑布局） ========== */
.forecast-section {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 12px;
  transition: var(--transition-fast);
}

.forecast-section:hover {
  background: var(--bg-hover);
}

.forecast-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.forecast-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 8px 10px;
  transition: all 0.3s ease;
  cursor: default;
  white-space: nowrap;
}

.forecast-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.forecast-date {
  font-size: 13px;
  font-weight: 500;
  color: #CBD5E1;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
}

.forecast-icon {
  font-size: 20px;
  line-height: 1;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
}

.forecast-temp {
  font-size: 14px;
  font-weight: 600;
  color: #F87171;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
}

/* ========== 响应式设计 ========== */
@media (max-width: 1919px) {
  .info-panel {
    width: 320px;
    padding: 24px;
  }

  .time {
    font-size: 48px;
  }

  .temperature {
    font-size: 34px;
  }

  .weather-icon {
    font-size: 64px;
  }

  .forecast-icon {
    font-size: 18px;
  }
}

@media (max-width: 768px) {
  .info-panel {
    width: 280px;
    padding: 20px;
    top: 24px;
    right: 24px;
  }

  .time {
    font-size: 42px;
  }

  .temperature {
    font-size: 30px;
  }

  .weather-icon {
    font-size: 56px;
  }

  .forecast-grid {
    grid-template-columns: 1fr;
  }

  .forecast-icon {
    font-size: 16px;
  }

  .forecast-temp {
    font-size: 13px;
  }
}

@media (min-width: 2560px) {
  .info-panel {
    width: 420px;
    padding: 32px;
    top: 60px;
    right: 60px;
  }

  .time {
    font-size: 64px;
  }

  .temperature {
    font-size: 48px;
  }

  .weather-icon {
    font-size: 80px;
  }

  .date {
    font-size: 17px;
  }

  .weather-details {
    font-size: 16px;
  }

  .forecast-card {
    padding: 10px 12px;
  }

  .forecast-icon {
    font-size: 22px;
  }

  .forecast-temp {
    font-size: 16px;
  }
}

/* ========== 性能优化 ========== */
.info-panel,
.time,
.temperature {
  will-change: transform;
  transform: translateZ(0);
}

/* ========== 可访问性增强 ========== */
@media (prefers-contrast: high) {
  .info-panel {
    border: 2px solid rgba(255, 255, 255, 0.4);
    background-color: rgba(15, 23, 42, 0.6);
  }

  .time {
    -webkit-text-fill-color: #FFFFFF;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  }

  .temperature {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  }
}

@media (prefers-reduced-motion: reduce) {
  .info-panel,
  .time,
  .forecast-section {
    transition: none;
    animation: none;
  }
}
</style>
