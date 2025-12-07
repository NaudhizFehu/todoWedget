import React, { useState, useEffect } from 'react';

function DbSettings({ onClose }) {
  const [config, setConfig] = useState({
    host: 'localhost',
    port: '5433',
    database: 'todo_widget',
    user: 'todo_widget',
    password: 'todo_widget',
  });
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    if (window.electronAPI) {
      try {
        const currentConfig = await window.electronAPI.getDbConfig();
        if (currentConfig) {
          setConfig({
            host: currentConfig.host || 'localhost',
            port: String(currentConfig.port || '5433'),
            database: currentConfig.database || 'todo_widget',
            user: currentConfig.user || 'todo_widget',
            password: currentConfig.password || 'todo_widget',
          });
        }
      } catch (error) {
        console.error('DB 설정 로드 실패:', error);
      }
    }
  };

  const handleTestConnection = async () => {
    if (!window.electronAPI) {
      alert('Electron API를 사용할 수 없습니다.');
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const testConfig = {
        host: config.host,
        port: parseInt(config.port),
        database: config.database,
        user: config.user,
        password: config.password,
      };

      const result = await window.electronAPI.testDbConnection(testConfig);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || '연결 테스트 실패',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndReconnect = async () => {
    if (!window.electronAPI) {
      alert('Electron API를 사용할 수 없습니다.');
      return;
    }

    setIsSaving(true);
    setTestResult(null);

    try {
      const dbConfig = {
        host: config.host,
        port: parseInt(config.port),
        database: config.database,
        user: config.user,
        password: config.password,
      };

      const result = await window.electronAPI.updateDbConfig(dbConfig);
      setTestResult(result);

      if (result.success) {
        alert('DB 설정이 저장되고 재연결되었습니다.');
        if (onClose) {
          onClose();
        }
      } else {
        alert(`DB 재연결 실패: ${result.message}`);
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || 'DB 재연결 실패',
      });
      alert(`DB 재연결 실패: ${error.message || error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
    setTestResult(null);
  };

  return (
    <div className="p-4 bg-gray-800 rounded border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">DB 연결 설정</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl font-bold"
          >
            ×
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">호스트</label>
          <input
            type="text"
            value={config.host}
            onChange={(e) => handleChange('host', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            placeholder="localhost"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">포트</label>
          <input
            type="text"
            value={config.port}
            onChange={(e) => handleChange('port', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            placeholder="5433"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">데이터베이스</label>
          <input
            type="text"
            value={config.database}
            onChange={(e) => handleChange('database', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            placeholder="todo_widget"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">사용자</label>
          <input
            type="text"
            value={config.user}
            onChange={(e) => handleChange('user', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            placeholder="todo_widget"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">비밀번호</label>
          <input
            type="password"
            value={config.password}
            onChange={(e) => handleChange('password', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            placeholder="todo_widget"
          />
        </div>

        {testResult && (
          <div
            className={`p-2 rounded text-sm ${
              testResult.success
                ? 'bg-green-900 text-green-200'
                : 'bg-red-900 text-red-200'
            }`}
          >
            {testResult.success ? '✓ ' : '✗ '}
            {testResult.message}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleTestConnection}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '테스트 중...' : '연결 테스트'}
          </button>
          <button
            onClick={handleSaveAndReconnect}
            disabled={isSaving || isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '저장 중...' : '저장 및 재연결'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DbSettings;






