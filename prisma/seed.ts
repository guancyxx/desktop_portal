import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Default CrawlConfig for each tenant
  // Note: In real deployment, you'd fetch actual organizationIds from Keycloak
  // For development, this creates a template config that can be copied per tenant
  
  const defaultConfig = {
    id: '00000000-0000-0000-0000-000000000001', // UUID for default config template
    organizationId: '00000000-0000-0000-0000-000000000000', // Placeholder organization
    userId: '00000000-0000-0000-0000-000000000000', // System user
    name: 'Default Crawl Configuration',
    isDefault: true,
    browserConfig: {
      headless: true,
      viewport: {
        width: 1920,
        height: 1080,
      },
      waitUntil: 'networkidle',
      timeout: 30000,
    },
    crawlerConfig: {
      maxDepth: 1,
      followLinks: false,
      respectRobotsTxt: true,
      userAgent: 'DreamBuilder-Crawler/1.0',
    },
    llmProvider: 'ollama',
    llmModel: 'qwen3-coder:30b', // Default model from user's Ollama installation
    description: 'Default configuration for web crawling with Ollama LLM integration',
  }

  // Upsert default config (idempotent)
  const config = await prisma.crawlConfig.upsert({
    where: { id: defaultConfig.id },
    update: defaultConfig,
    create: defaultConfig,
  })

  console.log('✅ Default CrawlConfig created:', config.name)
  console.log(`   ID: ${config.id}`)
  console.log(`   LLM: ${config.llmProvider} (${config.llmModel})`)
  
  // Note: Real tenant-specific configs should be created when organizations are set up
  console.log('\n⚠️  Remember to create tenant-specific configs in production!')
  console.log('   Each tenant should have their own CrawlConfig with their organizationId')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
