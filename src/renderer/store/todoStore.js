import { create } from 'zustand';

const useTodoStore = create((set) => ({
  dailyTodos: [],
  midTermTodos: [],
  selectedDate: new Date().toISOString().split('T')[0],
  
  setDailyTodos: (todos) => set({ dailyTodos: todos }),
  setMidTermTodos: (todos) => set({ midTermTodos: todos }),
  setSelectedDate: (date) => set({ selectedDate: date }),
}));

export default useTodoStore;






