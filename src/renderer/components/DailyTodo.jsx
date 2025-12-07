import React, { useState, useEffect } from 'react';
import TodoItem from './TodoItem';

function DailyTodo({ isDbConnected = false }) {
  const [todos, setTodos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState('active'); // 'active', 'completed', 'on_hold', 'all'

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    if (!window.electronAPI) {
      console.error('electronAPI가 사용할 수 없습니다. Electron 환경인지 확인하세요.');
      alert('Electron API를 사용할 수 없습니다. 애플리케이션을 재시작해주세요.');
      return;
    }

    try {
      const data = await window.electronAPI.getDailyTodos(null);
      setTodos(data || []);
    } catch (error) {
      console.error('할일 로드 실패:', error);
      alert(`할일을 불러오는데 실패했습니다: ${error.message || error}`);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) {
      alert('할일 제목을 입력해주세요.');
      return;
    }

    if (!window.electronAPI) {
      console.error('electronAPI가 사용할 수 없습니다.');
      alert('Electron API를 사용할 수 없습니다. 애플리케이션을 재시작해주세요.');
      return;
    }

    try {
      await window.electronAPI.addDailyTodo({
        content: newTodo,
        description: null,
        todo_date: selectedDate,
        priority: 0,
      });
      setNewTodo('');
      loadTodos();
    } catch (error) {
      console.error('할일 추가 실패:', error);
      alert(`할일 추가에 실패했습니다: ${error.message || error}`);
    }
  };

  const handleToggleComplete = async (id, completed) => {
    if (!window.electronAPI) {
      console.error('electronAPI가 사용할 수 없습니다.');
      return;
    }

    try {
      await window.electronAPI.updateDailyTodo(id, { completed: !completed });
      loadTodos();
    } catch (error) {
      console.error('할일 업데이트 실패:', error);
      alert(`할일 업데이트에 실패했습니다: ${error.message || error}`);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    if (!window.electronAPI) {
      console.error('electronAPI가 사용할 수 없습니다.');
      return;
    }

    try {
      await window.electronAPI.updateDailyTodo(id, { status: newStatus });
      loadTodos();
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert(`상태 변경에 실패했습니다: ${error.message || error}`);
    }
  };

  const handleDescriptionUpdate = async (id, description) => {
    if (!window.electronAPI) {
      console.error('electronAPI가 사용할 수 없습니다.');
      return;
    }

    try {
      await window.electronAPI.updateDailyTodo(id, { description });
      loadTodos();
    } catch (error) {
      console.error('세부사항 업데이트 실패:', error);
      alert(`세부사항 업데이트에 실패했습니다: ${error.message || error}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.electronAPI) {
      console.error('electronAPI가 사용할 수 없습니다.');
      return;
    }

    try {
      await window.electronAPI.deleteDailyTodo(id);
      loadTodos();
    } catch (error) {
      console.error('할일 삭제 실패:', error);
      alert(`할일 삭제에 실패했습니다: ${error.message || error}`);
    }
  };

  // 필터링된 할일 목록
  const filteredTodos = todos.filter((todo) => {
    const status = todo.status || (todo.completed ? 'completed' : 'pending');
    if (filter === 'active') return status === 'pending';
    if (filter === 'completed') return status === 'completed';
    if (filter === 'on_hold') return status === 'on_hold';
    return true; // 'all'
  });

  // 날짜별 그룹화 함수
  const groupTodosByDate = (todos) => {
    const grouped = {};
    todos.forEach(todo => {
      const date = todo.todo_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(todo);
    });
    return grouped;
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  // 필터링된 할일을 날짜별로 그룹화
  const groupedTodos = groupTodosByDate(filteredTodos);

  return (
    <div className="p-4 h-full flex flex-col">
      {/* 필터 버튼 */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1 text-xs rounded ${
            filter === 'active'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          미완료
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
      
      {/* 할일 추가 폼 */}
      <div className="mb-4 space-y-2">
        <div className="flex gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            disabled={!isDbConnected}
            className={`px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:outline-none focus:border-blue-500 ${
              !isDbConnected
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          />
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && isDbConnected && handleAddTodo()}
            placeholder="할일 제목..."
            disabled={!isDbConnected}
            className={`flex-1 px-3 py-2 rounded border focus:outline-none ${
              !isDbConnected
                ? 'bg-gray-700 text-gray-500 border-gray-600 cursor-not-allowed opacity-50'
                : 'bg-gray-800 text-white border-gray-700 focus:border-blue-500'
            }`}
          />
          <button
            onClick={handleAddTodo}
            disabled={!isDbConnected}
            title={!isDbConnected ? "DB 연결이 필요합니다" : ""}
            className={`px-4 py-2 text-white rounded ${
              !isDbConnected
                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            추가
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {Object.keys(groupedTodos).length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            {todos.length === 0
              ? '할일이 없습니다'
              : filter === 'active'
              ? '미완료 할일이 없습니다'
              : filter === 'completed'
              ? '완료된 할일이 없습니다'
              : filter === 'on_hold'
              ? '보류된 할일이 없습니다'
              : '할일이 없습니다'}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedTodos)
              .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
              .map(([date, dateTodos]) => (
                <div key={date} className="mb-4">
                  <div className="text-sm font-semibold text-gray-400 mb-2 px-2">
                    {formatDate(date)}
                  </div>
                  <div className="space-y-2">
                    {dateTodos.map((todo) => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        onToggleComplete={handleToggleComplete}
                        onStatusChange={handleStatusChange}
                        onDescriptionUpdate={handleDescriptionUpdate}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DailyTodo;

