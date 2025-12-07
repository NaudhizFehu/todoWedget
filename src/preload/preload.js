const { contextBridge, ipcRenderer } = require('electron');

// IPC 통신을 위한 API 노출
try {
  contextBridge.exposeInMainWorld('electronAPI', {
    // Daily Todos
    getDailyTodos: (date) => ipcRenderer.invoke('get-daily-todos', date),
    addDailyTodo: (todo) => ipcRenderer.invoke('add-daily-todo', todo),
    updateDailyTodo: (id, todo) => ipcRenderer.invoke('update-daily-todo', id, todo),
    deleteDailyTodo: (id) => ipcRenderer.invoke('delete-daily-todo', id),
    
    // Midterm Todos
    getMidTermTodos: () => ipcRenderer.invoke('get-midterm-todos'),
    addMidTermTodo: (todo) => ipcRenderer.invoke('add-midterm-todo', todo),
    updateMidTermTodo: (id, todo) => ipcRenderer.invoke('update-midterm-todo', id, todo),
    deleteMidTermTodo: (id) => ipcRenderer.invoke('delete-midterm-todo', id),
    
    // Window controls
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    
    // DB 설정
    testDbConnection: (config) => ipcRenderer.invoke('test-db-connection', config),
    updateDbConfig: (config) => ipcRenderer.invoke('update-db-config', config),
    getDbConfig: () => ipcRenderer.invoke('get-db-config'),
    checkDbConnection: () => ipcRenderer.invoke('check-db-connection'),
    onDbReconnected: (callback) => {
      ipcRenderer.on('db-reconnected', callback);
      return () => ipcRenderer.removeListener('db-reconnected', callback);
    },

    // Log folder
    openLogFolder: () => ipcRenderer.invoke('open-log-folder'),

    // Auto start
    isAutoStartEnabled: () => ipcRenderer.invoke('is-auto-start-enabled'),
    enableAutoStart: () => ipcRenderer.invoke('enable-auto-start'),
    disableAutoStart: () => ipcRenderer.invoke('disable-auto-start'),
  });
  
  console.log('electronAPI가 성공적으로 로드되었습니다.');
} catch (error) {
  console.error('electronAPI 로드 실패:', error);
}

