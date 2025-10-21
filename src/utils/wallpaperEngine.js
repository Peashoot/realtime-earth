/**
 * Wallpaper Engine 属性监听器
 * 用于在 Wallpaper Engine 中动态更新配置
 */

import { CONFIG } from './config.js'

/**
 * 初始化 Wallpaper Engine 属性监听
 */
export function initWallpaperEngineListener() {
  // 检查是否在 Wallpaper Engine 环境中运行
  if (typeof window.wallpaperPropertyListener === 'undefined') {
    console.log('不在 Wallpaper Engine 环境中，使用默认配置')
    return
  }

  console.log('初始化 Wallpaper Engine 属性监听器...')

  // 监听属性变化
  window.wallpaperPropertyListener = {
    /**
     * 当属性改变时触发
     * @param {Object} properties - 改变的属性对象
     */
    applyUserProperties: function (properties) {
      console.log('Wallpaper Engine 属性已更新:', properties)

      // 纹理质量
      if (properties.textureQuality) {
        CONFIG.earth.textureQuality = properties.textureQuality.value
        console.log('纹理质量已更新:', CONFIG.earth.textureQuality)
        // 注意：纹理质量需要重新加载页面才能生效
        window.location.reload()
      }

      // 相机距离
      if (properties.cameraDistance) {
        CONFIG.earth.camera.distance = properties.cameraDistance.value
        console.log('相机距离已更新:', CONFIG.earth.camera.distance)
        // 触发自定义事件，让场景更新相机位置
        window.dispatchEvent(new CustomEvent('cameraDistanceChanged', {
          detail: { distance: properties.cameraDistance.value }
        }))
      }

      // 允许鼠标拖动旋转
      if (properties.enableRotate) {
        CONFIG.earth.camera.enableRotate = properties.enableRotate.value
        console.log('允许鼠标拖动旋转:', CONFIG.earth.camera.enableRotate)
        window.dispatchEvent(new CustomEvent('enableRotateChanged', {
          detail: { enabled: properties.enableRotate.value }
        }))
      }

      // 允许滚轮缩放
      if (properties.enableZoom) {
        CONFIG.earth.camera.enableZoom = properties.enableZoom.value
        console.log('允许滚轮缩放:', CONFIG.earth.camera.enableZoom)
        window.dispatchEvent(new CustomEvent('enableZoomChanged', {
          detail: { enabled: properties.enableZoom.value }
        }))
      }

      // 自动旋转
      if (properties.autoRotate) {
        CONFIG.earth.camera.autoRotate = properties.autoRotate.value
        console.log('自动旋转:', CONFIG.earth.camera.autoRotate)
        window.dispatchEvent(new CustomEvent('autoRotateChanged', {
          detail: { enabled: properties.autoRotate.value }
        }))
      }

      // 自动旋转速度
      if (properties.autoRotateSpeed) {
        CONFIG.earth.camera.autoRotateSpeed = properties.autoRotateSpeed.value
        console.log('自动旋转速度:', CONFIG.earth.camera.autoRotateSpeed)
        window.dispatchEvent(new CustomEvent('autoRotateSpeedChanged', {
          detail: { speed: properties.autoRotateSpeed.value }
        }))
      }

      // 显示经纬线
      if (properties.showMeridianLines) {
        CONFIG.earth.showMeridianLines = properties.showMeridianLines.value
        console.log('显示经纬线:', CONFIG.earth.showMeridianLines)
        // 经纬线需要重新加载页面才能生效
        window.location.reload()
      }

      // 显示农历
      if (properties.showLunar) {
        // 这个属性由 InfoPanel 组件处理
        window.dispatchEvent(new CustomEvent('showLunarChanged', {
          detail: { enabled: properties.showLunar.value }
        }))
      }
    }
  }

  console.log('Wallpaper Engine 属性监听器初始化完成')
}
