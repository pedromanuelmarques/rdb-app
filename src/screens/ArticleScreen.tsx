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
