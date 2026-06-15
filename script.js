const GENERAL_PASSWORD = "ESPADA1997"; 
const BERSERK_PASSWORD = "ESPADA1488"; 

let isLevel2Unlocked = false; 
let currentSelectedTab = "history"; // Фиксируем, куда именно кликнул пользователь

// Элементы
const loginBtn = document.getElementById('login-btn');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('error-msg');
const authScreen = document.getElementById('auth-screen');
const loadingScreen = document.getElementById('loading-screen');
const mainContent = document.getElementById('main-content');

const btnTabHistory = document.getElementById('btn-tab-history');
const btnTabReglement = document.getElementById('btn-tab-reglement');
const btnTabOperations = document.getElementById('btn-tab-operations');

const contentHistory = document.getElementById('content-history');
const contentReglement = document.getElementById('content-reglement');
const contentOperations = document.getElementById('content-operations');
const tabLockScreen = document.getElementById('tab-lock-screen');

const level2Password = document.getElementById('level2-password');
const level2Btn = document.getElementById('level2-btn');
const level2Error = document.getElementById('level2-error');

function triggerAnimation(element) {
    element.classList.remove('animated-content');
    void element.offsetWidth; 
    element.classList.add('animated-content');
}

// Авторизация 1 Уровня
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
            renderActiveTab("history"); 
        } else {
            progress += Math.floor(Math.random() * 15) + 5;
            if (progress > 100) progress = 100;
            progressFill.style.width = progress + '%';
            percentText.innerText = progress + '%';
        }
    }, 50);
}

// Прямая и чистая функция отрисовки интерфейса без рекурсий
function renderActiveTab(tabName) {
    // 1. Сбрасываем активные классы со всех кнопок
    btnTabHistory.classList.remove('active');
    btnTabReglement.classList.remove('active');
    btnTabOperations.classList.remove('active');
    
    // 2. Скрываем вообще все контентные блоки
    contentHistory.style.display = 'none';
    contentReglement.style.display = 'none';
    contentOperations.style.display = 'none';
    tabLockScreen.style.display = 'none';
    
    // 3. Полностью очищаем тему с body
    document.body.classList.remove('theme-blue', 'theme-red', 'theme-green');

    // 4. Отрисовка конкретной вкладки
    if (tabName === "history") {
        btnTabHistory.classList.add('active');
        document.body.classList.add('theme-blue');
        contentHistory.style.display = 'block';
        triggerAnimation(contentHistory);
    } 
    else if (tabName === "reglement") {
        btnTabReglement.classList.add('active');
        if (isLevel2Unlocked) {
            document.body.classList.add('theme-red');
            contentReglement.style.display = 'block';
            triggerAnimation(contentReglement);
        } else {
            document.body.classList.add('theme-blue');
            tabLockScreen.style.display = 'flex';
            triggerAnimation(tabLockScreen);
        }
    }
    else if (tabName === "operations") {
        btnTabOperations.classList.add('active');
        if (isLevel2Unlocked) {
            document.body.classList.add('theme-green');
            contentOperations.style.display = 'block';
            triggerAnimation(contentOperations);
        } else {
            document.body.classList.add('theme-blue');
            tabLockScreen.style.display = 'flex';
            triggerAnimation(tabLockScreen);
        }
    }
}

// Клик по вкладкам просто меняет внутренний статус и вызывает отрисовку
btnTabHistory.addEventListener('click', () => { currentSelectedTab = "history"; renderActiveTab("history"); });
btnTabReglement.addEventListener('click', () => { currentSelectedTab = "reglement"; renderActiveTab("reglement"); });
btnTabOperations.addEventListener('click', () => { currentSelectedTab = "operations"; renderActiveTab("operations"); });

// Проверка пароля Уровня 2
function checkLevel2Password() {
    if (level2Password.value === BERSERK_PASSWORD) {
        isLevel2Unlocked = true;
        level2Error.style.display = 'none';
        level2Password.value = '';
        
        // Пароль верный — рендерим ту вкладку, на которой юзер споткнулся
        renderActiveTab(currentSelectedTab);
    } else {
        level2Error.style.display = 'block';
        level2Password.value = '';
    }
}

level2Btn.addEventListener('click', checkLevel2Password);
level2Password.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkLevel2Password();
});

// Кнопка выхода
document.getElementById('logout-btn').addEventListener('click', () => {
    mainContent.style.display = 'none';
    authScreen.style.display = 'flex';
    passwordInput.value = '';
    level2Password.value = '';
    isLevel2Unlocked = false;
    currentSelectedTab = "history";
    document.body.classList.remove('theme-red', 'theme-green');
    document.body.classList.add('theme-blue');
});

loginBtn.addEventListener('click', checkMainPassword);
passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkMainPassword();
});