let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let timeLeft, timerId = null, isPaused = true, currentCycle = 1, isWorking = true;
const DB_URL = "https://mytodo-6847f-default-rtdb.europe-west1.firebasedatabase.app/tasks.json";

// Логика таймера
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
            document.getElementById('snd-work').play();
            isWorking = false;
            timeLeft = document.getElementById('break-time').value * 60;
            document.getElementById('status-text').textContent = "ОТДЫХ";
            document.getElementById('status-text').style.color = "#ffae00";
        } else {
            document.getElementById('snd-break').play();
            isWorking = true;
            currentCycle++;
            timeLeft = document.getElementById('work-time').value * 60;
            document.getElementById('status-text').textContent = `РАБОТА (ЦИКЛ ${currentCycle})`;
            document.getElementById('status-text').style.color = "#00fbff";
        }
        if (currentCycle <= document.getElementById('cycles-count').value) startTimer();
    }
}

function startTimer() {
    isPaused = false;
    if (!timeLeft) timeLeft = document.getElementById('work-time').value * 60;
    if (!timerId) timerId = setInterval(updateTimer, 1000);
    document.getElementById('status-text').textContent = isWorking ? `РАБОТА (ЦИКЛ ${currentCycle})` : "ОТДЫХ";
}

document.getElementById('start-btn').onclick = startTimer;
document.getElementById('pause-btn').onclick = () => { isPaused = true; };
document.getElementById('reset-btn').onclick = () => {
    clearInterval(timerId); timerId = null; timeLeft = null; isWorking = true; currentCycle = 1;
    document.getElementById('timer-display').textContent = "25:00";
    document.getElementById('status-text').textContent = "ГОТОВ?";
};

// Задачи
function renderTasks() {
    const todoList = document.getElementById('todo-list');
    const doneList = document.getElementById('done-list');
    const now = Date.now();
    tasks = tasks.filter(t => now - t.id < 86400000); // 24 часа

    todoList.innerHTML = ''; doneList.innerHTML = '';
    tasks.forEach(t => {
        const li = document.createElement('li');
        li.textContent = t.text;
        li.onclick = () => { t.done = !t.done; renderTasks(); };
        t.done ? doneList.appendChild(li) : todoList.appendChild(li);
    });
    const doneCount = tasks.filter(t => t.done).length;
    document.getElementById('completion-pc').textContent = tasks.length ? Math.round((doneCount/tasks.length)*100) + '%' : '0%';
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

document.getElementById('add-todo').onclick = () => {
    const input = document.getElementById('todo-input');
    if (input.value) {
        tasks.push({ id: Date.now(), text: input.value, done: false });
        input.value = ''; renderTasks();
    }
};

// Полноэкранный режим
document.getElementById('fullscreen-btn').onclick = () => {
    const card = document.getElementById('timer-card');
    if (!document.fullscreenElement) card.requestFullscreen();
    else document.exitFullscreen();
};

// Звуки (настройка громкости)
const sounds = { rain: new Audio('rain.mp3'), fire: new Audio('fire.mp3'), park: new Audio('park.mp3') };
['rain', 'fire', 'park'].forEach(s => {
    sounds[s].loop = true;
    document.getElementById(`${s}-vol`).oninput = (e) => {
        sounds[s].volume = e.target.value;
        if (sounds[s].paused) sounds[s].play();
    };
});

renderTasks();
document.getElementById('clear-all-tasks').onclick = () => {
    // Спрашиваем подтверждение, чтобы не удалить случайно
    if (confirm("Удалить все задачи?")) {
        tasks = []; // Очищаем массив
        localStorage.removeItem('tasks'); // Удаляем из памяти браузера
        renderTasks(); // Обновляем экран
    }
};