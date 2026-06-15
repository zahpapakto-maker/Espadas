const GENERAL_PASSWORD = "ESPADA1997"; // Пароль 1 уровня
const BERSERK_PASSWORD = "ESPADA1488"; // Пароль 2 уровня (TFB)

let isLevel2Unlocked = false; // Статус разблокировки 2 уровня
let currentActiveTab = "history"; // Текущая открытая вкладка

// Элементы основного экрана авторизации
const loginBtn = document.getElementById('login-btn');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('error-msg');
const authScreen = document.getElementById('auth-screen');
const loadingScreen = document.getElementById('loading-screen');
const mainContent = document.getElementById('main-content');

// Элементы навигации и вкладок
const btnTabHistory = document.getElementById('btn-tab-history');
const btnTabReglement = document.getElementById('btn-tab-reglement');
const contentHistory = document.getElementById('content-history');
const contentReglement = document.getElementById('content-reglement');
const tabLockScreen = document.getElementById('tab-lock-screen');

// Элементы мини-авторизации 2 уровня
const level2Password = document.getElementById('level2-password');
const level2Btn = document.getElementById('level2-btn');
const level2Error = document.getElementById('level2-error');

// Логика главного экрана входа
function checkMainPassword() {
    if (passwordInput.value === GENERAL_PASSWORD) {
        authScreen.style.display = 'none';
        loadingScreen.style.display = 'flex';
        errorMsg.style.display = 'none';
        startLoadingAnimation();
    } else {
        errorMsg.style.display = 'block';
        passwordInput.value = '';
    }
}

function startLoadingAnimation() {
    const progressFill = document.querySelector('.progress-fill');
    const percentText = document.querySelector('.percent');
    let progress = 0;
    
    const interval = setInterval(() => {
        if (progress >= 100) {
            clearInterval(interval);
            loadingScreen.style.display = 'none';
            mainContent.style.display = 'flex';
            showTab("history"); // Сразу открываем Историю
        } else {
            progress += Math.floor(Math.random() * 18) + 4;
            if (progress > 100) progress = 100;
            progressFill.style.width = progress + '%';
            percentText.innerText = progress + '%';
        }
    }, 100);
}

// Переключение и обработка вкладок
function showTab(tabName) {
    currentActiveTab = tabName;
    
    // Сбрасываем активные стили кнопок
    btnTabHistory.classList.remove('active');
    btnTabReglement.classList.remove('active');
    
    // Прячем абсолютно весь контент
    contentHistory.style.display = 'none';
    contentReglement.style.display = 'none';
    tabLockScreen.style.display = 'none';

    if (tabName === "history") {
        btnTabHistory.classList.add('active');
        contentHistory.style.display = 'block';
    } 
    else if (tabName === "reglement") {
        btnTabReglement.classList.add('active');
        
        // Проверяем, вводился ли уже второй ключ
        if (isLevel2Unlocked) {
            contentReglement.style.display = 'block';
        } else {
            tabLockScreen.style.display = 'flex'; // Требуем пароль
        }
    }
}

// Проверка ключа Уровня 2 (Berserk)
function checkLevel2Password() {
    if (level2Password.value === BERSERK_PASSWORD) {
        isLevel2Unlocked = true;
        level2Error.style.display = 'none';
        tabLockScreen.style.display = 'none';
        contentReglement.style.display = 'block';
    } else {
        level2Error.style.display = 'block';
        level2Password.value = '';
    }
}

// Слушатели событий
btnTabHistory.addEventListener('click', () => showTab("history"));
btnTabReglement.addEventListener('click', () => showTab("reglement"));

level2Btn.addEventListener('click', checkLevel2Password);
level2Password.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkLevel2Password();
});

// Кнопка полного выхода
document.getElementById('logout-btn').addEventListener('click', () => {
    mainContent.style.display = 'none';
    authScreen.style.display = 'flex';
    passwordInput.value = '';
    level2Password.value = '';
    isLevel2Unlocked = false; // Сбрасываем под-пароль при выходе
});

loginBtn.addEventListener('click', checkMainPassword);
passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkMainPassword();
});