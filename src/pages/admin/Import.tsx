import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportMedia } from "@/components/admin/import/ImportMedia";
import { ImportPosts } from "@/components/admin/import/ImportPosts";
import { ImportUsers } from "@/components/admin/import/ImportUsers";
import { ImportLinks } from "@/components/admin/import/ImportLinks";

export default function Import() {
  const [activeTab, setActiveTab] = useState("media");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import</h1>
        <p className="text-muted-foreground">
          Import your WordPress content into the application.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>WordPress Import</CardTitle>
          <CardDescription>
            Import your WordPress content step by step. Start with media files, then proceed with posts, users, and custom links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="links">Custom Links</TabsTrigger>
            </TabsList>
            <TabsContent value="media" className="mt-6">
              <ImportMedia onComplete={() => setActiveTab("posts")} />
            </TabsContent>
            <TabsContent value="posts" className="mt-6">
              <ImportPosts onComplete={() => setActiveTab("users")} />
            </TabsContent>
            <TabsContent value="users" className="mt-6">
              <ImportUsers onComplete={() => setActiveTab("links")} />
            </TabsContent>
            <TabsContent value="links" className="mt-6">
              <ImportLinks />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}