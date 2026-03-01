const DB_URL = "https://mytodo-6847f-default-rtdb.europe-west1.firebasedatabase.app/tasks.json";

// ЗВУКИ
const sounds = {
    rain: new Audio('rain.mp3'),
    fire: new Audio('fire.mp3'),
    forest: new Audio('forest.mp3')
};
Object.values(sounds).forEach(s => s.loop = true);

function setupSound(id, key) {
    document.getElementById(id).oninput = (e) => {
        sounds[key].volume = e.target.value;
        if (e.target.value > 0) sounds[key].play(); else sounds[key].pause();
    };
}
setupSound('rain-vol', 'rain'); setupSound('fire-vol', 'fire'); setupSound('forest-vol', 'forest');

// ТАЙМЕР
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
        if (!isPaused && timeLeft > 0) { timeLeft--; renderTimer(); }
    }, 1000);
};
document.getElementById('pause-btn').onclick = () => isPaused = true;
document.getElementById('reset-btn').onclick = () => {
    isPaused = true;
    timeLeft = (document.getElementById('work-time').value || 25) * 60;
    renderTimer();
};

// FULLSCREEN (ИСПРАВЛЕННЫЙ)
document.getElementById('fullscreen-btn').onclick = () => {
    let elem = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
};

// FIREBASE
async function loadTasks() {
    try {
        const res = await fetch(DB_URL);
        const data = await res.json();
        const todo = document.getElementById('todo-list');
        const done = document.getElementById('done-list');
        todo.innerHTML = ''; done.innerHTML = '';
        let t = 0, d = 0;
        if (data) {
            Object.keys(data).forEach(k => {
                t++;
                const li = document.createElement('li');
                li.textContent = data[k].text;
                li.onclick = () => toggleTask(k, data[k].done);
                if (data[k].done) { li.classList.add('done-item'); done.appendChild(li); d++; }
                else { todo.appendChild(li); }
            });
        }
        document.getElementById('completion-pc').textContent = t > 0 ? Math.round((d/t)*100)+"%" : "0%";
    } catch(e) {}
}

async function addTask() {
    const i = document.getElementById('todo-input');
    if (!i.value.trim()) return;
    await fetch(DB_URL, { method: 'POST', body: JSON.stringify({text: i.value, done: false}) });
    i.value = ''; loadTasks();
}

async function toggleTask(id, s) {
    await fetch(`https://mytodo-6847f-default-rtdb.europe-west1.firebasedatabase.app/tasks/${id}.json`, {
        method: 'PATCH', body: JSON.stringify({done: !s})
    });
    loadTasks();
}

document.getElementById('add-todo').onclick = addTask;
document.getElementById('clear-all-tasks').onclick = async () => {
    if(confirm("Удалить всё?")) { await fetch(DB_URL, {method: 'DELETE'}); loadTasks(); }
};

setInterval(loadTasks, 4000);
loadTasks();
