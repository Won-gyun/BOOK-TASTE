// ============================================================
// 도서 CRUD 훅 (Supabase)
// ============================================================
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Book } from '../types';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('updatedAt', { ascending: false });

    if (error) {
      console.error('Error fetching books:', error);
    } else {
      setBooks(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** 새 도서 추가 */
  const addBook = useCallback(async (
    title: string, author: string, totalPages: number,
    coverUri?: string | null, isbn?: string | null
  ) => {
    const { error } = await supabase
      .from('books')
      .insert([
        { title, author, totalPages, coverUri, isbn }
      ]);

    if (error) console.error('Error adding book:', error);
    else await refresh();
  }, [refresh]);

  /** 도서 삭제 */
  const deleteBook = useCallback(async (id: number) => {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id);

    if (error) console.error('Error deleting book:', error);
    else await refresh();
  }, [refresh]);

  /** 읽은 페이지 업데이트 */
  const updateProgress = useCallback(async (id: number, currentPage: number) => {
    const today = new Date().toISOString().slice(0, 10);

    // 1. 기존 도서 정보 조회 (현재 페이지 확인용)
    const { data: book, error: fetchError } = await supabase
      .from('books')
      .select('currentPage')
      .eq('id', id)
      .single();

    if (fetchError || !book) return;

    const diff = currentPage - book.currentPage;

    // 2. 도서 업데이트
    const { error: updateError } = await supabase
      .from('books')
      .update({
        currentPage,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating book progress:', updateError);
      return;
    }

    // 3. 독서 기록 로그 추가 (오늘자)
    if (diff > 0) {
      // 오늘자 기록 확인
      const { data: existingLog } = await supabase
        .from('reading_logs')
        .select('id, pagesRead')
        .eq('bookId', id)
        .eq('date', today)
        .maybeSingle();

      if (existingLog) {
        await supabase
          .from('reading_logs')
          .update({ pagesRead: existingLog.pagesRead + diff })
          .eq('id', existingLog.id);
      } else {
        await supabase
          .from('reading_logs')
          .insert([
            { bookId: id, pagesRead: diff, date: today }
          ]);
      }
    }
    await refresh();
  }, [refresh]);

  /** 도서 정보 수정 */
  const updateBook = useCallback(async (
    id: number, title: string, author: string, totalPages: number, coverUri?: string | null
  ) => {
    const { error } = await supabase
      .from('books')
      .update({
        title,
        author,
        totalPages,
        coverUri,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id);

    if (error) console.error('Error updating book:', error);
    else await refresh();
  }, [refresh]);

  return { books, loading, refresh, addBook, deleteBook, updateProgress, updateBook };
}

/** 단일 도서 조회 훅 */
export function useBook(bookId: number) {
  const [book, setBook] = useState<Book | null>(null);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (error) {
      console.error('Error fetching book:', error);
    } else {
      setBook(data);
    }
  }, [bookId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { book, refresh };
}
