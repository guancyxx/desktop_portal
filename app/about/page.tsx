'use client'

import React from 'react'

export default function AboutPage() {
  return (
    <div className="pt-12 pb-24 px-6 max-w-3xl mx-auto text-sm">
      <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">关于 DreamBuilder Portal</h1>
      <div className="rounded-xl border border-white/10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl p-4 text-gray-700 dark:text-gray-300">
        <p className="mb-2">版本：v1.0.0</p>
        <p className="mb-2">构建日期：2025-10-16</p>
        <p className="mb-2">系统说明：DreamBuilder Portal 是面向企业的一体化桌面入口，提供统一访问、应用聚合与一致化体验。</p>
        <p>版权：© 2025 DreamBuilder. 保留所有权利。</p>
      </div>
    </div>
  )
}


