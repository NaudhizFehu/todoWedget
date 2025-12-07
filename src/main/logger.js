const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class Logger {
  constructor() {
    // 로그 파일 경로 설정
    const userDataPath = app.getPath('userData');
    this.logDir = path.join(userDataPath, 'logs');
    
    // logs 디렉토리 생성
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    // 로그 파일명: app-2024-12-06.log
    const today = new Date().toISOString().split('T')[0];
    this.logFile = path.join(this.logDir, `app-${today}.log`);
    
    // 시작 로그
    this.info('=== 앱 시작 ===');
  }
  
  _write(level, ...args) {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    const logLine = `[${timestamp}] [${level}] ${message}\n`;
    
    try {
      fs.appendFileSync(this.logFile, logLine, 'utf8');
      
      // 개발 모드에서는 콘솔에도 출력
      if (!app.isPackaged) {
        console.log(`[${level}]`, ...args);
      }
    } catch (error) {
      console.error('로그 쓰기 실패:', error);
    }
  }
  
  info(...args) {
    this._write('INFO', ...args);
  }
  
  error(...args) {
    this._write('ERROR', ...args);
  }
  
  warn(...args) {
    this._write('WARN', ...args);
  }
  
  debug(...args) {
    this._write('DEBUG', ...args);
  }
  
  // 로그 파일 경로 반환
  getLogPath() {
    return this.logFile;
  }
  
  // 로그 폴더 열기
  openLogFolder() {
    const { shell } = require('electron');
    shell.openPath(this.logDir);
  }
}

// 싱글톤 인스턴스
let loggerInstance = null;

function getLogger() {
  if (!loggerInstance) {
    loggerInstance = new Logger();
  }
  return loggerInstance;
}

module.exports = { getLogger };