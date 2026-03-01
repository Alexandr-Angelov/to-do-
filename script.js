const DB_URL = "https://mytodo-6847f-default-rtdb.europe-west1.firebasedatabase.app/tasks.json";

// --- ЗВУКИ ---
const sounds = {
    rain: new Audio('rain.mp3'),
    fire: new Audio('fire.mp3'),
    forest: new Audio('forest.mp3')
};

// Зацикливаем звуки
Object.values(sounds).forEach(s => s.loop = true);

// Управление громкостью
function setupSound(id, soundKey) {
    const slider = document.getElementById(id);
    slider.oninput = () => {
        sounds[soundKey].volume = slider.value;
        if (slider.value > 0 && sounds[soundKey].paused) {
            sounds[soundKey].play().catch(() => console.log("Кликните на страницу для звука"));
        } else if (slider.value == 0) {
            sounds[soundKey].pause();
        }
    };
}

setupSound('rain-vol', 'rain');
setupSound('fire-vol', 'fire');
setupSound('forest-vol', 'forest');

// --- ТАЙМЕР ---
let timeLeft = 25 * 60;
let timerId = null;
let isPaused = true;

function renderTimer() {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    document.getElementById('timer-display').textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

document.getElementById('start-btn').onclick = () => {
    isPaused = false;
    if (!timerId) timerId = setInterval(() => {
        if (!isPaused && timeLeft > 0) {
            timeLeft--;
            renderTimer();
        }
    }, 1000);
};

document.getElementById('pause-btn').onclick = () => isPaused = true;
document.getElementById('reset-btn').onclick = () => {
    isPaused = true;
    timeLeft = (document.getElementById('work-time').value || 25) * 60;
    renderTimer();
};

// --- FULLSCREEN ---
document.getElementById('fullscreen-btn').onclick = () => {
    let elem = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
};

// --- FIREBASE & ЗАДАЧИ ---
async function loadTasks() {
    try {
        const res = await fetch(DB_URL);
        const data = await res.json();
        const todoList = document.getElementById('todo-list');
        const doneList = document.getElementById('done-list');
        const pc = document.getElementById('completion-pc');
        
        todoList.innerHTML = '';
        doneList.innerHTML = '';
        let total = 0, done = 0;

        if (data) {
            Object.keys(data).forEach(key => {
                total++;
                const task = data[key];
                const li = document.createElement('li');
                li.textContent = task.text;
                li.onclick = () => toggleTask(key, task.done);
                if (task.done) { li.classList.add('done-item'); doneList.appendChild(li); done++; }
                else { todoList.appendChild(li); }
            });
        }
        pc.textContent = total > 0 ? Math.round((done / total) * 100) + "%" : "0%";
    } catch (e) { console.log("Firebase sync..."); }
}

async function addTask() {
    const input = document.getElementById('todo-input');
    if (!input.value.trim()) return;
    await fetch(DB_URL, { method: 'POST', body: JSON.stringify({ text: input.value, done: false }) });
    input.value = '';
    loadTasks();
}

async function toggleTask(id, currentStatus) {
    await fetch(`https://mytodo-6847f-default-rtdb.europe-west1.firebasedatabase.app/tasks/${id}.json`, {
        method: 'PATCH',
        body: JSON.stringify({ done: !currentStatus })
    });
    loadTasks();
}

document.getElementById('add-todo').onclick = addTask;
document.getElementById('clear-all-tasks').onclick = async () => {
    if (confirm("Очистить базу?")) { await fetch(DB_URL, { method: 'DELETE' }); loadTasks(); }
};

setInterval(loadTasks, 4000);
loadTasks();
