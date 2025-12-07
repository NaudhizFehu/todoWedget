const { app, BrowserWindow, ipcMain, globalShortcut, nativeImage } = require('electron');
const path = require('path');
const { getLogger } = require('./logger');
const {
  initDatabase,
  testConnection,
  reconnectDatabase,
  getDbConfig,
  isConnected
} = require('./database');
const { setMainWindow, minimizeWindow, closeWindow, toggleWindow } = require('./window');
const { createTray } = require('./tray');
const { enableAutoStart, disableAutoStart, isAutoStartEnabled } = require('./autoStart');
const {
  getDailyTodos,
  addDailyTodo,
  updateDailyTodo,
  deleteDailyTodo,
  getMidTermTodos,
  addMidTermTodo,
  updateMidTermTodo,
  deleteMidTermTodo,
} = require('./dbOperations');

const logger = getLogger();
let mainWindow = null;

// 아이콘 경로를 가져오는 함수
function getIconPath() {
  const fs = require('fs');
  if (app.isPackaged) {
    // Production mode icon path
    const iconPath = path.join(process.resourcesPath, 'assets', 'TodoWidgetIcon.ico');

    logger.info('=== 아이콘 경로 디버깅 ===');
    logger.info('process.resourcesPath:', process.resourcesPath);
    logger.info('아이콘 경로:', iconPath);
    logger.info('파일 존재:', fs.existsSync(iconPath));

    const assetsDir = path.join(process.resourcesPath, 'assets');
    if (fs.existsSync(assetsDir)) {
      logger.info('Assets 폴더 내용:', fs.readdirSync(assetsDir));
    } else {
      logger.error('Assets 폴더 없음:', assetsDir);
    }
    logger.info('=======================');

    return iconPath;
  } else {
    const devIconPath = path.join(__dirname, '../../assets/TodoWidgetIcon.ico');
    const devIconPngPath = path.join(__dirname, '../../assets/TodoWidgetIcon.png');
    return fs.existsSync(devIconPath) ? devIconPath : devIconPngPath;
  }
}

function createWindow() {
  // 개발 모드 감지: app.isPackaged가 false이면 개발 모드
  const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';
  
  // preload 경로를 절대 경로로 설정
  const preloadPath = path.resolve(__dirname, '../preload/preload.js');

  // 아이콘 로드
  const iconPath = getIconPath();
  let icon = null;

  try {
    icon = nativeImage.createFromPath(iconPath);

    logger.info('아이콘 isEmpty:', icon.isEmpty());
    logger.info('아이콘 크기:', icon.getSize());

    if (icon.isEmpty()) {
      logger.error('아이콘 비어있음');
      icon = null;
    } else {
      logger.info('아이콘 로드 성공');
    }
  } catch (error) {
    logger.error('아이콘 로드 실패:', error);
    icon = null;
  }
  
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    show: true,
    backgroundColor: '#ffffff',
    icon: icon,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Windows taskbar settings
  if (process.platform === 'win32' && icon && !icon.isEmpty()) {
    try {
      mainWindow.setAppDetails({
        appId: 'com.todowidget.app',
        appIconPath: iconPath,
        appIconIndex: 0
      });
      logger.info('setAppDetails 성공');
    } catch (error) {
      logger.error('setAppDetails 실패:', error);
    }
  }
  
  // window.js에 메인 윈도우 설정
  setMainWindow(mainWindow);

  // 개발 모드에서는 React 개발 서버, 프로덕션에서는 빌드된 파일
  if (isDev) {
    // React 개발 서버가 준비될 때까지 약간 대기
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:11000').catch((err) => {
        logger.error('React 개발 서버 연결 실패:', err);
        // 재시도
        setTimeout(() => {
          mainWindow.loadURL('http://localhost:11000').catch((err2) => {
            logger.error('React 개발 서버 재연결 실패:', err2);
          });
        }, 2000);
      });
    }, 1000);

    // F12로 DevTools 토글
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' || input.code === 'F12') {
        mainWindow.webContents.toggleDevTools();
      }
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../build/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    setMainWindow(null);
  });
}

// IPC 핸들러 등록
function setupIpcHandlers() {
  // Daily Todos
  ipcMain.handle('get-daily-todos', async (event, date) => {
    // date가 없거나 빈 문자열이면 null로 전달
    const dateParam = date && date.trim() !== '' ? date : null;
    return await getDailyTodos(dateParam);
  });

  ipcMain.handle('add-daily-todo', async (event, todo) => {
    return await addDailyTodo(todo);
  });

  ipcMain.handle('update-daily-todo', async (event, id, updates) => {
    return await updateDailyTodo(id, updates);
  });

  ipcMain.handle('delete-daily-todo', async (event, id) => {
    return await deleteDailyTodo(id);
  });

  // Midterm Todos
  ipcMain.handle('get-midterm-todos', async () => {
    return await getMidTermTodos();
  });

  ipcMain.handle('add-midterm-todo', async (event, todo) => {
    return await addMidTermTodo(todo);
  });

  ipcMain.handle('update-midterm-todo', async (event, id, updates) => {
    return await updateMidTermTodo(id, updates);
  });

  ipcMain.handle('delete-midterm-todo', async (event, id) => {
    return await deleteMidTermTodo(id);
  });

  // Window controls
  ipcMain.on('minimize-window', () => {
    minimizeWindow();
  });

  ipcMain.on('close-window', () => {
    closeWindow();
  });

  // DB 설정
  ipcMain.handle('test-db-connection', async (event, config) => {
    return await testConnection(config);
  });

  ipcMain.handle('update-db-config', async (event, config) => {
    const result = await reconnectDatabase(config);
    if (result.success && mainWindow) {
      // 재연결 성공 시 모든 탭에 데이터 새로고침 알림
      mainWindow.webContents.send('db-reconnected');
    }
    return result;
  });

  ipcMain.handle('get-db-config', async () => {
    return getDbConfig();
  });

  ipcMain.handle('check-db-connection', async () => {
    const connected = await isConnected();
    return { connected };
  });

  // 자동 시작 설정
  ipcMain.handle('is-auto-start-enabled', async () => {
    return await isAutoStartEnabled();
  });

  ipcMain.handle('enable-auto-start', async () => {
    return await enableAutoStart();
  });

  ipcMain.handle('disable-auto-start', async () => {
    return await disableAutoStart();
  });

  // Log folder opener
  ipcMain.handle('open-log-folder', () => {
    // const logger = getLogger();
    logger.openLogFolder();
  });
}

// 전역 단축키 등록
function registerGlobalShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+T', () => {
    toggleWindow();
  });
}

// Single instance lock - 중복 실행 방지
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // 이미 실행 중이면 종료
  logger.info('Another instance is already running. Quitting...');
  app.quit();
} else {
  // 두 번째 인스턴스 실행 시도 시
  app.on('second-instance', () => {
    logger.info('Second instance detected. Focusing existing window...');
    // 기존 윈도우를 보여주고 포커스
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(async () => {
  logger.info('앱 시작');
  logger.info('로그 파일 경로:', logger.getLogPath());

  // Windows 작업표시줄 아이콘을 위한 AppUserModelId 설정 (필수)
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.todowidget.app');
  }

  // 앱 아이콘 설정 (개발 모드에서만)
  if (!app.isPackaged) {
    try {
      const iconPath = getIconPath();
      const icon = nativeImage.createFromPath(iconPath);
      if (!icon.isEmpty()) {
        app.setIcon(icon);
        logger.info('App icon set successfully');
      }
    } catch (error) {
      logger.error('App icon set failed:', error);
    }
  }

  // DB 초기화 실패해도 앱은 시작
  try {
    const result = await initDatabase();
    if (!result.success) {
      logger.warn('DB connection failed, app continues to run');
    }
  } catch (error) {
    logger.error('Unexpected error during DB initialization:', error);
  }
  
  // IPC 핸들러 설정
  setupIpcHandlers();
  
  // 트레이 생성
  createTray();
  
  // 전역 단축키 등록
  registerGlobalShortcuts();
  
  // 자동 시작 설정 (설치 시 자동으로 활성화)
  try {
    const autoStartEnabled = await isAutoStartEnabled();
    if (!autoStartEnabled) {
      await enableAutoStart();
    }
  } catch (error) {
    logger.error('Auto-start setup failed:', error);
  }
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

