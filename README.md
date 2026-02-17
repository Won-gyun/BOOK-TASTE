# 책음미하기 (Book Taste)

나만의 독서 기록을 시작하고, 좋아하는 문장을 목소리로 남겨보세요.

## 주요 기능
- 📚 **독서 기록**: 읽고 있는 책의 현재 페이지를 기록하고 관리합니다.
- ✍️ **기억하고 싶은 문장**: 인상 깊은 구절을 텍스트로 저장합니다.
- 🎙️ **낭독 녹음**: 선택한 문장을 직접 읽고 녹음하여 다시 들어볼 수 있습니다.
- 📊 **독서 통계**: 월별 독서량과 연속 독서 일수를 확인합니다.
- ☁️ **Cloud 동기화**: Supabase를 통한 안전한 데이터 저장 및 기기 간 동기화.

## 기술 스택
- **Frontend**: React Native (Expo)
- **Backend**: Supabase (Auth, Database, Storage)
- **Platform**: Web (Vercel), Android, iOS

## 시작하기

### 환경 변수 설정
`.env` 파일을 작성하고 Supabase 정보를 입력하세요.
```env
EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 실행 방법
```bash
# 의존성 설치
npm install

# 웹 실행
npm run web
```

## 배포 (Vercel)

1. Vercel 프로젝트 생성 및 저장소 연결.
2. **Build Command**: `npm run vercel-build`
3. **Output Directory**: `dist`
4. **Environment Variables**: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` 추가.
