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
            ti