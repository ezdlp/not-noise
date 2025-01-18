import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CategorySelect } from "./CategorySelect";
import { SeoSection } from "./seo/SeoSection";

interface PostSettingsProps {
  post: any;
  onUpdate: (key: string, value: any) => void;
}

export function PostSettings({ post, onUpdate }: PostSettingsProps) {
  const baseUrl = window.location.origin;
  const postUrl = `${baseUrl}/blog/${post.slug}`;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Post Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure your post settings and SEO options
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>URL Slug</Label>
          <Input
            value={post.slug || ''}
            onChange={(e) => onUpdate('slug', e.target.value)}
            placeholder="Enter URL slug"
          />
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <CategorySelect
            value={post.category_id}
            onChange={(value) => onUpdate('category_id', value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={post.allow_comments}
            onCheckedChange={(checked) => onUpdate('allow_comments', checked)}
          />
          <Label>Allow Comments</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={post.is_featured}
            onCheckedChange={(checked) => onUpdate('is_featured', checked)}
          />
          <Label>Featured Post</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={post.is_sticky}
            onCheckedChange={(checked) => onUpdate('is_sticky', checked)}
          />
          <Label>Sticky Post</Label>
        </div>
      </div>

      <Separator />

      <SeoSection
        title={post.title || ''}
        content={post.content || ''}
        focusKeyword={post.focus_keyword || ''}
        onFocusKeywordChange={(value) => onUpdate('focus_keyword', value)}
        seoTitle={post.seo_title || ''}
        onSeoTitleChange={(value) => onUpdate('seo_title', value)}
        metaDescription={post.meta_description || ''}
        onMetaDescriptionChange={(value) => onUpdate('meta_description', value)}
        ogTitle={post.og_title || ''}
        onOgTitleChange={(value) => onUpdate('og_title', value)}
        ogDescription={post.og_description || ''}
        onOgDescriptionChange={(value) => onUpdate('og_description', value)}
        ogImage={post.og_image || ''}
        onOgImageChange={(value) => onUpdate('og_image', value)}
        url={postUrl}
      />
    </div>
  );
}