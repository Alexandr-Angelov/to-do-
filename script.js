const DB_URL = "https://mytodo-6847f-default-rtdb.europe-west1.firebasedatabase.app/tasks.json";

// Глобальная переменная для хранения задач
let tasks = [];

// --- 1. ЗАГРУЗКА И СИНХРОНИЗАЦИЯ ---
async function loadTasks() {
    try {
        const response = await fetch(DB_URL);
        const data = await response.json();
        
        // Превращаем объект Firebase в массив
        if (data) {
            tasks = Object.keys(data).map(key => ({
                id: key,
                text: data[key].text,
                done: data[key].done || false
            }));
        } else {
            tasks = [];
        }

        renderTasks();
    } catch (error) {
        console.error("Ошибка при получении данных:", error);
    }
}

// --- 2. ДОБАВЛЕНИЕ ЗАДАЧИ ---
async function addTask() {
    const input = document.getElementById('todo-input');
    const text = input.value.trim();

    if (text !== "") {
        const newTask = {
            text: text,
            done: false,
            createdAt: Date.now()
        };

        try {
            await fetch(DB_URL, {
                method: 'POST',
                body: JSON.stringify(newTask)
            });
            input.value = "";
            await loadTasks(); // Обновляем список сразу после добавления
        } catch (error) {
            alert("Не удалось сохранить задачу в облако!");
        }
    }
}

// --- 3. УДАЛЕНИЕ (ВЫПОЛНЕНИЕ) ---
async function deleteTask(firebaseId) {
    try {
        const taskUrl = `https://mytodo-6847f-default-rtdb.europe-west1.firebasedatabase.app/tasks/${firebaseId}.json`;
        await fetch(taskUrl, { method: 'DELETE' });
        await loadTasks(); // Обновляем список
    } catch (error) {
        console.error("Ошибка при удалении:", error);
    }
}

// --- 4. ОТРИСОВКА И ПРОЦЕНТЫ ---
function renderTasks() {
    const todoList = document.getElementById('todo-list');
    const percentDisplay = document.getElementById('completion-pc');
    
    todoList.innerHTML = '';

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.textContent = task.text;
        // При клике задача удаляется из базы (считается выполненной)
        li.onclick = () => deleteTask(task.id);
        todoList.appendChild(li);
    });

    // Считаем проценты или количество
    if (tasks.length > 0) {
        percentDisplay.textContent = `Задач: ${tasks.length}`;
        percentDisplay.style.color = "#00fbff";
    } else {
        percentDisplay.textContent = "0%";
        percentDisplay.style.color = "white";
    }
}

// --- 5. КНОПКИ И СОБЫТИЯ ---
document.getElementById('add-todo').onclick = addTask;

// Позволяет добавлять задачу нажатием Enter
document.getElementById('todo-input').onkeypress = (e) => {
    if (e.key === 'Enter') addTask();
};

document.getElementById('clear-all-tasks').onclick = async () => {
    if (confirm("Очистить весь список везде?")) {
        await fetch(DB_URL, { method: 'DELETE' });
        loadTasks();
    }
};

// --- 6. АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ ---
// Проверяем базу каждые 3 секунды для синхронизации с телефоном/ботом
setInterval(loadTasks, 3000);

// Первый запуск при загрузке страницы
loadTasks();
