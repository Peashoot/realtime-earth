import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],

  // 使用相对路径，确保 Wallpaper Engine 可以加载资源
  base: './',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',

    // 优化配置（使用 esbuild 更快）
    minify: 'esbuild',
    target: 'es2015',

    rollupOptions: {
      output: {
        // 分块策略
        manualChunks: {
          'three': ['three'],
          'vendor': ['vue', 'dayjs']
        },
        // 资源文件命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },

    // 资源大小警告阈值（KB）
    chunkSizeWarningLimit: 1000
  },

  // 开发服务器配置
  server: {
    port: 3000,
    open: true,
    cors: true
  }
})
