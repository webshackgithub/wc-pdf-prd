# Project Architecture & Cursor Rules

이 문서는 `codefactory-pdf` 프로젝트의 아키텍처, 기술 스택, 코딩 컨벤션을 정의합니다. AI 어시스턴트(Cursor 등)와 개발자는 이 규칙을 준수해야 합니다.

## 1. 프로젝트 개요 (Overview)
- **Type**: Client-side Single Page Application (SPA)
- **Goal**: 브라우저 내에서 서버 전송 없이 PDF를 분할하거나 병합하는 서비스.
- **Privacy First**: 모든 파일 처리는 클라이언트(브라우저) 메모리 상에서 이루어지며, 백엔드 API 서버는 존재하지 않습니다.

## 2. 기술 스택 (Tech Stack)
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn UI (Radix UI 기반)
    - Toast Notification: `sonner`
- **3D Graphics**: `@splinetool/react-spline` (Interactive 3D Robot)
- **Icons**: Lucide React
- **Core Libraries**:
    - `pdf-lib`: PDF 문서 로드, 페이지 분할, 병합 조작
    - `jszip`: 분할된 파일들의 압축 처리
    - `react-dropzone`: 파일 업로드 인터랙션
    - `react-pdf`: PDF 페이지 미리보기 (썸네일)
    - `file-saver`: 클라이언트 측 파일 다운로드
    - `next-themes`: 다크 모드(Dark Mode) 테마 관리

## 3. 디렉토리 구조 (Directory Structure)
```
/
├── app/                  # Next.js App Router
│   ├── layout.tsx        # Global Layout (font, metadata, toaster)
│   ├── page.tsx          # Main Entry & State Management (Client Component)
│   └── globals.css       # Tailwind & Global Styles
├── components/
│   ├── ui/               # Shadcn UI reusable components (Button, Card, Sonner, etc.)
│   ├── blocks/           # Complex UI Blocks
│   │   └── interactive-3d-robot.tsx # 3D Robot Spline Component
│   ├── theme-provider.tsx # [Theme] Next-themes Provider Wrapper
│   └── views/            # Feature-specific Page Views
│       ├── UploadView.tsx      # [DEPRECATED] 초기 파일 업로드 뷰 (현재 3D Dropzone으로 대체됨)
│       ├── PreviewView.tsx     # [PREVIEW] 업로드 된 파일 미리보기 및 확인
│       ├── MergePrepView.tsx   # [MERGE_PREP] 병합 전 파일 목록 편집 뷰 (순서 변경, 삭제)
│       ├── ProcessingView.tsx  # [PROCESSING] 처리 진행 화면
│       └── SuccessView.tsx     # [COMPLETED] 완료, 페이지 선택 및 다운로드 화면
├── lib/
│   ├── utils.ts          # Shadcn cn() 유틸리티
│   └── pdf-processing.ts # PDF 처리 로직 (분 할, 병합, 압축)
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
    1. `IDLE`: 초기 상태. 분할/병합 모드 선택 가능. 3D 로봇 배경.
        - **Drag & Drop**: 로봇 머리 영역(Head Dropzone)을 통해 파일 업로드.
    2. `MERGE_PREP`: (병합 모드 전용) 업로드된 파일들의 목록을 확인하고 순서를 조정하는 상태.
    3. `PROCESSING`: 파일 변환, 병합, 압축 연산 수행 중.
    4. `COMPLETED`: 작업 완료. 결과물 다운로드 가능.

### 4.3 Logic Flow

#### A. PDF 분할 (Split Mode)
1. **User Action**: `IDLE` 상태(분할 모드)에서 PDF 파일 1개 드롭.
2. **Core Processing**: `splitPdf()` 실행 (페이지별 Blob 생성).
3. **Completion**: 결과 Blob들을 상태에 저장 후 `COMPLETED` 전환.
4. **Download**: "전체 ZIP 다운로드" 또는 개별/선택 페이지 다운로드.

#### B. PDF 병합 (Merge Mode)
1. **User Action**: `IDLE` 상태(병합 모드)에서 다수의 PDF 파일 드롭.
2. **Page Expansion**: 드롭된 각 파일은 즉시 모든 페이지 단위로 분할되어 목록에 추가됨 (예: 3페이지 파일 -> 3개의 항목).
3. **Preparation** (`MergePrepView`):
    - 사용자가 썸네일을 보며 페이지 순서를 변경하거나 불필요한 페이지 삭제.
    - 추가 파일 드롭 가능.
4. **Core Processing**: `mergePdfs()` 실행 (목록의 순서대로 하나의 PDF로 병합).
5. **Completion**: 병합된 PDF Blob 생성 후 `COMPLETED` 전환.
6. **Download**: "병합된 PDF 다운로드" 버튼 활성화.

## 5. 코딩 컨벤션 (Coding Conventions)

### 5.1 일반 규칙
- 모든 설명, 구현 계획, 작업(Task), 주석, 커밋 메시지와 **UI 텍스트**는 **한국어**로 작성합니다.
- 변수명, 함수명은 영어로 작성하되 의미가 명확해야 합니다.
- **Functional Components**: React 컴포넌트는 함수형으로 작성합니다.

### 5.2 컴포넌트 스타일
- **Full Page Layout**: Navbar와 Footer 없이 화면 전체(`100vh`)를 사용하는 레이아웃을 지향합니다.
- **Tailwind CSS**: 스타일링은 Tailwind 유틸리티 클래스를 우선 사용합니다.

### 5.3 비동기 처리
- PDF 처리와 같이 시간이 걸리는 작업은 UI가 멈추지 않도록 비동기(`async/await`)로 처리합니다.
- 다운로드 등 시간이 걸리는 버튼 작업 시에는 로딩 인디케이터(`Loader2` 등)를 노출하여 사용자에게 피드백을 줍니다.

## 6. AI 에이전트 행동 수칙
1. **사용자 언어**: 항상 한국어로 소통합니다.
2. **코드 변경**: 기존 코드 스타일을 존중하며, 불필요하게 전체 파일을 다시 쓰지 않고 변경된 부분만 명확히 제시합니다.
3. **제안**: 새로운 라이브러리 추가가 필요할 경우, 그 이유와 크기(번들 사이즈 영향)를 먼저 설명합니다.
