
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Info, Link, FileSearch, Search } from 'lucide-react';

export default function SitemapHelp() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Sitemap Help & Documentation</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <Link className="h-5 w-5 text-primary mb-2" />
            <CardTitle className="text-lg">What Is a Sitemap?</CardTitle>
            <CardDescription>Basic information about sitemaps</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              A sitemap is an XML file that lists all the pages on your website, helping search engines find, crawl, and index your content more efficiently.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <FileSearch className="h-5 w-5 text-primary mb-2" />
            <CardTitle className="text-lg">Our Sitemap System</CardTitle>
            <CardDescription>How Soundraiser manages sitemaps</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Our system automatically generates and updates the sitemap daily, including all public smart links, blog posts, and static pages.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <Search className="h-5 w-5 text-primary mb-2" />
            <CardTitle className="text-lg">Search Engine Benefits</CardTitle>
            <CardDescription>Why sitemaps matter for SEO</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              A properly configured sitemap helps your content get discovered and indexed faster by search engines, improving your site's visibility.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Sitemap FAQ</CardTitle>
          <CardDescription>Common questions about the sitemap system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">How often is the sitemap updated?</h3>
            <p className="text-sm text-muted-foreground">
              The sitemap is automatically regenerated daily, and also updates whenever a new smart link or blog post is published.
            </p>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-medium mb-2">Which pages are included in the sitemap?</h3>
            <p className="text-sm text-muted-foreground">
              The sitemap includes all public smart links, published blog posts, and key static pages such as the homepage, pricing page, etc.
            </p>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-medium mb-2">How can I manually regenerate the sitemap?</h3>
            <p className="text-sm text-muted-foreground">
              Go to the Sitemap Management page and click the "Regenerate Sitemap" button. This will create a fresh sitemap with all current content.
            </p>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-medium mb-2">How do I notify search engines about my sitemap?</h3>
            <p className="text-sm text-muted-foreground">
              Our system automatically pings Google and Bing when the sitemap is updated. You can also manually trigger this from the Sitemap Management page.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-amber-800">
              <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
              Common Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="text-amber-800">
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2">
                <span className="font-semibold">Empty Sitemap:</span>
                <span>If your sitemap shows as empty, try manually regenerating it from the management page.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">404 Not Found:</span>
                <span>If the sitemap URL returns 404, it might not have been generated yet or there was an error during generation.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">XML Format Errors:</span>
                <span>If you see XML syntax errors, this usually indicates a problem with the sitemap generation process.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-blue-800">
              <Info className="h-5 w-5 mr-2 text-blue-600" />
              Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2">
                <span className="font-semibold">Verify in Google Search Console:</span>
                <span>Register your sitemap with Google Search Console to monitor indexing and crawl errors.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">Include New Content:</span>
                <span>After publishing important new content, manually regenerate the sitemap for faster discovery.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">Monitor Errors:</span>
                <span>Regularly check the sitemap health page to ensure there are no ongoing issues with the system.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
