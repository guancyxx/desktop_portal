/**
 * SchemaEditor Component
 * 
 * JSON schema editor with validation, syntax highlighting, and template selection.
 */

'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  SCHEMA_TEMPLATES,
  getSchemaTemplate,
  type SchemaTemplate,
} from '@/lib/crawl-example-schemas'
import { FileCode2, Check, X, Copy, RotateCcw } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export interface SchemaEditorProps {
  value: string
  onChange: (value: string) => void
  onInstructionChange?: (instruction: string) => void
  instruction?: string
  className?: string
}

export function SchemaEditor({
  value,
  onChange,
  onInstructionChange,
  instruction = '',
  className,
}: SchemaEditorProps) {
  const { toast } = useToast()
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>('')
  const [validationError, setValidationError] = React.useState<string>('')
  const [isValid, setIsValid] = React.useState<boolean>(false)
  const [currentTemplate, setCurrentTemplate] = React.useState<SchemaTemplate | null>(null)

  // Validate JSON on value change
  React.useEffect(() => {
    if (!value.trim()) {
      setValidationError('')
      setIsValid(false)
      return
    }

    try {
      const parsed = JSON.parse(value)
      
      // Basic schema validation
      if (typeof parsed !== 'object' || parsed === null) {
        setValidationError('Schema must be a valid JSON object')
        setIsValid(false)
        return
      }

      if (!parsed.type && !parsed.properties) {
        setValidationError('Schema should have "type" or "properties" field')
        setIsValid(false)
        return
      }

      setValidationError('')
      setIsValid(true)
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Invalid JSON')
      setIsValid(false)
    }
  }, [value])

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const template = getSchemaTemplate(templateId)
    if (!template) return

    setSelectedTemplate(templateId)
    setCurrentTemplate(template)
    onChange(JSON.stringify(template.schema, null, 2))
    
    if (onInstructionChange && template.instruction) {
      onInstructionChange(template.instruction)
    }

    toast({
      title: 'Template Applied',
      description: `"${template.name}" schema template loaded successfully`,
    })
  }

  // Handle format JSON
  const handleFormat = () => {
    try {
      const parsed = JSON.parse(value)
      onChange(JSON.stringify(parsed, null, 2))
      toast({
        title: 'Formatted',
        description: 'JSON schema formatted successfully',
      })
    } catch (error) {
      toast({
        title: 'Format Failed',
        description: 'Cannot format invalid JSON',
        variant: 'destructive',
      })
    }
  }

  // Handle copy schema
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      toast({
        title: 'Copied',
        description: 'Schema copied to clipboard',
      })
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy schema to clipboard',
        variant: 'destructive',
      })
    }
  }

  // Handle reset
  const handleReset = () => {
    onChange('')
    if (onInstructionChange) {
      onInstructionChange('')
    }
    setSelectedTemplate('')
    setCurrentTemplate(null)
    toast({
      title: 'Reset',
      description: 'Schema editor cleared',
    })
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-5 w-5" />
              <CardTitle>JSON Schema Editor</CardTitle>
              {isValid && (
                <Badge variant="default" className="bg-green-500">
                  <Check className="mr-1 h-3 w-3" />
                  Valid
                </Badge>
              )}
              {validationError && (
                <Badge variant="destructive">
                  <X className="mr-1 h-3 w-3" />
                  Invalid
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFormat}
                disabled={!value.trim()}
              >
                Format
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!value.trim()}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!value.trim()}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Selector */}
          <div className="space-y-2">
            <Label htmlFor="schema-template">Quick Start Templates</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger id="schema-template">
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Schema (Empty)</SelectItem>
                {SCHEMA_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentTemplate && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <p className="font-medium">{currentTemplate.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {currentTemplate.useCases.map((useCase) => (
                    <Badge key={useCase} variant="secondary">
                      {useCase}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* JSON Schema Editor */}
          <div className="space-y-2">
            <Label htmlFor="schema-json">JSON Schema</Label>
            <Textarea
              id="schema-json"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Enter JSON schema or select a template...

Example:
{
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "author": { "type": "string" }
  },
  "required": ["title"]
}`}
              className="font-mono text-sm min-h-[300px]"
            />
            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
          </div>

          {/* Extraction Instruction */}
          {onInstructionChange && (
            <div className="space-y-2">
              <Label htmlFor="extraction-instruction">
                Extraction Instruction (Optional)
              </Label>
              <Textarea
                id="extraction-instruction"
                value={instruction}
                onChange={(e) => onInstructionChange(e.target.value)}
                placeholder="Provide specific instructions to guide the LLM extraction process..."
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Provide additional context or instructions to help the LLM extract data more
                accurately.
              </p>
            </div>
          )}

          {/* Helper Text */}
          <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">Schema Guidelines:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Use JSON Schema format with type definitions</li>
              <li>Include descriptions for better LLM understanding</li>
              <li>Mark required fields in the &quot;required&quot; array</li>
              <li>Use enums for fixed value choices</li>
              <li>Keep schemas focused and not overly complex</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
