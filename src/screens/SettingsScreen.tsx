// ============================================================
// 설정 화면 - 데이터 백업/복구, 앱 정보
// ============================================================
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useDatabase } from '../database/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, fontSize, shadow } from '../utils/theme';

export default function SettingsScreen() {
  const db = useDatabase();
  const { user, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  // 데이터 내보내기 (JSON)
  const handleExport = async () => {
    setExporting(true);
    try {
      const books = await db.getAllAsync('SELECT * FROM books');
      const sentences = await db.getAllAsync('SELECT * FROM sentences');
      const recordings = await db.getAllAsync('SELECT * FROM recordings');
      const readingLogs = await db.getAllAsync('SELECT * FROM reading_logs');

      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        books,
        sentences,
        recordings,
        readingLogs,
      };

      const json = JSON.stringify(data, null, 2);
      const path = FileSystem.cacheDirectory + `booksavor_backup_${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(path, json);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, {
          mimeType: 'application/json',
          dialogTitle: '책음미하기 데이터 내보내기',
        });
      } else {
        Alert.alert('완료', `백업 파일이 저장되었습니다:\n${path}`);
      }
    } catch (e: any) {
      Alert.alert('오류', `내보내기 실패: ${e.message}`);
    }
    setExporting(false);
  };

  // 데이터 가져오기
  const handleImport = async () => {
    Alert.alert(
      '데이터 가져오기',
      '기존 데이터가 모두 삭제되고 백업 파일의 데이터로 대체됩니다. 계속하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '가져오기',
          onPress: async () => {
            setImporting(true);
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true,
              });

              if (result.canceled || !result.assets?.[0]) {
                setImporting(false);
                return;
              }

              const fileUri = result.assets[0].uri;
              const json = await FileSystem.readAsStringAsync(fileUri);
              const data = JSON.parse(json);

              if (!data.version || !data.books) {
                Alert.alert('오류', '올바른 백업 파일이 아닙니다.');
                setImporting(false);
                return;
              }

              // 기존 데이터 삭제
              await db.execAsync(`
                DELETE FROM reading_logs;
                DELETE FROM recordings;
                DELETE FROM sentences;
                DELETE FROM books;
              `);

              // 도서 복원
              for (const book of data.books) {
                await db.runAsync(
                  `INSERT INTO books (id, title, author, totalPages, currentPage, coverUri, isbn, createdAt, updatedAt)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [book.id, book.title, book.author, book.totalPages, book.currentPage,
                   book.coverUri, book.isbn, book.createdAt, book.updatedAt]
                );
              }

              // 문장 복원
              for (const s of data.sentences || []) {
                await db.runAsync(
                  `INSERT INTO sentences (id, bookId, content, page, createdAt) VALUES (?, ?, ?, ?, ?)`,
                  [s.id, s.bookId, s.content, s.page, s.createdAt]
                );
              }

              // 녹음 복원 (파일은 별도 복구 필요)
              for (const r of data.recordings || []) {
                await db.runAsync(
                  `INSERT INTO recordings (id, bookId, sentenceId, title, fileUri, duration, createdAt)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [r.id, r.bookId, r.sentenceId, r.title, r.fileUri, r.duration, r.createdAt]
                );
              }

              // 독서 기록 복원
              for (const log of data.readingLogs || []) {
                await db.runAsync(
                  `INSERT INTO reading_logs (id, bookId, pagesRead, date) VALUES (?, ?, ?, ?)`,
                  [log.id, log.bookId, log.pagesRead, log.date]
                );
              }

              Alert.alert('완료', '데이터를 성공적으로 가져왔습니다.');
            } catch (e: any) {
              Alert.alert('오류', `가져오기 실패: ${e.message}`);
            }
            setImporting(false);
          },
        },
      ]
    );
  };

  const SettingItem = ({
    icon,
    label,
    subtitle,
    onPress,
    loading: itemLoading,
    danger,
  }: {
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    subtitle?: string;
    onPress: () => void;
    loading?: boolean;
    danger?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={itemLoading}>
      <View style={[styles.settingIcon, danger && { backgroundColor: colors.danger + '15' }]}>
        <MaterialIcons
          name={icon}
          size={22}
          color={danger ? colors.danger : colors.primary}
        />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, danger && { color: colors.danger }]}>{label}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {itemLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <MaterialIcons name="chevron-right" size={22} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 계정 */}
      <Text style={styles.sectionTitle}>계정</Text>
      <View style={styles.section}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>이메일</Text>
          <Text style={styles.infoValue}>{user?.email ?? '-'}</Text>
        </View>
        <View style={styles.divider} />
        <SettingItem
          icon="logout"
          label="로그아웃"
          subtitle="현재 계정에서 로그아웃"
          onPress={() => {
            Alert.alert(
              '로그아웃',
              '정말 로그아웃 하시겠습니까?',
              [
                { text: '취소', style: 'cancel' },
                { text: '로그아웃', onPress: () => signOut() },
              ]
            );
          }}
        />
      </View>

      {/* 데이터 관리 */}
      <Text style={styles.sectionTitle}>데이터 관리</Text>
      <View style={styles.section}>
        <SettingItem
          icon="file-upload"
          label="데이터 내보내기"
          subtitle="JSON 파일로 전체 데이터 백업"
          onPress={handleExport}
          loading={exporting}
        />
        <View style={styles.divider} />
        <SettingItem
          icon="file-download"
          label="데이터 가져오기"
          subtitle="백업 파일에서 데이터 복원"
          onPress={handleImport}
          loading={importing}
        />
      </View>

      {/* 데이터 초기화 */}
      <Text style={styles.sectionTitle}>위험 구역</Text>
      <View style={styles.section}>
        <SettingItem
          icon="delete-forever"
          label="전체 데이터 삭제"
          subtitle="모든 도서, 문장, 녹음 데이터 삭제"
          danger
          onPress={() => {
            Alert.alert(
              '전체 데이터 삭제',
              '정말로 모든 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
              [
                { text: '취소', style: 'cancel' },
                {
                  text: '삭제',
                  style: 'destructive',
                  onPress: async () => {
                    await db.execAsync(`
                      DELETE FROM reading_logs;
                      DELETE FROM recordings;
                      DELETE FROM sentences;
                      DELETE FROM books;
                    `);
                    // 녹음 파일도 삭제
                    const dir = FileSystem.documentDirectory + 'recordings/';
                    const info = await FileSystem.getInfoAsync(dir);
                    if (info.exists) {
                      await FileSystem.deleteAsync(dir, { idempotent: true });
                    }
                    Alert.alert('완료', '모든 데이터가 삭제되었습니다.');
                  },
                },
              ]
            );
          }}
        />
      </View>

      {/* 앱 정보 */}
      <Text style={styles.sectionTitle}>앱 정보</Text>
      <View style={styles.section}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>앱 이름</Text>
          <Text style={styles.infoValue}>책음미하기</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>버전</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>저장소</Text>
          <Text style={styles.infoValue}>로컬 SQLite</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },

  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadow.sm,
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingInfo: { flex: 1 },
  settingLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  settingSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: colors.surfaceVariant,
    marginLeft: 68,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  infoLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
  },
});
