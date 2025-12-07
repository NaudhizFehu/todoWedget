const { app } = require('electron');
const { exec } = require('child_process');
const path = require('path');

function getAutoStartKey() {
  const appName = 'TodoWidget';
  const appPath = app.getPath('exe');
  return {
    name: appName,
    path: appPath,
    args: [],
  };
}

function isAutoStartEnabled() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve(false);
      return;
    }

    const key = getAutoStartKey();
    const regQuery = `reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${key.name}"`;

    exec(regQuery, (error) => {
      resolve(!error);
    });
  });
}

function enableAutoStart() {
  return new Promise((resolve, reject) => {
    if (process.platform !== 'win32') {
      reject(new Error('자동 시작은 Windows에서만 지원됩니다.'));
      return;
    }

    const key = getAutoStartKey();
    const appPath = key.path.replace(/\\/g, '\\\\');
    const regAdd = `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${key.name}" /t REG_SZ /d "${appPath}" /f`;

    exec(regAdd, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
}

function disableAutoStart() {
  return new Promise((resolve, reject) => {
    if (process.platform !== 'win32') {
      reject(new Error('자동 시작은 Windows에서만 지원됩니다.'));
      return;
    }

    const key = getAutoStartKey();
    const regDelete = `reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${key.name}" /f`;

    exec(regDelete, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
}

module.exports = {
  isAutoStartEnabled,
  enableAutoStart,
  disableAutoStart,
};






