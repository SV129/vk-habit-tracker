// Заглушка для вк, локальный тест
/*if (typeof vkConnect === 'undefined') {
    window.vkConnect = {
        send: (method, params) => {
            console.log(`[VK Mock] ${method}`, params);
            return Promise.resolve();
        }
    };
    console.log("Режим теста: VK Connect не загружен, но приложение работает локально!");
}*/

// Подключение VK Bridge
const vkBridge = require('@vkontakte/vk-bridge');

// Инициализация приложения
async function initializeApp() {
  try {
    // 1. Обязательная инициализация VK Mini App
    await vkBridge.send('VKWebAppInit');
    console.log('VK Mini App initialized');

    // 2. Получение информации о пользователе
    const user = await vkBridge.send('VKWebAppGetUserInfo');
    updateMotivationMessage(`Привет, ${user.first_name}! Начни улучшать свои привычки!`);

    // 3. Отправка события аналитики
    await vkBridge.send('VKWebAppTrackEvent', {
      event_name: 'app_launch',
      event_data: { timestamp: Date.now() }
    });

    // 4. Инициализация трекера привычек
    initHabitTracker();

  } catch (error) {
    console.error('VK API Error:', error);
    handleVKBridgeError();
  }
}

// Обработка ошибок VK Bridge
function handleVKBridgeError() {
  // Fallback для локального тестирования
  if (!window.vkBridge) {
    window.vkBridge = {
      send: (method, params) => {
        console.log(`[MOCK] ${method}`, params);
        if (method === 'VKWebAppGetUserInfo') {
          return Promise.resolve({ 
            first_name: 'Тестовый',
            last_name: 'Пользователь',
            id: 1234567
          });
        }
        return Promise.resolve({});
      }
    };
    updateMotivationMessage('Режим тестирования (VK Bridge не загружен)');
  }
  initHabitTracker();
}

// Инициализация трекера привычек
function initHabitTracker() {
  const elements = {
    habitInput: document.getElementById('habit-input'),
    addBtn: document.getElementById('add-btn'),
    habitsList: document.querySelector('.habits-list'),
    progressFill: document.querySelector('.progress-fill'),
    completedCount: document.getElementById('completed-count'),
    totalCount: document.getElementById('total-count'),
    motivation: document.querySelector('.motivation')
  };

  let habits = JSON.parse(localStorage.getItem('habits')) || [];

  // Загрузка привычек
  function loadHabits() {
    elements.habitsList.innerHTML = '';
    habits.forEach((habit, index) => {
      const habitItem = document.createElement('div');
      habitItem.className = 'habit-item';
      habitItem.innerHTML = `
        <span class="habit-name">${habit.name}</span>
        <div class="habit-actions">
          <button class="complete-btn" data-index="${index}">
            ${habit.completed ? '✅' : '☑️'}
          </button>
          <button class="delete-btn" data-index="${index}">🗑️</button>
        </div>
      `;
      elements.habitsList.appendChild(habitItem);
    });
    updateStats();
  }

  // Обновление статистики
  function updateStats() {
    const total = habits.length;
    const completed = habits.filter(habit => habit.completed).length;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    elements.progressFill.style.width = `${progress}%`;
    elements.completedCount.textContent = completed;
    elements.totalCount.textContent = total;
    localStorage.setItem('habits', JSON.stringify(habits));
    updateMotivationMessage(getMotivationText(completed, total));
  }

  // Мотивационные сообщения
  function getMotivationText(completed, total) {
    const messages = {
      noHabits: "Добавь свою первую привычку!",
      allCompleted: "Отличная работа! Ты выполнил все привычки!",
      default: [
        "Маленькие шаги приводят к большим результатам!",
        "Продолжай в том же духе!",
        "Ты на правильном пути!"
      ]
    };

    if (total === 0) return messages.noHabits;
    if (completed === total) return messages.allCompleted;
    return messages.default[Math.floor(Math.random() * messages.default.length)];
  }

  function updateMotivationMessage(text) {
    elements.motivation.textContent = text;
  }

  // Добавление привычки
  elements.addBtn.addEventListener('click', async () => {
    const name = elements.habitInput.value.trim();
    if (name) {
      habits.push({ name, completed: false });
      elements.habitInput.value = '';
      
      try {
        await vkBridge.send('VKWebAppTrackEvent', {
          event_name: 'habit_added',
          event_data: { habit_name: name }
        });
      } catch (e) {
        console.error('Analytics error:', e);
      }
      
      loadHabits();
    }
  });

  // Обработка действий с привычками
  elements.habitsList.addEventListener('click', async (e) => {
    const index = e.target.dataset?.index;
    if (index === undefined) return;

    if (e.target.classList.contains('complete-btn')) {
      habits[index].completed = !habits[index].completed;
      
      try {
        await vkBridge.send('VKWebAppTrackEvent', {
          event_name: habits[index].completed ? 'habit_completed' : 'habit_unchecked',
          event_data: { habit_name: habits[index].name }
        });
      } catch (e) {
        console.error('Analytics error:', e);
      }
      
      loadHabits();
    } else if (e.target.classList.contains('delete-btn')) {
      const deletedHabit = habits[index].name;
      habits.splice(index, 1);
      
      try {
        await vkBridge.send('VKWebAppTrackEvent', {
          event_name: 'habit_deleted',
          event_data: { habit_name: deletedHabit }
        });
      } catch (e) {
        console.error('Analytics error:', e);
      }
      
      loadHabits();
    }
  });

  // Первая загрузка
  loadHabits();
}

// Запуск приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', initializeApp);
