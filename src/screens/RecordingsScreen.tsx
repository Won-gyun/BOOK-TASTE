// ============================================================
// 녹음 관리 화면 - 전체 낭독 녹음 목록, 재생, 삭제
// ============================================================
import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { useRecordings } from '../hooks/useRecordings';
import { RecordingItem } from '../components/RecordingItem';
import { EmptyState } from '../components/EmptyState';
import { Recording } from '../types';
import { colors, spacing, fontSize } from '../utils/theme';

export default function RecordingsScreen() {
  const { recordings, loading, refresh, deleteRecording } = useRecordings();
  const [playingId, setPlayingId] = useState<number | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
      // 화면을 벗어나면 재생 중지
      return () => {
        if (soundRef.current) {
          soundRef.current.unloadAsync();
          soundRef.current = null;
          setPlayingId(null);
        }
      };
    }, [refresh])
  );

  const playRecording = async (id: number, fileUri: string) => {
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

  const handleDelete = (id: number) => {
    Alert.alert('녹음 삭제', '이 녹음 파일을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          if (playingId === id && soundRef.current) {
            await soundRef.current.unloadAsync();
            soundRef.current = null;
            setPlayingId(null);
          }
          await deleteRecording(id);
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Recording }) => (
    <RecordingItem
      recording={item}
      isPlaying={playingId === item.id}
      onPlay={() => playRecording(item.id, item.fileUri)}
      onDelete={() => handleDelete(item.id)}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="mic-none"
            title="녹음이 없습니다"
            subtitle="도서 상세 화면에서 낭독을 녹음해보세요"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
});
