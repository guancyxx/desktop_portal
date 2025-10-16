'use client'

import React from 'react'

export default function SystemSettingsPage() {
  return (
    <div className="pt-12 pb-24 px-6 max-w-5xl mx-auto text-sm">
      <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">系统设置</h1>

      <section className="mb-8 rounded-xl border border-white/10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl p-4">
        <h2 className="text-base font-medium mb-3 text-gray-900 dark:text-white">通用</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
          <label className="flex items-center justify-between gap-3">
            <span>语言</span>
            <select className="bg-transparent border rounded px-2 py-1 text-sm">
              <option>中文</option>
              <option>English</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-3">
            <span>时区</span>
            <select className="bg-transparent border rounded px-2 py-1 text-sm">
              <option>Asia/Shanghai</option>
              <option>UTC</option>
            </select>
          </label>
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-white/10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl p-4">
        <h2 className="text-base font-medium mb-3 text-gray-900 dark:text-white">外观</h2>
        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
          <button className="rounded-lg px-3 py-1 border hover:bg-black/5">浅色</button>
          <button className="rounded-lg px-3 py-1 border hover:bg-black/5">深色</button>
          <button className="rounded-lg px-3 py-1 border hover:bg黑/5">跟随系统</button>
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-white/10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl p-4">
        <h2 className="text-base font-medium mb-3 text-gray-900 dark:text-white">关于系统</h2>
        <ul className="space-y-1 text-gray-700 dark:text-gray-300">
          <li>版本：v1.0.0</li>
          <li>平台：DreamBuilder Portal</li>
        </ul>
      </section>
    </div>
  )
}


