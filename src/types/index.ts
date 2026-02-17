// ============================================================
// 책음미하기 - 타입 정의
// ============================================================

/** 도서 정보 */
export interface Book {
  id: number;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  coverUri: string | null;
  isbn: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 기억하고 싶은 문장 */
export interface Sentence {
  id: number;
  bookId: number;
  content: string;
  page: number | null;
  createdAt: string;
}

/** 낭독 녹음 */
export interface Recording {
  id: number;
  bookId: number | null;
  sentenceId: number | null;
  title: string;
  fileUri: string;
  duration: number; // 초 단위
  createdAt: string;
}

/** 독서 기록 (통계용) */
export interface ReadingLog {
  id: number;
  bookId: number;
  pagesRead: number;
  date: string; // YYYY-MM-DD
}

/** 네비게이션 파라미터 타입 */
export type RootStackParamList = {
  MainTabs: undefined;
  BookDetail: { bookId: number };
  AddBook: { isbn?: string } | undefined;
  SentenceDetail: { sentenceId: number; bookId: number };
  RecordingPlayer: { recordingId: number };
};

export type MainTabParamList = {
  Home: undefined;
  Library: undefined;
  Recordings: undefined;
  Settings: undefined;
};

/** 인증 네비게이션 파라미터 타입 */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};
