// ============================================================
// 책음미하기 - 메인 엔트리 포인트
// Expo 기반 서버리스 독서 기록 및 낭독 앱
// ============================================================
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { DatabaseProvider } from './src/database/DatabaseContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <DatabaseProvider>
            <StatusBar style="dark" />
            <AppNavigator />
          </DatabaseProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
