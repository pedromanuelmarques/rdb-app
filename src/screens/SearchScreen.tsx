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
