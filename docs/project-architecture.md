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
- **3D Graphics**: `@splinetool/react-spline` (Interactive 3D Robot)
- **Icons**: Lucide React
- **Core Libraries**:
    - `pdf-lib`: PDF 문서 로드 및 페이지 분할 조작
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
│       ├── ProcessingView.tsx  # [PROCESSING] 처리 진행 화면
│       └── SuccessView.tsx     # [COMPLETED] 완료, 페이지 선택 및 다운로드 화면
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
    1. `IDLE`: 초기 상태. 전체 화면 3D 로봇 배경이 표시되며, 로봇 머리 부분(Head Dropzone)을 통해 파일을 업로드합니다.
        - **Drag & Drop**: 화면 전체가 아닌 **로봇의 머리 영역**에만 드롭존이 활성화됩니다.
    2. `PREVIEW`: (현재 사용 안 함 - Direct Processing으로 전환)
    3. `PROCESSING`: 파일 변환 및 압축 연산 수행 중. (3D 배경 위에 오버레이)
    4. `COMPLETED`: 변환 완료, 다운로드 버튼 활성화. (3D 배경 위에 오버레이)

### 4.3 Logic Flow
1. **User Action**: `IDLE` 상태에서 로봇의 머리 부분에 PDF 파일을 드래그 & 드롭.
2. **Validation**: 파일 타입(.pdf) 및 크기(100MB) 검증.
3. **State Transition**: `IDLE` -> `PROCESSING`.
4. **Core Processing** (`pdf-processing.ts`):
    - `splitPdf()`: `pdf-lib`으로 문서를 로드하고 페이지별로 분할하여 Blob 배열 생성.
    - `createZip()`: `jszip`으로 분할된 Blob들을 하나의 ZIP 파일로 패키징.
5. **Completion**: 결과 ZIP Blob을 상태에 저장하고 `COMPLETED` 상태로 전환.
6. **Selection & Download**:
    - `SuccessView`에서 사용자가 다운로드할 페이지를 개별 선택 가능.
    - "전체 다운로드" 또는 "선택 다운로드" 버튼을 통해 ZIP 파일 다운로드.

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

## 6. AI 에이전트 행동 수칙
1. **사용자 언어**: 항상 한국어로 소통합니다.
2. **코드 변경**: 기존 코드 스타일을 존중하며, 불필요하게 전체 파일을 다시 쓰지 않고 변경된 부분만 명확히 제시합니다.
3. **제안**: 새로운 라이브러리 추가가 필요할 경우, 그 이유와 크기(번들 사이즈 영향)를 먼저 설명합니다.
