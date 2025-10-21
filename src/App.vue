<template>
  <div class="wallpaper-container">
    <!-- Three.js 渲染画布 -->
    <canvas ref="canvasRef" class="earth-canvas"></canvas>

    <!-- 信息面板 -->
    <InfoPanel />
  </div>
</template>

<script setup>
import { ref, onMounted, provide } from 'vue'
import InfoPanel from './components/InfoPanel.vue'
import { useEarthScene } from './composables/useEarthScene.js'
import { useWeather } from './composables/useWeather.js'

const canvasRef = ref(null)

// 获取天气信息（包含用户位置）- 只在这里调用一次
const { weather, forecast, loading, error } = useWeather()

// 通过 provide 将天气数据提供给子组件
provide('weather', weather)
provide('forecast', forecast)
provide('weatherLoading', loading)
provide('weatherError', error)

onMounted(async () => {
  if (canvasRef.value) {
    // 初始化 Three.js 地球场景（不再传递rotationSpeed参数）
    const earthScene = useEarthScene(canvasRef.value)

    // 等待天气数据加载（包含位置信息）
    // 延迟一下，确保天气服务已经获取位置
    setTimeout(() => {
      if (weather.value && weather.value.location) {
        const { lat, lon } = weather.value.location
        console.log('从天气服务获取到用户位置:', { lat, lon })

        // 在地球上添加位置标记
        if (earthScene && earthScene.addLocationMarker) {
          earthScene.addLocationMarker(lat, lon)
        }
      }
    }, 2000) // 2秒后检查位置信息
  }
})
</script>

<style scoped>
.wallpaper-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.earth-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
}
</style>