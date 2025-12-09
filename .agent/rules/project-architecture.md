---
trigger: always_on
---

# Project Architecture & Cursor Rules

이 문서는 `codefactory-pdf` 프로젝트의 아키텍처, 기술 스택, 코딩 컨벤션을 정의합니다. AI 어시스턴트(Cursor 등)와 개발자는 이 규칙을 준수해야 합니다.

## 1. 프로젝트 개요 (Overview)
- **Type**: Client-side Single Page Application (SPA)
- **Goal**: 브라우저 내에서 서버 전송 없이 PDF를 분할하고 ZIP으로 압축하여 다운로드하는 서비스.
- **Privacy First**: 모든 파일 처리는 클라이언트(브라우저) 메모리 상에서 이루어지며, 백엔드 API 서버는 존재하지 않습니다.

## 2. 기술 스택 (Tech Stack)
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn UI (Radix UI 기반)
    - Toast Notification: `sonner`
- **Icons**: Lucide React
- **Core Libraries**:
    - `pdf-lib`: PDF 문서 로드 및 페이지 분할 조작
    - `jszip`: 분할된 파일들의 압축 처리
    - `react-dropzone`: 파일 업로드 인터랙션
    - `react-pdf`: PDF 페이지 미리보기 (썸네일)
    - `file-saver`: 클라이언트 측 파일 다운로드

## 3. 디렉토리 구조 (Directory Structure)
```
/
├── app/                  # Next.js App Router
│   ├── layout.tsx        # Global Layout (font, metadata, toaster)
│   ├── page.tsx          # Main Entry & State Management (Client Component)
│   └── globals.css       # Tailwind & Global Styles
├── components/
│   ├── ui/               # Shadcn UI reusable components (Button, Card, Sonner, etc.)
│   └── views/            # Feature-specific Page Views
│       ├── UploadView.tsx      # [IDLE] 파일 업로드 (Dropzone, Validation)
│       ├── PreviewView.tsx     # [PREVIEW] 업로드 된 파일 미리보기 및 확인
│       ├── ProcessingView.tsx  # [PROCESSING] 처리 진행 화면
│       └── SuccessView.tsx     # [COMPLETED] 완료 및 다운로드 화면
├── lib/
│   ├── utils.ts          # Shadcn cn() 유틸리티
│   └── pdf-processing.ts # PDF 분할(splitPdf) 및 ZIP 압축(createZip) 로직
├── public/               # Static Assets
└── docs/                 # Project Documentation (PRD, Execution Plan, Architecture)
```

## 4. 아키텍처 원칙 (Architecture Principles)

### 4.1 Client-Side Only Processing
- **원칙**: 어떠한 경우에도 사용자 파일이 외부 서버로 전송되어서는 안 됩니다.
- **구현**: Next.js의 Server Action이나 API Route를 파일 처리에 사용하지 않습니다. 모든 로직은 브라우저의 Web Worker나 메인 스레드에서 `pdf-lib`을 통해 처리합니다.

### 4.2 State Machine Pattern
- `page.tsx`는 UI의 상태를 관리하는 컨트롤러 역할을 합니다.
- **States**:
    1. `IDLE`: 초기 상태, 파일 업로드 대기. (`File | null` 상태 관리 포함)
    2. `PREVIEW`: 파일 업로드 직후, 전체 페이지 목록(썸네일) 확인 및 분할 시작 대기.
    3. `PROCESSING`: 파일 변환 및 압축 연산 수행 중.
    4. `COMPLETED`: 변환 완료, 다운로드 버튼 활성화.
- 각 뷰(`views/*`)는 자신의 역할만 수행하고, 상태 변경은 부모 컴포넌트(`page.tsx`)로부터 전달받은 함수(Callback)를 통해 요청합니다.

### 4.3 Logic Flow
1. **User Action**: `UploadView`에서 파일 선택 (Drag & Drop or Click).
2. **Validation**: 파일 타입(.pdf) 및 크기(100MB) 검증.
3. **State Transition**: `IDLE` -> `PREVIEW`.
4. **Preview & Confirm**: 사용자가 페이지 목록을 확인하고 "분할 시작" 버튼 클릭.
5. **State Transition**: `PREVIEW` -> `PROCESSING`.
6. **Core Processing** (`pdf-processing.ts`):
    - `splitPdf()`: `pdf-lib`으로 문서를 로드하고 페이지별로 분할하여 Blob 배열 생성 (페이지 수 검증 포함).
    - `createZip()`: `jszip`으로 분할된 Blob들을 하나의 ZIP 파일로 패키징.
7. **Completion**: 결과 ZIP Blob을 상태에 저장하고 `COMPLETED` 상태로 전환.
8. **Download**: `SuccessView`에서 ZIP 다운로드 트리거.

## 5. 코딩 컨벤션 (Coding Conventions)

### 5.1 일반 규칙
- 모든 코멘트와 문서는 **한국어**로 작성합니다.
- 변수명, 함수명은 영어로 작성하되 의미가 명확해야 합니다 (예: `handleFileUpload` (O), `doIt` (X)).
- **Functional Components**: React 컴포넌트는 함수형으로 작성합니다.

### 5.2 컴포넌트 스타일
- **Tailwind CSS**: 스타일링은 Tailwind 유틸리티 클래스를 우선 사용합니다.
- 복잡한 조건부 스타일링은 `clsx` 또는 `cn()` 유틸리티를 사용합니다.

### 5.3 비동기 처리
- PDF 처리와 같이 시간이 걸리는 작업은 UI가 멈추지 않도록 비동기(`async/await`)로 처리합니다.
- 대용량 파일 처리 시 브라우저 프리징을 방지하기 위해 로직 최적화나 Web Worker 도입을 고려합니다 (Phase 3 이후).

## 6. AI 에이전트 행동 수칙
1. **사용자 언어**: 항상 한국어로 소통합니다.
2. **코드 변경**: 기존 코드 스타일을 존중하며, 불필요하게 전체 파일을 다시 쓰지 않고 변경된 부분만 명확히 제시합니다.
3. **제안**: 새로운 라이브러리 추가가 필요할 경우, 그 이유와 크기(번들 사이즈 영향)를 먼저 설명합니다.
