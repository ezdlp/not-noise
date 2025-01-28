import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PostFormValues } from "./PostEditor";
import { CategorySelect } from "./CategorySelect";
import { FeaturedImage } from "./FeaturedImage";
import { TagsInput } from "./TagsInput";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

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
      <Card>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={post.status}
                onChange={(e) => onUpdate('status', e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Publish Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !post.published_at && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {post.published_at ? format(new Date(post.published_at), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={post.published_at ? new Date(post.published_at) : undefined}
                    onSelect={(date) => onUpdate('published_at', date?.toISOString())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <CategorySelect
                value={post.category_id}
                onChange={(value) => onUpdate('category_id', value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <TagsInput
                value={post.tags || []}
                onChange={(value) => onUpdate('tags', value)}
              />
            </div>

            <div className="space-y-2">
              <Label>URL Slug</Label>
              <Input
                value={post.slug || ''}
                onChange={(e) => onUpdate('slug', e.target.value)}
                placeholder="post-url-slug"
              />
            </div>

            <div className="space-y-2">
              <Label>Featured Image</Label>
              <FeaturedImage
                value={post.featured_image || ''}
                onChange={(value) => onUpdate('featured_image', value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            type="button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Post' : 'Create Post')}
          </Button>
        </div>
      </Card>
    </div>
  );
}