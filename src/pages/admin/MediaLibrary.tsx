import { MediaLibrary as MediaLibraryComponent } from "@/components/admin/blog/MediaLibrary";

function MediaLibrary() {
  const handleSelect = (url: string) => {
    console.log("Selected URL:", url);
  };

  const handleClose = () => {
    console.log("Media library closed");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-semibold tracking-tight">Media Library</h1>
      </div>
      <div className="bg-white rounded-lg shadow-modern p-6">
        <MediaLibraryComponent 
          onSelect={handleSelect}
          onClose={handleClose}
          showInsertButton={false}
        />
      </div>
    </div>
  );
}

export default MediaLibrary;