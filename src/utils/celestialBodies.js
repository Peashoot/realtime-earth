/**
 * 天体系统配置
 * 基于真实天文数据，经过艺术化调整以适应可视化
 *
 * 缩放策略说明：
 * - 大小比例：小天体（<1）使用 0.8次方放大，大天体（>1）使用平方根缩小
 * - 距离比例：使用平方根缩放压缩距离，保持相对关系
 * - 地球半径 = 1 单位作为基准
 *
 * 真实数据参考：
 * - 半径比例（相对地球）：月球0.273, 水星0.383, 金星0.949, 火星0.532
 *                        木星11.21, 土星9.45, 天王星4.01, 海王星3.88, 太阳109.2
 * - 距离（AU）：月球0.00257, 水星0.39, 金星0.72, 火星1.52, 木星5.20
 *             土星9.54, 天王星19.19, 海王星30.07, 太阳1.00
 */

import { CONFIG } from './config.js'

export const CELESTIAL_BODIES = {
  // 月球（地球的卫星）
  moon: {
    name: '月球',
    type: 'satellite',
    radius: 0.027,                   // 艺术化：0.027（真实：0.273倍地球半径）
    orbitRadius: 0.15,               // 艺术化压缩（真实：384,400km ≈ 60倍地球半径）
    orbitPeriod: 27.3,               // 真实公转周期（天）
    color: 0xc9c9c9,                 // 月球灰色（更亮一些）
    emissive: 0x333333,              // 微弱自发光（反射太阳光）
    specular: 0x222222,              // 低镜面反射
    shininess: 5,                    // 低光泽度（月球表面粗糙）
    realRadius: 0.273,               // 真实半径比例（相对地球=1）
    realOrbitRadius: 384400,         // 真实轨道半径（km）
    get enabled() { return CONFIG.earth.celestial?.bodies?.moon ?? true }
  },

  // 太阳
  sun: {
    name: '太阳',
    type: 'star',
    radius: 0.6,                     // 艺术化大小（在12单位距离上的合理视觉大小）
    visualDistance: 12,              // 太阳的可视距离（与地球的距离）
    color: 0xffdd00,                 // 太阳黄色
    emissive: 0xffaa00,              // 强烈自发光
    glowColor: 0xffff00,             // 光晕颜色
    glowIntensity: 2.5,              // 光晕强度
    position: 'sunLight',            // 使用太阳光源方向
    realRadius: 109.2,               // 真实半径比例（相对地球=1）
    realDistance: 149600000,         // 真实距离（km，1 AU）
    get enabled() { return CONFIG.earth.celestial?.bodies?.sun ?? true }
  },

  // 水星
  mercury: {
    name: '水星',
    type: 'planet',
    radius: 0.038,                   // 艺术化（真实：0.383倍地球半径）
    orbitRadius: 2.0,                // sqrt(0.39) * 3.2 ≈ 2.0（真实：0.39 AU）
    orbitPeriod: 88,                 // 真实公转周期（天）
    color: 0x8c7853,                 // 灰褐色（类似月球）
    specular: 0x333333,              // 低镜面反射
    shininess: 5,                    // 粗糙表面
    realRadius: 0.383,               // 真实半径比例
    realOrbitRadius: 0.39,           // 真实轨道半径（AU）
    get enabled() { return CONFIG.earth.celestial?.bodies?.mercury ?? true }
  },

  // 金星
  venus: {
    name: '金星',
    type: 'planet',
    radius: 0.095,                   // 艺术化（真实：0.949倍地球半径，接近地球大小）
    orbitRadius: 2.7,                // sqrt(0.72) * 3.2 ≈ 2.7（真实：0.72 AU）
    orbitPeriod: 225,                // 真实公转周期（天）
    color: 0xffd89a,                 // 淡黄色（厚重硫酸云层）
    emissive: 0x443322,              // 轻微自发光（温室效应）
    specular: 0x888888,              // 高镜面反射（云层光滑）
    shininess: 80,                   // 高光泽度
    realRadius: 0.949,               // 真实半径比例
    realOrbitRadius: 0.72,           // 真实轨道半径（AU）
    get enabled() { return CONFIG.earth.celestial?.bodies?.venus ?? true }
  },

  // 火星
  mars: {
    name: '火星',
    type: 'planet',
    radius: 0.053,                   // 艺术化（真实：0.532倍地球半径）
    orbitRadius: 3.9,                // sqrt(1.52) * 3.2 ≈ 3.9（真实：1.52 AU）
    orbitPeriod: 687,                // 真实公转周期（天）
    color: 0xcd5c5c,                 // 火星红色（氧化铁锈红）
    specular: 0x442222,              // 低镜面反射
    shininess: 10,                   // 中等光泽度
    realRadius: 0.532,               // 真实半径比例
    realOrbitRadius: 1.52,           // 真实轨道半径（AU）
    get enabled() { return CONFIG.earth.celestial?.bodies?.mars ?? true }
  },

  // 木星
  jupiter: {
    name: '木星',
    type: 'planet',
    radius: 0.335,                   // sqrt(11.21) * 0.1 ≈ 0.335（真实：11.21倍地球半径）
    orbitRadius: 7.3,                // sqrt(5.20) * 3.2 ≈ 7.3（真实：5.20 AU）
    orbitPeriod: 4333,               // 真实公转周期：11.86年 ≈ 4333天
    color: 0xc88b3a,                 // 橙褐色（氨气云层）
    specular: 0x554433,              // 中等镜面反射
    shininess: 30,                   // 中等光泽度
    realRadius: 11.21,               // 真实半径比例
    realOrbitRadius: 5.20,           // 真实轨道半径（AU）
    get enabled() { return CONFIG.earth.celestial?.bodies?.jupiter ?? true }
  },

  // 土星
  saturn: {
    name: '土星',
    type: 'planet',
    radius: 0.307,                   // sqrt(9.45) * 0.1 ≈ 0.307（真实：9.45倍地球半径）
    orbitRadius: 9.9,                // sqrt(9.54) * 3.2 ≈ 9.9（真实：9.54 AU）
    orbitPeriod: 10759,              // 真实公转周期：29.5年 ≈ 10759天
    color: 0xfad5a5,                 // 淡金黄色（氨晶体云）
    specular: 0x665544,              // 中等镜面反射
    shininess: 25,                   // 中等光泽度
    hasRings: true,                  // 土星标志性光环
    ringInnerRadius: 0.37,           // 光环内径（相对土星半径1.2倍）
    ringOuterRadius: 0.62,           // 光环外径（相对土星半径2.0倍）
    ringColor: 0xccaa88,             // 光环颜色（冰粒子反射）
    realRadius: 9.45,                // 真实半径比例
    realOrbitRadius: 9.54,           // 真实轨道半径（AU）
    get enabled() { return CONFIG.earth.celestial?.bodies?.saturn ?? true }
  },

  // 天王星
  uranus: {
    name: '天王星',
    type: 'planet',
    radius: 0.200,                   // sqrt(4.01) * 0.1 ≈ 0.200（真实：4.01倍地球半径）
    orbitRadius: 14.0,               // sqrt(19.19) * 3.2 ≈ 14.0（真实：19.19 AU）
    orbitPeriod: 30687,              // 真实公转周期：84年 ≈ 30687天
    color: 0x4fd0e7,                 // 青蓝色（甲烷吸收红光）
    specular: 0x446688,              // 中等镜面反射
    shininess: 40,                   // 较高光泽度（冰态表面）
    realRadius: 4.01,                // 真实半径比例
    realOrbitRadius: 19.19,          // 真实轨道半径（AU）
    get enabled() { return CONFIG.earth.celestial?.bodies?.uranus ?? true }
  },

  // 海王星
  neptune: {
    name: '海王星',
    type: 'planet',
    radius: 0.197,                   // sqrt(3.88) * 0.1 ≈ 0.197（真实：3.88倍地球半径）
    orbitRadius: 17.5,               // sqrt(30.07) * 3.2 ≈ 17.5（真实：30.07 AU）
    orbitPeriod: 60190,              // 真实公转周期：165年 ≈ 60190天
    color: 0x2e5ee6,                 // 深蓝色（甲烷大气层）
    specular: 0x334488,              // 中等镜面反射
    shininess: 50,                   // 较高光泽度
    realRadius: 3.88,                // 真实半径比例
    realOrbitRadius: 30.07,          // 真实轨道半径（AU）
    get enabled() { return CONFIG.earth.celestial?.bodies?.neptune ?? true }
  },

  // 彗星（哈雷彗星风格）
  comet: {
    name: '彗星',
    type: 'comet',
    radius: 0.01,                    // 彗核很小（几km级别）
    orbitRadius: 8.0,                // 近日点距离（艺术化）
    orbitEccentricity: 0.85,         // 高离心率，极椭圆轨道
    orbitPeriod: 2740,               // 类似哈雷彗星：75年 ≈ 2740天
    color: 0xcccccc,                 // 灰白色彗核（岩石和冰）
    tailLength: 1.2,                 // 彗尾基础长度
    tailColor: 0x88aaff,             // 蓝白色离子尾
    dustTailColor: 0xffeeaa,         // 黄白色尘埃尾
    comaColor: 0xaaddff,             // 彗发颜色（淡蓝色气体云）
    get enabled() { return CONFIG.earth.celestial?.bodies?.comet ?? true }
  }
}

// 时间加速倍数配置
export const TIME_SCALE = {
  realtime: 1,                       // 真实时间
  fast: 100,                         // 100倍速
  veryFast: 1000,                    // 1000倍速
  ultraFast: 10000,                  // 10000倍速
  get default() { return CONFIG.earth.celestial?.timeScale ?? 1000 }
}
