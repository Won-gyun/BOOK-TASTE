// ============================================================
// 라이브러리 화면 - 전체 도서 목록 + 도서 추가
// ============================================================
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useBooks } from '../hooks/useBooks';
import { BookCard } from '../components/BookCard';
import { EmptyState } from '../components/EmptyState';
import { RootStackParamList, Book } from '../types';
import { colors, spacing, borderRadius, fontSize, shadow } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function LibraryScreen() {
  const nav = useNavigation<Nav>();
  const { books, loading, refresh } = useBooks();
  const [filter, setFilter] = useState<'all' | 'reading' | 'done'>('all');

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const filtered = books.filter((b) => {
    if (filter === 'reading') return b.totalPages > 0 && b.currentPage < b.totalPages;
    if (filter === 'done') return b.totalPages > 0 && b.currentPage >= b.totalPages;
    return true;
  });

  const renderBook = ({ item }: { item: Book }) => (
    <BookCard book={item} onPress={() => nav.navigate('BookDetail', { bookId: item.id })} />
  );

  return (
    <View style={styles.container}>
      {/* 필터 탭 */}
      <View style={styles.filterRow}>
        {(['all', 'reading', 'done'] as const).map((key) => {
          const labels = { all: '전체', reading: '읽는 중', done: '완독' };
          const active = filter === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.filterBtn, active && styles.filterBtnActive]}
              onPress={() => setFilter(key)}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {labels[key]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBook}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="library-books"
            title="도서가 없습니다"
            subtitle="아래 버튼을 눌러 첫 번째 책을 추가해보세요"
          />
        }
      />

      {/* 플로팅 추가 버튼 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => nav.navigate('AddBook')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.white,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.lg,
  },
});
