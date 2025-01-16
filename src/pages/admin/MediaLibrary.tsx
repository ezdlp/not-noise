import { MediaLibrary } from "@/components/admin/blog/MediaLibrary";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function MediaLibraryPage() {
  const [selectedUrl, setSelectedUrl] = useState<string>("");
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
      </div>
      <MediaLibrary 
        onSelect={(url) => setSelectedUrl(url)}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}