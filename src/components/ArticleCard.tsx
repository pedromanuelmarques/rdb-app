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
