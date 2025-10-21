# 实时地球动态壁纸 - 使用说明

> Vue 3 + Three.js + Wallpaper Engine
> 最后更新时间：2025年10月

---

## ✅ 项目状态

**所有核心功能已完成并成功构建！**

- ✅ Vue 3 + Vite 项目结构
- ✅ Three.js 3D地球渲染
- ✅ 实时太阳光照系统（基于UTC时间）
- ✅ 自动太阳赤纬角计算（真实季节模拟）
- ✅ 昼夜纹理混合（自定义Shader）
- ✅ 城市灯光夜景效果
- ✅ 真实天气数据（和风天气API）
- ✅ IP地理定位 + 中文地名（GeoAPI）
- ✅ 鼠标交互旋转（OrbitControls）
- ✅ 经纬度网格线（可配置）
- ✅ Wallpaper Engine 配置
- ✅ **完整太阳系天体系统**
  - ✅ 增强太阳视觉效果（多层光晕、日冕、脉动）
  - ✅ 月球系统（真实比例与轨道）
  - ✅ 八大行星（水星、金星、火星、木星、土星、天王星、海王星）
  - ✅ 哈雷彗星（双尾效果、动态彗发）
  - ✅ 真实天文数据（大小、距离、轨道周期）
  - ✅ 动态效果（自转、公转、彗尾变化）

---

## 📦 构建输出

### 文件结构

```
dist/
├── index.html              # 入口文件
├── assets/
│   ├── css/               # 样式文件 (~3KB)
│   └── js/                # JavaScript文件
│       ├── index-xxx.js   # 主应用代码 (~110KB)
│       ├── vendor-xxx.js  # Vue + Day.js (~67KB)
│       └── three-xxx.js   # Three.js (~483KB)
├── fonts/                 # 字体文件
│   ├── JetBrainsMono-Bold.woff2
│   └── JetBrainsMono-Regular.woff2
└── textures/             # 地球纹理资源
    ├── 2k_earth_daymap.jpg      # 日间地球
    ├── 2k_earth_nightmap.jpg    # 夜间地球（城市灯光）
    ├── 2k_earth_normal_map.png  # 法线贴图
    ├── 2k_earth_specular_map.jpg # 高光贴图
    ├── 2k_earth_clouds.jpg      # 云层
    └── 8k 版本...
```

### 构建统计

| 资源 | 大小（原始） | 大小（Gzip） |
|------|------------|-------------|
| HTML | 0.66 KB | 0.40 KB |
| CSS | 4.33 KB | 1.35 KB |
| JS（主应用） | 55.24 KB | 17.57 KB |
| JS（Vue等） | 66.99 KB | 26.83 KB |
| JS（Three.js） | 490.43 KB | 123.40 KB |
| **总计** | ~618 KB | ~169 KB |

---

## 🚀 在 Wallpaper Engine 中使用

### 方法1：直接导入（推荐）

1. **打开 Wallpaper Engine**
2. **点击"壁纸编辑器"**
3. **选择"创建壁纸" → "Web"**
4. **浏览到项目目录**，选择 `project.json` 文件
5. Wallpaper Engine 会自动加载 `dist/index.html`
6. **点击"确定"**保存

### 方法2：发布到创意工坊

1. 在 Wallpaper Engine 编辑器中打开壁纸
2. 点击"文件" → "发布到创意工坊"
3. 填写壁纸信息：
   - 标题：实时地球动态壁纸
   - 描述：（参考下方描述模板）
   - 标签：3D、地球、实时、天气
4. 上传预览图（建议截图）
5. 点击"发布"

---

## ⚙️ 配置选项

### 环境变量配置

项目使用环境变量来保护敏感信息（如API密钥）。

1. **复制环境变量模板**：
   ```bash
   cp .env.example .env.local
   ```

2. **编辑 `.env.local` 文件**，填入你的和风天气API密钥：
   ```env
   VITE_QWEATHER_API_KEY=your_api_key_here
   VITE_QWEATHER_BASE_URL=https://devapi.qweather.com/v7
   ```

3. **获取和风天气API Key**：
   - 访问 [和风天气开发平台](https://www.qweather.com/)
   - 注册账号并创建应用
   - 免费版可满足个人使用需求

**注意**：`.env.local` 文件已在 `.gitignore` 中，不会被提交到版本控制系统。

### 在 `src/utils/config.js` 中配置：

```javascript
// IP定位配置
location: {
  enableIPLocation: true       // 是否启用IP定位
}

// 地球渲染配置
earth: {
  textureQuality: '2k',        // '2k' | '8k' - 纹理质量
  sunDeclination: 'auto',      // 'auto' | 数值 - 太阳赤纬角
  longitudeOffset: 90,         // 经度偏移量（度）
  showMeridianLines: false,    // 是否显示经线和标签

  // 相机控制配置
  camera: {
    enableRotate: false,       // 是否允许鼠标拖动旋转
    enableZoom: false,         // 是否允许滚轮缩放
    distance: 3.0,             // 相机距离（1.5 - 5.0）
    autoRotate: true,          // 是否自动旋转观察视角
    autoRotateSpeed: 1.0       // 自动旋转速度（-10.0 到 10.0）
  },

  // 天体系统配置
  celestial: {
    enabled: true,             // 是否启用天体系统
    showOrbits: false,         // 是否显示轨道线
    timeScale: 1000,           // 时间缩放倍数（1=真实时间）

    // 太阳视觉效果
    sun: {
      enablePulsate: true,     // 是否启用太阳脉动效果
      enableCorona: true       // 是否启用日冕效果
    },

    // 各个天体的显示开关
    bodies: {
      moon: true,              // 月球
      sun: true,               // 太阳
      mercury: true,           // 水星
      venus: true,             // 金星
      mars: true,              // 火星
      jupiter: true,           // 木星
      saturn: true,            // 土星
      uranus: true,            // 天王星
      neptune: true,           // 海王星
      comet: true              // 彗星
    }
  }
}

// 天气更新间隔
weather: {
  updateInterval: 30 * 60 * 1000  // 更新间隔（毫秒）
}
```

**说明**：
- API密钥等敏感信息已移至 `.env.local` 文件中
- 其他配置项可在 `config.js` 中直接修改
- 天体系统可单独开关，也可选择性显示各个天体
- 时间缩放倍数控制天体运动速度（建议1000x以看到明显运动）

### 季节配置说明

通过 `sunDeclination` 模拟不同季节：

| 值 | 季节 | 效果 |
|------|------|------|
| **'auto'** | **自动计算** | **根据当前日期自动计算太阳赤纬角（推荐）** |
| **0.0** | 春秋分 | 南北极各一半昼夜 |
| **+23.44** | 夏至 | 北极圈内极昼 |
| **-23.44** | 冬至 | 南极圈内极昼 |
| **+10.0** | 春末/夏初 | 北半球日照增多 |
| **-10.0** | 秋末/冬初 | 南半球日照增多 |

**注意**：当设置为 `'auto'` 时，系统会根据当前日期自动计算太阳赤纬角，模拟真实的季节变化。计算公式基于地球公转轨道的天文学模型。

---

## 🎯 功能特性

### 1. 3D地球渲染
- ✅ 高质量地球纹理（2K/8K可选）
- ✅ 法线贴图（地形凹凸感）
- ✅ 高光贴图（海洋反射）
- ✅ 动态云层（独立旋转）
- ✅ 大气光晕效果（Fresnel）
- ✅ 星空背景（2000个粒子）
- ✅ 经纬度网格线（金色，30度间隔，可配置隐藏）

### 2. 实时光照系统
- ✅ 根据真实UTC时间计算太阳位置
- ✅ 昼夜纹理自动混合（Shader实现）
  - 白天区域：显示日间地球纹理
  - 夜晚区域：显示城市灯光纹理
  - 晨昏线：平滑过渡（约12度宽）
- ✅ 海洋镜面反射（仅白天）
- ✅ 可调节太阳赤纬角（模拟季节变化）
- ✅ 每60秒更新一次太阳位置

### 3. 地理定位与天气
- ✅ **自动IP定位**：
  - 主方法：myip.ipip.net
  - 备用方法：ipconfig.me
- ✅ **IP地理位置解析**：ipinfo.io（获取经纬度）
- ✅ **中文城市名称**：和风天气 GeoAPI（经纬度→中文地名）
- ✅ **和风天气API**：实时天气数据
  - 温度、天气描述、天气图标
  - 7天天气预报（显示未来3天）
  - 30分钟自动更新
- ✅ **位置标记**：红色闪烁标记显示当前位置

### 4. 交互与相机控制
- ✅ **鼠标拖拽旋转**：OrbitControls实现（可配置开关）
  - 左键拖拽：旋转视角
  - 可在配置中禁用
- ✅ **滚轮缩放**：1.5x - 5x 缩放范围（可配置开关）
  - 滚轮：放大/缩小
  - 可在配置中禁用
- ✅ **相机距离调节**：可在配置中设置初始距离
- ✅ **自动旋转观察视角**：可配置开关和速度
  - 速度可调：-10.0 到 10.0（负值反向）
  - 平滑旋转，可暂停
- ✅ **太阳光照固定**：拖动时太阳照射的经纬度保持不变
- ✅ **Wallpaper Engine 集成**：所有相机参数可在 WE 中实时调整

### 5. 信息面板
- ✅ **日期显示**：完整日期 + 星期
- ✅ **时间显示**：HH:mm:ss 格式，渐变色
- ✅ **天气显示**：
  - 当前天气：温度、天气描述、图标
  - 未来三天预报：日期、图标、温度范围
- ✅ **位置显示**：中文城市名称

### 6. 天体系统（完整太阳系）
- ✅ **增强太阳效果**：
  - 5层光晕系统（核心、内层、中层、外层、日冕）
  - 自定义着色器实现真实日冕效果
  - 微妙脉动动画（2%幅度）
  - 加法混合模式（AdditiveBlending）
  - 可配置开关（脉动、日冕）

- ✅ **月球系统**：
  - 真实比例大小（0.273倍地球半径）
  - 27.3天公转周期
  - 围绕地球运行
  - 粗糙月球表面材质
  - 微弱自发光（反射太阳光）

- ✅ **八大行星**：
  - **水星**：灰褐色，粗糙表面（88天周期）
  - **金星**：淡黄色云层，高反光（225天周期）
  - **火星**：锈红色氧化铁表面（687天周期）
  - **木星**：橙褐色氨气云层，最大气态行星（11.86年周期）
  - **土星**：淡金黄色，标志性光环系统（29.5年周期）
  - **天王星**：青蓝色甲烷冰晶（84年周期）
  - **海王星**：深蓝色甲烷大气（165年周期）
  - 真实大小比例（经艺术化调整）
  - 真实轨道距离（经平方根缩放）
  - 真实公转周期
  - 高质量材质（specular + shininess）

- ✅ **哈雷彗星**：
  - **彗核**：灰白色岩石和冰核心
  - **彗发**：淡蓝色气体云（coma），靠近太阳时膨胀
  - **离子尾**：蓝白色（200粒子），细长笔直，受太阳风影响
  - **尘埃尾**：黄白色（300粒子），较宽，沿轨道弯曲
  - 极椭圆轨道（离心率0.85）
  - 75年公转周期
  - 动态效果：彗尾长度和亮度随距离变化

- ✅ **真实天文数据**：
  - 所有天体大小基于真实比例（经艺术化调整以保证可视性）
  - 轨道距离使用平方根缩放（保持相对关系）
  - 公转周期完全真实（可加速1000倍观看）
  - 物理正确的彗尾方向计算

- ✅ **可配置选项**：
  - 天体系统总开关
  - 单独控制每个天体显示
  - 轨道线显示/隐藏
  - 时间缩放倍数调节（1x - 10000x）
  - 太阳视觉效果开关（脉动、日冕）

---

## 🔧 开发相关

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 项目结构

```
realtime-earth/
├── src/
│   ├── components/        # Vue组件
│   │   └── InfoPanel.vue  # 信息面板
│   ├── composables/       # 组合式函数
│   │   ├── useEarthScene.js       # 地球场景（Shader、经线、标记）
│   │   ├── useSunPosition.js      # 太阳位置计算
│   │   ├── useCelestialSystem.js  # 天体系统（太阳、行星、彗星）
│   │   ├── useTime.js             # 时间管理
│   │   └── useWeather.js          # 天气数据集成
│   ├── services/          # 服务层
│   │   ├── location.js    # IP定位服务（双重备用）
│   │   └── qweather.js    # 和风天气API
│   ├── utils/             # 工具函数
│   │   ├── config.js            # 配置文件
│   │   ├── celestialBodies.js   # 天体数据配置（大小、轨道、颜色）
│   │   ├── wallpaperEngine.js   # Wallpaper Engine属性监听
│   │   └── geoUtils.js          # 地理坐标转换
│   ├── App.vue            # 根组件
│   ├── main.js            # 入口文件
│   └── style.css          # 全局样式
├── public/
│   ├── fonts/             # 字体资源
│   └── textures/          # 地球纹理
├── dist/                  # 构建输出（用于Wallpaper Engine）
├── package.json
├── vite.config.js         # Vite配置
└── project.json           # Wallpaper Engine配置
```

### 核心技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | 3.5.13 | 响应式UI框架 |
| Three.js | ^0.171.0 | 3D渲染引擎 |
| Vite | ^6.0.1 | 构建工具 |
| Day.js | ^1.11.13 | 日期时间处理 |
| QWeather API | v7 | 天气数据 |
| Tencent Location | v1 | IP定位 |

---

## 📝 技术实现细节

### 太阳赤纬角自动计算

当 `sunDeclination` 设置为 `'auto'` 时，系统使用以下公式计算太阳赤纬角：

```javascript
// 公式：δ = -23.44° × cos(360°/365 × (N + 10))
// N = 当前是一年中的第几天（1-365/366）
function calculateSolarDeclination(date) {
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000)
  const declination = -23.44 * Math.cos((360 / 365) * (dayOfYear + 10) * (Math.PI / 180))
  return declination
}
```

**说明**：
- 这是简化的天文学模型，足够精确用于可视化
- N + 10 是因为冬至大约在每年的第355天（12月21日左右）
- 赤纬角范围：-23.44° (冬至) 到 +23.44° (夏至)
- 春分/秋分时赤纬角接近 0°

### 昼夜纹理混合（Custom Shader）

```glsl
// 片段着色器核心逻辑
float sunIntensity = dot(normal, sunDirection);
float dayMix = smoothstep(-0.1, 0.1, sunIntensity);
vec4 finalColor = mix(nightColor, dayColor, dayMix);
```

### 坐标系统

- **经度方向**：从北极看逆时针为西经→东经
- **经度偏移**：`longitudeOffset = -90` 修正贴图旋转
- **太阳位置**：`longitude = 180 - UTC时间 * 15°`

### IP定位流程

```
1. 获取IP (myip.ipip.net 或 ipconfig.me)
   ↓
2. IP → 地理坐标 (ipinfo.io)
   ↓
3. 坐标 → 中文城市名称 (和风天气 GeoAPI)
   ↓
4. 坐标 → 天气数据 (和风天气)
```

**优势**：
- 获取准确的中文城市名称
- ipinfo.io 响应快速，数据准确
- 统一使用和风天气API生态
- 自动降级：GeoAPI失败时使用英文名称

---

## ⚡ 性能优化建议

### 当前性能表现
- **帧率**：60fps（流畅）
- **内存占用**：~250MB
- **初始加载**：~2-3秒（取决于纹理质量和网络）

### 优化建议
1. **低端设备**：
   - 使用2K纹理（`textureQuality: '2k'`）
   - 隐藏经线（`showMeridianLines: false`）
2. **高端设备**：
   - 使用8K纹理（`textureQuality: '8k'`）
   - 显示所有效果
3. **多显示器**：
   - 建议使用2K纹理避免内存不足

---

## 🐛 已知问题与注意事项

### 1. API配置
- **和风天气API**：需要注册获取免费API Key
- **IP定位服务**：使用 ipinfo.io，无需注册（有免费额度限制）

### 2. 坐标系统
- 经度偏移量可能需要根据实际情况调整
- 当前默认 `-90` 适配地球贴图旋转

### 3. 天气更新
- 默认30分钟更新一次，避免API调用频率超限
- 可在配置中调整 `updateInterval`

---

## 📄 许可证

本项目使用的开源资源：

| 资源 | 许可证 | 来源 |
|------|--------|------|
| Vue 3 | MIT | https://vuejs.org/ |
| Three.js | MIT | https://threejs.org/ |
| Day.js | MIT | https://day.js.org/ |
| 地球纹理 | 公共领域 | NASA/Solar System Scope |
| JetBrains Mono | OFL | https://jetbrains.com/mono |
| QWeather API | 商业/免费 | https://www.qweather.com/ |
| ipinfo.io | 免费额度 | https://ipinfo.io/ |

---

## 🎓 学习资源

### Three.js 相关
- [Three.js 官方文档](https://threejs.org/docs/)
- [Three.js Examples](https://threejs.org/examples/)
- [ShaderMaterial 指南](https://threejs.org/docs/#api/en/materials/ShaderMaterial)

### WebGL Shader
- [The Book of Shaders](https://thebookofshaders.com/)
- [GLSL 参考](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language)

### 地理坐标系统
- [Geographic coordinate system](https://en.wikipedia.org/wiki/Geographic_coordinate_system)
- [Spherical coordinate system](https://en.wikipedia.org/wiki/Spherical_coordinate_system)

---

## 📧 反馈与支持

如果遇到问题或有改进建议，欢迎：
- 提交 Issue
- 发起 Pull Request
- 联系开发者

---

## 🎉 致谢

感谢以下开源项目和服务：
- **Vue.js** - 渐进式JavaScript框架
- **Three.js** - JavaScript 3D库
- **Vite** - 下一代前端工具链
- **NASA** - 地球纹理资源
- **和风天气** - 天气数据服务
- **ipinfo.io** - IP定位服务

---

## 🔄 版本历史

### v2.0.0 - 天体系统重大更新
- ✅ **完整天体系统**：添加月球、太阳、八大行星、彗星
- ✅ **增强太阳效果**：
  - 5层光晕系统（核心、内层、中层、外层、日冕）
  - 自定义着色器实现真实日冕效果
  - 微妙脉动动画
- ✅ **月球系统**：
  - 真实比例大小和轨道
  - 27.3天公转周期
  - 高质量表面材质
- ✅ **八大行星**：
  - 基于真实天文数据（大小、距离、周期）
  - 艺术化比例缩放（保证可视性）
  - 各自特色颜色和材质（金星云层、土星光环等）
- ✅ **哈雷彗星**：
  - 双尾系统（离子尾 + 尘埃尾）
  - 动态彗发效果
  - 物理正确的彗尾方向
  - 距离相关的亮度变化
- ✅ **天体配置系统**：
  - 天体系统总开关
  - 单独控制每个天体显示
  - 轨道线可视化
  - 时间缩放倍数调节（1x - 10000x）
- ✅ **Wallpaper Engine集成**：
  - 新增天体系统配置面板
  - 支持实时调整轨道线显示
  - 支持实时调整时间缩放
- ✅ **性能优化**：
  - 高效粒子系统（500+ 彗星粒子）
  - 优化几何细分度（64x64）
  - 加法混合模式优化

### v1.3.0
- ✅ 相机控制系统：支持拖拽旋转、滚轮缩放、自动旋转
- ✅ Wallpaper Engine 实时配置：所有相机参数可动态调整
- ✅ 未来天气预报：7天数据，显示未来3天
- ✅ 切换IP定位服务：从 ip-api.com 到 ipinfo.io
- ✅ 移除无用配置项：删除 rotationSpeed

### v1.2.0
- ✅ 添加自动太阳赤纬角计算（基于日期的真实季节模拟）
- ✅ 替换IP定位服务：从腾讯位置服务切换到 ip-api.com
- ✅ 集成和风天气 GeoAPI：支持中文城市名称
- ✅ 优化环境变量管理：敏感信息移至 .env.local
- ✅ 移除不必要的API签名和代理配置
- ✅ 简化配置文件结构

### v1.1.0
- ✅ 添加昼夜纹理混合（自定义Shader）
- ✅ 集成和风天气API
- ✅ 添加IP地理定位（双重备用机制）
- ✅ 实现鼠标交互旋转（OrbitControls）
- ✅ 添加经纬度网格线（可配置）
- ✅ 添加季节模拟功能（可调节太阳赤纬角）
- ✅ 优化坐标系统和经度计算
- ✅ 添加位置标记功能

### v1.0.0
- ✅ 基础3D地球渲染
- ✅ 太阳光照系统
- ✅ 信息面板
- ✅ Wallpaper Engine 集成

---
