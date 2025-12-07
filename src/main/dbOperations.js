const { getPool } = require('./database');

// Daily Todos CRUD
async function getDailyTodos(date = null) {
  const pool = getPool();
  if (!pool) {
    return []; // 빈 배열 반환
  }
  try {
    let query, params;
    if (date) {
      query = 'SELECT * FROM daily_todos WHERE todo_date = $1 ORDER BY created_at ASC';
      params = [date];
    } else {
      query = 'SELECT * FROM daily_todos ORDER BY todo_date DESC, created_at ASC';
      params = [];
    }
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('일일 할일 조회 실패:', error);
    return []; // 에러 시에도 빈 배열 반환
  }
}

async function addDailyTodo(todo) {
  const pool = getPool();
  if (!pool) {
    return { success: false, error: 'DB 연결이 필요합니다.' };
  }
  try {
    const status = todo.status || 'pending';
    const result = await pool.query(
      `INSERT INTO daily_todos (content, description, completed, status, priority, todo_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        todo.content,
        todo.description || null,
        todo.completed || false,
        status,
        todo.priority || 0,
        todo.todo_date
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error('일일 할일 추가 실패:', error);
    return { success: false, error: error.message || '할일 추가에 실패했습니다.' };
  }
}

async function updateDailyTodo(id, updates) {
  const pool = getPool();
  if (!pool) {
    return { success: false, error: 'DB 연결이 필요합니다.' };
  }
  try {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.content !== undefined) {
      fields.push(`content = $${paramIndex++}`);
      values.push(updates.content);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.completed !== undefined) {
      fields.push(`completed = $${paramIndex++}`);
      values.push(updates.completed);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
      // status가 변경되면 completed도 자동 업데이트
      if (updates.status === 'completed') {
        fields.push(`completed = true`);
      } else if (updates.status === 'pending' || updates.status === 'on_hold') {
        fields.push(`completed = false`);
      }
    }
    if (updates.priority !== undefined) {
      fields.push(`priority = $${paramIndex++}`);
      values.push(updates.priority);
    }
    if (updates.todo_date !== undefined) {
      fields.push(`todo_date = $${paramIndex++}`);
      values.push(updates.todo_date);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE daily_todos SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  } catch (error) {
    console.error('일일 할일 업데이트 실패:', error);
    return { success: false, error: error.message || '할일 업데이트에 실패했습니다.' };
  }
}

async function deleteDailyTodo(id) {
  const pool = getPool();
  if (!pool) {
    return { success: false, error: 'DB 연결이 필요합니다.' };
  }
  try {
    await pool.query('DELETE FROM daily_todos WHERE id = $1', [id]);
    return { success: true };
  } catch (error) {
    console.error('일일 할일 삭제 실패:', error);
    return { success: false, error: error.message || '할일 삭제에 실패했습니다.' };
  }
}

// Midterm Todos CRUD
async function getMidTermTodos() {
  const pool = getPool();
  if (!pool) {
    return []; // 빈 배열 반환
  }
  try {
    const result = await pool.query(
      'SELECT * FROM midterm_todos ORDER BY end_date ASC, priority DESC'
    );
    return result.rows;
  } catch (error) {
    console.error('중기 할일 조회 실패:', error);
    return []; // 에러 시에도 빈 배열 반환
  }
}

async function addMidTermTodo(todo) {
  const pool = getPool();
  if (!pool) {
    return { success: false, error: 'DB 연결이 필요합니다.' };
  }
  try {
    const result = await pool.query(
      `INSERT INTO midterm_todos (title, content, start_date, end_date, progress, status, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        todo.title,
        todo.content || null,
        todo.start_date,
        todo.end_date,
        todo.progress || 0,
        todo.status || 'pending',
        todo.priority || 0,
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error('중기 할일 추가 실패:', error);
    return { success: false, error: error.message || '할일 추가에 실패했습니다.' };
  }
}

async function updateMidTermTodo(id, updates) {
  const pool = getPool();
  if (!pool) {
    return { success: false, error: 'DB 연결이 필요합니다.' };
  }
  try {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      fields.push(`content = $${paramIndex++}`);
      values.push(updates.content);
    }
    if (updates.start_date !== undefined) {
      fields.push(`start_date = $${paramIndex++}`);
      values.push(updates.start_date);
    }
    if (updates.end_date !== undefined) {
      fields.push(`end_date = $${paramIndex++}`);
      values.push(updates.end_date);
    }
    if (updates.progress !== undefined) {
      fields.push(`progress = $${paramIndex++}`);
      values.push(updates.progress);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.priority !== undefined) {
      fields.push(`priority = $${paramIndex++}`);
      values.push(updates.priority);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE midterm_todos SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  } catch (error) {
    console.error('중기 할일 업데이트 실패:', error);
    return { success: false, error: error.message || '할일 업데이트에 실패했습니다.' };
  }
}

async function deleteMidTermTodo(id) {
  const pool = getPool();
  if (!pool) {
    return { success: false, error: 'DB 연결이 필요합니다.' };
  }
  try {
    await pool.query('DELETE FROM midterm_todos WHERE id = $1', [id]);
    return { success: true };
  } catch (error) {
    console.error('중기 할일 삭제 실패:', error);
    return { success: false, error: error.message || '할일 삭제에 실패했습니다.' };
  }
}

module.exports = {
  getDailyTodos,
  addDailyTodo,
  updateDailyTodo,
  deleteDailyTodo,
  getMidTermTodos,
  addMidTermTodo,
  updateMidTermTodo,
  deleteMidTermTodo,
};

