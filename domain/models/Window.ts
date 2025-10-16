/**
 * Window Domain Model - 窗口领域模型
 */
import { ApplicationModel } from './Application'

export interface WindowPosition {
  x: number
  y: number
}

export interface WindowSize {
  width: number
  height: number
}

/**
 * 窗口状态枚举
 */
export enum WindowState {
  Normal = 'normal',
  Minimized = 'minimized',
  Maximized = 'maximized'
}

/**
 * 窗口领域模型
 */
export class WindowModel {
  constructor(
    public readonly id: string,
    public readonly app: ApplicationModel,
    public position: WindowPosition,
    public size: WindowSize,
    public state: WindowState,
    public zIndex: number,
    public readonly createdAt: Date = new Date()
  ) {}
  
  /**
   * 创建新窗口
   */
  static create(
    app: ApplicationModel,
    position: WindowPosition,
    size: WindowSize,
    zIndex: number
  ): WindowModel {
    const id = `window-${app.id}-${Date.now()}`
    return new WindowModel(id, app, position, size, WindowState.Normal, zIndex)
  }
  
  /**
   * 窗口是否最小化
   */
  isMinimized(): boolean {
    return this.state === WindowState.Minimized
  }
  
  /**
   * 窗口是否最大化
   */
  isMaximized(): boolean {
    return this.state === WindowState.Maximized
  }
  
  /**
   * 窗口是否正常状态
   */
  isNormal(): boolean {
    return this.state === WindowState.Normal
  }
  
  /**
   * 最小化窗口
   */
  minimize(): WindowModel {
    return new WindowModel(
      this.id,
      this.app,
      this.position,
      this.size,
      WindowState.Minimized,
      this.zIndex,
      this.createdAt
    )
  }
  
  /**
   * 最大化窗口
   */
  maximize(): WindowModel {
    return new WindowModel(
      this.id,
      this.app,
      this.position,
      this.size,
      WindowState.Maximized,
      this.zIndex,
      this.createdAt
    )
  }
  
  /**
   * 恢复窗口到正常状态
   */
  restore(): WindowModel {
    return new WindowModel(
      this.id,
      this.app,
      this.position,
      this.size,
      WindowState.Normal,
      this.zIndex,
      this.createdAt
    )
  }
  
  /**
   * 切换最大化状态
   */
  toggleMaximize(): WindowModel {
    const newState = this.isMaximized() ? WindowState.Normal : WindowState.Maximized
    return new WindowModel(
      this.id,
      this.app,
      this.position,
      this.size,
      newState,
      this.zIndex,
      this.createdAt
    )
  }
  
  /**
   * 更新窗口位置
   */
  updatePosition(position: WindowPosition): WindowModel {
    return new WindowModel(
      this.id,
      this.app,
      position,
      this.size,
      this.state,
      this.zIndex,
      this.createdAt
    )
  }
  
  /**
   * 更新窗口大小
   */
  updateSize(size: WindowSize): WindowModel {
    return new WindowModel(
      this.id,
      this.app,
      this.position,
      size,
      this.state,
      this.zIndex,
      this.createdAt
    )
  }
  
  /**
   * 更新 zIndex（聚焦）
   */
  focus(newZIndex: number): WindowModel {
    return new WindowModel(
      this.id,
      this.app,
      this.position,
      this.size,
      this.state,
      newZIndex,
      this.createdAt
    )
  }
  
  /**
   * 检查窗口是否在指定位置
   */
  isAtPosition(x: number, y: number): boolean {
    return (
      x >= this.position.x &&
      x <= this.position.x + this.size.width &&
      y >= this.position.y &&
      y <= this.position.y + this.size.height
    )
  }
  
  /**
   * 检查窗口是否与另一个窗口重叠
   */
  overlaps(other: WindowModel): boolean {
    return !(
      this.position.x + this.size.width < other.position.x ||
      other.position.x + other.size.width < this.position.x ||
      this.position.y + this.size.height < other.position.y ||
      other.position.y + other.size.height < this.position.y
    )
  }
  
  /**
   * 计算窗口面积
   */
  getArea(): number {
    return this.size.width * this.size.height
  }
}

