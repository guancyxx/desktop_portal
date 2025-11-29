/**
 * ExtractWithLLM Use Case - Application Layer
 * 
 * Orchestrates LLM-based structured data extraction from crawled content.
 * Handles graceful degradation when Ollama is unavailable.
 */

import { Crawl4AIClient } from '@/infrastructure/clients/Crawl4AIClient'
import { OllamaClient } from '@/infrastructure/clients/OllamaClient'

export interface ExtractWithLLMRequest {
  content: string
  provider: string
  model: string
  schema?: Record<string, any>
  instruction?: string
}

export interface ExtractWithLLMResponse {
  success: boolean
  extractedData?: Record<string, any>
  error?: string
  fallbackContent?: string
}

export class ExtractWithLLM {
  constructor(
    private crawl4aiClient: Crawl4AIClient,
    private ollamaClient: OllamaClient
  ) {}

  async execute(request: ExtractWithLLMRequest): Promise<ExtractWithLLMResponse> {
    try {
      // 1. Validate provider availability
      if (request.provider === 'ollama') {
        const isAvailable = await this.ollamaClient.healthCheck()
        if (!isAvailable) {
          return this.gracefulDegradation(
            'Ollama service is not available',
            request.content
          )
        }

        // Check if requested model is available
        const modelsResponse = await this.ollamaClient.listModels()
        const hasModel = modelsResponse.models.some((m) => m.name === request.model)
        if (!hasModel) {
          const availableModels = modelsResponse.models.map((m) => m.name).join(', ')
          return this.gracefulDegradation(
            `Model "${request.model}" is not available in Ollama. Available models: ${availableModels}`,
            request.content
          )
        }
      }

      // 2. Validate schema if provided
      if (request.schema) {
        const schemaValidation = this.validateSchema(request.schema)
        if (!schemaValidation.valid) {
          return {
            success: false,
            error: `Invalid schema: ${schemaValidation.error}`,
            fallbackContent: request.content,
          }
        }
      }

      // 3. Build extraction config
      const extractionConfig = this.crawl4aiClient.buildExtractionConfig(
        request.provider,
        request.model,
        request.schema,
        request.instruction
      )

      // 4. Execute extraction (simulated - in real scenario, this would be part of crawl)
      // Note: In actual implementation, extraction happens during crawl.
      // This use case is for standalone extraction testing or re-extraction scenarios.
      
      return {
        success: true,
        extractedData: {
          message: 'Extraction configuration validated successfully',
          config: extractionConfig,
        },
      }
    } catch (error) {
      return this.gracefulDegradation(
        error instanceof Error ? error.message : 'Unknown extraction error',
        request.content
      )
    }
  }

  /**
   * Graceful degradation - return raw content with error information
   */
  private gracefulDegradation(
    errorMessage: string,
    fallbackContent: string
  ): ExtractWithLLMResponse {
    return {
      success: false,
      error: errorMessage,
      fallbackContent,
      extractedData: {
        _error: errorMessage,
        _note: 'LLM extraction failed. Returning raw markdown content.',
      },
    }
  }

  /**
   * Validate JSON schema structure
   */
  private validateSchema(schema: Record<string, any>): {
    valid: boolean
    error?: string
  } {
    try {
      // Basic validation - check if it's a valid object
      if (typeof schema !== 'object' || schema === null) {
        return { valid: false, error: 'Schema must be an object' }
      }

      // Check for required schema properties
      if (!schema.type && !schema.properties) {
        return {
          valid: false,
          error: 'Schema must have "type" or "properties" field',
        }
      }

      // Validate schema is JSON-serializable
      JSON.stringify(schema)

      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid JSON schema',
      }
    }
  }
}
