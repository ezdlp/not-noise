import { useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SocialAssetTemplateProps {
  smartLinkId: string;
  platform: string;
  artworkUrl: string;
  title: string;
  artistName: string;
  onSuccess?: (imageUrl: string) => void;
  onError?: (error: Error) => void;
}

export function SocialAssetTemplate({
  smartLinkId,
  platform,
  artworkUrl,
  title,
  artistName,
  onSuccess,
  onError
}: SocialAssetTemplateProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generateImage = async () => {
      try {
        // Call the edge function to get the HTML template
        const { data, error } = await supabase.functions.invoke('generate-social-assets', {
          body: { smartLinkId, platform, artworkUrl, title, artistName }
        });

        if (error) throw error;

        if (!containerRef.current) return;

        // Set the HTML content
        containerRef.current.innerHTML = data.html;

        // Wait for images to load
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate image
        const imageBlob = await toPng(containerRef.current, {
          quality: 0.95,
          width: 1200,
          height: 630
        });

        // Convert blob URL to File object
        const response = await fetch(imageBlob);
        const buffer = await response.arrayBuffer();
        const file = new File([buffer], 'social-asset.png', { type: 'image/png' });

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('social-media-assets')
          .upload(data.filePath, file, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase
          .storage
          .from('social-media-assets')
          .getPublicUrl(data.filePath);

        // Store asset record in database
        const { error: dbError } = await supabase
          .from('social_media_assets')
          .insert({
            smart_link_id: smartLinkId,
            platform,
            image_url: publicUrl
          });

        if (dbError) {
          console.error('Database error:', dbError);
          // Don't throw here, as we still want to return the URL
        }

        onSuccess?.(publicUrl);
        toast.success('Social media asset generated successfully');

      } catch (error) {
        console.error('Error generating social asset:', error);
        onError?.(error as Error);
        toast.error('Failed to generate social media asset');
      }
    };

    generateImage();
  }, [smartLinkId, platform, artworkUrl, title, artistName, onSuccess, onError]);

  return (
    <div ref={containerRef} className="hidden">
      {/* Template will be injected here */}
    </div>
  );
}