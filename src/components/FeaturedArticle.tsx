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
