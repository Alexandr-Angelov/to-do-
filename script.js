const DB_URL = "https://mytodo-6847f-default-rtdb.europe-west1.firebasedatabase.app/tasks.json";

// --- ПЕРЕМЕННЫЕ ---
let timeLeft = 25 * 60;
let timerId = null;
let isPaused = true;
let currentCycle = 1;
let isWorking = true;
let tasks = [];

// --- 1. ТАЙМЕР (ИСПРАВЛЕН ДЛЯ ТЕЛЕФОНОВ) ---

function updateTimer() {
    if (isPaused || timeLeft <= 0) return;

    timeLeft--;
    renderTimer();

    if (timeLeft <= 0) {
        stopTimer();
        // Переключение фаз
        if (isWorking) {
            isWorking = false;
            timeLeft = (parseInt(document.getElementById('break-time').value) || 5) * 60;
            document.getElementById('status-text').textContent = "ОТДЫХ";
        } else {
            isWorking = true;
            currentCycle++;
            timeLeft = (parseInt(document.getElementById('work-time').value) || 25) * 60;
            document.getElementById('status-text').textContent = `РАБОТА (${currentCycle})`;
        }
        alert("Время вышло!"); // Уведомление для мобилок
    }
}

function renderTimer() {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    document.getElementById('timer-display').textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function startTimer() {
    if (isPaused) {
        isPaused = false;
        if (!timerId) {
            timerId = setInterval(updateTimer, 1000);
        }
        document.getElementById('status-text').textContent = isWorking ? `РАБОТА (${currentCycle})` : "ОТДЫХ";
    }
}

function stopTimer() {
    isPaused = true;
    clearInterval(timerId);
    timerId = null;
}

// Кнопки таймера
document.getElementById('start-btn').onclick = startTimer;
document.getElementById('pause-btn').onclick = stopTimer;
document.getElementById('reset-btn').onclick = () => {
    stopTimer();
    const workMins = parseInt(document.getElementById('work-time').value) || 25;
    timeLeft = workMins * 60;
    isWorking = true;
    currentCycle = 1;
    renderTimer();
    document.getElementById('status-text').textContent = "ГОТОВ?";
};

// --- 2. ПОЛНОЭКРАННЫЙ РЕЖИМ (ДЛЯ ВСЕХ) ---

document.getElementById('fullscreen-btn').onclick = () => {
    const elem = document.documentElement; // Весь сайт на весь экран
    if (!document.fullscreenElement) {
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen(); // Для Safari/iPhone
        else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
};

// --- 3. ЗАДАЧИ И СИНХРОНИЗАЦИЯ (FIREBASE) ---

async function loadTasks() {
    try {
        const response = await fetch(DB_URL);
        const data = await response.json();
        // Превращаем объект в массив с ID
        tasks = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
        renderTasksUI();
    } catch (e) { console.error("Ошибка сети:", e); }
}

async function addTask() {
    const input = document.getElementById('todo-input');
    if (!input.value.trim()) return;
    
    const newTask = { text: input.value, done: false };
    await fetch(DB_URL, { method: 'POST', body: JSON.stringify(newTask) });
    input.value = "";
    loadTasks();
}

// Смена статуса (не удаление!)
async function toggleTaskStatus(id, currentDone) {
    const url = `https://mytodo-6847f-default-rtdb.europe-west1.firebasedatabase.app/tasks/${id}.json`;
    await fetch(url, {
        method: 'PATCH',
        body: JSON.stringify({ done: !currentDone })
    });
    loadTasks();
}

function renderTasksUI() {
    const todoList = document.getElementById('todo-list');
    const doneList = document.getElementById('done-list');
    const pcDisplay = document.getElementById('completion-pc');

    todoList.innerHTML = '';
    doneList.innerHTML = '';
    let doneCount = 0;

    tasks.forEach(t => {
        const li = document.createElement('li');
        li.textContent = t.text;
        li.onclick = () => toggleTaskStatus(t.id, t.done);

        if (t.done) {
            li.classList.add('done'); // Добавь в CSS .done { text-decoration: line-through; opacity: 0.5; }
            doneList.appendChild(li);
            doneCount++;
        } else {
            todoList.appendChild(li);
        }
    });

    // Расчет процентов
    const total = tasks.length;
    const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    pcDisplay.textContent = `${percent}%`;
}

// Привязка к кнопкам
document.getElementById('add-todo').onclick = addTask;
document.getElementById('clear-all-tasks').onclick = async () => {
    if (confirm("Удалить всё?")) {
        await fetch(DB_URL, { method: 'DELETE' });
        loadTasks();
    }
};

// Запуск
loadTasks();
setInterval(loadTasks, 5000); // Синхронизация каждые 5 сек
