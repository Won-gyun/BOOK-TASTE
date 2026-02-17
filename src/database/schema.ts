// ============================================================
// SQLite 데이터베이스 스키마 정의 및 초기화
// ============================================================
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'booksavor.db';

/** 데이터베이스 연결을 열고 테이블을 초기화한다 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  // WAL 모드 활성화 (성능 향상)
  await db.execAsync('PRAGMA journal_mode = WAL;');

  // 테이블 생성
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT '',
      totalPages INTEGER NOT NULL DEFAULT 0,
      currentPage INTEGER NOT NULL DEFAULT 0,
      coverUri TEXT,
      isbn TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS sentences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookId INTEGER NOT NULL,
      content TEXT NOT NULL,
      page INTEGER,
      createdAt TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (bookId) REFERENCES books(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recordings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookId INTEGER,
      sentenceId INTEGER,
      title TEXT NOT NULL,
      fileUri TEXT NOT NULL,
      duration REAL NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (bookId) REFERENCES books(id) ON DELETE SET NULL,
      FOREIGN KEY (sentenceId) REFERENCES sentences(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS reading_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookId INTEGER NOT NULL,
      pagesRead INTEGER NOT NULL DEFAULT 0,
      date TEXT NOT NULL,
      FOREIGN KEY (bookId) REFERENCES books(id) ON DELETE CASCADE
    );
  `);

  return db;
}
