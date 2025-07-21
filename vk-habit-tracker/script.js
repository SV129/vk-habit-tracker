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

// Массив мотивационных сообщений для разных ситуаций
const motivationData = {
    daily: [
        "Сегодня — твой день! 🌟",
        "Маленькие шаги ведут к большим результатам! 👣",
        "Ты можешь больше, чем думаешь! 💪"
    ],
    progress: [
        {threshold: 0, message: "Сделай первый шаг прямо сейчас! 🚀"},
        {threshold: 30, message: "Хорошее начало! Продолжай в том же духе! 🌱"},
        {threshold: 70, message: "Отличный прогресс! Так держать! 🔥"},
        {threshold: 100, message: "Идеальный результат! Ты просто супер! 🎯"}
    ],
    encouragement: [
        "Не сдавайся! У тебя всё получится! ✨",
        "Верь в себя — ты способен на большее! 💫",
        "Каждая привычка делает тебя лучше! 🌿"
    ]
};

// Инициализация VK API
function initVK() {
    if (typeof vkConnect !== 'undefined') {
        vkConnect.send("VKWebAppInit", {})
            .then(() => console.log("VK Mini App инициализирован"))
            .catch(err => console.error("Ошибка инициализации:", err));
    }
}

// Отправка мотивационного уведомления
function sendMotivationNotification(message) {
    if (typeof vkConnect !== 'undefined') {
        vkConnect.send("VKWebAppShowSnackbar", {
            text: message,
            timeout: 3000
        }).catch(err => console.error("Ошибка уведомления:", err));
    }
    updateMotivationMessage(message);
}

// Обновление мотивационного сообщения
function updateMotivationMessage(message) {
    const motivationElement = document.querySelector('.motivation');
    if (message) {
        motivationElement.textContent = message;
        return;
    }
    
    // Случайное ежедневное сообщение
    const randomDaily = motivationData.daily[
        Math.floor(Math.random() * motivationData.daily.length)
    ];
    motivationElement.textContent = randomDaily;
}

// Анализ прогресса и мотивация
function checkProgress(completed, total) {
    if (total === 0) return;
    
    const percentage = Math.round((completed / total) * 100);
    
    // Сообщение по прогрессу
    for (const item of motivationData.progress.slice().reverse()) {
        if (percentage >= item.threshold) {
            sendMotivationNotification(item.message);
            break;
        }
    }
    
    // Случайное подбадривание каждые 3 завершённые привычки
    if (completed > 0 && completed % 3 === 0) {
        const randomEncouragement = motivationData.encouragement[
            Math.floor(Math.random() * motivationData.encouragement.length)
        ];
        sendMotivationNotification(randomEncouragement);
    }
}

// Основной код приложения
document.addEventListener('DOMContentLoaded', () => {
    initVK();
    updateMotivationMessage();
    
    const habitInput = document.getElementById('habit-input');
    const addBtn = document.getElementById('add-btn');
    const habitsList = document.querySelector('.habits-list');
    const progressFill = document.querySelector('.progress-fill');
    const completedCount = document.getElementById('completed-count');
    const totalCount = document.getElementById('total-count');

    let habits = JSON.parse(localStorage.getItem('habits')) || [];

    function loadHabits() {
        habitsList.innerHTML = '';
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
            habitsList.appendChild(habitItem);
        });
        updateStats();
    }

    function updateStats() {
        const total = habits.length;
        const completed = habits.filter(habit => habit.completed).length;
        const progress = total > 0 ? (completed / total) * 100 : 0;

        progressFill.style.width = `${progress}%`;
        completedCount.textContent = completed;
        totalCount.textContent = total;
        
        checkProgress(completed, total);
        localStorage.setItem('habits', JSON.stringify(habits));
    }

    addBtn.addEventListener('click', () => {
        const name = habitInput.value.trim();
        if (name) {
            habits.push({ name, completed: false });
            habitInput.value = '';
            sendMotivationNotification("Привычка добавлена! Теперь главное — не сдаваться! 💪");
            loadHabits();
        } else {
            sendMotivationNotification("Введите название привычки!");
        }
    });

    habitsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('complete-btn')) {
            const index = e.target.dataset.index;
            habits[index].completed = !habits[index].completed;
            const action = habits[index].completed ? "completed" : "unchecked";
            sendMotivationNotification(
                action === "completed" 
                    ? "Отличная работа! Так держать! 🌟" 
                    : "Не переживай! Завтра получится лучше! 💫"
            );
            loadHabits();
        } else if (e.target.classList.contains('delete-btn')) {
            const index = e.target.dataset.index;
            habits.splice(index, 1);
            sendMotivationNotification("Привычка удалена. Сосредоточься на оставшихся! 🎯");
            loadHabits();
        }
    });

    // Первое уведомление через 5 секунд
    setTimeout(() => {
        sendMotivationNotification("Добро пожаловать в трекер привычек! Начни своё путешествие к лучшей версии себя! 🚀");
    }, 5000);

    loadHabits();
});