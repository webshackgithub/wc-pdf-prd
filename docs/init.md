# PRD: Client-side PDF Splitter Service

## 1. 개요 (Overview)
* **프로젝트명:** PDF Splitter (가칭)
* **목적:** 사용자가 업로드한 PDF 파일을 별도의 서버 전송 없이 브라우저 내에서 페이지 단위로 분할하여 다운로드할 수 있는 웹 서비스 제공.
* **핵심 가치:**
    * **보안성:** 파일이 서버로 전송되지 않고 로컬에서 처리되어 데이터 유출 걱정 없음.
    * **속도:** 네트워크 대기 시간 없이 즉시 분할 처리.
    * **편의성:** 페이지 이동 없이(URL 유지) 하나의 화면에서 모든 작업 완료.

## 2. 타겟 사용자 (Target Audience)
* 대량의 문서를 스캔하여 페이지별로 분류해야 하는 사무직 종사자.
* 하나의 PDF로 묶인 과제나 문서를 개별 파일로 나누고 싶은 학생 및 연구자.
* 빠르고 간편하며 무료인 PDF 도구를 찾는 일반 웹 사용자.

## 3. 사용자 스토리 (User Stories)
* 사용자는 별도의 회원가입이나 로그인 절차 없이 서비스를 바로 이용하고 싶다.
* 사용자는 PDF 파일을 드래그 앤 드롭으로 쉽게 업로드하고 싶다.
* 사용자는 분할된 파일이 수십 장일 경우, 하나씩 받기보다 ZIP 파일로 한 번에 받고 싶다.
* 사용자는 작업이 끝난 후 페이지를 새로고침 하지 않고 바로 다른 파일을 작업하고 싶다.

## 4. 기능 명세 (Functional Requirements)

### 4.1. 파일 업로드 (Upload Phase)
* **Drag & Drop 영역:** 파일을 끌어다 놓거나 클릭하여 파일 탐색기를 열 수 있어야 함.
* **유효성 검사:**
    * 파일 형식: `.pdf` 확장자만 허용.
    * 파일 크기 제한: 브라우저 메모리 부하 방지를 위해 (예: 최대 100MB) 제한 설정 및 알림.
    * 다중 파일 불가: 한 번에 하나의 PDF만 처리 (MVP 기준).

### 4.2. PDF 처리 (Processing Phase)
* **페이지 분할:** `pdf-lib`을 사용하여 원본 PDF의 총 페이지 수를 인식하고, 1페이지씩 별도의 PDF 객체로 분리.
* **압축 (Archiving):** `jszip`을 사용하여 분리된 PDF 파일들을 하나의 ZIP 파일로 패키징.
* **파일명 규칙:**
    * 개별 파일: `[원본파일명]_page_01.pdf`, `[원본파일명]_page_02.pdf` ...
    * ZIP 파일: `[원본파일명]_split.zip`

### 4.3. 결과 및 다운로드 (Result Phase)
* **다운로드 버튼:** 생성된 ZIP 파일을 다운로드할 수 있는 명확한 버튼 제공.
* **초기화 버튼:** "다른 파일 작업하기" 버튼을 통해 즉시 업로드 화면으로 복귀 (상태 초기화).

## 5. 기술 사양 (Technical Specifications)

### 5.1. Tech Stack
| 구분 | 기술 / 라이브러리 | 비고 |
| :--- | :--- | :--- |
| **Framework** | Next.js 14+ (App Router) | React 기반 웹 프레임워크 |
| **Language** | TypeScript | 안정적인 타입 관리 |
| **Styling** | Tailwind CSS | 유틸리티 퍼스트 CSS |
| **UI Component** | Shadcn UI | Radix UI 기반의 재사용 가능한 컴포넌트 (Card, Button, Progress 등) |
| **PDF Logic** | `pdf-lib` | 클라이언트 사이드 PDF 조작 |
| **Zip Logic** | `jszip` | 파일 압축 처리 |
| **File Handling** | `react-dropzone`, `file-saver` | 업로드 UI 및 파일 저장 트리거 |

### 5.2. 아키텍처 (Architecture)
* **Client-side Only:** 별도의 Backend API 서버를 구축하지 않음.
* **Single Page Logic:**
    * URL 변경 없음 (`/` 루트 경로 유지).
    * React `useState`를 활용한 조건부 렌더링 (`Upload` -> `Processing` -> `Success`).

## 6. UI/UX 디자인 가이드

### 6.1. 레이아웃
* **중앙 집중형 카드 레이아웃:** 화면 중앙에 Shadcn `Card` 컴포넌트를 배치하여 시선 집중.
* **Clean & Minimalist:** 불필요한 장식을 배제하고 기능에 집중 (사용자 선호 스타일 반영).
* **Dark/Light Mode:** 시스템 설정 또는 토글 버튼을 통해 테마 지원.

### 6.2. 화면 상태 흐름 (State Flow)
1.  **Initial State:**
    * 큰 점선 테두리의 박스 (Dropzone).
    * 문구: "PDF 파일을 이곳에 드롭하거나 클릭하여 업로드하세요."
2.  **Processing State:**
    * 업로드 즉시 로딩 인디케이터 표시 (Shadcn `Progress` 바 또는 Spinner).
    * 문구: "파일을 분리하고 있습니다... (3/10 페이지)"
3.  **Success State:**
    * 체크 아이콘 또는 성공 메시지.
    * 주요 정보: "총 10개의 파일로 분리되었습니다."
    * 액션 버튼 1: `ZIP 파일 다운로드` (Primary color, 강조).
    * 액션 버튼 2: `처음으로` (Ghost/Outline style).

