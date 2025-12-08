# Todo Widget

Windows 위젯 스타일 TodoList 애플리케이션

## 기능

- 일일 TodoList와 기간제 TodoList를 별도로 관리
- 항상 화면 위에 표시되는 위젯 스타일
- 로컬 PostgreSQL 데이터베이스 사용
- 드래그로 위치 이동 가능
- 시스템 트레이 지원
- 전역 단축키 (Ctrl+Shift+T)

## 기술 스택

- **Frontend**: Electron + React
- **Database**: PostgreSQL (로컬)
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Database Client**: node-postgres (pg)

## 설치 및 실행

### 1. PostgreSQL 설정

PostgreSQL이 설치되어 있어야 하며, 다음 정보로 데이터베이스를 생성하세요:

```sql
CREATE DATABASE todo_widget;
CREATE USER todo_widget WITH PASSWORD 'todo_widget';
GRANT ALL PRIVILEGES ON DATABASE todo_widget TO todo_widget;
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```
DB_HOST=localhost
DB_PORT=5433
DB_NAME=todo_widget
DB_USER=todo_widget
DB_PASSWORD=todo_widget
```

### 3. 의존성 설치

```bash
npm install
```

### 4. 개발 모드 실행

```bash
npm run dev
```

이 명령은 React 개발 서버와 Electron을 동시에 실행합니다.

### 5. 프로덕션 빌드

```bash
npm run build
npm run build:electron
```

## 프로젝트 구조

```
todo-widget/
├── src/
│   ├── main/              # Electron 메인 프로세스
│   │   ├── main.js        # 메인 진입점
│   │   ├── window.js      # 창 관리
│   │   ├── tray.js        # 시스템 트레이
│   │   ├── database.js    # PostgreSQL 연결
│   │   └── dbOperations.js # CRUD 작업
│   ├── renderer/          # React 렌더러 프로세스
│   │   ├── components/    # React 컴포넌트
│   │   ├── App.jsx
│   │   └── index.jsx
│   └── preload/           # IPC 브릿지
│       └── preload.js
├── public/
└── package.json
```

## 사용법

- **할일 추가**: 입력 필드에 내용을 입력하고 Enter 키를 누르거나 추가 버튼을 클릭
- **완료 처리**: 체크박스를 클릭하여 완료/미완료 상태 전환
- **삭제**: 각 할일 항목의 × 버튼 클릭
- **위젯 이동**: 헤더를 드래그하여 위치 이동
- **최소화**: 헤더의 − 버튼 클릭 또는 시스템 트레이 아이콘 클릭
- **숨기기/보이기**: Ctrl+Shift+T 단축키 또는 시스템 트레이 아이콘 클릭

## 주의사항

- PostgreSQL이 실행 중이어야 합니다
- 데이터베이스 연결 정보는 `.env` 파일에서 관리됩니다
- `.env` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다






