// ============================================================
// 도서 상세 화면 - 진행률 업데이트, 문장 저장, 낭독 녹음
// ============================================================
import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, Image, RefreshControl, Modal, FlatList,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useBook } from '../hooks/useBooks';
import { useBooks } from '../hooks/useBooks';
import { useSentences } from '../hooks/useSentences';
import { useRecordings } from '../hooks/useRecordings';
import { ProgressBar } from '../components/ProgressBar';
import { RecordingItem } from '../components/RecordingItem';
import { calcProgress, formatDuration, formatDate } from '../utils/format';
import { RootStackParamList, Sentence } from '../types';
import { colors, spacing, borderRadius, fontSize, shadow } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function BookDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'BookDetail'>>();
  const nav = useNavigation<Nav>();
  const bookId = route.params.bookId;

  const { book, refresh: refreshBook } = useBook(bookId);
  const { updateProgress, deleteBook } = useBooks();
  const { sentences, refresh: refreshSentences, addSentence, deleteSentence } = useSentences(bookId);
  const { recordings, refresh: refreshRecs, addRecording, deleteRecording } = useRecordings(bookId);

  // 페이지 입력 상태
  const [pageInput, setPageInput] = useState('');

  // 문장 추가 모달
  const [sentenceModal, setSentenceModal] = useState(false);
  const [sentenceText, setSentenceText] = useState('');
  const [sentencePage, setSentencePage] = useState('');

  // 녹음 상태
  const [isRecording, setIsRecording] = useState(false);
  const [recordingObj, setRecordingObj] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // 재생 상태
  const [playingId, setPlayingId] = useState<number | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // 탭별 전환
  const [tab, setTab] = useState<'sentences' | 'recordings'>('sentences');

  useFocusEffect(
    useCallback(() => {
      refreshBook();
      refreshSentences();
      refreshRecs();
    }, [refreshBook, refreshSentences, refreshRecs])
  );

  if (!book) return null;

  const progress = calcProgress(book.currentPage, book.totalPages);

  // 페이지 업데이트
  const handleUpdatePage = async () => {
    const page = parseInt(pageInput, 10);
    if (isNaN(page) || page < 0) return;
    const clamped = Math.min(page, book.totalPages);
    await updateProgress(book.id, clamped);
    setPageInput('');
    refreshBook();
  };

  // 문장 저장
  const handleAddSentence = async () => {
    if (!sentenceText.trim()) return;
    const page = parseInt(sentencePage, 10) || null;
    await addSentence(bookId, sentenceText.trim(), page);
    setSentenceText('');
    setSentencePage('');
    setSentenceModal(false);
  };

  // 녹음 시작
  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('권한 필요', '마이크 권한을 허용해주세요.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecordingObj(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimer.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch (e) {
      Alert.alert('오류', '녹음을 시작할 수 없습니다.');
    }
  };

  // 녹음 중지 및 저장
  const stopRecording = async () => {
    if (!recordingObj) return;
    if (recordingTimer.current) clearInterval(recordingTimer.current);

    try {
      await recordingObj.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recordingObj.getURI();
      if (uri) {
        // recordings 폴더로 복사
        const dir = FileSystem.documentDirectory + 'recordings/';
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        const filename = `rec_${Date.now()}.m4a`;
        const dest = dir + filename;
        await FileSystem.moveAsync({ from: uri, to: dest });

        const title = `${book.title} - 낭독 ${new Date().toLocaleDateString('ko-KR')}`;
        await addRecording(title, dest, recordingDuration, bookId);
      }
    } catch (e) {
      Alert.alert('오류', '녹음 저장에 실패했습니다.');
    }

    setRecordingObj(null);
    setIsRecording(false);
    setRecordingDuration(0);
  };

  // 재생
  const playRecording = async (id: number, fileUri: string) => {
    // 이미 재생 중이면 중지
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    if (playingId === id) {
      setPlayingId(null);
      return;
    }

    try {
      const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
      soundRef.current = sound;
      setPlayingId(id);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch {
      Alert.alert('오류', '재생할 수 없습니다.');
    }
  };

  // 도서 삭제
  const handleDeleteBook = () => {
    Alert.alert('도서 삭제', '이 도서와 관련된 모든 문장, 녹음이 삭제됩니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await deleteBook(bookId);
          nav.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => { refreshBook(); refreshSentences(); refreshRecs(); }}
          colors={[colors.primary]}
        />
      }
    >
      {/* 도서 헤더 */}
      <View style={styles.header}>
        {book.coverUri ? (
          <Image source={{ uri: book.coverUri }} style={styles.cover} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <MaterialIcons name="menu-book" size={40} color={colors.textTertiary} />
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.bookTitle}>{book.title}</Text>
          <Text style={styles.bookAuthor}>{book.author || '저자 미상'}</Text>
          {book.isbn && <Text style={styles.isbn}>ISBN: {book.isbn}</Text>}
        </View>
      </View>

      {/* 진행률 */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>독서 진행률</Text>
          <Text style={[styles.progressPercent, progress >= 100 && { color: colors.success }]}>
            {progress}%
          </Text>
        </View>
        <ProgressBar
          progress={progress}
          height={10}
          color={progress >= 100 ? colors.success : colors.primary}
        />
        <Text style={styles.progressPages}>
          {book.currentPage} / {book.totalPages} 페이지
        </Text>

        {/* 페이지 업데이트 */}
        <View style={styles.pageInputRow}>
          <TextInput
            style={styles.pageInput}
            placeholder="현재 페이지"
            placeholderTextColor={colors.textTertiary}
            value={pageInput}
            onChangeText={setPageInput}
            keyboardType="number-pad"
          />
          <TouchableOpacity style={styles.pageBtn} onPress={handleUpdatePage}>
            <Text style={styles.pageBtnText}>업데이트</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 녹음 컨트롤 */}
      <View style={styles.recordCard}>
        <Text style={styles.sectionTitle}>낭독 녹음</Text>
        <TouchableOpacity
          style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <MaterialIcons
            name={isRecording ? 'stop' : 'mic'}
            size={28}
            color={isRecording ? colors.danger : colors.white}
          />
          <Text style={[styles.recordBtnText, isRecording && { color: colors.danger }]}>
            {isRecording ? `녹음 중 ${formatDuration(recordingDuration)}` : '녹음 시작'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 탭 전환: 문장 / 녹음 */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'sentences' && styles.tabBtnActive]}
          onPress={() => setTab('sentences')}
        >
          <Text style={[styles.tabText, tab === 'sentences' && styles.tabTextActive]}>
            문장 ({sentences.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'recordings' && styles.tabBtnActive]}
          onPress={() => setTab('recordings')}
        >
          <Text style={[styles.tabText, tab === 'recordings' && styles.tabTextActive]}>
            녹음 ({recordings.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 문장 목록 */}
      {tab === 'sentences' && (
        <View>
          <TouchableOpacity
            style={styles.addSentenceBtn}
            onPress={() => setSentenceModal(true)}
          >
            <MaterialIcons name="add" size={20} color={colors.primary} />
            <Text style={styles.addSentenceBtnText}>문장 추가</Text>
          </TouchableOpacity>

          {sentences.map((s) => (
            <View key={s.id} style={styles.sentenceCard}>
              <Text style={styles.sentenceContent}>"{s.content}"</Text>
              <View style={styles.sentenceMeta}>
                {s.page && <Text style={styles.sentencePage}>p.{s.page}</Text>}
                <Text style={styles.sentenceDate}>{formatDate(s.createdAt)}</Text>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert('문장 삭제', '이 문장을 삭제하시겠습니까?', [
                      { text: '취소' },
                      { text: '삭제', style: 'destructive', onPress: () => deleteSentence(s.id) },
                    ]);
                  }}
                >
                  <MaterialIcons name="delete-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 녹음 목록 */}
      {tab === 'recordings' && (
        <View>
          {recordings.map((r) => (
            <RecordingItem
              key={r.id}
              recording={r}
              isPlaying={playingId === r.id}
              onPlay={() => playRecording(r.id, r.fileUri)}
              onDelete={() => {
                Alert.alert('녹음 삭제', '이 녹음을 삭제하시겠습니까?', [
                  { text: '취소' },
                  { text: '삭제', style: 'destructive', onPress: () => deleteRecording(r.id) },
                ]);
              }}
            />
          ))}
          {recordings.length === 0 && (
            <Text style={styles.emptyText}>아직 녹음이 없습니다</Text>
          )}
        </View>
      )}

      {/* 도서 삭제 */}
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteBook}>
        <MaterialIcons name="delete-forever" size={20} color={colors.danger} />
        <Text style={styles.deleteBtnText}>도서 삭제</Text>
      </TouchableOpacity>

      {/* 문장 추가 모달 */}
      <Modal visible={sentenceModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>기억하고 싶은 문장</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="문장을 입력하세요..."
              placeholderTextColor={colors.textTertiary}
              value={sentenceText}
              onChangeText={setSentenceText}
              multiline
              numberOfLines={4}
            />
            <TextInput
              style={styles.input}
              placeholder="페이지 (선택)"
              placeholderTextColor={colors.textTertiary}
              value={sentencePage}
              onChangeText={setSentencePage}
              keyboardType="number-pad"
            />

            {/* OCR 안내 - 카메라로 촬영하여 직접 입력 유도 */}
            <TouchableOpacity
              style={styles.ocrBtn}
              onPress={async () => {
                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ['images'],
                  quality: 0.8,
                });
                if (!result.canceled) {
                  Alert.alert(
                    'OCR 안내',
                    '촬영된 이미지를 참고하여 문장을 직접 입력해주세요.\n(로컬 OCR은 향후 업데이트 예정)'
                  );
                }
              }}
            >
              <MaterialIcons name="camera-alt" size={20} color={colors.info} />
              <Text style={styles.ocrBtnText}>카메라로 촬영</Text>
            </TouchableOpacity>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setSentenceModal(false);
                  setSentenceText('');
                  setSentencePage('');
                }}
              >
                <Text style={styles.modalCancelBtnText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddSentence}>
                <Text style={styles.modalSaveBtnText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 60 },

  // 헤더
  header: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  cover: {
    width: 90,
    height: 130,
    borderRadius: borderRadius.md,
  },
  coverPlaceholder: {
    width: 90,
    height: 130,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.lg,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  isbn: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },

  // 진행률 카드
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  progressPercent: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary,
  },
  progressPages: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  pageInputRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  pageInput: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  pageBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  pageBtnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },

  // 녹음 카드
  recordCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  recordBtnActive: {
    backgroundColor: colors.danger + '15',
    borderWidth: 2,
    borderColor: colors.danger,
  },
  recordBtnText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },

  // 탭
  tabRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },

  // 문장
  addSentenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  addSentenceBtnText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  sentenceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    ...shadow.sm,
  },
  sentenceContent: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  sentenceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  sentencePage: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  sentenceDate: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    flex: 1,
  },

  emptyText: {
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: fontSize.sm,
    paddingVertical: spacing.xxl,
  },

  // 삭제 버튼
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxxl,
    gap: spacing.xs,
  },
  deleteBtnText: {
    color: colors.danger,
    fontSize: fontSize.sm,
  },

  // 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  ocrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  ocrBtnText: {
    color: colors.info,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
  },
  modalCancelBtnText: { color: colors.textSecondary, fontWeight: '600' },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  modalSaveBtnText: { color: colors.white, fontWeight: '600' },
});
