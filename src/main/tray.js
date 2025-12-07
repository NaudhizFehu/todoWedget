const { app, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { toggleWindow } = require('./window');

let tray = null;

function createTray() {
  // TodoWidgetIcon을 트레이 아이콘으로 사용
  let iconPath;
  const fs = require('fs');

  if (app.isPackaged) {
    // 프로덕션 모드: app 디렉토리의 assets 폴더에서 로드
    iconPath = path.join(process.resourcesPath, 'assets', 'TodoWidgetIcon.ico');
  } else {
    // 개발 모드에서도 .ico 파일 우선, 없으면 .png
    const devIconPath = path.join(__dirname, '../../assets/TodoWidgetIcon.ico');
    const devIconPngPath = path.join(__dirname, '../../assets/TodoWidgetIcon.png');
    iconPath = fs.existsSync(devIconPath) ? devIconPath : devIconPngPath;
  }
  
  // 아이콘 파일 로드
  try {
    const icon = nativeImage.createFromPath(iconPath);
    // 트레이 아이콘은 작은 크기로 리사이즈 (16x16 또는 32x32 권장)
    const resizedIcon = icon.resize({ width: 16, height: 16 });
    tray = new Tray(resizedIcon);
  } catch (error) {
    console.error('트레이 아이콘 로드 실패:', error);
    // 아이콘 파일이 없으면 빈 이미지로 생성
    const emptyIcon = nativeImage.createEmpty();
    tray = new Tray(emptyIcon);
  }
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '보이기/숨기기',
      click: () => {
        toggleWindow();
      },
    },
    {
      type: 'separator',
    },
    {
      label: '종료',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Todo Widget');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    toggleWindow();
  });
}

module.exports = {
  createTray,
};

