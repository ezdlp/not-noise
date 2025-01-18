import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

interface SocialPreviewProps {
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  url: string;
}

export function SocialPreview({ ogTitle, ogDescription, ogImage, url }: SocialPreviewProps) {
  return (
    <Tabs defaultValue="facebook">
      <TabsList>
        <TabsTrigger value="facebook">Facebook</TabsTrigger>
        <TabsTrigger value="twitter">Twitter</TabsTrigger>
      </TabsList>
      
      <TabsContent value="facebook">
        <Card className="p-4">
          <div className="space-y-4">
            {ogImage && (
              <img 
                src={ogImage} 
                alt="Social preview" 
                className="w-full h-52 object-cover rounded-t"
              />
            )}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase">{new URL(url).hostname}</p>
              <h4 className="font-bold text-[#1877F2]">{ogTitle}</h4>
              <p className="text-sm text-gray-600 line-clamp-2">{ogDescription}</p>
            </div>
          </div>
        </Card>
      </TabsContent>
      
      <TabsContent value="twitter">
        <Card className="p-4">
          <div className="space-y-4">
            {ogImage && (
              <img 
                src={ogImage} 
                alt="Social preview" 
                className="w-full h-52 object-cover rounded"
              />
            )}
            <div className="space-y-2">
              <h4 className="font-bold">{ogTitle}</h4>
              <p className="text-sm text-gray-600 line-clamp-2">{ogDescription}</p>
              <p className="text-xs text-gray-500">{new URL(url).hostname}</p>
            </div>
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
}