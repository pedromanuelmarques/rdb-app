import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerNavigationProp,
} from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/HomeScreen';
import { CategoryScreen } from '../screens/CategoryScreen';
import { ArticleScreen } from '../screens/ArticleScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { RootStackParamList, DrawerParamList } from '../types';
import { colors, spacing, fontSize } from '../theme';

const CATEGORIES = [
  { id: 0, name: 'Home' },
  { id: 5, name: 'Música' },
  { id: 151, name: 'Cinema' },
  { id: 31481, name: 'Lifestyle' },
  { id: 14699, name: 'Moda' },
  { id: 14688, name: 'Artes' },
  { id: 2548, name: 'Livros' },
  { id: 31477, name: 'Jogos' },
  { id: 24678, name: 'Tech' },
];

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator<RootStackParamList>();

function AppHeader() {
  const nav = useNavigation<DrawerNavigationProp<DrawerParamList>>();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <TouchableOpacity onPress={() => nav.openDrawer()} style={styles.headerBtn}>
        <Text style={styles.headerIcon}>☰</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>RUA DE BAIXO</Text>
      <TouchableOpacity
        onPress={() => nav.navigate('HomeStack', { screen: 'Search' })}
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
                navigation.navigate('HomeStack', { screen: 'Home' });
              } else {
                navigation.navigate('HomeStack', {
                  screen: 'Category',
                  params: { categoryId: cat.id, categoryName: cat.name },
                });
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
    minHeight: 56,
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
