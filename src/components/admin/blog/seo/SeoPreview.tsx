import { Card } from "@/components/ui/card";

interface SeoPreviewProps {
  title: string;
  metaDescription: string;
  url: string;
}

export function SeoPreview({ title, metaDescription, url }: SeoPreviewProps) {
  return (
    <Card className="p-4 space-y-2">
      <h3 className="text-sm font-medium text-blue-600 hover:underline truncate">
        {title}
      </h3>
      <p className="text-sm text-green-700 truncate">
        {url}
      </p>
      <p className="text-sm text-gray-600 line-clamp-2">
        {metaDescription}
      </p>
    </Card>
  );
}