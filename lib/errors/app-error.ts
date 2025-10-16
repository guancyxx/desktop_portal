/**
 * 应用错误类型定义
 * 
 * 提供统一的错误处理和分类
 */

/**
 * 基础应用错误类
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly isOperational: boolean = true
  ) {
    super(message)
    this.name = 'AppError'
    
    // 确保原型链正确
    Object.setPrototypeOf(this, AppError.prototype)
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode
    }
  }
}

/**
 * 未授权错误 (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message = '未授权访问') {
    super(message, 'UNAUTHORIZED', 401)
    this.name = 'UnauthorizedError'
  }
}

/**
 * 禁止访问错误 (403)
 */
export class ForbiddenError extends AppError {
  constructor(message = '无权限访问此资源') {
    super(message, 'FORBIDDEN', 403)
    this.name = 'ForbiddenError'
  }
}

/**
 * 资源未找到错误 (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string = '资源') {
    super(`${resource}未找到`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

/**
 * 验证错误 (400)
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly fields?: Record<string, string>
  ) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

/**
 * 网络错误
 */
export class NetworkError extends AppError {
  constructor(message = '网络请求失败') {
    super(message, 'NETWORK_ERROR', 0)
    this.name = 'NetworkError'
  }
}

/**
 * 服务器错误 (500)
 */
export class ServerError extends AppError {
  constructor(message = '服务器内部错误') {
    super(message, 'SERVER_ERROR', 500)
    this.name = 'ServerError'
  }
}

/**
 * 统一错误处理器
 */
export function handleApiError(error: unknown): never {
  // 如果已经是 AppError，直接抛出
  if (error instanceof AppError) {
    throw error
  }
  
  // 处理 fetch 错误
  if (error instanceof TypeError && error.message.includes('fetch')) {
    throw new NetworkError('网络连接失败，请检查网络设置')
  }
  
  // 处理标准 Error
  if (error instanceof Error) {
    throw new ServerError(error.message)
  }
  
  // 未知错误
  throw new ServerError('发生未知错误')
}

/**
 * 从 HTTP 响应创建错误
 */
export async function createErrorFromResponse(response: Response): Promise<AppError> {
  const statusCode = response.status
  
  let message = response.statusText
  try {
    const data = await response.json()
    message = data.message || data.error || message
  } catch {
    // 无法解析响应体，使用默认消息
  }
  
  switch (statusCode) {
    case 401:
      return new UnauthorizedError(message)
    case 403:
      return new ForbiddenError(message)
    case 404:
      return new NotFoundError(message)
    case 400:
      return new ValidationError(message)
    case 500:
    case 502:
    case 503:
      return new ServerError(message)
    default:
      return new AppError(message, 'HTTP_ERROR', statusCode)
  }
}

