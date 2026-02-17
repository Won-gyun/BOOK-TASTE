// ============================================================
// Firebase 설정 - 앱 초기화 및 Auth 인스턴스
// ============================================================
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Firebase 콘솔 > 프로젝트 설정 > 일반 > 웹 앱에서 값을 복사하세요
const firebaseConfig = {
  apiKey: "AIzaSyBzsyC8WztmFjU41_Bv8C5oXLZk7MdWTgo",
  authDomain: "book-taste-d49a9.firebaseapp.com",
  projectId: "book-taste-d49a9",
  storageBucket: "book-taste-d49a9.firebasestorage.app",
  messagingSenderId: "160959335619",
  appId: "1:160959335619:web:55cd5ba54bd8d50cfd6676",
  measurementId: "G-6C49KLHPCB"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// AsyncStorage로 인증 상태를 기기에 영속 저장
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export default app;
