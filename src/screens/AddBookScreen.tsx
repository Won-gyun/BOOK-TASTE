// ============================================================
// 도서 추가 화면 - ISBN 스캔 또는 수동 입력
// ============================================================
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useBooks } from '../hooks/useBooks';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, fontSize, shadow } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AddBook'>;

export default function AddBookScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { addBook } = useBooks();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [isbn, setIsbn] = useState(route.params?.isbn ?? '');
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // ISBN으로 도서 정보 조회 (Open Library API - 무료)
  const fetchBookInfo = async (code: string) => {
    try {
      const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${code}&format=json&jscmd=data`);
      const data = await res.json();
      const key = `ISBN:${code}`;
      if (data[key]) {
        const info = data[key];
        setTitle(info.title || '');
        setAuthor(info.authors?.[0]?.name || '');
        setTotalPages(info.number_of_pages?.toString() || '');
        if (info.cover?.medium) setCoverUri(info.cover.medium);
        setIsbn(code);
      } else {
        Alert.alert('알림', '해당 ISBN의 도서 정보를 찾을 수 없습니다. 수동으로 입력해주세요.');
      }
    } catch {
      Alert.alert('오류', 'ISBN 정보를 가져오는 데 실패했습니다.');
    }
  };

  // 바코드 스캔 처리
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanning(false);
    setIsbn(data);
    fetchBookInfo(data);
  };

  // 표지 이미지 선택
  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setCoverUri(result.assets[0].uri);
    }
  };

  // 저장
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('알림', '제목을 입력해주세요.');
      return;
    }
    const pages = parseInt(totalPages, 10) || 0;
    await addBook(title.trim(), author.trim(), pages, coverUri, isbn || null);
    nav.goBack();
  };

  // 바코드 스캔 화면
  if (scanning) {
    if (!permission?.granted) {
      return (
        <View style={styles.center}>
          <Text style={styles.permText}>카메라 권한이 필요합니다</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryBtnText}>권한 허용</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setScanning(false)}>
            <Text style={styles.secondaryBtnText}>취소</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.scanContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8'] }}
          onBarcodeScanned={handleBarCodeScanned}
        />
        <View style={styles.scanOverlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanText}>ISBN 바코드를 스캔하세요</Text>
        </View>
        <TouchableOpacity style={styles.scanClose} onPress={() => setScanning(false)}>
          <MaterialIcons name="close" size={28} color={colors.white} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* ISBN 스캔 버튼 */}
        <TouchableOpacity style={styles.scanBtn} onPress={() => setScanning(true)}>
          <MaterialIcons name="qr-code-scanner" size={24} color={colors.primary} />
          <Text style={styles.scanBtnText}>ISBN 바코드 스캔</Text>
        </TouchableOpacity>

        {/* ISBN 수동 입력 */}
        <View style={styles.isbnRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="ISBN 번호 입력"
            placeholderTextColor={colors.textTertiary}
            value={isbn}
            onChangeText={setIsbn}
            keyboardType="number-pad"
          />
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => isbn && fetchBookInfo(isbn)}
          >
            <MaterialIcons name="search" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* 표지 이미지 */}
        <TouchableOpacity style={styles.coverPicker} onPress={pickCover}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <MaterialIcons name="add-photo-alternate" size={40} color={colors.textTertiary} />
              <Text style={styles.coverPlaceholderText}>표지 이미지</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 입력 필드 */}
        <Text style={styles.label}>제목 *</Text>
        <TextInput
          style={styles.input}
          placeholder="도서 제목"
          placeholderTextColor={colors.textTertiary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>저자</Text>
        <TextInput
          style={styles.input}
          placeholder="저자 이름"
          placeholderTextColor={colors.textTertiary}
          value={author}
          onChangeText={setAuthor}
        />

        <Text style={styles.label}>총 페이지 수</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor={colors.textTertiary}
          value={totalPages}
          onChangeText={setTotalPages}
          keyboardType="number-pad"
        />

        {/* 저장 버튼 */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>도서 추가</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },

  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  scanBtnText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },

  isbnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  coverPicker: {
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  coverImage: {
    width: 120,
    height: 170,
    borderRadius: borderRadius.md,
  },
  coverPlaceholder: {
    width: 120,
    height: 170,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  coverPlaceholderText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },

  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
    ...shadow.md,
  },
  saveBtnText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.white,
  },

  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  primaryBtnText: { color: colors.white, fontWeight: '600', fontSize: fontSize.md },
  secondaryBtn: { marginTop: spacing.md },
  secondaryBtnText: { color: colors.textSecondary, fontSize: fontSize.md },
  permText: { fontSize: fontSize.md, color: colors.textSecondary },

  // 스캔 화면
  scanContainer: { flex: 1, backgroundColor: '#000' },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 150,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  scanText: {
    color: colors.white,
    fontSize: fontSize.md,
    marginTop: spacing.lg,
    fontWeight: '600',
  },
  scanClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
