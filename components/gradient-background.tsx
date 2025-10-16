'use client'

export function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
      
      {/* Animated blobs */}
      <div className="absolute top-0 -left-4 h-72 w-72 animate-blob rounded-full bg-purple-300 opacity-70 mix-blend-multiply blur-xl filter dark:opacity-30" />
      <div className="animation-delay-2000 absolute top-0 -right-4 h-72 w-72 animate-blob rounded-full bg-yellow-300 opacity-70 mix-blend-multiply blur-xl filter dark:opacity-30" />
      <div className="animation-delay-4000 absolute -bottom-8 left-20 h-72 w-72 animate-blob rounded-full bg-pink-300 opacity-70 mix-blend-multiply blur-xl filter dark:opacity-30" />
    </div>
  )
}

