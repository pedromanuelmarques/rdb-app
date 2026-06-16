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
