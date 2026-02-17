// ============================================================
// 데이터베이스 컨텍스트 - 앱 전체에서 DB 인스턴스 공유
// ============================================================
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';
import { initDatabase } from './schema';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';

interface DatabaseContextType {
  db: SQLite.SQLiteDatabase;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

/** DB 인스턴스를 사용하기 위한 훅 */
export function useDatabase(): SQLite.SQLiteDatabase {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error('useDatabase must be used within DatabaseProvider');
  return ctx.db;
}

/** 앱 최상단에서 DB를 초기화하고 하위 컴포넌트에 제공 */
export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(setDb)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>DB 초기화 실패: {error}</Text>
      </View>
    );
  }

  if (!db) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>데이터베이스 준비 중...</Text>
      </View>
    );
  }

  return (
    <DatabaseContext.Provider value={{ db }}>
      {children}
    </DatabaseContext.Provider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748b' },
  errorText: { fontSize: 14, color: '#ef4444' },
});
