import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CategorySelect } from "./CategorySelect";

interface PostSettingsProps {
  post: any;
  onUpdate: (key: string, value: any) => void;
}

export function PostSettings({ post, onUpdate }: PostSettingsProps) {
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
      </div>
    </div>
  );
}