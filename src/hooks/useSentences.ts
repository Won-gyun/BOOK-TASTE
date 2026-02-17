// ============================================================
// 문장 저장 CRUD 훅 (Supabase)
// ============================================================
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Sentence } from '../types';

export function useSentences(bookId?: number) {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('sentences')
      .select('*')
      .order('createdAt', { ascending: false });

    if (bookId) {
      query = query.eq('bookId', bookId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sentences:', error);
    } else {
      setSentences(data || []);
    }
    setLoading(false);
  }, [bookId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** 문장 추가 */
  const addSentence = useCallback(async (
    targetBookId: number, content: string, page?: number | null
  ) => {
    const { error } = await supabase
      .from('sentences')
      .insert([
        { bookId: targetBookId, content, page }
      ]);

    if (error) console.error('Error adding sentence:', error);
    else await refresh();
  }, [refresh]);

  /** 문장 삭제 */
  const deleteSentence = useCallback(async (id: number) => {
    const { error } = await supabase
      .from('sentences')
      .delete()
      .eq('id', id);

    if (error) console.error('Error deleting sentence:', error);
    else await refresh();
  }, [refresh]);

  /** 문장 수정 */
  const updateSentence = useCallback(async (id: number, content: string, page?: number | null) => {
    const { error } = await supabase
      .from('sentences')
      .update({ content, page })
      .eq('id', id);

    if (error) console.error('Error updating sentence:', error);
    else await refresh();
  }, [refresh]);

  return { sentences, loading, refresh, addSentence, deleteSentence, updateSentence };
}
