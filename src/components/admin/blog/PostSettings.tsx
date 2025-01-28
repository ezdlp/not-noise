import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PostFormValues } from "./PostEditor";
import { CategorySelect } from "./CategorySelect";
import { FeaturedImage } from "./FeaturedImage";
import { TagsInput } from "./TagsInput";
import { SeoSection } from "./seo/SeoSection";

interface PostSettingsProps {
  post: PostFormValues;
  onUpdate: (key: string, value: any) => void;
  onClose: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
}

export function PostSettings({ post, onUpdate, onClose, isSubmitting, isEditing }: PostSettingsProps) {
  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <Label>Status</Label>
            <Select
              value={post.status || 'draft'}
              onValueChange={(value) => onUpdate('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Category</Label>
              <CategorySelect
                value={post.category_id}
                onChange={(value) => onUpdate('category_id', value)}
              />
            </div>

            <div>
              <Label>Tags</Label>
              <TagsInput
                value={post.tags || []}
                onChange={(value) => onUpdate('tags', value)}
              />
            </div>

            <div>
              <Label>Author Name</Label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                value={post.author_name || ''}
                onChange={(e) => onUpdate('author_name', e.target.value)}
                placeholder="Enter author name"
              />
            </div>
          </div>

          <Separator />

          <div>
            <Label>Featured Image</Label>
            <FeaturedImage
              value={post.featured_image}
              onChange={(value) => onUpdate('featured_image', value)}
            />
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
            ogTitle={post.seo_title || ''}
            onOgTitleChange={(value) => onUpdate('seo_title', value)}
            ogDescription={post.meta_description || ''}
            onOgDescriptionChange={(value) => onUpdate('meta_description', value)}
            ogImage={post.featured_image || ''}
            onOgImageChange={(value) => onUpdate('featured_image', value)}
            url={`/blog/${post.slug}`}
          />
        </div>

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Post' : 'Create Post'}
          </Button>
        </div>
      </Card>
    </div>
  );
}