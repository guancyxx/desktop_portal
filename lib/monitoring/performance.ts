/**
 * Performance Monitoring - 性能监控工具
 * 
 * 监控和记录应用性能指标
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  metadata?: Record<string, unknown>
}

/**
 * 性能监控器（单例）
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 100 // 最多保存100条记录
  
  private constructor() {
    // 私有构造函数，确保单例
  }
  
  /**
   * 获取单例实例
   */
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }
  
  /**
   * 记录性能指标
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)
    
    // 保持最多 maxMetrics 条记录
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }
    
    // 如果性能低于阈值，发出警告
    if (metric.value > 16) { // 超过一帧时间（60fps）
      console.warn(`[Performance] Slow ${metric.name}: ${metric.value.toFixed(2)}ms`, metric.metadata)
    }
  }
  
  /**
   * 测量组件渲染时间
   */
  measureComponentRender(componentName: string, callback: () => void): void {
    const startTime = performance.now()
    
    callback()
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    this.recordMetric({
      name: 'component_render',
      value: duration,
      timestamp: Date.now(),
      metadata: { component: componentName }
    })
  }
  
  /**
   * 测量异步操作时间
   */
  async measureAsync<T>(
    name: string,
    callback: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await callback()
      const duration = performance.now() - startTime
      
      this.recordMetric({
        name,
        value: duration,
        timestamp: Date.now(),
        metadata: { ...metadata, status: 'success' }
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      this.recordMetric({
        name,
        value: duration,
        timestamp: Date.now(),
        metadata: { 
          ...metadata, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      
      throw error
    }
  }
  
  /**
   * 测量 API 调用时间
   */
  async measureAPICall<T>(
    endpoint: string,
    callback: () => Promise<T>
  ): Promise<T> {
    return this.measureAsync('api_call', callback, { endpoint })
  }
  
  /**
   * 获取性能指标统计
   */
  getStats(metricName?: string): {
    count: number
    average: number
    min: number
    max: number
    p50: number
    p95: number
    p99: number
  } {
    const filtered = metricName
      ? this.metrics.filter(m => m.name === metricName)
      : this.metrics
    
    if (filtered.length === 0) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0
      }
    }
    
    const values = filtered.map(m => m.value).sort((a, b) => a - b)
    const sum = values.reduce((acc, v) => acc + v, 0)
    
    return {
      count: filtered.length,
      average: sum / filtered.length,
      min: values[0] || 0,
      max: values[values.length - 1] || 0,
      p50: values[Math.floor(values.length * 0.5)] || 0,
      p95: values[Math.floor(values.length * 0.95)] || 0,
      p99: values[Math.floor(values.length * 0.99)] || 0,
    }
  }
  
  /**
   * 获取所有指标
   */
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }
  
  /**
   * 清除所有指标
   */
  clear(): void {
    this.metrics = []
  }
  
  /**
   * 导出性能报告
   */
  exportReport(): string {
    const metricNames = Array.from(new Set(this.metrics.map(m => m.name)))
    const report = metricNames.map(name => {
      const stats = this.getStats(name)
      return `${name}:
  Count: ${stats.count}
  Average: ${stats.average.toFixed(2)}ms
  Min: ${stats.min.toFixed(2)}ms
  Max: ${stats.max.toFixed(2)}ms
  P50: ${stats.p50.toFixed(2)}ms
  P95: ${stats.p95.toFixed(2)}ms
  P99: ${stats.p99.toFixed(2)}ms`
    }).join('\n\n')
    
    return report
  }
}

// 导出单例实例
export const performanceMonitor = PerformanceMonitor.getInstance()

/**
 * React Hook：测量组件渲染性能
 */
export function usePerformanceMonitor(componentName: string) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      performanceMonitor.measureComponentRender(componentName, () => {})
      
      if (duration > 16) {
        console.warn(`[Performance] ${componentName} render took ${duration.toFixed(2)}ms`)
      }
    }
  }
  
  return () => {} // noop in production
}

