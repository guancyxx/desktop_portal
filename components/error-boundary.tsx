/**
 * Error Boundary - 错误边界组件
 * 
 * 捕获组件树中的 JavaScript 错误，记录错误并显示备用 UI
 */
'use client'

import { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }
  
  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误到控制台
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // 调用自定义错误处理器
    this.props.onError?.(error, errorInfo)
    
    // 更新状态
    this.setState({
      errorInfo
    })
    
    // TODO: 发送错误到监控服务（如 Sentry）
  }
  
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }
  
  render() {
    if (this.state.hasError) {
      // 使用自定义 fallback
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      // 默认错误 UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="h-6 w-6" />
              <h1 className="text-2xl font-bold">出错了</h1>
            </div>
            
            <div className="space-y-2">
              <p className="text-gray-700 dark:text-gray-300">
                应用程序遇到了一个错误。我们已经记录了这个问题。
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                    查看错误详情
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md overflow-auto">
                    <p className="text-xs font-mono text-red-600 dark:text-red-400">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={this.handleReset}
                className="flex-1"
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                重试
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="flex-1"
              >
                返回首页
              </Button>
            </div>
          </Card>
        </div>
      )
    }
    
    return this.props.children
  }
}

/**
 * 简化版错误展示组件
 */
interface ErrorDisplayProps {
  error: Error
  reset?: () => void
}

export function ErrorDisplay({ error, reset }: ErrorDisplayProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <h2 className="text-lg font-semibold">加载失败</h2>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {error.message || '发生未知错误'}
        </p>
        
        {reset && (
          <Button onClick={reset} size="sm" variant="outline">
            <RefreshCw className="mr-2 h-3 w-3" />
            重试
          </Button>
        )}
      </Card>
    </div>
  )
}

