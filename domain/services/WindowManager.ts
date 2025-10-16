/**
 * Window Manager Service - 窗口管理领域服务
 * 
 * 负责窗口的创建、管理和布局
 */
import { WindowModel, WindowPosition, WindowSize } from '../models/Window'
import { ApplicationModel } from '../models/Application'

/**
 * 窗口管理器配置
 */
export interface WindowManagerConfig {
  defaultWidth: number
  defaultHeight: number
  minWidth: number
  minHeight: number
  maxWindows: number
  cascadeOffset: number
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: WindowManagerConfig = {
  defaultWidth: 900,
  defaultHeight: 600,
  minWidth: 400,
  minHeight: 300,
  maxWindows: 10,
  cascadeOffset: 30
}

/**
 * 窗口管理器领域服务
 */
export class WindowManager {
  private config: WindowManagerConfig
  
  constructor(config: Partial<WindowManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }
  
  /**
   * 创建新窗口
   */
  createWindow(
    app: ApplicationModel,
    existingWindows: WindowModel[],
    nextZIndex: number
  ): WindowModel {
    const position = this.calculateInitialPosition(existingWindows)
    const size: WindowSize = {
      width: this.config.defaultWidth,
      height: this.config.defaultHeight
    }
    
    return WindowModel.create(app, position, size, nextZIndex)
  }
  
  /**
   * 计算新窗口的初始位置（层叠布局）
   */
  private calculateInitialPosition(existingWindows: WindowModel[]): WindowPosition {
    const offset = this.config.cascadeOffset
    const count = existingWindows.length
    
    return {
      x: 50 + count * offset,
      y: 80 + count * offset
    }
  }
  
  /**
   * 检查是否可以创建新窗口
   */
  canCreateWindow(existingWindows: WindowModel[]): boolean {
    return existingWindows.length < this.config.maxWindows
  }
  
  /**
   * 查找应用对应的窗口
   */
  findWindowByAppId(
    windows: WindowModel[],
    appId: string
  ): WindowModel | undefined {
    return windows.find(window => window.app.id === appId)
  }
  
  /**
   * 获取顶层窗口（非最小化）
   */
  getTopWindow(windows: WindowModel[]): WindowModel | undefined {
    return windows
      .filter(w => !w.isMinimized())
      .sort((a, b) => b.zIndex - a.zIndex)[0]
  }
  
  /**
   * 获取所有可见窗口（非最小化）
   */
  getVisibleWindows(windows: WindowModel[]): WindowModel[] {
    return windows
      .filter(w => !w.isMinimized())
      .sort((a, b) => b.zIndex - a.zIndex)
  }
  
  /**
   * 获取最小化的窗口
   */
  getMinimizedWindows(windows: WindowModel[]): WindowModel[] {
    return windows.filter(w => w.isMinimized())
  }
  
  /**
   * 自动排列窗口（平铺布局）
   */
  autoArrangeWindows(
    windows: WindowModel[],
    screenWidth: number,
    screenHeight: number
  ): WindowModel[] {
    const visibleWindows = this.getVisibleWindows(windows)
    const count = visibleWindows.length
    
    if (count === 0) return windows
    
    // 计算网格布局
    const cols = Math.ceil(Math.sqrt(count))
    const rows = Math.ceil(count / cols)
    
    const windowWidth = Math.floor(screenWidth / cols)
    const windowHeight = Math.floor(screenHeight / rows)
    
    return windows.map(window => {
      if (window.isMinimized()) return window
      
      const index = visibleWindows.indexOf(window)
      const row = Math.floor(index / cols)
      const col = index % cols
      
      return window
        .updatePosition({ x: col * windowWidth, y: row * windowHeight })
        .updateSize({ width: windowWidth, height: windowHeight })
        .restore() // 取消最大化
    })
  }
  
  /**
   * 层叠排列窗口
   */
  cascadeWindows(windows: WindowModel[]): WindowModel[] {
    const visibleWindows = this.getVisibleWindows(windows)
    const offset = this.config.cascadeOffset
    
    return windows.map((window, index) => {
      if (window.isMinimized()) return window
      
      const visibleIndex = visibleWindows.indexOf(window)
      if (visibleIndex === -1) return window
      
      return window
        .updatePosition({
          x: 50 + visibleIndex * offset,
          y: 80 + visibleIndex * offset
        })
        .updateSize({
          width: this.config.defaultWidth,
          height: this.config.defaultHeight
        })
        .restore()
    })
  }
  
  /**
   * 关闭所有窗口
   */
  closeAllWindows(): WindowModel[] {
    return []
  }
  
  /**
   * 最小化所有窗口
   */
  minimizeAllWindows(windows: WindowModel[]): WindowModel[] {
    return windows.map(w => w.minimize())
  }
  
  /**
   * 验证窗口位置是否在屏幕内
   */
  validateWindowPosition(
    window: WindowModel,
    screenWidth: number,
    screenHeight: number
  ): boolean {
    return (
      window.position.x >= 0 &&
      window.position.y >= 0 &&
      window.position.x + window.size.width <= screenWidth &&
      window.position.y + window.size.height <= screenHeight
    )
  }
  
  /**
   * 约束窗口大小
   */
  constrainWindowSize(size: WindowSize): WindowSize {
    return {
      width: Math.max(this.config.minWidth, size.width),
      height: Math.max(this.config.minHeight, size.height)
    }
  }
  
  /**
   * 计算下一个 zIndex
   */
  getNextZIndex(windows: WindowModel[]): number {
    if (windows.length === 0) return 100
    
    const maxZIndex = Math.max(...windows.map(w => w.zIndex))
    return maxZIndex + 1
  }
}

