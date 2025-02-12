
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeoAnalysis } from "./SeoAnalysis";
import { SeoPreview } from "./SeoPreview";
import { SocialPreview } from "./SocialPreview";

interface SeoSectionProps {
  title: string;
  content: string;
  focusKeyword: string;
  onFocusKeywordChange: (value: string) => void;
  seoTitle: string;
  onSeoTitleChange: (value: string) => void;
  metaDescription: string;
  onMetaDescriptionChange: (value: string) => void;
  ogTitle: string;
  onOgTitleChange: (value: string) => void;
  ogDescription: string;
  onOgDescriptionChange: (value: string) => void;
  twitterTitle: string;
  onTwitterTitleChange: (value: string) => void;
  twitterDescription: string;
  onTwitterDescriptionChange: (value: string) => void;
  ogImage: string;
  onOgImageChange: (value: string) => void;
  url: string;
}

export function SeoSection({
  title,
  content,
  focusKeyword,
  onFocusKeywordChange,
  seoTitle,
  onSeoTitleChange,
  metaDescription,
  onMetaDescriptionChange,
  ogTitle,
  onOgTitleChange,
  ogDescription,
  onOgDescriptionChange,
  twitterTitle,
  onTwitterTitleChange,
  twitterDescription,
  onTwitterDescriptionChange,
  ogImage,
  onOgImageChange,
  url,
}: SeoSectionProps) {
  return (
    <Card className="p-6">
      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="focusKeyword">Focus Keyword</Label>
              <Input
                id="focusKeyword"
                value={focusKeyword}
                onChange={(e) => onFocusKeywordChange(e.target.value)}
                placeholder="Enter your focus keyword"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO Title</Label>
              <Input
                id="seoTitle"
                value={seoTitle}
                onChange={(e) => onSeoTitleChange(e.target.value)}
                placeholder="Enter SEO title"
              />
              <p className="text-sm text-muted-foreground">
                {seoTitle.length}/60 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={metaDescription}
                onChange={(e) => onMetaDescriptionChange(e.target.value)}
                placeholder="Enter meta description"
              />
              <p className="text-sm text-muted-foreground">
                {metaDescription.length}/156 characters
              </p>
            </div>

            <SeoAnalysis
              content={content}
              focusKeyword={focusKeyword}
              title={seoTitle || title}
              metaDescription={metaDescription}
            />
          </div>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ogTitle">Facebook Title</Label>
              <Input
                id="ogTitle"
                value={ogTitle}
                onChange={(e) => onOgTitleChange(e.target.value)}
                placeholder="Enter Facebook title"
              />
              <p className="text-sm text-muted-foreground">
                {ogTitle.length}/60 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ogDescription">Facebook Description</Label>
              <Textarea
                id="ogDescription"
                value={ogDescription}
                onChange={(e) => onOgDescriptionChange(e.target.value)}
                placeholder="Enter Facebook description"
              />
              <p className="text-sm text-muted-foreground">
                {ogDescription.length}/156 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitterTitle">Twitter Title</Label>
              <Input
                id="twitterTitle"
                value={twitterTitle}
                onChange={(e) => onTwitterTitleChange(e.target.value)}
                placeholder="Enter Twitter title"
              />
              <p className="text-sm text-muted-foreground">
                {twitterTitle.length}/60 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitterDescription">Twitter Description</Label>
              <Textarea
                id="twitterDescription"
                value={twitterDescription}
                onChange={(e) => onTwitterDescriptionChange(e.target.value)}
                placeholder="Enter Twitter description"
              />
              <p className="text-sm text-muted-foreground">
                {twitterDescription.length}/156 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ogImage">Social Image URL</Label>
              <Input
                id="ogImage"
                value={ogImage}
                onChange={(e) => onOgImageChange(e.target.value)}
                placeholder="Enter social media image URL"
              />
            </div>

            <SocialPreview
              ogTitle={ogTitle || seoTitle || title}
              ogDescription={ogDescription || metaDescription}
              ogImage={ogImage}
              url={url}
            />
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Search Engine Preview</h3>
            <SeoPreview
              title={seoTitle || title}
              metaDescription={metaDescription}
              url={url}
            />
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
