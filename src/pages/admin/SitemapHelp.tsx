
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, FileText, Settings, Tool } from 'lucide-react';

export default function SitemapHelp() {
  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sitemap Documentation</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="troubleshooting" className="flex items-center gap-1">
            <Tool className="h-4 w-4" />
            Troubleshooting
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Sitemap System Overview</CardTitle>
              <CardDescription>
                Understanding how the sitemap generation system works
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">What is a Sitemap?</h3>
                <p className="text-gray-700 mb-3">
                  A sitemap is an XML file that lists all the important pages on your website.
                  It helps search engines understand your site structure and find all your content,
                  which can improve your SEO performance.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">How Our Sitemap System Works</h3>
                <p className="text-gray-700 mb-3">
                  Soundraiser's sitemap system has several key components:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Automatic Generation:</strong> The sitemap is automatically regenerated when content changes.</li>
                  <li><strong>Database Triggers:</strong> When blog posts or smart links are added, updated, or deleted, database triggers notify the sitemap generator.</li>
                  <li><strong>Caching:</strong> The sitemap is cached in the database to improve performance.</li>
                  <li><strong>Search Engine Notification:</strong> When the sitemap updates, search engines are automatically notified.</li>
                  <li><strong>Monitoring:</strong> A monitoring system tracks the sitemap's health and logs all events.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">What's Included in the Sitemap</h3>
                <p className="text-gray-700 mb-3">
                  Our sitemap includes:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Static pages (homepage, pricing, etc.)</li>
                  <li>All published blog posts</li>
                  <li>Blog pagination pages</li>
                  <li>All public smart links</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring the Sitemap</CardTitle>
              <CardDescription>
                How to monitor and ensure your sitemap is working correctly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Health Check Dashboard</h3>
                <p className="text-gray-700 mb-3">
                  The Sitemap Monitor provides real-time status of your sitemap:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Health Status:</strong> Overall health (OK, Warning, Error)</li>
                  <li><strong>Last Updated:</strong> When the sitemap was last regenerated</li>
                  <li><strong>Age:</strong> How old the current sitemap is</li>
                  <li><strong>URL Count:</strong> Number of URLs in the sitemap</li>
                </ul>
                <p className="text-gray-700 mt-3">
                  <strong className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Good Practice:
                  </strong>{" "}
                  Check the Sitemap Monitor at least once a week to ensure everything is functioning correctly.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Log Analysis</h3>
                <p className="text-gray-700 mb-3">
                  The Logs tab shows a detailed history of all sitemap-related events:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Success Events:</strong> Successful regenerations and pings</li>
                  <li><strong>Warning Events:</strong> Non-critical issues that need attention</li>
                  <li><strong>Error Events:</strong> Critical failures that require immediate action</li>
                </ul>
                <p className="text-gray-700 mt-3">
                  Pay special attention to recurring errors, which may indicate a systemic issue.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Search Console Integration</h3>
                <p className="text-gray-700 mb-3">
                  For more advanced monitoring, connect your sitemap to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Google Search Console:</strong> Track indexing status and coverage issues</li>
                  <li><strong>Bing Webmaster Tools:</strong> Monitor how Bing sees your content</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Sitemap Maintenance</CardTitle>
              <CardDescription>
                Regular maintenance tasks to keep the sitemap optimized
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Regular Maintenance Tasks</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>
                    <strong>Manual Regeneration:</strong> Use the "Regenerate Sitemap" button after major content changes or if the automatic system fails.
                  </li>
                  <li>
                    <strong>Search Engine Pings:</strong> Periodically ping search engines (weekly is recommended) to ensure they're aware of your latest content.
                  </li>
                  <li>
                    <strong>Log Cleanup:</strong> Old logs are automatically purged, but you may want to review them periodically for recurring issues.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">When to Regenerate Manually</h3>
                <p className="text-gray-700 mb-3">
                  While the sitemap regenerates automatically, manual regeneration is recommended when:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>After bulk content updates</li>
                  <li>When the sitemap is older than 24 hours</li>
                  <li>After fixing content issues flagged by search engines</li>
                  <li>After making changes to site structure or navigation</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">System Configuration</h3>
                <p className="text-gray-700 mb-3">
                  The following aspects of the sitemap can be configured:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Regeneration Triggers:</strong> Database triggers that initiate sitemap updates</li>
                  <li><strong>Ping Settings:</strong> Which search engines to notify</li>
                  <li><strong>Content Prioritization:</strong> Priority values for different content types</li>
                </ul>
                <p className="text-gray-700 mt-3">
                  These settings can only be modified by a developer directly in the code.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="troubleshooting">
          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting Guide</CardTitle>
              <CardDescription>
                How to diagnose and fix common sitemap issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Common Problems and Solutions</h3>
                
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-red-600 mb-2">Sitemap Not Updating</h4>
                  <p className="text-gray-700 mb-2">If the sitemap isn't updating automatically:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700">
                    <li>Check the logs for errors during regeneration</li>
                    <li>Verify database triggers are active</li>
                    <li>Try a manual regeneration</li>
                    <li>If manual regeneration fails, check the error logs for detailed messages</li>
                  </ol>
                </div>
                
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-red-600 mb-2">Missing Content</h4>
                  <p className="text-gray-700 mb-2">If some content is missing from the sitemap:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700">
                    <li>Verify the content's visibility settings (public vs. private)</li>
                    <li>Check if the content is published (not draft)</li>
                    <li>Make sure smart links have slugs assigned</li>
                    <li>View the XML directly to confirm what's included</li>
                  </ol>
                </div>
                
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-red-600 mb-2">Search Engines Not Indexing Content</h4>
                  <p className="text-gray-700 mb-2">If search engines aren't indexing your content:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700">
                    <li>Verify your robots.txt isn't blocking access</li>
                    <li>Manually ping search engines</li>
                    <li>Check Search Console for crawl errors</li>
                    <li>Verify the sitemap URL is accessible externally</li>
                  </ol>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Error Messages and Meanings</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="font-mono text-sm text-red-600">"Failed to store sitemap"</p>
                    <p className="text-gray-700 mt-1">Database error when trying to save the sitemap. Check database connection and permissions.</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="font-mono text-sm text-red-600">"Error fetching smart links"</p>
                    <p className="text-gray-700 mt-1">Issue querying the smart_links table. May indicate database schema problems.</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="font-mono text-sm text-red-600">"Search engine ping failed"</p>
                    <p className="text-gray-700 mt-1">Could not notify search engines. Check internet connectivity or try again later.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">When to Contact Support</h3>
                <p className="text-gray-700 mb-3">
                  Contact development support if:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Manual regeneration consistently fails</li>
                  <li>There are persistent database errors in the logs</li>
                  <li>The sitemap shows as empty (0 URLs)</li>
                  <li>Search engines report invalid XML format</li>
                </ul>
                <p className="text-gray-700 mt-3">
                  When contacting support, include:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Recent error logs</li>
                  <li>When the issue started</li>
                  <li>Any recent changes to the site</li>
                  <li>Steps you've already taken to troubleshoot</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
