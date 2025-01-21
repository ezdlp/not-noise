import { MediaLibrary as MediaLibraryComponent } from "@/components/admin/blog/MediaLibrary";

function MediaLibrary() {
  const handleSelect = (url: string) => {
    console.log("Selected URL:", url);
  };

  const handleClose = () => {
    console.log("Media library closed");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
      </div>
      <MediaLibraryComponent 
        onSelect={handleSelect}
        onClose={handleClose}
        showInsertButton={false}
      />
    </div>
  );
}

export default MediaLibrary;