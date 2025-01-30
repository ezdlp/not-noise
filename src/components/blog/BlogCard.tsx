import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface BlogCardProps {
  title: string;
  featuredImage: string | null;
  publishedAt: string | null;
}

export function BlogCard({ title, featuredImage, publishedAt }: BlogCardProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow">
      <AspectRatio ratio={16 / 9} className="bg-muted">
        {featuredImage ? (
          <img
            src={featuredImage}
            alt={title}
            className="object-cover w-full h-full transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
      </AspectRatio>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        {publishedAt && (
          <p className="text-sm text-muted-foreground">
            {format(new Date(publishedAt), "MMMM d, yyyy")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}