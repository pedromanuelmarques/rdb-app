export interface Category {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface Post {
  id: number;
  date: string;
  slug: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  categories: number[];
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
      media_details?: { sizes?: { medium?: { source_url: string } } };
    }>;
    author?: Array<{ name: string }>;
  };
}

export type RootStackParamList = {
  Home: undefined;
  Category: { categoryId: number; categoryName: string };
  Article: { postId: number; categoryName: string };
  Search: undefined;
};
