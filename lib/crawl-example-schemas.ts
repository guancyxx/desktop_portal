/**
 * Example JSON Schemas for LLM Extraction
 * 
 * Pre-defined schemas for common web extraction scenarios.
 */

export interface SchemaTemplate {
  id: string
  name: string
  description: string
  schema: Record<string, any>
  instruction?: string
  useCases: string[]
}

export const SCHEMA_TEMPLATES: SchemaTemplate[] = [
  {
    id: 'article',
    name: 'Article / Blog Post',
    description: 'Extract structured information from news articles and blog posts',
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The main title of the article',
        },
        author: {
          type: 'string',
          description: 'Author name',
        },
        publishDate: {
          type: 'string',
          description: 'Publication date (ISO 8601 format)',
        },
        summary: {
          type: 'string',
          description: 'Brief summary of the article (2-3 sentences)',
        },
        mainContent: {
          type: 'string',
          description: 'Main content body',
        },
        tags: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Article tags or categories',
        },
        readTimeMinutes: {
          type: 'number',
          description: 'Estimated reading time in minutes',
        },
      },
      required: ['title', 'mainContent'],
    },
    instruction: 'Extract article information including title, author, publication date, summary, and content. Identify tags and estimate reading time.',
    useCases: ['News articles', 'Blog posts', 'Medium articles', 'Documentation'],
  },
  {
    id: 'product',
    name: 'E-commerce Product',
    description: 'Extract product details from e-commerce pages',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Product name',
        },
        brand: {
          type: 'string',
          description: 'Brand or manufacturer',
        },
        price: {
          type: 'object',
          properties: {
            amount: {
              type: 'number',
              description: 'Price amount',
            },
            currency: {
              type: 'string',
              description: 'Currency code (e.g., USD, EUR)',
            },
            discount: {
              type: 'number',
              description: 'Discount percentage if applicable',
            },
          },
          required: ['amount', 'currency'],
        },
        description: {
          type: 'string',
          description: 'Product description',
        },
        specifications: {
          type: 'object',
          additionalProperties: {
            type: 'string',
          },
          description: 'Technical specifications as key-value pairs',
        },
        availability: {
          type: 'string',
          enum: ['in_stock', 'out_of_stock', 'preorder', 'discontinued'],
          description: 'Stock availability status',
        },
        rating: {
          type: 'object',
          properties: {
            score: {
              type: 'number',
              description: 'Rating score (e.g., 4.5)',
            },
            count: {
              type: 'number',
              description: 'Number of reviews',
            },
          },
        },
        images: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Product image URLs',
        },
      },
      required: ['name', 'price'],
    },
    instruction: 'Extract comprehensive product information including name, brand, price (with currency), description, specifications, availability, ratings, and images.',
    useCases: ['Amazon', 'eBay', 'Shopify stores', 'Product pages'],
  },
  {
    id: 'contact',
    name: 'Contact Information',
    description: 'Extract contact details and business information',
    schema: {
      type: 'object',
      properties: {
        businessName: {
          type: 'string',
          description: 'Business or organization name',
        },
        address: {
          type: 'object',
          properties: {
            street: {
              type: 'string',
            },
            city: {
              type: 'string',
            },
            state: {
              type: 'string',
            },
            postalCode: {
              type: 'string',
            },
            country: {
              type: 'string',
            },
          },
        },
        phone: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Phone numbers',
        },
        email: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Email addresses',
        },
        website: {
          type: 'string',
          description: 'Website URL',
        },
        socialMedia: {
          type: 'object',
          properties: {
            facebook: {
              type: 'string',
            },
            twitter: {
              type: 'string',
            },
            linkedin: {
              type: 'string',
            },
            instagram: {
              type: 'string',
            },
          },
          description: 'Social media profile URLs',
        },
        businessHours: {
          type: 'string',
          description: 'Operating hours',
        },
      },
      required: ['businessName'],
    },
    instruction: 'Extract all available contact information including business name, address, phone numbers, emails, website, social media links, and business hours.',
    useCases: ['Contact pages', 'Business directories', 'About pages'],
  },
  {
    id: 'event',
    name: 'Event Information',
    description: 'Extract event details from event pages',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Event name',
        },
        description: {
          type: 'string',
          description: 'Event description',
        },
        startDate: {
          type: 'string',
          description: 'Start date and time (ISO 8601)',
        },
        endDate: {
          type: 'string',
          description: 'End date and time (ISO 8601)',
        },
        location: {
          type: 'object',
          properties: {
            venue: {
              type: 'string',
            },
            address: {
              type: 'string',
            },
            city: {
              type: 'string',
            },
            isVirtual: {
              type: 'boolean',
            },
          },
        },
        organizer: {
          type: 'string',
          description: 'Event organizer',
        },
        price: {
          type: 'object',
          properties: {
            amount: {
              type: 'number',
            },
            currency: {
              type: 'string',
            },
            isFree: {
              type: 'boolean',
            },
          },
        },
        registrationUrl: {
          type: 'string',
          description: 'Registration/ticket URL',
        },
        capacity: {
          type: 'number',
          description: 'Maximum attendees',
        },
      },
      required: ['name', 'startDate'],
    },
    instruction: 'Extract event details including name, dates, location, organizer, pricing, and registration information.',
    useCases: ['Eventbrite', 'Meetup', 'Conference pages', 'Webinar pages'],
  },
  {
    id: 'job',
    name: 'Job Posting',
    description: 'Extract job listing information',
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Job title',
        },
        company: {
          type: 'string',
          description: 'Company name',
        },
        location: {
          type: 'string',
          description: 'Job location',
        },
        employmentType: {
          type: 'string',
          enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
        },
        remote: {
          type: 'boolean',
          description: 'Is remote work allowed',
        },
        salary: {
          type: 'object',
          properties: {
            min: {
              type: 'number',
            },
            max: {
              type: 'number',
            },
            currency: {
              type: 'string',
            },
            period: {
              type: 'string',
              enum: ['hourly', 'monthly', 'yearly'],
            },
          },
        },
        description: {
          type: 'string',
          description: 'Job description',
        },
        requirements: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Job requirements and qualifications',
        },
        benefits: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Employee benefits',
        },
        postedDate: {
          type: 'string',
          description: 'Posted date (ISO 8601)',
        },
        applyUrl: {
          type: 'string',
          description: 'Application URL',
        },
      },
      required: ['title', 'company'],
    },
    instruction: 'Extract comprehensive job posting information including title, company, location, employment type, salary, requirements, benefits, and application details.',
    useCases: ['LinkedIn Jobs', 'Indeed', 'Company career pages'],
  },
  {
    id: 'recipe',
    name: 'Recipe',
    description: 'Extract cooking recipe information',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Recipe name',
        },
        description: {
          type: 'string',
          description: 'Recipe description',
        },
        author: {
          type: 'string',
          description: 'Recipe author/chef',
        },
        prepTime: {
          type: 'string',
          description: 'Preparation time (e.g., "15 minutes")',
        },
        cookTime: {
          type: 'string',
          description: 'Cooking time',
        },
        totalTime: {
          type: 'string',
          description: 'Total time',
        },
        servings: {
          type: 'number',
          description: 'Number of servings',
        },
        ingredients: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'List of ingredients with quantities',
        },
        instructions: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Step-by-step cooking instructions',
        },
        nutrition: {
          type: 'object',
          properties: {
            calories: {
              type: 'number',
            },
            protein: {
              type: 'string',
            },
            carbohydrates: {
              type: 'string',
            },
            fat: {
              type: 'string',
            },
          },
          description: 'Nutritional information per serving',
        },
        difficulty: {
          type: 'string',
          enum: ['easy', 'medium', 'hard'],
        },
        tags: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Recipe tags (e.g., vegetarian, gluten-free)',
        },
      },
      required: ['name', 'ingredients', 'instructions'],
    },
    instruction: 'Extract complete recipe information including name, times, servings, ingredients with quantities, step-by-step instructions, nutrition facts, and dietary tags.',
    useCases: ['Food blogs', 'Recipe sites', 'Cooking magazines'],
  },
]

/**
 * Get schema template by ID
 */
export function getSchemaTemplate(id: string): SchemaTemplate | undefined {
  return SCHEMA_TEMPLATES.find((template) => template.id === id)
}

/**
 * Get all schema template names for dropdown
 */
export function getSchemaTemplateOptions(): Array<{ value: string; label: string }> {
  return SCHEMA_TEMPLATES.map((template) => ({
    value: template.id,
    label: template.name,
  }))
}
