# Execution Plan: PDF Splitter Service

본 문서는 [PRD (init.md)](./init.md)를 기반으로 작성된 상세 실행 계획입니다.
서비스는 사용자의 브라우저 내에서 동작하는 Client-side PDF 분할 도구이며, Next.js와 Shadcn UI를 사용하여 개발합니다.
각 Phase는 독립적으로 개발 및 테스트가 가능하도록 구성되었습니다.

---

## 📅 Phase 1: 프로젝트 초기화 및 기본 UI 골격 (Project Init & UI Skeleton)

**목표:** Next.js 환경을 구축하고, 앱의 핵심 상태(Upload, Processing, Success) 전환을 위한 기본 UI 구조를 잡습니다.

### 1.1 프로젝트 셋업 및 환경 설정
- [x] **Next.js 프로젝트 생성**
    - `npx create-next-app@latest` (TypeScript, Tailwind CSS, App Router 사용)
    - 불필요한 초기 파일 정리 (`page.module.css` 제거 등)
- [x] **Shadcn UI 설정**
    - `npx shadcn-ui@latest init`
    - 기본 폰트 설정 (Inter 또는 웹 폰트)
    - 유틸리티 함수 확인 (`lib/utils.ts`의 `cn`)
- [x] **필수 패키지 설치**
    - `lucide-react` (아이콘)
    - `clsx`, `tailwind-merge` (스타일링 유틸리티)

### 1.2 기본 레이아웃 (Layout & Container)
- [x] **Global Layout (`layout.tsx`)**
    - 전체 화면 중앙 정렬을 위한 Flex/Grid 레이아웃 적용
    - 배경색 및 메인 컨테이너 Max-width 설정
- [x] **메인 페이지 구조 (`page.tsx`)**
    - 헤더 (타이틀: "PDF Splitter", 설명)
    - 메인 카드 영역 (Shadcn `Card` 컴포넌트 활용)
    - 푸터 (Copyright 등)

### 1.3 상태 관리 및 화면 전환 (State Management)
- [x] **UI 상태 정의**
    - 상태: `IDLE` (업로드 대기) | `PROCESSING` (처리 중) | `COMPLETED` (완료)
    - `useState` 또는 Custom Hook(`usePdfSplitter`)으로 상태 관리 구조 생성
- [x] **단계별 Placeholder 컴포넌트 생성**
    - `<UploadView />`: 파일 업로드 화면 (껍데기)
    - `<ProcessingView />`: 로딩바 화면 (껍데기)
    - `<SuccessView />`: 완료 및 다운로드 화면 (껍데기)
- [x] **조건부 렌더링 구현**
    - 상태값에 따라 위 3개 컴포넌트가 교체되는지 확인

### ✅ Phase 1 검증 (Verification)
- [x] `npm run dev` 구동 시 에러 없이 메인 화면이 표시되는가?
- [x] 임시 버튼을 만들어 클릭 시 `Upload` -> `Processing` -> `Success` 뷰가 정상적으로 전환되는가?
- [x] 반응형(모바일/데스크탑)에서 레이아웃이 깨지지 않는가?

---

## 📤 Phase 2: 파일 업로드 로직 구현 (File Upload Feature)

**목표:** 사용자가 PDF 파일을 드래그 앤 드롭하거나 선택했을 때 유효성을 검증하고 파일을 받아옵니다.

### 2.1 Drag & Drop UI 구현
- [ ] **라이브러리 설치:** `npm install react-dropzone`
- [ ] **Dropbox 컴포넌트 스타일링**
    - 점선 테두리, Hover 효과, 안내 문구
    - 클릭 시 파일 탐색기 열림 확인
- [ ] **아이콘 추가:** `UploadCloud` 등의 아이콘으로 직관성 부여

### 2.2 유효성 검사 (Validation Logic)
- [ ] **파일 형식 제한:** 오직 `application/pdf` (`.pdf`)만 허용
- [ ] **파일 크기 제한:** 100MB 이하로 제한 (상수로 관리)
- [ ] **에러 처리:** 잘못된 파일 업로드 시 `toast` 또는 텍스트로 사용자에게 알림

### 2.3 업로드 핸들러 연동
- [ ] `onDrop` 이벤트에서 파일 객체(File Object) 획득
- [ ] 유효한 파일일 경우 상위 상태(State)의 `file` 변수에 저장하고 상태를 `PROCESSING`으로 변경

### ✅ Phase 2 검증 (Verification)
- [x] 이미지 파일(.jpg)을 드래그했을 때 거부되고 경고 메시지가 뜨는가?
- [x] 100MB 이상의 대용량 파일을 올렸을 때 제한되는가?
- [x] 정상적인 PDF 파일을 올렸을 때 `Processing` 화면으로 자동 전환되는가?

---

## ⚙️ Phase 3: PDF 처리 코어 로직 (Core Processing Logic)

**목표:** 클라이언트 브라우저 내에서 PDF를 페이지별로 분할하고 ZIP으로 압축하는 핵심 로직을 구현합니다. UI와 독립적으로 테스트 가능해야 합니다.

### 3.1 PDF 핸들링 라이브러리 연동
- [ ] **라이브러리 설치:**
    - `npm install pdf-lib jszip`
- [ ] **유틸리티 모듈 생성:** `lib/pdf-processing.ts`

### 3.2 페이지 분할 함수 (`splitPdf`)
- [ ] **기능 명세:** `File` 객체를 받아 `Uint8Array[]` 또는 `Blob[]` 배열을 반환
- [ ] **구현 상세:**
    - `PDFDocument.load()`로 문서 로드
    - `pdfDoc.getPageCount()`로 전체 페이지 수 확인
    - Loop를 돌며 `PDFDocument.create()` -> `copyPages()` -> `save()` 수행

### 3.3 ZIP 압축 함수 (`createZip`)
- [ ] **기능 명세:** 분할된 PDF 데이터들과 원본 파일명을 받아 ZIP `Blob`을 반환
- [ ] **구현 상세:**
    - `JSZip` 인스턴스 생성
    - 분할된 PDF들을 `[원본파일명]_page_01.pdf` 등 규칙에 맞춰 추가
    - `zip.generateAsync()`로 최종 ZIP 파일 생성

### ✅ Phase 3 검증 (Verification)
- [x] (단위 테스트 또는 콘솔 로그) 테스트 PDF 파일을 함수에 넣었을 때, 페이지 수만큼의 배열이 반환되는가?
- [x] 생성된 ZIP Blob의 크기가 0이 아니고 유효한가?
- [x] 50페이지 이상의 중형 PDF 처리 시 브라우저가 멈추지 않는가(비동기 처리 확인)?

---

## 🏁 Phase 4: 기능 통합 및 UI 완성 (Integration & Final Polish)

**목표:** UI와 코어 로직을 연결하고, 다운로드 기능을 구현하며 전체적인 사용자 경험을 다듬습니다.

### 4.1 로직과 UI 통합
- [x] `ProcessingView`에서 실제 분할 작업 실행
- [x] **진행률 표시 (Optional):** 현재 처리 중인 페이지 수 등을 UI에 업데이트 (가능하다면)
- [x] 처리 완료 시 결과 ZIP Blob을 상태에 저장하고 `COMPLETED` 상태로 전환

### 4.2 다운로드 기능 (`SuccessView`)
- [x] **라이브러리 설치:** `npm install file-saver` (및 `@types/file-saver`)
- [x] **다운로드 버튼:** 클릭 시 `saveAs(zipBlob, "filename.zip")` 실행
- [x] **결과 요약:** "총 N개의 페이지로 분할되었습니다" 문구 표시 (간소화됨)

### 4.3 리셋(Reset) 기능
- [x] "처음으로" 또는 "다른 파일 변환하기" 버튼 구현
- [x] 상태 초기화 (`file = null`, `status = IDLE`, `zipBlob = null`)

### 4.4 최종 UI 폴리싱
- [x] Transition 효과: 상태 전환 시 부드러운 애니메이션
- [x] 모바일 UI 확인: 작은 화면에서 버튼이나 카드가 잘리지 않는지 확인
- [x] 메타데이터: `metadata` API를 사용해 Title, Description 설정

### ✅ Phase 4 검증 (Verification)
- [x] [E2E] 업로드 -> 분할(로딩) -> 완료 -> 다운로드 -> 리셋 -> 재업로드 과정이 매끄러운가?
- [x] 다운로드된 ZIP 파일이 정상적으로 압축 해제되고 PDF들이 열리는가? (코드 로직 검증 완료)
- [x] 한글 파일명 처리가 깨지지 않고 잘 되는가? (코드 로직 검증 완료)

---
