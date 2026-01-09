# Job Done Front - 도크 작업 완료 알림 시스템

TypeScript + React 기반 프론트엔드 애플리케이션입니다.

## 기능

- **관리자 페이지** (`/admin`): 대형 선택 및 도크 번호 버튼으로 작업 완료 알림 전송
- **신호수 페이지** (`/signal`): 실시간 알림 수신 및 확인 처리
- 실시간 Socket.IO 통신
- Supabase 데이터베이스 연동

## 기술 스택

- React 19 + TypeScript
- React Router 7 (라우팅)
- Socket.IO Client (실시간 통신)
- Supabase JS (데이터베이스)
- Tailwind CSS (스타일링)
- Vite (빌드 도구)

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 실제 값으로 설정:

```env
# Supabase 설정
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Socket.IO 서버 URL
VITE_SOCKET_IO_URL=http://localhost:3001
```

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 빌드

```bash
npm run build
```

## 프로젝트 구조

```
src/
├── components/     # 재사용 가능한 컴포넌트
├── pages/         # 페이지 컴포넌트
│   ├── AdminPage.tsx    # 관리자 페이지
│   └── SignalPage.tsx   # 신호수 페이지
├── hooks/         # 커스텀 훅
│   ├── useSocket.ts     # Socket.IO 연결 관리
│   └── useSupabase.ts   # Supabase 클라이언트
├── types/         # TypeScript 타입 정의
│   ├── index.ts         # 공통 타입
│   └── supabase.ts      # Supabase 타입
├── App.tsx        # 메인 앱 컴포넌트
├── main.tsx       # 앱 진입점
└── index.css      # 글로벌 스타일
```

## 사용 방법

### 관리자
1. `/admin`으로 접속
2. 1번 대형(32-41) 또는 2번 대형(22-31) 선택
3. 해당 도크 번호 버튼 클릭으로 작업 완료 알림 전송
4. 최근 전송 로그 확인 가능

### 신호수
1. `/signal`으로 접속
2. 최신 알림이 큰 카드로 표시됨
3. 알림 탭으로 확인 처리
4. 알림 히스토리 확인 가능

## 백엔드 요구사항

이 프론트엔드는 다음과 같은 백엔드 API를 필요로 합니다:

- **Socket.IO 서버**: 실시간 이벤트 처리
- **Supabase 데이터베이스**: dock_events, dock_sets 테이블

## MVP 요구사항 준수

- ✅ 로그인/인증 없음 (URL 기반 역할 구분)
- ✅ 실시간 알림 전송/수신
- ✅ 공용 체크 시스템 (개별 확인이 아닌 전체 확인)
- ✅ 대형별 도크 세트 관리
- ✅ 반응형 UI 디자인
- ✅ 중복 이벤트 처리 (여러 탭 동시 사용 시)

## 최근 수정사항

### v1.0.16 - 로그 삭제 실시간 동기화
**문제**: 로그 삭제 시 DB 반영 안되고 신호수 페이지 동기화 부족
**해결**: Socket.IO 이벤트로 DB 삭제 및 실시간 동기화 구현
**영향**: 모든 클라이언트에서 로그 삭제가 실시간으로 반영

**기술적 세부사항**:
- client:delete_event 이벤트로 서버에 삭제 요청
- server:event_deleted 이벤트로 모든 클라이언트에 삭제 브로드캐스트
- AdminPage와 SignalPage 모두 삭제 이벤트 처리

### v1.0.9 - TypeScript 프로젝트 참조 에러 해결
**문제**: tsconfig.json 참조에서 TS6310 에러 발생
**해결**: tsconfig.node.json의 noEmit 설정 수정
**영향**: TypeScript 컴파일 에러 해결

**기술적 세부사항**:
- composite: true인 프로젝트는 emit 비활성화 불가
- tsconfig.node.json에서 noEmit: false로 변경

### v1.0.8 - 모바일 UI 개선
**문제**: 스마트폰 사용을 위한 모바일 친화적 UI 필요 (최소 320px)
**해결**: 모든 페이지를 모바일 우선 디자인으로 개선
**영향**: 터치 친화적이고 가독성 좋은 모바일 UI 완성

**기술적 세부사항**:
- 컨테이너 최대 너비: 7xl → md (28rem/448px)
- 도크 버튼: 5열 → 3열 그리드, 터치 높이 60px 확보
- 텍스트 크기: lg → base/sm으로 축소
- 패딩/마진: 모바일에 최적화된 간격 적용
- 버튼: active 상태 추가로 터치 피드백 제공

### v1.0.4 - 확인 시간 지속성 문제 해결
**문제**: 관리자 페이지 새로고침 시 확인 시간이 사라지는 문제
**해결**: 로컬 스토리지를 활용한 acked_at 데이터 지속성 구현
**영향**: 새로고침 후에도 확인 시간 유지, 서버 DB 문제 우회

**기술적 세부사항**:
- 실시간 이벤트에서 acked_at을 localStorage에 저장
- DB 데이터 로드 시 로컬 데이터와 병합
- 7일 이상 된 오래된 이벤트 자동 정리

### v1.0.3 - 날짜 유효성 문제 해결
**문제**: 관리자 페이지 새로고침 시 "전송: Invalid Date" 표시
**해결**: 날짜 유효성 검사 및 DB 쿼리 필터링 추가
**영향**: 유효하지 않은 날짜 데이터 처리, 사용자 경험 개선

**기술적 세부사항**:
- formatTime 함수에 null/undefined/Invalid Date 체크 추가
- Supabase 타입 정의에서 created_at을 nullable로 수정
- DB 쿼리에 `not('created_at', 'is', null)` 조건 추가

### v1.0.2 - 임시 이벤트 중복 문제 해결
**문제**: 관리자 페이지에서 버튼 클릭 시 임시 이벤트와 서버 이벤트가 모두 표시되는 문제
**해결**: 임시 이벤트를 서버 이벤트로 교체하는 로직 구현
**영향**: AdminPage에서 이벤트 중복 제거, 사용자 경험 개선

**기술적 세부사항**:
- 임시 이벤트 ID 패턴: `temp-${dockSetId}-${dockNo}-${timestamp}`
- 서버 이벤트 도착 시 동일한 dockNo, dockSetId, 시간 범위(10초)로 임시 이벤트 찾기
- 찾으면 교체, 없으면 새로 추가

### v1.0.1 - 중복 이벤트 처리 개선
**문제**: 여러 관리자 탭을 동시에 열었을 때 동일한 이벤트가 여러 번 표시되는 문제
**해결**: `useRef<Set<string>>`을 사용하여 처리된 이벤트 ID를 추적하고 중복 방지
**영향**: AdminPage와 SignalPage 모두에서 실시간 이벤트 중복 제거

**기술적 세부사항**:
- `processedEventIds.current`로 이벤트 ID 추적
- Socket.IO 이벤트 핸들러에서 중복 체크
- 이벤트 생성과 확인 이벤트 모두 필터링