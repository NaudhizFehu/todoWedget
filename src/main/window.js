const { BrowserWindow, screen } = require('electron');

let mainWindow = null;

function setMainWindow(window) {
  mainWindow = window;
  
  // 드래그 가능하도록 설정
  if (window) {
    window.setMovable(true);
  }
}

function getMainWindow() {
  return mainWindow;
}

function minimizeWindow() {
  if (mainWindow) {
    mainWindow.minimize();
  }
}

function closeWindow() {
  if (mainWindow) {
    mainWindow.hide(); // 완전히 닫지 않고 숨김
  }
}

function toggleWindow() {
  if (mainWindow) {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  }
}

module.exports = {
  setMainWindow,
  getMainWindow,
  minimizeWindow,
  closeWindow,
  toggleWindow,
};

