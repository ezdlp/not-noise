export interface Profile {
  id: string;
  name: string;
  artist_name: string;
  music_genre: string;
  country: string;
  email?: string;
  user_roles: UserRole[];
  smart_links?: SmartLink[];
}

export interface UserRole {
  id: string;
  role: 'admin' | 'user';
}

export interface SmartLink {
  id: string;
  title: string;
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