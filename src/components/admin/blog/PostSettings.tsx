import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CategorySelect } from "./CategorySelect";
import { FeaturedImage } from "./FeaturedImage";

interface PostSettingsProps {
  post: any;
  onUpdate: (key: string, value: any) => void;
  onClose: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
}

export function PostSettings({ post, onUpdate, onClose, isSubmitting, isEditing }: PostSettingsProps) {
  const baseUrl = window.location.origin;
  const postUrl = `${baseUrl}/${post.slug}`;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Page Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure your page settings
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <FeaturedImage
          value={post.featured_image}
          onChange={(url) => onUpdate('featured_image', url)}
        />

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

        <div className="pt-4 flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : (isEditing ? "Update" : "Publish")}
          </Button>
        </div>
      </div>
    </div>
  );
}