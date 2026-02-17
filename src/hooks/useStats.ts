// ============================================================
// 독서 통계 훅 (Supabase)
// ============================================================
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Stats {
  totalBooks: number;
  completedBooks: number;
  totalPagesThisMonth: number;
  totalRecordingDuration: number; // 초
  streakDays: number; // 연속 독서 일수
  monthlyPages: { month: string; pages: number }[];
}

export function useStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalBooks: 0,
    completedBooks: 0,
    totalPagesThisMonth: 0,
    totalRecordingDuration: 0,
    streakDays: 0,
    monthlyPages: [],
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. 총 도서 수
      const { count: totalBooks, error: booksError } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (booksError) throw booksError;

      // 2. 완독 도서 수
      // Supabase doesn't support computed columns in count easily without RPC, 
      // so we might need to fetch or use a slightly different query.
      // For now, let's fetch basic completion status if we had a status column, 
      // but since we compare pages, we'll do a client-side filter or raw query if needed.
      // Simpler approach: fetch all books and filter (if small dataset) or use rpc.
      // Let's use a simple select for now as dataset is likely small per user.
      const { data: allBooks } = await supabase
        .from('books')
        .select('current_page, total_pages')
        .eq('user_id', user.id);

      const completedBooks = allBooks?.filter(b => b.total_pages > 0 && b.current_page >= b.total_pages).length ?? 0;

      // 3. 이번 달 읽은 페이지
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data: monthLogs } = await supabase
        .from('reading_logs')
        .select('pages_read')
        .eq('user_id', user.id)
        .gte('date', monthStart);

      const totalPagesThisMonth = monthLogs?.reduce((sum, log) => sum + (log.pages_read || 0), 0) ?? 0;

      // 4. 총 녹음 시간
      const { data: recordings } = await supabase
        .from('recordings')
        .select('duration')
        .eq('user_id', user.id);

      const totalRecordingDuration = recordings?.reduce((sum, rec) => sum + (rec.duration || 0), 0) ?? 0;

      // 5. 연속 독서 일수 & 월별 통계
      // Fetch all logs date/pages for stats
      const { data: allLogs } = await supabase
        .from('reading_logs')
        .select('date, pages_read')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      // Streak
      let streakDays = 0;
      if (allLogs && allLogs.length > 0) {
        const uniqueDates = Array.from(new Set(allLogs.map(l => l.date))).sort().reverse();
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Check if read today or yesterday to start streak
        if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
          let currentTestDate = new Date(uniqueDates[0] === todayStr ? todayStr : yesterdayStr);

          for (const dateStr of uniqueDates) {
            const testStr = currentTestDate.toISOString().split('T')[0];
            if (dateStr === testStr) {
              streakDays++;
              currentTestDate.setDate(currentTestDate.getDate() - 1);
            } else {
              // Gap found
              if (dateStr < testStr) break;
              // If dateStr > testStr (which shouldn't happen in sorted desc unique), ignore
            }
          }
        }
      }

      // Monthly Pages (Client-side aggregation for now)
      const monthlyMap = new Map<string, number>();
      allLogs?.forEach(log => {
        const month = log.date.substring(0, 7); // YYYY-MM
        const current = monthlyMap.get(month) || 0;
        monthlyMap.set(month, current + (log.pages_read || 0));
      });

      const monthlyPages = Array.from(monthlyMap.entries())
        .map(([month, pages]) => ({ month, pages }))
        .sort((a, b) => b.month.localeCompare(a.month)) // Descending
        .slice(0, 6);

      setStats({
        totalBooks: totalBooks ?? 0,
        completedBooks,
        totalPagesThisMonth,
        totalRecordingDuration,
        streakDays,
        monthlyPages,
      });

    } catch (e) {
      console.error('Error loading stats:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { stats, loading, refresh };
}
