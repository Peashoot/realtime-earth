import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { initWallpaperEngineListener } from './utils/wallpaperEngine.js'

// 初始化 Wallpaper Engine 属性监听
initWallpaperEngineListener()

createApp(App).mount('#app')
