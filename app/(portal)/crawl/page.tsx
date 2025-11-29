/**
 * Crawl Management Page
 * 
 * Main page for web crawling operations - submit new crawls and view history.
 */

'use client'

import { useState } from 'react'
import { CrawlSubmitForm } from '@/components/crawl/CrawlSubmitForm'
import { CrawlHistoryTable } from '@/components/crawl/CrawlHistoryTable'
import { CrawlTaskResponse } from '@/types/crawl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Globe, History } from 'lucide-react'

export default function CrawlPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  function handleCrawlSuccess(_task: CrawlTaskResponse) {
    // Refresh history when new crawl is submitted
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Web Crawler</h1>
        <p className="text-muted-foreground mt-2">
          Extract web content as markdown with optional LLM-powered structured data extraction
        </p>
      </div>

      <Tabs defaultValue="crawl" className="w-full">
        <TabsList>
          <TabsTrigger value="crawl" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            New Crawl
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crawl" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Submit Crawl Task</CardTitle>
              <CardDescription>
                Enter a URL to crawl and extract content. Optionally use LLM for structured data extraction.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CrawlSubmitForm onSuccess={handleCrawlSuccess} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crawl History</CardTitle>
              <CardDescription>
                View and manage your crawl tasks. Click on any row to see detailed results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CrawlHistoryTable key={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
