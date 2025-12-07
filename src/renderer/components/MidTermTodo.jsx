import React, { useState, useEffect } from 'react';
import TodoItem from './TodoItem';

function MidTermTodo({ isDbConnected = false }) {
  const [todos, setTodos] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState('pending'); // 'pending', 'in_progress', 'on_hold', 'completed', 'all'
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    priority: 0,
  });

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    if (window.electronAPI) {
      try {
        const data = await window.electronAPI.getMidTermTodos();
        setTodos(data || []);
      } catch (error) {
        console.error('중기 할일 로드 실패:', error);
      }
    }
  };

  const handleAddTodo = async () => {
    if (!formData.title.trim()) return;

    if (window.electronAPI) {
      try {
        await window.electronAPI.addMidTermTodo({
          ...formData,
          progress: 0,
          status: 'pending',
        });
        setFormData({
          title: '',
          content: '',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          priority: 0,
        });
        setShowAddForm(false);
        loadTodos();
      } catch (error) {
        console.error('중기 할일 추가 실패:', error);
      }
    }
  };

  const handleUpdateProgress = async (id, progress) => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.updateMidTermTodo(id, { progress });
        loadTodos();
      } catch (error) {
        console.error('진행률 업데이트 실패:', error);
        alert(`진행률 업데이트에 실패했습니다: ${error.message || error}`);
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    if (!window.electronAPI) {
      console.error('electronAPI가 사용할 수 없습니다.');
      return;
    }

    try {
      await window.electronAPI.updateMidTermTodo(id, { status: newStatus });
      loadTodos();
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert(`상태 변경에 실패했습니다: ${error.message || error}`);
    }
  };

  // 필터링된 할일 목록
  const filteredTodos = todos.filter((todo) => {
    const status = todo.status || 'pending';
    if (filter === 'pending') return status === 'pending' || status === 'in_progress';
    if (filter === 'in_progress') return status === 'in_progress';
    if (filter === 'on_hold') return status === 'on_hold';
    if (filter === 'completed') return status === 'completed';
    return true; // 'all'
  });

  const handleDelete = async (id) => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.deleteMidTermTodo(id);
        loadTodos();
      } catch (error) {
        console.error('중기 할일 삭제 실패:', error);
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    // Date 객체인 경우 문자열로 변환
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    // 문자열인 경우 그대로 반환
    if (typeof date === 'string') {
      // YYYY-MM-DD 형식인지 확인
      if (date.match(/^\d{4}-\d{2}-\d{2}/)) {
        return date;
      }
      // 다른 형식이면 Date 객체로 변환 후 반환
      return new Date(date).toISOString().split('T')[0];
    }
    return String(date);
  };

  const calculateDday = (endDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let end;
    if (endDate instanceof Date) {
      end = new Date(endDate);
    } else if (typeof endDate === 'string') {
      end = new Date(endDate);
    } else {
      return 0;
    }
    end.setHours(0, 0, 0, 0);
    
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-4">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={!isDbConnected}
          title={!isDbConnected ? "DB 연결이 필요합니다" : ""}
          className={`w-full px-4 py-2 text-white rounded ${
            !isDbConnected
              ? 'bg-gray-600 cursor-not-allowed opacity-50'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {showAddForm ? '취소' : '+ 중기 할일 추가'}
        </button>
      </div>

      {/* 필터 버튼 */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1 text-xs rounded ${
            filter === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          미완료
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`px-3 py-1 text-xs rounded ${
            filter === 'in_progress'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          작업중
        </button>
        <button
          onClick={() => setFilter('on_hold')}
          className={`px-3 py-1 text-xs rounded ${
            filter === 'on_hold'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          보류
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1 text-xs rounded ${
            filter === 'completed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          완료
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-xs rounded ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          모두
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4 p-4 bg-gray-800 rounded border border-gray-700 space-y-3">
          <input
            type="text"
            placeholder="제목"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            disabled={!isDbConnected}
            className={`w-full px-3 py-2 rounded border focus:outline-none ${
              !isDbConnected
                ? 'bg-gray-600 text-gray-500 border-gray-500 cursor-not-allowed opacity-50'
                : 'bg-gray-700 text-white border-gray-600 focus:border-blue-500'
            }`}
          />
          <textarea
            placeholder="내용 (선택사항)"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            disabled={!isDbConnected}
            className={`w-full px-3 py-2 rounded border focus:outline-none ${
              !isDbConnected
                ? 'bg-gray-600 text-gray-500 border-gray-500 cursor-not-allowed opacity-50'
                : 'bg-gray-700 text-white border-gray-600 focus:border-blue-500'
            }`}
            rows="2"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              disabled={!isDbConnected}
              className={`px-3 py-2 rounded border focus:outline-none ${
                !isDbConnected
                  ? 'bg-gray-600 text-gray-500 border-gray-500 cursor-not-allowed opacity-50'
                  : 'bg-gray-700 text-white border-gray-600 focus:border-blue-500'
              }`}
            />
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              disabled={!isDbConnected}
              className={`px-3 py-2 rounded border focus:outline-none ${
                !isDbConnected
                  ? 'bg-gray-600 text-gray-500 border-gray-500 cursor-not-allowed opacity-50'
                  : 'bg-gray-700 text-white border-gray-600 focus:border-blue-500'
              }`}
            />
          </div>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            disabled={!isDbConnected}
            className={`w-full px-3 py-2 rounded border focus:outline-none ${
              !isDbConnected
                ? 'bg-gray-600 text-gray-500 border-gray-500 cursor-not-allowed opacity-50'
                : 'bg-gray-700 text-white border-gray-600 focus:border-blue-500'
            }`}
          >
            <option value="0">낮음</option>
            <option value="1">보통</option>
            <option value="2">높음</option>
          </select>
          <button
            onClick={handleAddTodo}
            disabled={!isDbConnected}
            title={!isDbConnected ? "DB 연결이 필요합니다" : ""}
            className={`w-full px-4 py-2 text-white rounded ${
              !isDbConnected
                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            추가
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {filteredTodos.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            {todos.length === 0
              ? '중기 할일이 없습니다'
              : filter === 'pending'
              ? '미완료 중기 할일이 없습니다'
              : filter === 'in_progress'
              ? '작업중인 중기 할일이 없습니다'
              : filter === 'on_hold'
              ? '보류된 중기 할일이 없습니다'
              : filter === 'completed'
              ? '완료된 중기 할일이 없습니다'
              : '중기 할일이 없습니다'}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTodos.map((todo) => {
              const dday = calculateDday(todo.end_date);
              const status = todo.status || 'pending';
              const isOnHold = status === 'on_hold';
              const isCompleted = status === 'completed';
              const isInProgress = status === 'in_progress';
              
              return (
                <div
                  key={todo.id}
                  className={`p-2 rounded border ${
                    isOnHold
                      ? 'bg-gray-700 border-yellow-600 hover:border-yellow-500'
                      : isCompleted
                      ? 'bg-gray-800 border-gray-600'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm ${
                            isCompleted
                              ? 'line-through text-gray-500'
                              : isOnHold
                              ? 'text-yellow-300'
                              : isInProgress
                              ? 'text-blue-300'
                              : 'text-white'
                          }`}
                        >
                          {todo.title}
                        </span>
                        {isOnHold && (
                          <span className="text-xs px-1.5 py-0.5 bg-yellow-600 text-yellow-100 rounded">
                            보류
                          </span>
                        )}
                        {isInProgress && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-600 text-blue-100 rounded">
                            작업중
                          </span>
                        )}
                      </div>
                      {todo.content && (
                        <p className="text-xs text-gray-400 mt-1">{todo.content}</p>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(todo.start_date)} ~ {formatDate(todo.end_date)}
                        {dday >= 0 ? (
                          <span className="ml-2 text-blue-400">D-{dday}</span>
                        ) : (
                          <span className="ml-2 text-red-400">D+{Math.abs(dday)}</span>
                        )}
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-400">진행률</span>
                          <span className="text-gray-400">{todo.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${todo.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <select
                        value={status}
                        onChange={(e) => handleStatusChange(todo.id, e.target.value)}
                        className="text-xs px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="pending">미완료</option>
                        <option value="in_progress">작업중</option>
                        <option value="on_hold">보류</option>
                        <option value="completed">완료</option>
                      </select>
                      <button
                        onClick={() => handleDelete(todo.id)}
                        className="text-red-400 hover:text-red-300 text-lg font-bold"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleUpdateProgress(todo.id, Math.max(0, todo.progress - 10))}
                      className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600"
                    >
                      -10%
                    </button>
                    <button
                      onClick={() => handleUpdateProgress(todo.id, Math.min(100, todo.progress + 10))}
                      className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600"
                    >
                      +10%
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MidTermTodo;

