<template>
  <div
    class="info-panel"
    :style="panelPositionStyle"
    role="region"
    aria-label="天气和时间信息面板"
  >
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
    <div class="time-section" role="timer" aria-label="当前时间">
      <div
        class="time"
        :class="{ 'animate': timeChanged }"
        ref="timeRef"
        aria-live="polite"
      >
        {{ currentTime }}
      </div>
      <div class="timezone" aria-label="时区">{{ timezone }}</div>
    </div>

    <!-- 第三区：当前天气区 -->
    <div class="weather-section" role="complementary" aria-label="当前天气信息">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-skeleton" aria-busy="true" aria-live="polite" aria-label="天气数据加载中">
        <div class="skeleton-main">
          <div class="skeleton-icon"></div>
          <div class="skeleton-temp"></div>
        </div>
        <div class="skeleton-details">
          <div class="skeleton-line skeleton-line-lg"></div>
          <div class="skeleton-line skeleton-line-sm"></div>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state" role="alert" aria-live="assertive">
        <div class="error-icon" role="img" aria-label="警告图标">⚠️</div>
        <div class="error-message">
          <div class="error-title">天气数据加载失败</div>
          <div class="error-desc">{{ error }}</div>
        </div>
      </div>

      <!-- 正常天气显示 -->
      <template v-else>
        <div class="weather-main">
          <div class="weather-icon" role="img" :aria-label="`天气图标：${weatherDesc}`">{{ weatherIcon }}</div>
          <div class="temperature" :style="{ color: temperatureColor }" aria-label="`当前温度：${temperature}摄氏度`">
            {{ temperature }}°C
          </div>
        </div>
        <div class="weather-details">
          <span class="weather-desc">{{ weatherDesc }}</span>
          <span class="weather-separator" aria-hidden="true">•</span>
          <span class="weather-detail-item" aria-label="`温度范围：${tempRange}`">{{ tempRange }}</span>
          <span class="weather-separator" aria-hidden="true">•</span>
          <span class="weather-detail-item" aria-label="`湿度：${humidity}百分之`">湿度 {{ humidity }}%</span>
        </div>
      </template>
    </div>

    <!-- 第四区：未来天气预报区（2列3行紧凑布局） -->
    <div
      class="forecast-section"
      v-if="forecastDays && forecastDays.length > 0"
      role="complementary"
      aria-label="未来天气预报"
    >
      <div class="forecast-grid" role="list">
        <div
          v-for="(day, index) in forecastDays"
          :key="index"
          class="forecast-card"
          role="listitem"
          :aria-label="`${day.dateLabel}：${day.desc}，最高温度${day.tempMax}度`"
        >
          <span class="forecast-date">{{ day.dateLabel }}</span>
          <span class="forecast-icon" role="img" :aria-label="`天气图标：${day.desc}`">{{ day.icon }}</span>
          <span class="forecast-temp" :style="{ color: day.tempColor }">{{ day.tempMax }}°</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, watch } from 'vue'
import { useTime } from '../composables/useTime.js'
import { CONFIG } from '../utils/config.js'

// 时间数据
const { currentDate, currentWeekday, currentTime, timezone, lunarDate } = useTime()

// 从父组件注入天气数据
const weather = inject('weather')
const forecast = inject('forecast')
const loading = inject('weatherLoading')
const error = inject('weatherError')

// 配置项
const showLunar = ref(CONFIG.ui.panel.showLunar) // 从配置读取是否显示农历
const panelPosition = ref(CONFIG.ui.panel.position) // 面板位置

// 时间变化动画控制
const timeChanged = ref(false)
const timeRef = ref(null)

// 监听时间变化，触发动画（优化：仅在分钟变化时触发）
watch(currentTime, (newTime, oldTime) => {
  if (oldTime && newTime !== oldTime) {
    // 提取分钟部分 (HH:mm)
    const newMinute = newTime.slice(0, 5)
    const oldMinute = oldTime.slice(0, 5)

    // 仅在分钟变化时触发动画
    if (newMinute !== oldMinute) {
      timeChanged.value = true
      setTimeout(() => {
        timeChanged.value = false
      }, 150)
    }
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

// 计算属性 - 面板位置样式
const panelPositionStyle = computed(() => {
  const positions = {
    'top-left': { top: '40px', left: '40px', right: 'auto', bottom: 'auto' },
    'top-right': { top: '40px', right: '40px', left: 'auto', bottom: 'auto' },
    'bottom-left': { bottom: '40px', left: '40px', right: 'auto', top: 'auto' },
    'bottom-right': { bottom: '40px', right: '40px', left: 'auto', top: 'auto' },
    'center': {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      right: 'auto',
      bottom: 'auto'
    }
  }
  return positions[panelPosition.value] || positions['top-right']
})

// 工具函数 - 根据温度获取颜色
const getTemperatureColor = (temp) => {
  const temperature = parseFloat(temp)
  if (isNaN(temperature)) return '#D1D5DB' // 默认颜色

  if (temperature < 0) return '#3B82F6'      // 深蓝
  if (temperature < 15) return '#06B6D4'     // 青色
  if (temperature < 25) return '#10B981'     // 绿色
  if (temperature < 35) return '#F59E0B'     // 橙色
  return '#EF4444'                           // 红色
}

// 计算属性 - 当前温度颜色
const temperatureColor = computed(() => {
  return getTemperatureColor(temperature.value)
})

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
        desc: day.textDay,
        tempColor: getTemperatureColor(day.tempMax)  // 添加温度颜色
      }
    })
})
</script>

<style scoped>
/* ========== CSS变量系统 ========== */
:root {
  /* 优化后的文本颜色 - 提高对比度 */
  --text-primary: #FFFFFF;        /* 主要文本 - 白色 */
  --text-secondary: #F8FAFC;      /* 次要文本 - 浅灰 */
  --text-tertiary: #E2E8F0;       /* 三级文本 - 加强亮度 */
  --text-quaternary: #D1D5DB;     /* 四级文本 - 从 #CBD5E1 提升到 #D1D5DB 提高对比度 */

  /* 背景色 - 微调透明度以提高对比度 */
  --bg-panel: rgba(15, 23, 42, 0.65);  /* 从 0.55 提升到 0.65，增强背景 */
  --bg-section: rgba(255, 255, 255, 0.12);  /* 从 0.1 提升到 0.12 */
  --bg-hover: rgba(255, 255, 255, 0.18);    /* 从 0.15 提升到 0.18 */

  /* 边框和阴影 */
  --border-main: rgba(255, 255, 255, 0.35);      /* 从 0.3 提升 */
  --border-section: rgba(255, 255, 255, 0.18);   /* 从 0.15 提升 */
  --shadow-panel: 0 12px 48px rgba(0, 0, 0, 0.7);     /* 增强阴影 */
  --shadow-hover: 0 16px 64px rgba(0, 0, 0, 0.8);     /* 增强阴影 */
  --shadow-text: 0 2px 12px rgba(0, 0, 0, 0.7);       /* 增强文字阴影 */
  --shadow-text-strong: 0 4px 16px rgba(102, 126, 234, 0.6);  /* 增强 */

  --gradient-time: linear-gradient(135deg, #667EEA 0%, #764BA2 50%, #F093FB 100%);
  --transition-smooth: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-fast: all 0.2s ease;

  /* 优化后的字号系统 - 采用 1.5 倍比例 */
  --font-size-xs: 12px;      /* 极小 */
  --font-size-sm: 13px;      /* 小 */
  --font-size-base: 15px;    /* 基础 */
  --font-size-lg: 18px;      /* 大 */
  --font-size-xl: 24px;      /* 超大 */
  --font-size-2xl: 36px;     /* 2倍超大 */
  --font-size-3xl: 52px;     /* 3倍超大（时间显示）从 56px 调整到 52px */
}

/* ========== 主面板 ========== */
.info-panel {
  position: fixed;
  /* top, right, bottom, left 由 Vue 动态设置 */
  width: 370px;
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

  /* 首次加载动画 */
  animation: panelEnter 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
}

/* 首次加载进入动画 */
@keyframes panelEnter {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
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
  font-size: var(--font-size-base);  /* 15px，使用基础字号 */
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.01em;
  text-shadow: var(--shadow-text);
}

.weekday {
  font-size: var(--font-size-sm);  /* 13px，保持原有大小 */
  font-weight: 400;
  color: var(--text-tertiary);
  text-shadow: var(--shadow-text);
}

.lunar {
  font-size: var(--font-size-xs);  /* 12px */
  font-weight: 300;
  color: var(--text-quaternary);
  font-style: italic;
  margin-left: 4px;
  text-shadow: var(--shadow-text);
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
  font-size: var(--font-size-sm);  /* 13px */
  font-weight: 500;
  color: var(--text-tertiary);
  text-shadow: var(--shadow-text);
}

/* ========== 第二区：时间显示区 ========== */
.time-section {
  text-align: center;
  margin-bottom: 20px;
}

.time {
  font-family: 'JetBrains Mono', 'SF Mono', 'Courier New', monospace;
  font-size: var(--font-size-3xl);  /* 52px，从 56px 优化 */
  font-weight: 800;
  color: var(--text-primary);
  text-shadow: var(--shadow-text-strong), var(--shadow-text);
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
  font-size: var(--font-size-sm);  /* 13px */
  font-weight: 400;
  color: var(--text-tertiary);
  margin-top: 6px;
  letter-spacing: 0.02em;
  text-shadow: var(--shadow-text);
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
  font-size: 64px;  /* 从 72px 优化到 64px，更协调 */
  line-height: 1;
  flex-shrink: 0;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
}

.temperature {
  font-size: var(--font-size-2xl);  /* 36px，从 40px 优化 */
  font-weight: 700;
  color: var(--text-primary);
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
  font-size: var(--font-size-sm);  /* 13px，从 14px 微调 */
  color: var(--text-quaternary);
  line-height: 1.4;
  text-shadow: var(--shadow-text);
}

.weather-desc {
  font-weight: 500;
  color: var(--text-tertiary);
}

.weather-separator {
  color: var(--text-quaternary);
  opacity: 0.6;
}

.weather-detail-item {
  white-space: nowrap;
}

/* ========== 加载骨架屏 ========== */
.loading-skeleton {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.skeleton-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.skeleton-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-temp {
  width: 80px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-line-lg {
  width: 60%;
}

.skeleton-line-sm {
  width: 40%;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* ========== 错误状态 ========== */
.error-state {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
}

.error-icon {
  font-size: 32px;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 8px rgba(239, 68, 68, 0.4));
}

.error-message {
  flex: 1;
}

.error-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: #FCA5A5;
  margin-bottom: 4px;
}

.error-desc {
  font-size: var(--font-size-xs);
  color: var(--text-quaternary);
  line-height: 1.4;
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
  font-size: var(--font-size-sm);  /* 13px */
  font-weight: 500;
  color: var(--text-quaternary);
  text-shadow: var(--shadow-text);
}

.forecast-icon {
  font-size: var(--font-size-lg);  /* 18px，从 20px 微调 */
  line-height: 1;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
}

.forecast-temp {
  font-size: var(--font-size-sm);  /* 13px，从 14px 微调 */
  font-weight: 600;
  /* 颜色由 Vue 动态设置，根据温度变化 */
  text-shadow: var(--shadow-text);
}

/* ========== 响应式设计 ========== */
@media (max-width: 1919px) {
  .info-panel {
    width: 360px;
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
