# 작업 로그

## 프로젝트 개요
DB(데이터베이스/리드) 신청 폼 애플리케이션
보험 영업 대표를 위한 다단계 주문 폼 (제품 선택 → 신청자 정보 입력 → 확인)

**Tech Stack**: React + Vite, shadcn-ui, Tailwind CSS, Express.js, Nodemailer, Supabase

---

## 업데이트 예정

### 🔧 보안프로그램 간섭 문제 해결 (우선순위: 높음)
**문제 상황**: Windows PC 보험회사 환경에서 보안프로그램으로 인한 폼 입력 오류
- 크롬: 이름 입력 불가
- 기타 브라우저: 다음 단계 이동 불가

**해결 방안**:
1. **단기 해결책 (즉시 적용 가능)**
   - Input 이벤트 핸들러 다중화 (onChange, onInput, onKeyUp, onPaste)
   - 폴백 메커니즘 추가 (localStorage 백업, 자동 저장)
   - 브라우저 호환성 코드 보강
   - 사용자 문제 해결 가이드 제공

2. **중기 해결책**
   - 모바일 최적화 강화 (스마트폰 사용 유도)
   - 대체 입력 방법 제공

3. **장기 해결책**
   - PWA (Progressive Web App) 구현
     - 웹사이트를 앱처럼 설치 가능
     - 보안프로그램 간섭 우회
     - 오프라인 동작 지원
     - 독립적인 앱 환경에서 실행

**예상 효과**: 보험회사 PC 환경에서의 사용성 문제 90% 이상 해결

---

## 작업 히스토리

### 2025-11-01
- **제품명 및 설명 개선**
  - 모든 제품명에서 "[보장분석]" 텍스트 제거
  - A업체 제품명: "일반" → "보장분석/일반"으로 변경
  - 모든 제품 설명에서 나이(년생) 텍스트 삭제
  - 제품 설명을 "보장분석 / [특성] / 3주 이내 납품 완료 DB" 형식으로 통일

- **파일명 리팩토링**
  - `CheckboxGridPage.jsx` → `ProductList.jsx`로 파일명 변경
  - 컴포넌트명 및 관련 import 구문 업데이트
  - 더 명확하고 직관적인 파일명으로 개선

- **UI/UX 개선**
  - A/S 불가 항목 제목을 붉은색으로 강조 표시
  - A업체 및 B업체 설명 텍스트를 구조화된 리스트 형태로 개선
    - A업체: 카카오톡 개별 전달 방식 안내 추가
    - B업체: 전산 배분 관리 방식 안내 추가
  - 파일 수정: `src/pages/ProductList.jsx` (구 CheckboxGridPage.jsx)

### 2025-10-31
- **신청자 '직급' 드롭다운 추가**
  - 신청자 정보 입력 폼에 직급 선택 필드 추가
  - 순서: 이름 → 소속 → **직급** → 연락처 → 이메일
  - 직급 옵션: 총괄이사, 사업단장, 지점장, 팀장
  - 순차적 검증 시스템에 직급 검증 통합
  - 이메일 템플릿에 직급 정보 포함 (관리자 이메일 제목 및 본문)
  - 파일 수정: `src/pages/Index.jsx`, `api/send-email.js`

- **개발 환경 설정 및 버그 수정**
  - browserslist 및 caniuse-lite 패키지 업데이트
  - AdminDashboard Supabase 초기화 에러 수정
    - Supabase 미사용 환경에서 앱 로딩 실패 문제 해결
    - `nav-items.jsx`에서 AdminDashboard 라우트 비활성화 (주석 처리)
    - Supabase 설정 후 다시 활성화 가능하도록 주석으로 유지
  - 사용하지 않는 import 정리 (`App.jsx`)
  - 파일 수정: `src/nav-items.jsx`, `src/App.jsx`

### 2025-10-16
- **업체 헤더에 최소 주문 수량 안내문 추가** (`9b5a765`)
  - 사용자가 최소 주문 수량 요구사항을 명확히 인지할 수 있도록 안내 추가

### 2025-09-29
- **Improve Supabase config error messages** (`ecc6fb6`)
  - Supabase 설정 오류 메시지 개선으로 디버깅 용이성 향상

- **Refactor aggregation to shared module and add Vercel endpoint** (`66d9a1b`)
  - 집계 로직을 공유 모듈로 리팩토링
  - Vercel 배포를 위한 엔드포인트 추가

- **Add SPA rewrite for Vercel** (`ca18568`)
  - Vercel 배포 환경에서 SPA 라우팅 지원

- **Fix admin status updates and aggregation labels** (`0491b4b`)
  - 관리자 대시보드 상태 업데이트 및 집계 라벨 수정

- **feat: Add comprehensive admin dashboard with monthly aggregation** (`0b0bf0d`)
  - 월별 집계 기능을 포함한 종합 관리자 대시보드 추가
  - 주문 상태 관리 및 통계 분석 기능

- **feat: Add Supabase integration for automatic data collection** (`3052e4f`)
  - Supabase 연동으로 자동 데이터 수집 구현
  - submissions 및 order_items 테이블 스키마 적용

### 2025-09-26
- **update: Replace bank account info with contact message in email templates** (`32024c5`)
  - 이메일 템플릿에서 계좌 정보를 연락처 안내 메시지로 변경

### 2025-09-25
- **fix: Add 베스트 to affiliations in Index.jsx** (`03df055`)
  - 소속 드롭다운에 '베스트' 옵션 추가

- **Update CheckboxGridPage.jsx** (`e89080f`)
  - 체크박스 그리드 페이지 업데이트

---

## 주요 기능

### 현재 구현된 기능
- ✅ 3단계 위저드 폼 (제품 선택 → 신청자 정보 → 확인)
- ✅ A업체/B업체 제품 선택 (지역별, 유형별)
- ✅ 최소 주문 수량 검증 (5개 이상)
- ✅ 신청자 정보 입력 (이름, 소속, 직급, 전화번호, 이메일)
- ✅ 순차적 필드 검증 (Progressive form validation)
- ✅ 이메일 발송 (관리자 + 신청자)
- ✅ Supabase 데이터 저장 (선택적)
- ✅ 관리자 대시보드 (월별 집계, 상태 관리)
- ✅ 반응형 디자인 (모바일/데스크탑)

### 제품 설정
- **A업체**: [보장분석] 일반 - 80,000원
- **B업체**: 7가지 상품 (50,000원 ~ 90,000원)
  - 보장분석 일반/간편/우수
  - 여성100% 일반/간편
  - 실버 일반/간편
- **지역**: 8개 지역 (서울/인천/경기, 대전/충청, 광주/전남, 전북, 대구/경북, 부산/울산/경남, 강원, 제주)

---

## 환경 설정

### 필수 환경 변수
```bash
# Backend (Nodemailer)
SENDER_EMAIL=your-gmail@gmail.com
SENDER_APP_PASSWORD=your-app-password
RECIPIENT_EMAIL=admin@company.com

# Backend (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Frontend (Supabase)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Frontend (API)
VITE_API_BASE_URL=http://localhost:3001
```

---

## 개발 서버 실행

```bash
# Frontend (Port 8080)
npm run dev

# Backend (Port 3001)
npm run start:server
```

---

## 배포

**현재 배포 환경**: Vercel
**Production URL**: https://db-request-ext.vercel.app

배포 시 환경 변수를 Vercel 대시보드에 설정 필요.

---

## 참고 문서
- `CLAUDE.md` - Claude Code 작업 가이드
- `README.md` - 프로젝트 설명서
- `order.md` - 초기 요구사항 명세
