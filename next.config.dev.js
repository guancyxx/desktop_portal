/** @type {import('next').NextConfig} */
const nextConfig = {
  // 开发环境优化配置
  reactStrictMode: true,
  
  // 禁用遥测
  telemetry: false,
  
  // 开发环境下启用快速刷新
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000, // 轮询间隔（毫秒）
        aggregateTimeout: 300, // 延迟构建
        ignored: /node_modules/,
      }
    }
    return config
  },
  
  // 图片优化配置
  images: {
    domains: ['localhost'],
    unoptimized: true, // 开发环境禁用图片优化
  },
  
  // 环境变量
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  
  // 输出配置（开发环境使用默认）
  output: 'standalone',
  
  // 实验性功能
  experimental: {
    // 服务器组件优化
    serverComponentsExternalPackages: ['next-auth'],
  },
}

module.exports = nextConfig

