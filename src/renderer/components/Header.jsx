import React, { useEffect, useRef } from 'react';

function Header() {
  const headerRef = useRef(null);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const handleMouseDown = (e) => {
      isDragging.current = true;
      startPos.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      
      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;
      
      if (window.electronAPI) {
        // Electron API를 통해 창 이동
        // 실제 구현은 main 프로세스에서 처리
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    header.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      header.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  // ✅ 로그 폴더 열기 추가
  const handleOpenLogFolder = () => {
    window.electronAPI.openLogFolder();
  };

  return (
    <div
      ref={headerRef}
      className="flex items-center justify-between px-4 py-2 bg-gray-800 cursor-move select-none"
      style={{ WebkitAppRegion: 'drag' }}
    >
      <div className="text-sm font-semibold text-gray-300">Todo Widget</div>
      <div className="flex gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
      <button
          onClick={handleOpenLogFolder}
          className="px-2 py-1 hover:bg-blue-700 rounded no-drag"
          title="로그 폴더 열기"
        >
          📋
        </button>
        <button
          onClick={handleMinimize}
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded"
        >
          −
        </button>
        <button
          onClick={handleClose}
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-600 rounded"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default Header;






