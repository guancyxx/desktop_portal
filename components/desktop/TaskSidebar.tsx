'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import axios from 'axios'

interface Task {
  id: number
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  created_at: string
}

interface TaskSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const priorityColors = {
  low: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  medium: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  high: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
  urgent: 'bg-red-500/20 text-red-600 dark:text-red-400',
}

const priorityLabels = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
}

export function TaskSidebar({ isOpen, onClose }: TaskSidebarProps) {
  const { data: session, status: sessionStatus } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && sessionStatus === 'authenticated') {
      fetchTasks()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sessionStatus])

  const fetchTasks = async () => {
    // 检查用户是否已登录
    if (sessionStatus !== 'authenticated' || !session) {
      setError('请先登录')
      return
    }

    setLoading(true)
    setError(null)
    try {
      console.log('📝 获取任务列表 - 当前用户:', {
        name: session.user?.name,
        email: session.user?.email,
        hasAccessToken: !!session.accessToken
      })

      // 通过 Next.js API route 代理请求，避免 CSP 限制
      const response = await axios.get('/api/tasks', {
        params: {
          page_size: 20,
        },
      })
      
      console.log('✅ 任务列表获取成功:', {
        total: response.data.total,
        tasksCount: response.data.tasks?.length
      })
      
      const allTasks = response.data.tasks || []
      // 筛选出待办和进行中的任务
      const pendingTasks = allTasks.filter(
        (task: Task) => task.status === 'todo' || task.status === 'in_progress'
      )
      
      console.log('📊 待办任务数:', pendingTasks.length)
      setTasks(pendingTasks)
    } catch (err: any) {
      console.error('❌ 获取任务失败:', {
        status: err.response?.status,
        error: err.response?.data,
        message: err.message
      })
      // 检查是否是认证错误
      if (err.response?.status === 401) {
        setError('请先登录任务管理系统')
      } else if (err.response?.data?.error) {
        setError(err.response.data.error)
      } else {
        setError('暂无法获取任务列表')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    
    if (days < 0) return '已过期'
    if (days === 0) return '今天'
    if (days === 1) return '明天'
    if (days <= 7) return `${days}天后`
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* 侧边栏 */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-80 z-50 pt-8 pb-24"
          >
            {/* macOS 风格的毛玻璃侧边栏 */}
            <div className="h-full mx-2 rounded-2xl bg-white/90 dark:bg-gray-800/70 backdrop-blur-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden flex flex-col">
              {/* 头部 */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-2">
                  <div className="text-2xl">✓</div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    待办任务
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchTasks}
                    className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                    title="刷新"
                  >
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                    title="关闭"
                  >
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 任务列表 */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {!loading && (error || tasks.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="text-5xl mb-3">📋</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      {error ? '暂时无法加载任务' : '暂无待办任务'}
                    </p>
                    {error && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
                        请确保已登录任务管理系统
                      </p>
                    )}
                  </div>
                )}

                {!loading && !error && tasks.length > 0 && (
                  <div className="space-y-2">
                    {tasks.map((task) => {
                      const dueDate = formatDate(task.due_date)
                      const isOverdue = task.due_date && new Date(task.due_date) < new Date()

                      return (
                        <div
                          key={task.id}
                          className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-800/80 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30 transition-all cursor-pointer group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 group-hover:border-blue-500 transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">
                                {task.title}
                              </h3>
                              {task.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${priorityColors[task.priority]}`}>
                                  {priorityLabels[task.priority]}
                                </span>
                                {task.status === 'in_progress' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/20 text-blue-600 dark:text-blue-400">
                                    进行中
                                  </span>
                                )}
                                {dueDate && (
                                  <span className={`text-xs ${isOverdue ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                    📅 {dueDate}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

