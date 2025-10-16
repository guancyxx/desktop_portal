import { Application } from '@/types'

export const applications: Application[] = [
  {
    id: 'task-manager',
    name: 'Task Manager',
    description: 'Manage your tasks, projects, and workflows efficiently',
    icon: '📋',
    url: 'http://localhost:3001',
    category: 'productivity',
    roles: ['user', 'admin'],
    status: 'active',
    color: '#667eea',
    order: 1,
    windowMode: 'window', // 在页面内窗口打开
  },
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    description: 'Intelligent automation and natural language processing',
    icon: '🤖',
    url: 'http://localhost:3002',
    category: 'ai',
    roles: ['user', 'admin'],
    status: 'active',
    color: '#f093fb',
    order: 2,
    windowMode: 'window', // 在页面内窗口打开
  },
  {
    id: 'analytics',
    name: 'Analytics Dashboard',
    description: 'View insights and analytics across all your applications',
    icon: '📊',
    url: 'http://localhost:3003',
    category: 'analytics',
    roles: ['user', 'admin'],
    status: 'coming-soon',
    color: '#4facfe',
    order: 3,
    windowMode: 'window', // 在页面内窗口打开
  },
  {
    id: 'user-management',
    name: 'User Management',
    description: 'Manage users, roles, and permissions',
    icon: '👥',
    url: 'http://localhost:8080/admin/dreambuilder/console',
    category: 'admin',
    roles: ['admin'],
    status: 'active',
    color: '#fa709a',
    order: 4,
    windowMode: 'window', // 在页面内窗口打开
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Configure your preferences and system settings',
    icon: '⚙️',
    url: '/settings',
    category: 'tools',
    roles: ['user', 'admin'],
    status: 'active',
    color: '#a8edea',
    order: 5,
    windowMode: 'window', // 在页面内窗口打开
  },
  {
    id: 'help',
    name: 'Help',
    description: 'Help center and system information',
    icon: '❓',
    url: '/help',
    category: 'tools',
    roles: ['user', 'admin'],
    status: 'active',
    color: '#c3cfe2',
    order: 6,
    windowMode: 'window', // 在页面内窗口打开
  },
  {
    id: 'dev-tools',
    name: 'Developer Tools',
    description: 'API documentation and developer resources',
    icon: '🔧',
    url: 'http://localhost:3001/api-docs',
    category: 'tools',
    roles: ['admin'],
    status: 'active',
    color: '#fed6e3',
    order: 7,
    windowMode: 'window', // 在页面内窗口打开
  },
  {
    id: 'system-settings',
    name: 'System Settings',
    description: 'Configure system preferences',
    icon: '🛠️',
    url: '/system',
    category: 'tools',
    roles: ['user', 'admin'],
    status: 'active',
    color: '#d1d5db',
    order: 8,
    windowMode: 'window'
  },
  {
    id: 'about',
    name: 'About',
    description: 'About DreamBuilder Portal',
    icon: 'ℹ️',
    url: '/about',
    category: 'tools',
    roles: ['user', 'admin'],
    status: 'active',
    color: '#cbd5e1',
    order: 9,
    windowMode: 'window'
  },
]

export const categories = [
  { id: 'all', label: 'All Applications', icon: '📱' },
  { id: 'productivity', label: 'Productivity', icon: '📋' },
  { id: 'ai', label: 'AI & Automation', icon: '🤖' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'admin', label: 'Administration', icon: '👥' },
  { id: 'tools', label: 'Tools', icon: '🔧' },
]

