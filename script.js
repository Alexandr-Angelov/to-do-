const DB_URL = "https://mytodo-6847f-default-rtdb.europe-west1.firebasedatabase.app/tasks.json";

// --- ФУНКЦИЯ ЗАГРУЗКИ (ОБЩАЯ ДЛЯ ВСЕХ УСТРОЙСТВ) ---
async function syncTasks() {
    try {
        const response = await fetch(DB_URL);
        const data = await response.json();
        
        const todoList = document.getElementById('todo-list');
        todoList.innerHTML = ''; // Чистим список перед обновлением

        if (data) {
            // Firebase возвращает объект, превращаем его в список
            Object.keys(data).forEach(key => {
                const task = data[key];
                const li = document.createElement('li');
                li.textContent = task.text;
                
                // Клик по задаче удаляет её ВЕЗДЕ (и на компе, и в боте)
                li.onclick = async () => {
                    await fetch(`https://mytodo-6847f-default-rtdb.europe-west1.firebasedatabase.app/tasks/${key}.json`, {
                        method: 'DELETE'
                    });
                    syncTasks(); // Сразу обновляем экран
                };
                
                todoList.appendChild(li);
            });
        }
        
        // Обновляем счетчик задач
        const count = data ? Object.keys(data).length : 0;
        document.getElementById('completion-pc').textContent = count > 0 ? `Задач: ${count}` : "0%";
        
    } catch (e) {
        console.log("Ошибка синхронизации:", e);
    }
}

// --- ДОБАВЛЕНИЕ ЗАДАЧИ ---
document.getElementById('add-todo').onclick = async () => {
    const input = document.getElementById('todo-input');
    if (input.value.trim() !== "") {
        const newTask = {
            text: input.value,
            done: false,
            time: Date.now()
        };
        // Отправляем в Firebase
        await fetch(DB_URL, {
            method: 'POST',
            body: JSON.stringify(newTask)
        });
        input.value = "";
        syncTasks();
    }
};

// --- ОЧИСТКА ВСЕГО ---
document.getElementById('clear-all-tasks').onclick = async () => {
    if (confirm("Очистить список на всех устройствах?")) {
        await fetch(DB_URL, { method: 'DELETE' });
        syncTasks();
    }
};

// --- АВТОМАТИКА ---
// Проверять наличие новых задач каждые 3 секунды
setInterval(syncTasks, 3000);

// Запустить при открытии страницы
syncTasks();
