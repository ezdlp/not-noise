
import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/utils/imageCompression";

interface ArtworkUploaderProps {
  currentArtwork: string;
  onArtworkChange: (url: string) => void;
  smartLinkId?: string;
}

export function ArtworkUploader({ currentArtwork, onArtworkChange, smartLinkId }: ArtworkUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      console.log('Starting image upload process...');

      // Compress image using our utility
      const { compressedFile } = await compressImage(file, 'medium');
      console.log('Image compressed successfully');

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const basePath = smartLinkId ? `${smartLinkId}/` : 'temp/';
      const fileName = `${basePath}${crypto.randomUUID()}.${fileExt}`;

      // Upload to Supabase Storage
      console.log('Attempting to upload to Supabase storage...');
      const { data, error: uploadError } = await supabase.storage
        .from('artworks')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw uploadError;
      }
      console.log('File uploaded successfully:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('artworks')
        .getPublicUrl(fileName);

      console.log('Generated public URL:', publicUrl);

      // If we have a smartLinkId, update the record
      if (smartLinkId) {
        console.log('Updating smart link record...');
        const { error: updateError } = await supabase
          .from('smart_links')
          .update({ artwork_url: publicUrl })
          .eq('id', smartLinkId);

        if (updateError) {
          console.error('Error updating smart link:', updateError);
          throw updateError;
        }
        console.log('Smart link updated successfully');
      }

      onArtworkChange(publicUrl);
      toast.success('Artwork updated successfully');
    } catch (error) {
      console.error('Detailed error uploading artwork:', error);
      if (error.message) {
        toast.error(`Upload failed: ${error.message}`);
      } else {
        toast.error('Failed to update artwork. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative group">
      <img
        src={currentArtwork || "/placeholder.svg"}
        alt="Artwork"
        className="w-32 h-32 rounded-lg object-cover shadow-sm border border-[#E6E6E6] group-hover:opacity-75 transition-opacity"
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="bg-white/90 hover:bg-white"
          disabled={isUploading}
          onClick={handleClick}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
          <span className="ml-2">{isUploading ? 'Uploading...' : 'Change'}</span>
        </Button>
      </div>
    </div>
  );
}
