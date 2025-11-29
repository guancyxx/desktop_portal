/**
 * OllamaClient - Infrastructure Layer
 * 
 * HTTP client for Ollama local LLM service.
 * Used for health checks and model listing.
 */

import axios, { AxiosInstance } from 'axios'

export interface OllamaModel {
  name: string
  model: string
  modified_at: string
  size: number
  digest: string
  details?: {
    parent_model?: string
    format?: string
    family?: string
    families?: string[]
    parameter_size?: string
    quantization_level?: string
  }
}

export interface OllamaModelsResponse {
  models: OllamaModel[]
}

export interface OllamaHealthStatus {
  available: boolean
  version?: string
  models?: OllamaModel[]
  error?: string
}

export class OllamaClient {
  private client: AxiosInstance
  private readonly baseUrl: string

  constructor() {
    this.baseUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434'

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 5000, // Short timeout for health checks
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Check if Ollama service is available
   */
  async healthCheck(): Promise<OllamaHealthStatus> {
    try {
      const models = await this.listModels()
      return {
        available: true,
        models: models.models,
      }
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * List available Ollama models
   */
  async listModels(): Promise<OllamaModelsResponse> {
    try {
      const response = await this.client.get<OllamaModelsResponse>('/api/tags')
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message
        throw new Error(`Ollama list models failed: ${message}`)
      }
      throw new Error(
        `Ollama list models failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get specific model info
   */
  async getModelInfo(modelName: string): Promise<OllamaModel | null> {
    try {
      const response = await this.listModels()
      return response.models.find((m) => m.name === modelName || m.model === modelName) || null
    } catch {
      return null
    }
  }

  /**
   * Check if specific model is available
   */
  async isModelAvailable(modelName: string): Promise<boolean> {
    const model = await this.getModelInfo(modelName)
    return model !== null
  }

  /**
   * Test connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.listModels()
      return true
    } catch {
      return false
    }
  }

  /**
   * Format model size to human-readable string
   */
  static formatModelSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`
  }
}
