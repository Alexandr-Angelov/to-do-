const DB_URL = "https://mytodo-6847f-default-rtdb.europe-west1.firebasedatabase.app/tasks.json";

let timeLeft;
let timerId = null;
let isPaused = true;
let currentCycle = 1;
let isWorking = true;
let tasks = [];

// --- 1. ЛОГИКА ТАЙМЕРА ---

function updateTimer() {
    if (isPaused) return;
    timeLeft--;
    
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    document.getElementById('timer-display').textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    if (timeLeft <= 0) {
        clearInterval(timerId);
        timerId = null;
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
        startTimer();
    }
}

function startTimer() {
    isPaused = false;
    if (!timeLeft) {
        const workMins = parseInt(document.getElementById('work-time').value) || 25;
        timeLeft = workMins * 60;
    }
    if (!timerId) timerId = setInterval(updateTimer, 1000);
    document.getElementById('status-text').textContent = isWorking ? `РАБОТА (${currentCycle})` : "ОТДЫХ";
}

document.getElementById('start-btn').onclick = startTimer;
document.getElementById('pause-btn').onclick = () => { isPaused = true; };
document.getElementById('reset-btn').onclick = () => {
    clearInterval(timerId);
    timerId = null;
    timeLeft = null;
    isPaused = true;
    document.getElementById('timer-display').textContent = "25:00";
    document.getElementById('status-text').textContent = "ГОТОВ?";
};

// --- 2. ЛОГИКА ЗАДАЧ (FIREBASE) ---

async function loadTasks() {
    try {
        const response = await fetch(DB_URL);
        const data = await response.json();
        tasks = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
        renderTasks();
    } catch (e) { console.error("Ошибка загрузки:", e); }
}

async function addTask() {
    const input = document.getElementById('todo-input');
    if (input.value.trim() === "") return;
    const newTask = { text: input.value, done: false };
    await fetch(DB_URL, { method: 'POST', body: JSON.stringify(newTask) });
    input.value = "";
    loadTasks();
}

// Теперь вместо удаления мы меняем статус done: true
async function toggleTask(id, currentStatus) {
    const url = `https://mytodo-6847f-default-rtdb.europe-west1.firebasedatabase.app/tasks/${id}.json`;
    await fetch(url, {
        method: 'PATCH',
        body: JSON.stringify({ done: !currentStatus })
    });
    loadTasks();
}

function renderTasks() {
    const todoList = document.getElementById('todo-list');
    const doneList = document.getElementById('done-list');
    const pcDisplay = document.getElementById('completion-pc');
    
    todoList.innerHTML = '';
    doneList.innerHTML = '';

    let completedCount = 0;

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.textContent = task.text;
        li.onclick = () => toggleTask(task.id, task.done);

        if (task.done) {
            doneList.appendChild(li);
            completedCount++;
        } else {
            todoList.appendChild(li);
        }
    });

    // Расчет процентов
    const total = tasks.length;
    const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    pcDisplay.textContent = `${percent}%`;
}

// --- 3. ЗВУКИ И ДОПЫ ---

document.getElementById('add-todo').onclick = addTask;
document.getElementById('clear-all-tasks').onclick = async () => {
    if (confirm("Очистить всё?")) {
        await fetch(DB_URL, { method: 'DELETE' });
        loadTasks();
    }
};

// Звуки дождя/огня (если есть в HTML)
const rainSnd = new Audio('rain.mp3'); rainSnd.loop = true;
document.getElementById('rain-vol').oninput = (e) => {
    rainSnd.volume = e.target.value;
    if (e.target.value > 0) rainSnd.play(); else rainSnd.pause();
};

// Запуск
loadTasks();
setInterval(loadTasks, 4000); // Синхронизация каждые 4 сек
