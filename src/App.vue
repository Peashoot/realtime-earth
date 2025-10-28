<template>
  <div class="wallpaper-container">
    <!-- Three.js 渲染画布 -->
    <canvas ref="canvasRef" class="earth-canvas"></canvas>

    <!-- 信息面板 -->
    <InfoPanel />
  </div>
</template>

<script setup>
import { ref, onMounted, provide, watch } from 'vue'
import InfoPanel from './components/InfoPanel.vue'
import { useEarthScene } from './composables/useEarthScene.js'
import { useWeather } from './composables/useWeather.js'

const canvasRef = ref(null)
let earthSceneInstance = null
let locationMarkerAdded = false // 标志位，防止重复添加

// 获取天气信息（包含用户位置）- 只在这里调用一次
const { weather, forecast, loading, error } = useWeather()

// 通过 provide 将天气数据提供给子组件
provide('weather', weather)
provide('forecast', forecast)
provide('weatherLoading', loading)
provide('weatherError', error)

// 监听天气数据变化，一旦加载完成就添加位置标记
watch(weather, (newWeather) => {
  if (newWeather && newWeather.location && !locationMarkerAdded && earthSceneInstance) {
    const { lat, lon } = newWeather.location
    console.log('从天气服务获取到用户位置:', { lat, lon })

    // 在地球上添加位置标记
    if (earthSceneInstance.addLocationMarker) {
      earthSceneInstance.addLocationMarker(lat, lon)
      locationMarkerAdded = true // 标记已添加，防止重复
      console.log('位置标记已成功添加')
    }
  }
}, { immediate: true }) // immediate: true 表示立即执行一次

onMounted(() => {
  if (canvasRef.value) {
    // 初始化 Three.js 地球场景
    earthSceneInstance = useEarthScene(canvasRef.value)
    console.log('地球场景初始化完成')

    // 如果此时天气数据已经加载完成，立即添加标记
    if (weather.value && weather.value.location && !locationMarkerAdded) {
      const { lat, lon } = weather.value.location
      console.log('初始化时检测到位置信息:', { lat, lon })

      if (earthSceneInstance.addLocationMarker) {
        earthSceneInstance.addLocationMarker(lat, lon)
        locationMarkerAdded = true
        console.log('位置标记已成功添加（初始化）')
      }
    }
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