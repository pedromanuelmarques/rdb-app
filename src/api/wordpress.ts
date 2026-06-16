import { Post, Category } from '../types';

const BASE = 'https://www.ruadebaixo.com/wp-json/wp/v2';

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchPosts = (page = 1): Promise<Post[]> =>
  get(`${BASE}/posts?per_page=20&page=${page}&_embed`);

export const fetchPostsByCategory = (categoryId: number, page = 1): Promise<Post[]> =>
  get(`${BASE}/posts?categories=${categoryId}&per_page=20&page=${page}&_embed`);

export const fetchPost = (id: number): Promise<Post> =>
  get(`${BASE}/posts/${id}?_embed`);

export const fetchCategories = (): Promise<Category[]> =>
  get(`${BASE}/categories?per_page=100`);

export const searchPosts = (query: string): Promise<Post[]> => {
  if (!query) return Promise.resolve([]);
  return get(`${BASE}/posts?search=${encodeURIComponent(query)}&per_page=20&_embed`);
};
