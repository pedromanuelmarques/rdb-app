# Rua de Baixo App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React Native + Expo app for ruadebaixo.com that displays articles by category via a hamburger drawer, supports full-text search, native sharing, and push notifications via OneSignal.

**Architecture:** Single codebase (TypeScript) targeting Android + iOS via Expo managed workflow. All content from WordPress REST API — no custom backend. Navigation via React Navigation Drawer wrapping a Stack navigator. OneSignal Expo plugin handles push notifications end-to-end.

**Tech Stack:** React Native, Expo SDK (managed), TypeScript, React Navigation (Drawer + Stack), react-native-webview, OneSignal Expo Plugin, AsyncStorage, expo-sharing

---

## File Map

| File | Responsibility |
|---|---|
| `app.json` | Expo config — name, bundle IDs, OneSignal plugin |
| `babel.config.js` | Babel + Reanimated plugin |
| `App.tsx` | Root: SafeAreaProvider + NavigationContainer + OneSignal init |
| `src/types/index.ts` | TypeScript types: Post, Category, nav param lists |
| `src/theme.ts` | Colors, spacing, fontSize constants |
| `src/api/wordpress.ts` | All WP REST API calls |
| `src/hooks/useDebounce.ts` | Debounce hook for search input |
| `src/components/ArticleCard.tsx` | Reusable row: thumbnail + title + date |
| `src/components/FeaturedArticle.tsx` | Hero card for Home screen |
| `src/navigation/DrawerNavigator.tsx` | Drawer (custom content) + Stack + AppHeader |
| `src/screens/HomeScreen.tsx` | Featured article + recent list |
| `src/screens/CategoryScreen.tsx` | Articles by category, infinite scroll |
| `src/screens/ArticleScreen.tsx` | Full article content via WebView + share |
| `src/screens/SearchScreen.tsx` | Debounced search + results |
| `__tests__/api/wordpress.test.ts` | Unit tests for WP API module |
| `__tests__/hooks/useDebounce.test.ts` | Unit tests for debounce hook |
| `eas.json` | EAS Build config for store submission |

---

### Task 1: Initialize Expo project and install dependencies

**Files:**
- Auto-generated: `package.json`, `app.json`, `tsconfig.json`, `App.tsx`, `babel.config.js`

- [ ] **Step 1: Create Expo project in current directory**

```bash
npx create-expo-app@latest . --template blank-typescript
```

Expected: `✅ Your project is ready!`

- [ ] **Step 2: Verify Metro starts**

```bash
npx expo start --no-dev
```

Press `q` to quit after seeing "Metro Bundler". No errors expected.

- [ ] **Step 3: Install navigation dependencies**

```bash
npx expo install @react-navigation/native @react-navigation/drawer @react-navigation/stack react-native-gesture-handler react-native-reanimated react-native-screens react-native-safe-area-context
```

- [ ] **Step 4: Install content and utility dependencies**

```bash
npx expo install react-native-webview @react-native-async-storage/async-storage expo-sharing expo-constants expo-linking
```

- [ ] **Step 5: Install OneSignal**

```bash
npx expo install react-native-onesignal onesignal-expo-plugin
```

- [ ] **Step 6: Replace app.json**

```json
{
  "expo": {
    "name": "Rua de Baixo",
    "slug": "rua-de-baixo",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.ruadebaixo.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.ruadebaixo.app"
    },
    "extra": {
      "oneSignalAppId": "REPLACE_WITH_YOUR_ONESIGNAL_APP_ID"
    },
    "plugins": [
      [
        "onesignal-expo-plugin",
        { "mode": "development" }
      ]
    ]
  }
}
```

- [ ] **Step 7: Replace babel.config.js to add Reanimated plugin**

```js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: initialize Expo project with all dependencies"
```

---

### Task 2: Types and theme

**Files:**
- Create: `src/types/index.ts`
- Create: `src/theme.ts`

- [ ] **Step 1: Create `src/types/index.ts`**

```typescript
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
```

- [ ] **Step 2: Create `src/theme.ts`**

```typescript
export const colors = {
  background: '#FFFFFF',
  textPrimary: '#111111',
  textSecondary: '#999999',
  accent: '#0066CC',
  header: '#1A1A1A',
  drawer: '#1A1A1A',
  separator: '#F0F0F0',
  drawerText: '#BBBBBB',
  drawerActiveText: '#FFFFFF',
  drawerActiveBg: 'rgba(0,102,204,0.3)',
  drawerActiveBorder: '#0066CC',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
};
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts src/theme.ts
git commit -m "feat: add TypeScript types and theme constants"
```

---

### Task 3: WordPress API module (TDD)

**Files:**
- Create: `src/api/wordpress.ts`
- Create: `__tests__/api/wordpress.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/api/wordpress.test.ts
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx jest __tests__/api/wordpress.test.ts
```

Expected: FAIL — `Cannot find module '../../src/api/wordpress'`

- [ ] **Step 3: Implement `src/api/wordpress.ts`**

```typescript
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx jest __tests__/api/wordpress.test.ts
```

Expected: `6 tests passed`

- [ ] **Step 5: Commit**

```bash
git add src/api/wordpress.ts __tests__/api/wordpress.test.ts
git commit -m "feat: add WordPress API module with tests"
```

---

### Task 4: useDebounce hook (TDD)

**Files:**
- Create: `src/hooks/useDebounce.ts`
- Create: `__tests__/hooks/useDebounce.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/hooks/useDebounce.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useDebounce } from '../../src/hooks/useDebounce';

jest.useFakeTimers();

describe('useDebounce', () => {
  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 400));
    expect(result.current).toBe('hello');
  });

  it('delays value update by specified ms', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 400),
      { initialProps: { value: 'a' } },
    );
    rerender({ value: 'ab' });
    expect(result.current).toBe('a');
    act(() => { jest.advanceTimersByTime(400); });
    expect(result.current).toBe('ab');
  });

  it('resets timer on rapid updates — only last value emits', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 400),
      { initialProps: { value: 'a' } },
    );
    rerender({ value: 'ab' });
    act(() => { jest.advanceTimersByTime(200); });
    rerender({ value: 'abc' });
    act(() => { jest.advanceTimersByTime(400); });
    expect(result.current).toBe('abc');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx jest __tests__/hooks/useDebounce.test.ts
```

Expected: FAIL — `Cannot find module '../../src/hooks/useDebounce'`

- [ ] **Step 3: Implement `src/hooks/useDebounce.ts`**

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx jest __tests__/hooks/useDebounce.test.ts
```

Expected: `3 tests passed`

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDebounce.ts __tests__/hooks/useDebounce.test.ts
git commit -m "feat: add useDebounce hook with tests"
```

---

### Task 5: ArticleCard component

**Files:**
- Create: `src/components/ArticleCard.tsx`

- [ ] **Step 1: Create `src/components/ArticleCard.tsx`**

```typescript
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Post } from '../types';
import { colors, spacing, fontSize } from '../theme';

function getThumbnail(post: Post): string | null {
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  return (
    media?.media_details?.sizes?.medium?.source_url ??
    media?.source_url ??
    null
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function decodeTitle(raw: string): string {
  return raw.replace(/&amp;/g, '&').replace(/&#8211;/g, '–').replace(/&#8217;/g, "'");
}

interface Props {
  post: Post;
  onPress: (post: Post) => void;
}

export function ArticleCard({ post, onPress }: Props) {
  const thumbnail = getThumbnail(post);
  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(post)} activeOpacity={0.7}>
      {thumbnail ? (
        <Image source={{ uri: thumbnail }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]} />
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {decodeTitle(post.title.rendered)}
        </Text>
        <Text style={styles.date}>{formatDate(post.date)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    gap: spacing.md,
  },
  thumb: { width: 72, height: 52, borderRadius: 4 },
  thumbPlaceholder: { backgroundColor: colors.separator },
  info: { flex: 1 },
  title: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary, lineHeight: 18 },
  date: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.xs },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ArticleCard.tsx
git commit -m "feat: add ArticleCard reusable component"
```

---

### Task 6: FeaturedArticle component

**Files:**
- Create: `src/components/FeaturedArticle.tsx`

- [ ] **Step 1: Create `src/components/FeaturedArticle.tsx`**

```typescript
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Post, Category } from '../types';
import { colors, spacing, fontSize } from '../theme';

function getHeroImage(post: Post): string | null {
  return post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null;
}

function decodeTitle(raw: string): string {
  return raw.replace(/&amp;/g, '&').replace(/&#8211;/g, '–').replace(/&#8217;/g, "'");
}

interface Props {
  post: Post;
  categories: Category[];
  onPress: (post: Post) => void;
}

export function FeaturedArticle({ post, categories, onPress }: Props) {
  const heroImage = getHeroImage(post);
  const catName = categories.find(c => c.id === post.categories[0])?.name ?? '';

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(post)} activeOpacity={0.85}>
      {heroImage ? (
        <Image source={{ uri: heroImage }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <View style={styles.overlay}>
        {catName ? (
          <Text style={styles.category}>{catName.toUpperCase()}</Text>
        ) : null}
        <Text style={styles.title} numberOfLines={3}>
          {decodeTitle(post.title.rendered)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: spacing.md,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.separator,
  },
  image: { width: '100%', height: 200 },
  imagePlaceholder: { backgroundColor: '#CCCCCC' },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  category: {
    fontSize: fontSize.xs,
    color: colors.accent,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FeaturedArticle.tsx
git commit -m "feat: add FeaturedArticle hero component"
```

---

### Task 7: HomeScreen

**Files:**
- Create: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Create `src/screens/HomeScreen.tsx`**

```typescript
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, FlatList, ActivityIndicator, Text, StyleSheet, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Post, Category, RootStackParamList } from '../types';
import { fetchPosts, fetchCategories } from '../api/wordpress';
import { ArticleCard } from '../components/ArticleCard';
import { FeaturedArticle } from '../components/FeaturedArticle';
import { colors, spacing, fontSize } from '../theme';

export function HomeScreen() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [fetchedPosts, fetchedCats] = await Promise.all([
        fetchPosts(1),
        fetchCategories(),
      ]);
      setPosts(fetchedPosts);
      setCategories(fetchedCats);
      setError(null);
    } catch {
      setError('Não foi possível carregar os artigos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const goToArticle = useCallback((post: Post) => {
    const catName = categories.find(c => c.id === post.categories[0])?.name ?? '';
    navigation.navigate('HomeStack' as never, {
      screen: 'Article',
      params: { postId: post.id, categoryName: catName },
    } as never);
  }, [navigation, categories]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.accent} /></View>;
  }

  if (error) {
    return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;
  }

  const featured = posts[0];
  const recent = posts.slice(1);

  return (
    <FlatList
      data={recent}
      keyExtractor={item => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View>
          {featured && (
            <FeaturedArticle post={featured} categories={categories} onPress={goToArticle} />
          )}
          <Text style={styles.sectionLabel}>RECENTES</Text>
        </View>
      }
      renderItem={({ item }) => <ArticleCard post={item} onPress={goToArticle} />}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.textSecondary, fontSize: fontSize.sm },
  sectionLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 1.5,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "feat: add HomeScreen with featured article and recents"
```

---

### Task 8: CategoryScreen

**Files:**
- Create: `src/screens/CategoryScreen.tsx`

- [ ] **Step 1: Create `src/screens/CategoryScreen.tsx`**

```typescript
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, FlatList, ActivityIndicator, Text, StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Post, RootStackParamList } from '../types';
import { fetchPostsByCategory } from '../api/wordpress';
import { ArticleCard } from '../components/ArticleCard';
import { colors, fontSize } from '../theme';

type RouteT = RouteProp<RootStackParamList, 'Category'>;
type NavT = StackNavigationProp<RootStackParamList, 'Category'>;

export function CategoryScreen() {
  const route = useRoute<RouteT>();
  const navigation = useNavigation<NavT>();
  const { categoryId, categoryName } = route.params;

  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (pageNum: number, append: boolean) => {
    try {
      const fetched = await fetchPostsByCategory(categoryId, pageNum);
      if (fetched.length < 20) setHasMore(false);
      setPosts(prev => (append ? [...prev, ...fetched] : fetched));
      setError(null);
    } catch {
      setError('Não foi possível carregar os artigos.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [categoryId]);

  useEffect(() => { load(1, false); }, [load]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    setLoadingMore(true);
    load(next, true);
  }, [loadingMore, hasMore, page, load]);

  const goToArticle = useCallback((post: Post) => {
    navigation.navigate('Article', { postId: post.id, categoryName });
  }, [navigation, categoryName]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.accent} /></View>;
  }

  if (error) {
    return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={item => String(item.id)}
      renderItem={({ item }) => <ArticleCard post={item} onPress={goToArticle} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        loadingMore
          ? <ActivityIndicator color={colors.accent} style={{ padding: 16 }} />
          : null
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.textSecondary, fontSize: fontSize.sm },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/CategoryScreen.tsx
git commit -m "feat: add CategoryScreen with infinite scroll"
```

---

### Task 9: ArticleScreen

**Files:**
- Create: `src/screens/ArticleScreen.tsx`

- [ ] **Step 1: Create `src/screens/ArticleScreen.tsx`**

```typescript
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, ActivityIndicator,
  Share, TouchableOpacity, StyleSheet,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Post, RootStackParamList } from '../types';
import { fetchPost } from '../api/wordpress';
import { colors, spacing, fontSize } from '../theme';

type RouteT = RouteProp<RootStackParamList, 'Article'>;

const ARTICLE_CSS = `
  body {
    font-family: -apple-system, Roboto, sans-serif;
    font-size: 16px; color: #111; line-height: 1.7;
    padding: 0 16px 32px; margin: 0;
  }
  img { max-width: 100%; height: auto; border-radius: 4px; }
  a { color: #0066CC; }
  p { margin: 0 0 16px; }
  h2, h3 { font-weight: 700; line-height: 1.3; }
  figure { margin: 0 0 16px; }
`;

function getHeroImage(post: Post): string | null {
  return post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null;
}

function getAuthor(post: Post): string {
  return post._embedded?.author?.[0]?.name ?? '';
}

function decodeTitle(raw: string): string {
  return raw.replace(/&amp;/g, '&').replace(/&#8211;/g, '–').replace(/&#8217;/g, "'");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-PT', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function ArticleScreen() {
  const route = useRoute<RouteT>();
  const { postId, categoryName } = route.params;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [webViewHeight, setWebViewHeight] = useState(400);

  useEffect(() => {
    fetchPost(postId)
      .then(setPost)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  const handleShare = async () => {
    if (!post) return;
    await Share.share({ url: post.link, message: decodeTitle(post.title.rendered) });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Artigo não encontrado.</Text>
      </View>
    );
  }

  const heroImage = getHeroImage(post);
  const author = getAuthor(post);

  const html = `<!DOCTYPE html><html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>${ARTICLE_CSS}</style>
  </head>
  <body>
    ${post.content.rendered}
    <script>
      window.addEventListener('load', function() {
        window.ReactNativeWebView.postMessage(document.body.scrollHeight);
      });
    </script>
  </body></html>`;

  return (
    <ScrollView style={styles.container}>
      {heroImage && <Image source={{ uri: heroImage }} style={styles.hero} />}
      <View style={styles.metaRow}>
        <Text style={styles.category}>{categoryName.toUpperCase()}</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Text style={styles.shareIcon}>⎙</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>{decodeTitle(post.title.rendered)}</Text>
      {author ? (
        <Text style={styles.byline}>Por {author} · {formatDate(post.date)}</Text>
      ) : null}
      <View style={styles.divider} />
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={{ height: webViewHeight }}
        scrollEnabled={false}
        onMessage={e => setWebViewHeight(Number(e.nativeEvent.data) + 32)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.textSecondary, fontSize: fontSize.sm },
  hero: { width: '100%', height: 220 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  category: {
    fontSize: fontSize.xs, color: colors.accent, fontWeight: '700', letterSpacing: 1,
  },
  shareBtn: { padding: spacing.sm },
  shareIcon: { fontSize: 20, color: colors.textSecondary },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    lineHeight: 28,
  },
  byline: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.separator,
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/ArticleScreen.tsx
git commit -m "feat: add ArticleScreen with WebView and share button"
```

---

### Task 10: SearchScreen

**Files:**
- Create: `src/screens/SearchScreen.tsx`

- [ ] **Step 1: Create `src/screens/SearchScreen.tsx`**

```typescript
import React, { useState, useEffect } from 'react';
import {
  View, TextInput, FlatList, ActivityIndicator, Text, StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Post, RootStackParamList } from '../types';
import { searchPosts } from '../api/wordpress';
import { ArticleCard } from '../components/ArticleCard';
import { useDebounce } from '../hooks/useDebounce';
import { colors, spacing, fontSize } from '../theme';

type NavT = StackNavigationProp<RootStackParamList>;

export function SearchScreen() {
  const navigation = useNavigation<NavT>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    searchPosts(debouncedQuery)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const goToArticle = (post: Post) => {
    navigation.navigate('Article', { postId: post.id, categoryName: '' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Pesquisar artigos..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
      {loading && (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.lg }} />
      )}
      {!loading && searched && results.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Sem resultados para "{debouncedQuery}"</Text>
        </View>
      )}
      <FlatList
        data={results}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <ArticleCard post={item} onPress={goToArticle} />}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inputRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  input: { fontSize: fontSize.md, color: colors.textPrimary, height: 40 },
  empty: { alignItems: 'center', paddingTop: spacing.lg * 2 },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.sm },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/SearchScreen.tsx
git commit -m "feat: add SearchScreen with debounced live search"
```

---

### Task 11: DrawerNavigator and App root

**Files:**
- Create: `src/navigation/DrawerNavigator.tsx`
- Modify: `App.tsx`

- [ ] **Step 1: Fetch real WordPress category IDs to fill in the navigator**

```bash
curl "https://www.ruadebaixo.com/wp-json/wp/v2/categories?per_page=100" \
  | python3 -c "import json,sys; [print(c['id'], c['name']) for c in json.load(sys.stdin)]"
```

Note the IDs for: Música, Cinema, Lifestyle, Moda, Artes, Livros, Jogos, Tech.

- [ ] **Step 2: Create `src/navigation/DrawerNavigator.tsx`**

Replace `REAL_ID_FOR_*` with the actual IDs from Step 1.

```typescript
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar,
} from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { HomeScreen } from '../screens/HomeScreen';
import { CategoryScreen } from '../screens/CategoryScreen';
import { ArticleScreen } from '../screens/ArticleScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { RootStackParamList } from '../types';
import { colors, spacing, fontSize } from '../theme';

// Replace each REAL_ID_FOR_* with the actual WordPress category ID from Step 1
const CATEGORIES = [
  { id: 0, name: 'Home' },
  { id: REAL_ID_FOR_MUSICA, name: 'Música' },
  { id: REAL_ID_FOR_CINEMA, name: 'Cinema' },
  { id: REAL_ID_FOR_LIFESTYLE, name: 'Lifestyle' },
  { id: REAL_ID_FOR_MODA, name: 'Moda' },
  { id: REAL_ID_FOR_ARTES, name: 'Artes' },
  { id: REAL_ID_FOR_LIVROS, name: 'Livros' },
  { id: REAL_ID_FOR_JOGOS, name: 'Jogos' },
  { id: REAL_ID_FOR_TECH, name: 'Tech' },
];

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator<RootStackParamList>();

function AppHeader() {
  const nav = useNavigation<DrawerNavigationProp<any>>();
  return (
    <View style={styles.header}>
      <StatusBar barStyle="light-content" backgroundColor={colors.header} />
      <TouchableOpacity onPress={() => nav.openDrawer()} style={styles.headerBtn}>
        <Text style={styles.headerIcon}>☰</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>RUA DE BAIXO</Text>
      <TouchableOpacity
        onPress={() => nav.navigate('HomeStack' as never, { screen: 'Search' } as never)}
        style={styles.headerBtn}
      >
        <Text style={styles.headerIcon}>🔍</Text>
      </TouchableOpacity>
    </View>
  );
}

function CustomDrawerContent({ navigation }: DrawerContentComponentProps) {
  return (
    <View style={styles.drawer}>
      <View style={styles.drawerBrand}>
        <Text style={styles.drawerBrandText}>RUA DE BAIXO</Text>
      </View>
      <ScrollView>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.name}
            style={styles.drawerItem}
            onPress={() => {
              navigation.closeDrawer();
              if (cat.id === 0) {
                navigation.navigate('HomeStack' as never, { screen: 'Home' } as never);
              } else {
                navigation.navigate('HomeStack' as never, {
                  screen: 'Category',
                  params: { categoryId: cat.id, categoryName: cat.name },
                } as never);
              }
            }}
          >
            <Text style={styles.drawerItemText}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Category" component={CategoryScreen} />
      <Stack.Screen name="Article" component={ArticleScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
    </Stack.Navigator>
  );
}

export function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        header: () => <AppHeader />,
        drawerStyle: { backgroundColor: colors.drawer, width: 240 },
      }}
    >
      <Drawer.Screen name="HomeStack" component={HomeStack} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.header,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  headerBtn: { padding: spacing.sm, minWidth: 44, alignItems: 'center' },
  headerIcon: { color: '#FFFFFF', fontSize: 20 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  drawer: { flex: 1, backgroundColor: colors.drawer },
  drawerBrand: {
    padding: spacing.md,
    paddingTop: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  drawerBrandText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fontSize.sm,
    letterSpacing: 1.5,
  },
  drawerItem: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  drawerItemText: { color: colors.drawerText, fontSize: fontSize.sm },
});
```

- [ ] **Step 3: Replace `App.tsx`**

```typescript
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OneSignal from 'react-native-onesignal';
import Constants from 'expo-constants';
import { DrawerNavigator } from './src/navigation/DrawerNavigator';

export default function App() {
  useEffect(() => {
    const appId = Constants.expoConfig?.extra?.oneSignalAppId as string | undefined;
    if (appId && appId !== 'REPLACE_WITH_YOUR_ONESIGNAL_APP_ID') {
      OneSignal.setAppId(appId);
      OneSignal.promptForPushNotificationsWithUserResponse();
    }
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <DrawerNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 4: Run the app and verify all navigation**

```bash
npx expo start
```

Open on device with Expo Go (scan QR). Verify:
- Header shows ☰ and 🔍
- ☰ opens drawer with category list (text only)
- Tapping a category shows article list
- Tapping an article opens full content
- 🔍 opens search
- Typing in search returns results after ~400ms

- [ ] **Step 5: Commit**

```bash
git add src/navigation/DrawerNavigator.tsx App.tsx
git commit -m "feat: wire up drawer navigation and all screens"
```

---

### Task 12: OneSignal push notifications setup

**Files:**
- Modify: `app.json` (add real OneSignal App ID)

This task requires creating a OneSignal account. No code changes beyond `app.json`.

- [ ] **Step 1: Create OneSignal account**

1. Go to https://onesignal.com → Sign up (free)
2. Click "New App/Website" → name it "Rua de Baixo"
3. Select platform: Google Android → follow instructions to add Firebase credentials
4. Add platform: Apple iOS → follow instructions for APNs key (requires Apple Developer account)
5. Copy the **App ID** shown on the dashboard (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

- [ ] **Step 2: Install OneSignal WordPress plugin**

1. In WordPress admin → Plugins → Add New → search "OneSignal Push Notifications"
2. Install and Activate
3. In WordPress admin → Settings → OneSignal → enter your OneSignal App ID and REST API Key
4. Enable: "Automatically send a push notification when I publish a new post" → Save

- [ ] **Step 3: Update app.json with real OneSignal App ID**

Replace `REPLACE_WITH_YOUR_ONESIGNAL_APP_ID` in `app.json` with the actual App ID:

```json
"extra": {
  "oneSignalAppId": "YOUR-ACTUAL-ONESIGNAL-APP-ID-HERE"
}
```

- [ ] **Step 4: Commit**

```bash
git add app.json
git commit -m "feat: configure OneSignal App ID for push notifications"
```

---

### Task 13: EAS Build and store submission

**Files:**
- Create: `eas.json`

- [ ] **Step 1: Install EAS CLI and log in**

```bash
npm install -g eas-cli
eas login
```

Create a free account at expo.dev if needed.

- [ ] **Step 2: Configure EAS**

```bash
eas build:configure
```

Accept defaults. This creates `eas.json`:

```json
{
  "cli": { "version": ">= 5.9.1" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": { "distribution": "internal" },
    "production": {}
  },
  "submit": { "production": {} }
}
```

- [ ] **Step 3: Build Android APK for testing (no account needed)**

```bash
eas build --platform android --profile preview
```

Takes ~10-15 minutes on Expo's cloud servers. Download link sent via email and shown in terminal.

- [ ] **Step 4: Build production Android for Play Store**

```bash
eas build --platform android --profile production
```

- [ ] **Step 5: Submit to Google Play**

Requires Google Play Console account ($25 one-time). Create account at play.google.com/console.

```bash
eas submit --platform android
```

- [ ] **Step 6: Build and submit iOS (requires Apple Developer account — $99/year)**

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

Expo will prompt for Apple credentials and handle signing automatically.

- [ ] **Step 7: Commit**

```bash
git add eas.json
git commit -m "chore: add EAS Build configuration"
```

---

## Run All Tests

```bash
npx jest
```

Expected output:
```
PASS  __tests__/api/wordpress.test.ts
PASS  __tests__/hooks/useDebounce.test.ts

Test Suites: 2 passed, 2 total
Tests:       9 passed, 9 total
```
