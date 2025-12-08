import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DailyTodo from './components/DailyTodo';
import MidTermTodo from './components/MidTermTodo';
import DbSettings from './components/DbSettings';

function App() {
  const [activeTab, setActiveTab] = useState('daily');
  const [showDbSettings, setShowDbSettings] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState(false);

  const checkDbConnection = async () => {
    if (window.electronAPI && window.electronAPI.checkDbConnection) {
      try {
        const result = await window.electronAPI.checkDbConnection();
        setIsDbConnected(result.connected);
      } catch (error) {
        console.error('DB 연결 상태 확인 실패:', error);
        setIsDbConnected(false);
      }
    }
  };

  useEffect(() => {
    checkDbConnection();

    if (window.electronAPI && window.electronAPI.onDbReconnected) {
      const removeListener = window.electronAPI.onDbReconnected(() => {
        // DB 재연결 시 연결 상태 재확인 및 데이터 새로고침
        checkDbConnection();
        window.location.reload();
      });
      return () => {
        if (removeListener) removeListener();
      };
    }
  }, []);

  return (
    <div className="w-full h-full bg-gray-900 bg-opacity-90 text-white flex flex-col">
      <Header />
      <div className="flex border-b border-gray-700">
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            activeTab === 'daily'
              ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('daily')}
        >
          일일 할일
        </button>
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            activeTab === 'midterm'
              ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('midterm')}
        >
          기간제 할일
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            showDbSettings
              ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setShowDbSettings(!showDbSettings)}
          title="DB 설정"
        >
          ⚙️
        </button>
      </div>
      <div className="flex-1 overflow-y-auto relative">
        {showDbSettings ? (
          <div className="p-4">
            <DbSettings onClose={() => setShowDbSettings(false)} />
          </div>
        ) : (
          activeTab === 'daily' ? <DailyTodo isDbConnected={isDbConnected} /> : <MidTermTodo isDbConnected={isDbConnected} />
        )}
      </div>
    </div>
  );
}

export default App;

