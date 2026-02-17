// ============================================================
// 설정 화면 - 데이터 백업/복구, 앱 정보
// ============================================================
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, fontSize, shadow } from '../utils/theme';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '로그아웃', onPress: () => signOut() },
      ]
    );
  };

  const SettingItem = ({
    icon,
    label,
    subtitle,
    onPress,
    danger,
  }: {
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    subtitle?: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
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
      <MaterialIcons name="chevron-right" size={22} color={colors.textTertiary} />
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
          onPress={handleSignOut}
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
          <Text style={styles.infoLabel}>데이터 저장소</Text>
          <Text style={styles.infoValue}>Supabase Cloud</Text>
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
