# Windows 위젯 스타일 TodoList 애플리케이션 개발

## 프로젝트 개요
Windows에서 위젯처럼 동작하는 TodoList 관리 프로그램을 개발합니다.
- 일일 TodoList와 기간제 TodoList를 별도로 관리
- 항상 화면 위에 표시되는 위젯 스타일
- 로컬 PostgreSQL 데이터베이스 사용

## 기술 스택
- **Frontend**: Electron + React
- **Database**: PostgreSQL (로컬)
- **State Management**: Zustand 또는 Recoil
- **Styling**: Tailwind CSS 또는 styled-components
- **Database Client**: node-postgres (pg)

## 프로젝트 구조
```
todo-widget/
├── src/
│   ├── main/
│   │   ├── main.js              # Electron 메인 프로세스
│   │   ├── window.js            # 창 관리 (위젯 설정)
│   │   ├── tray.js              # 시스템 트레이
│   │   └── database.js          # PostgreSQL 연결
│   ├── renderer/
│   │   ├── components/
│   │   │   ├── DailyTodo.jsx    # 일일 할일 컴포넌트
│   │   │   ├── MidTermTodo.jsx  # 기간제 할일 컴포넌트
│   │   │   ├── TodoItem.jsx     # 할일 항목 컴포넌트
│   │   │   └── Header.jsx       # 드래그 가능한 헤더
│   │   ├── hooks/
│   │   │   ├── useDailyTodos.js
│   │   │   └── useMidTermTodos.js
│   │   ├── store/
│   │   │   └── todoStore.js
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── preload/
│   │   └── preload.js           # IPC 브릿지
│   └── shared/
│       └── types.js
├── package.json
└── electron-builder.json
```

## 데이터베이스 스키마

### 데이터베이스 생성
```sql
CREATE DATABASE todo_widget;
```

### 테이블 구조

**daily_todos 테이블**
```sql
CREATE TABLE daily_todos (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 0,  -- 0: 낮음, 1: 보통, 2: 높음
    todo_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_todos_date ON daily_todos(todo_date);
```

**midterm_todos 테이블**
```sql
CREATE TABLE midterm_todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    progress INTEGER DEFAULT 0,  -- 0-100
    status VARCHAR(20) DEFAULT 'pending',  -- pending, in_progress, completed, cancelled
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_midterm_todos_dates ON midterm_todos(start_date, end_date);
```

## 주요 기능 요구사항

### 1. Electron 윈도우 설정
- 프레임 없는 창 (frameless)
- 항상 화면 위에 표시 (alwaysOnTop: true)
- 크기: 350px x 600px (리사이징 가능)
- 반투명 배경 지원
- 드래그로 위치 이동 가능한 헤더
- 시스템 트레이에 최소화 기능

### 2. 일일 TodoList 기능
- 오늘 날짜의 할일 목록 표시
- 할일 추가/수정/삭제
- 체크박스로 완료 처리
- 우선순위 설정 (낮음/보통/높음)
- 날짜 선택하여 과거/미래 할일 조회

### 3. 기간제 TodoList 기능
- 기간이 있는 할일 관리 (시작일~종료일)
- 진행률 표시 (0-100%)
- 상태 관리 (대기/진행중/완료/취소)
- D-day 표시
- 목록 정렬 (마감일순, 우선순위순)

### 4. UI/UX
- 탭 또는 토글로 일일/기간제 할일 전환
- 반응형 리스트 (스크롤 가능)
- 다크모드/라이트모드 지원
- 부드러운 애니메이션

### 5. 시스템 통합
- 시스템 트레이 아이콘
- 전역 단축키 (예: Ctrl+Shift+T로 위젯 토글)
- 우클릭 컨텍스트 메뉴
- 자동 시작 옵션

## 개발 단계별 지침

### Phase 1: 프로젝트 초기 설정
1. Electron + React 보일러플레이트 생성
2. PostgreSQL 연결 설정 및 테스트
3. 기본 윈도우 생성 (프레임리스, 항상위)

### Phase 2: 데이터베이스 레이어
1. PostgreSQL 연결 풀 구성
2. daily_todos, midterm_todos 테이블 생성
3. CRUD API 함수 작성 (IPC 통신)

### Phase 3: UI 컴포넌트
1. 드래그 가능한 헤더 컴포넌트
2. 일일 TodoList 컴포넌트
3. 기간제 TodoList 컴포넌트
4. TodoItem 컴포넌트

### Phase 4: 기능 구현
1. 할일 추가/수정/삭제
2. 완료 처리 및 진행률 업데이트
3. 날짜 필터링 및 정렬
4. 로컬 스토리지 설정 저장

### Phase 5: 시스템 통합
1. 시스템 트레이 구현
2. 전역 단축키 등록
3. 자동 시작 설정

## 주의사항
- PostgreSQL 연결 정보는 환경변수 또는 설정 파일로 관리
- IPC 통신 시 보안 고려 (contextIsolation: true)
- 데이터베이스 마이그레이션 스크립트 작성
- 에러 핸들링 및 로깅 구현

## PostgreSQL 연결 정보
- Host: localhost
- Port: 5433
- Database: todo_widget
- User: todo_widget
- Password: todo_widget

위 정보는 .env 파일로 관리하고 .gitignore에 추가해주세요.