const { Pool } = require('pg');
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let pool = null;
let currentConfig = null;

function getConfigFilePath() {
  try {
    if (app && app.isReady && app.isReady()) {
      const userDataPath = app.getPath('userData');
      return path.join(userDataPath, 'db-config.json');
    }
  } catch (error) {
    console.error('app.getPath 실패:', error);
  }
  // app이 준비되지 않은 경우 프로젝트 루트 사용
  return path.join(__dirname, '../../db-config.json');
}

function loadDbConfig() {
  try {
    const configPath = getConfigFilePath();
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    }
  } catch (error) {
    console.error('설정 파일 로드 실패:', error);
  }
  return null;
}

function saveDbConfig(config) {
  try {
    const configPath = getConfigFilePath();
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    currentConfig = config;
    return true;
  } catch (error) {
    console.error('설정 파일 저장 실패:', error);
    return false;
  }
}

function getDbConfig() {
  if (currentConfig) {
    return currentConfig;
  }
  
  // 설정 파일에서 로드
  const savedConfig = loadDbConfig();
  if (savedConfig) {
    currentConfig = savedConfig;
    return savedConfig;
  }
  
  // .env 또는 기본값 사용
  const envConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    database: process.env.DB_NAME || 'todo_widget',
    user: process.env.DB_USER || 'todo_widget',
    password: process.env.DB_PASSWORD || 'todo_widget',
  };
  
  currentConfig = envConfig;
  return envConfig;
}

function initPool(config = null) {
  const dbConfig = config || getDbConfig();
  
  // config가 제공되면 무조건 새 pool 생성 (재연결 시)
  if (config && pool) {
    // 기존 pool이 있으면 종료 (재연결 시)
    pool.end().catch(() => {});
    pool = null;
  }
  
  if (!pool) {
    pool = new Pool({
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
}

async function closePool() {
  if (pool) {
    try {
      await pool.end();
      pool = null;
      console.log('DB 연결 풀 종료 완료');
    } catch (error) {
      console.error('DB 연결 풀 종료 실패:', error);
      pool = null;
    }
  }
}

async function testConnection(config) {
  const testPool = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    max: 1,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await testPool.connect();
    await client.query('SELECT 1');
    client.release();
    await testPool.end();
    return { success: true, message: '연결 성공' };
  } catch (error) {
    try {
      await testPool.end();
    } catch (e) {
      // 무시
    }
    return { success: false, message: error.message || '연결 실패' };
  }
}

async function reconnectDatabase(config) {
  try {
    // 기존 연결 종료
    await closePool();
    pool = null; // 명시적으로 null 설정
    
    // 설정 저장
    saveDbConfig(config);
    currentConfig = config;
    
    // initPool을 호출하여 새 설정으로 pool 생성
    initPool(config);
    
    // 연결 테스트 및 테이블 생성
    const client = await pool.connect();
    console.log('PostgreSQL 재연결 성공');
    
    await createTables(client);
    
    client.release();
    return { success: true, message: '재연결 성공' };
  } catch (error) {
    console.error('DB 재연결 실패:', error);
    pool = null;
    return { success: false, message: error.message || '재연결 실패' };
  }
}

async function initDatabase() {
  // 설정 파일에서 로드 시도
  const savedConfig = loadDbConfig();
  if (savedConfig) {
    currentConfig = savedConfig;
  }

  try {
    const pool = initPool();
    // 데이터베이스 연결 테스트
    const client = await pool.connect();
    console.log('PostgreSQL 연결 성공');

    // 테이블 생성
    await createTables(client);

    client.release();
    return { success: true };
  } catch (error) {
    console.error('데이터베이스 초기화 실패:', error);
    pool = null; // pool 초기화
    return { success: false, error: error.message };
  }
}

async function createTables(client) {
  // daily_todos 테이블
  await client.query(`
    CREATE TABLE IF NOT EXISTS daily_todos (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      description TEXT,
      completed BOOLEAN DEFAULT FALSE,
      priority INTEGER DEFAULT 0,
      todo_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // description 필드가 없는 경우 추가 (마이그레이션)
  try {
    await client.query(`
      ALTER TABLE daily_todos 
      ADD COLUMN IF NOT EXISTS description TEXT
    `);
  } catch (error) {
    // 컬럼이 이미 존재하는 경우 무시
    if (!error.message.includes('already exists')) {
      console.log('description 컬럼 마이그레이션:', error.message);
    }
  }

  // status 필드가 없는 경우 추가 (마이그레이션)
  try {
    await client.query(`
      ALTER TABLE daily_todos 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'
    `);
    
    // 기존 데이터 마이그레이션: completed 필드를 기반으로 status 설정
    await client.query(`
      UPDATE daily_todos 
      SET status = CASE 
        WHEN completed = true THEN 'completed'
        ELSE 'pending'
      END
      WHERE status IS NULL OR status = 'pending'
    `);
  } catch (error) {
    // 컬럼이 이미 존재하는 경우 무시
    if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
      console.log('status 컬럼 마이그레이션:', error.message);
    }
  }

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_daily_todos_date ON daily_todos(todo_date)
  `);

  // midterm_todos 테이블
  await client.query(`
    CREATE TABLE IF NOT EXISTS midterm_todos (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      content TEXT,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      progress INTEGER DEFAULT 0,
      status VARCHAR(20) DEFAULT 'pending',
      priority INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_midterm_todos_dates ON midterm_todos(start_date, end_date)
  `);

  // 기간제할일 status 필드 마이그레이션 (cancelled를 on_hold로 변경)
  try {
    await client.query(`
      UPDATE midterm_todos 
      SET status = 'on_hold'
      WHERE status = 'cancelled'
    `);
  } catch (error) {
    // 에러 무시 (이미 처리되었거나 필드가 없는 경우)
    console.log('기간제할일 status 마이그레이션:', error.message);
  }

  console.log('테이블 생성 완료');
}

function getPool() {
  if (!pool) {
    return null;
  }
  return pool;
}

async function isConnected() {
  if (!pool) return false;
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  initDatabase,
  getPool,
  closePool,
  reconnectDatabase,
  testConnection,
  getDbConfig,
  saveDbConfig,
  isConnected,
};

