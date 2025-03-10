
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSmartLink() {
  const { slug } = useParams<{ slug: string }>();

  const { data: smartLink, isLoading, error } = useQuery({
    queryKey: ['smartLink', slug],
    queryFn: async () => {
      console.log("Fetching smart link with slug:", slug);
      
      let smartLinkData;
      
      try {
        const { data: slugData, error: smartLinkError } = await supabase
          .from('smart_links')
          .select(`
            *,
            platform_links (
              id,
              platform_id,
              platform_name,
              url
            ),
            profiles:user_id (
              hide_branding
            )
          `)
          .eq('slug', slug)
          .maybeSingle();

        console.log("Slug query result:", { data: slugData, error: smartLinkError });

        if (!slugData && !smartLinkError) {
          console.log("Attempting to fetch by ID:", slug);
          const { data: idData, error: idError } = await supabase
            .from('smart_links')
            .select(`
              *,
              platform_links (
                id,
                platform_id,
                platform_name,
                url
              ),
              profiles:user_id (
                hide_branding
              )
            `)
            .eq('id', slug)
            .maybeSingle();

          console.log("ID query result:", { data: idData, error: idError });

          if (idError) {
            console.error('Error fetching smart link by ID:', idError);
            throw idError;
          }

          if (!idData) {
            console.error('Smart link not found by either slug or ID:', slug);
            throw new Error('Smart link not found');
          }

          smartLinkData = idData;
        } else if (smartLinkError) {
          console.error('Error fetching smart link:', smartLinkError);
          throw smartLinkError;
        } else {
          smartLinkData = slugData;
        }

        if (!smartLinkData) {
          throw new Error('Smart link not found');
        }

        console.log("Successfully found smart link:", smartLinkData);
        return smartLinkData;
      } catch (error) {
        console.error("Error in smart link query:", error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    smartLink,
    isLoading,
    error,
    slug
  };
}
