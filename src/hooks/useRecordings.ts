// ============================================================
// 낭독 녹음 CRUD 훅 (Supabase)
// ============================================================
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Recording } from '../types';

export function useRecordings(bookId?: number) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('recordings')
      .select('*')
      .order('createdAt', { ascending: false });

    if (bookId) {
      query = query.eq('bookId', bookId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching recordings:', error);
    } else {
      setRecordings(data || []);
    }
    setLoading(false);
  }, [bookId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** 녹음 레코드 추가 */
  const addRecording = useCallback(async (
    title: string, fileUri: string, duration: number,
    targetBookId?: number | null, sentenceId?: number | null
  ) => {
    try {
      // 1. Storage에 파일 업로드
      const filename = `${Date.now()}_${title.replace(/\s/g, '_')}.m4a`;
      const filePath = `recordings/${filename}`;

      const response = await fetch(fileUri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(filePath, blob, {
          contentType: 'audio/m4a',
        });

      if (uploadError) throw uploadError;

      // 2. Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('recordings')
        .getPublicUrl(filePath);

      // 3. DB에 메타데이터 저장
      const { error: dbError } = await supabase
        .from('recordings')
        .insert([
          {
            bookId: targetBookId,
            sentenceId: sentenceId,
            title,
            fileUri: publicUrl, // 로컬 URI 대신 Remote URL 저장
            duration
          }
        ]);

      if (dbError) throw dbError;

      await refresh();
    } catch (error) {
      console.error('Error adding recording:', error);
      alert('녹음 저장 중 오류가 발생했습니다.');
    }
  }, [refresh]);

  /** 녹음 삭제 (파일도 같이 삭제) */
  const deleteRecording = useCallback(async (id: number) => {
    try {
      // 1. 레코드 조회 (파일 경로 확인용)
      const { data: rec, error: fetchError } = await supabase
        .from('recordings')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !rec) throw fetchError || new Error('Recording not found');

      // 2. Storage에서 파일 삭제
      // fileUri가 Supabase URL이라면 경로 추출
      // 예: https://..../storage/v1/object/public/recordings/recordings/123.m4a
      const urlParts = rec.fileUri.split('/recordings/');
      if (urlParts.length > 1) {
        const path = 'recordings/' + urlParts[urlParts.length - 1]; // 간단한 파싱
        await supabase.storage.from('recordings').remove([path]);
      }

      // 3. DB에서 삭제
      const { error: deleteError } = await supabase
        .from('recordings')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await refresh();
    } catch (error) {
      console.error('Error deleting recording:', error);
    }
  }, [refresh]);

  return { recordings, loading, refresh, addRecording, deleteRecording };
}
