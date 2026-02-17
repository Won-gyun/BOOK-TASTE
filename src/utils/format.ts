// ============================================================
// 포맷팅 유틸리티
// ============================================================

/** 초를 "MM:SS" 형태로 변환 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** 초를 "Xh Ym" 형태로 변환 */
export function formatDurationLong(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

/** 날짜 문자열을 "YYYY.MM.DD" 형태로 변환 */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/** 진행률(%) 계산 */
export function calcProgress(current: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.round((current / total) * 100), 100);
}
