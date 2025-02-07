export interface Profile {
  id: string;
  name: string;
  artist_name: string;
  music_genre: string;
  country: string;
  email?: string;
  user_roles: { role: 'admin' | 'user' }[];
  smart_links?: SmartLink[];
}

export interface UserRole {
  id: string;
  role: 'admin' | 'user';
}

export interface SmartLink {
  id: string;
  title: string;
  artist_name: string;
  artwork_url?: string;
  created_at: string;
  user_id: string;
  profiles?: {
    name: string;
    email: string | null;
  };
  link_views?: LinkView[];
  platform_links?: PlatformLink[];
  email_subscribers?: EmailSubscriber[];
  meta_pixel_id?: string;
  meta_view_event?: string;
  meta_click_event?: string;
  email_capture_enabled?: boolean;
  email_capture_title?: string;
  email_capture_description?: string;
  slug?: string;
}

export interface LinkView {
  id: string;
  viewed_at: string | null;
}

export interface PlatformLink {
  id: string;
  platform_id: string;
  url: string;
  platform_clicks: PlatformClick[];
}

export interface PlatformClick {
  id: string;
  clicked_at: string | null;
}

export interface EmailSubscriber {
  id: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: Profile;
  created_at: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  status: 'draft' | 'published';
  seo_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  author_name: string | null;
  published_at: string | null;
  blog_posts_tags: {
    tag: {
      id: string;
      name: string;
    };
  }[];
  blog_post_categories: {
    category: {
      id: string;
      name: string;
    };
  }[];
}