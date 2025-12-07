import React, { useState } from 'react';

function TodoItem({ todo, onToggleComplete, onStatusChange, onDelete, onDescriptionUpdate }) {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState(todo.description || '');
  const priorityColors = {
    0: 'text-gray-400',
    1: 'text-yellow-400',
    2: 'text-red-400',
  };

  const priorityLabels = {
    0: '낮음',
    1: '보통',
    2: '높음',
  };

  const status = todo.status || (todo.completed ? 'completed' : 'pending');
  const isOnHold = status === 'on_hold';
  const isCompleted = status === 'completed';

  return (
    <div className={`flex items-center gap-2 p-2 rounded border ${
      isOnHold 
        ? 'bg-gray-700 border-yellow-600 hover:border-yellow-500' 
        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
    }`}>
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={() => {
          if (isOnHold) {
            // 보류 상태에서는 체크박스 클릭 시 미완료로 변경
            onStatusChange(todo.id, 'pending');
          } else {
            onToggleComplete(todo.id, todo.completed);
          }
        }}
        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm ${
              isCompleted ? 'line-through text-gray-500' : isOnHold ? 'text-yellow-300' : 'text-white'
            }`}
          >
            {todo.content}
          </span>
          {isOnHold && (
            <span className="text-xs px-1.5 py-0.5 bg-yellow-600 text-yellow-100 rounded">
              보류
            </span>
          )}
          {todo.priority > 0 && (
            <span className={`text-xs ${priorityColors[todo.priority]}`}>
              [{priorityLabels[todo.priority]}]
            </span>
          )}
        </div>
        <div className="mt-1">
          {isEditingDescription ? (
            <div className="space-y-1">
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="세부사항 (보류 업무 경과 등)..."
                rows="2"
                className="w-full px-2 py-1 text-xs bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                autoFocus
              />
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    if (onDescriptionUpdate) {
                      onDescriptionUpdate(todo.id, editDescription.trim() || null);
                    }
                    setIsEditingDescription(false);
                  }}
                  className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setEditDescription(todo.description || '');
                    setIsEditingDescription(false);
                  }}
                  className="px-2 py-0.5 text-xs bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div>
              {todo.description ? (
                <div className="flex items-start gap-1">
                  <div
                    className={`text-xs flex-1 whitespace-pre-wrap ${
                      isCompleted ? 'text-gray-600 line-through' : 'text-gray-400'
                    }`}
                  >
                    {todo.description}
                  </div>
                  {onDescriptionUpdate && (
                    <button
                      onClick={() => {
                        setEditDescription(todo.description);
                        setIsEditingDescription(true);
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      수정
                    </button>
                  )}
                </div>
              ) : (
                onDescriptionUpdate && (
                  <button
                    onClick={() => setIsEditingDescription(true)}
                    className="text-xs text-gray-500 hover:text-gray-400"
                  >
                    + 세부사항 추가
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <select
          value={status}
          onChange={(e) => onStatusChange(todo.id, e.target.value)}
          className="text-xs px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="pending">미완료</option>
          <option value="on_hold">보류</option>
          <option value="completed">완료</option>
        </select>
        <button
          onClick={() => onDelete(todo.id)}
          className="text-red-400 hover:text-red-300 text-lg font-bold"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default TodoItem;

