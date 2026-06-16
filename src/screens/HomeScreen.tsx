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
