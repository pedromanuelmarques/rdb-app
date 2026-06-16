import {
  fetchPosts, fetchPostsByCategory, fetchPost, fetchCategories, searchPosts,
} from '../../src/api/wordpress';

const mockPost = {
  id: 1,
  date: '2026-06-16T10:00:00',
  slug: 'test',
  link: 'https://www.ruadebaixo.com/test',
  title: { rendered: 'Test' },
  content: { rendered: '<p>Body</p>' },
  excerpt: { rendered: '<p>Excerpt</p>' },
  categories: [5],
  _embedded: {
    'wp:featuredmedia': [{ source_url: 'https://example.com/img.jpg' }],
    author: [{ name: 'Author' }],
  },
};

const mockCat = { id: 5, name: 'Música', slug: 'musica', count: 10 };

beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => { jest.resetAllMocks(); });

describe('fetchPosts', () => {
  it('calls correct URL with _embed', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [mockPost] });
    const posts = await fetchPosts(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://www.ruadebaixo.com/wp-json/wp/v2/posts?per_page=20&page=1&_embed',
    );
    expect(posts[0].id).toBe(1);
  });

  it('throws on non-ok response', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(fetchPosts(1)).rejects.toThrow('API error: 500');
  });
});

describe('fetchPostsByCategory', () => {
  it('filters by category ID', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [mockPost] });
    await fetchPostsByCategory(5, 1);
    expect(fetch).toHaveBeenCalledWith(
      'https://www.ruadebaixo.com/wp-json/wp/v2/posts?categories=5&per_page=20&page=1&_embed',
    );
  });
});

describe('fetchPost', () => {
  it('calls correct URL for single post', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => mockPost });
    const post = await fetchPost(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://www.ruadebaixo.com/wp-json/wp/v2/posts/1?_embed',
    );
    expect(post.id).toBe(1);
  });
});

describe('fetchCategories', () => {
  it('fetches all categories', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [mockCat] });
    const cats = await fetchCategories();
    expect(fetch).toHaveBeenCalledWith(
      'https://www.ruadebaixo.com/wp-json/wp/v2/categories?per_page=100',
    );
    expect(cats[0].name).toBe('Música');
  });
});

describe('searchPosts', () => {
  it('searches by query', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [mockPost] });
    const posts = await searchPosts('jazz');
    expect(fetch).toHaveBeenCalledWith(
      'https://www.ruadebaixo.com/wp-json/wp/v2/posts?search=jazz&per_page=20&_embed',
    );
    expect(posts).toHaveLength(1);
  });

  it('returns empty array without calling fetch for empty query', async () => {
    const posts = await searchPosts('');
    expect(fetch).not.toHaveBeenCalled();
    expect(posts).toEqual([]);
  });
});
