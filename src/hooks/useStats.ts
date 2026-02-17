// ============================================================
// 독서 통계 훅
// ============================================================
import { useCallback, useEffect, useState } from 'react';
import { useDatabase } from '../database/DatabaseContext';

interface Stats {
  totalBooks: number;
  completedBooks: number;
  totalPagesThisMonth: number;
  totalRecordingDuration: number; // 초
  streakDays: number; // 연속 독서 일수
  monthlyPages: { month: string; pages: number }[];
}

export function useStats() {
  const db = useDatabase();
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
    setLoading(true);

    // 총 도서 수
    const totalRow = await db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM books');
    const totalBooks = totalRow?.cnt ?? 0;

    // 완독 도서 수
    const completedRow = await db.getFirstAsync<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM books WHERE currentPage >= totalPages AND totalPages > 0'
    );
    const completedBooks = completedRow?.cnt ?? 0;

    // 이번 달 읽은 페이지
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const pagesRow = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(pagesRead), 0) as total FROM reading_logs WHERE date >= ?',
      [monthStart]
    );
    const totalPagesThisMonth = pagesRow?.total ?? 0;

    // 총 녹음 시간
    const durationRow = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(duration), 0) as total FROM recordings'
    );
    const totalRecordingDuration = durationRow?.total ?? 0;

    // 연속 독서 일수 계산
    const logs = await db.getAllAsync<{ date: string }>(
      'SELECT DISTINCT date FROM reading_logs ORDER BY date DESC'
    );
    let streakDays = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < logs.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().slice(0, 10);
      if (logs[i].date === expectedStr) {
        streakDays++;
      } else {
        break;
      }
    }

    // 월별 페이지 수 (최근 6개월)
    const monthlyPages = await db.getAllAsync<{ month: string; pages: number }>(
      `SELECT strftime('%Y-%m', date) as month, SUM(pagesRead) as pages
       FROM reading_logs
       GROUP BY month
       ORDER BY month DESC
       LIMIT 6`
    );

    setStats({
      totalBooks,
      completedBooks,
      totalPagesThisMonth,
      totalRecordingDuration,
      streakDays,
      monthlyPages: monthlyPages.reverse(),
    });
    setLoading(false);
  }, [db]);

  useEffect(() => { refresh(); }, [refresh]);

  return { stats, loading, refresh };
}
