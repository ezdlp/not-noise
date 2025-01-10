import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings.</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Site Settings</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="site-name">Site Name</Label>
                <Input id="site-name" placeholder="My Music Site" />
              </div>
              <div>
                <Label htmlFor="site-description">Site Description</Label>
                <Input id="site-description" placeholder="A platform for music artists" />
              </div>
              <Button>Save Changes</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Email Settings</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input id="smtp-host" placeholder="smtp.example.com" />
              </div>
              <div>
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input id="smtp-port" placeholder="587" />
              </div>
              <Button>Save Changes</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">API Configuration</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="api-key">API Key</Label>
                <Input id="api-key" type="password" />
              </div>
              <Button>Generate New Key</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}