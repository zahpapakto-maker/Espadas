// Пароль доступа к архиву
const CORRECT_PASSWORD = "ESPADA1997";

const loginBtn = document.getElementById('login-btn');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('error-msg');

const authScreen = document.getElementById('auth-screen');
const loadingScreen = document.getElementById('loading-screen');
const mainContent = document.getElementById('main-content');

// Проверка валидности пароля
function checkPassword() {
    if (passwordInput.value === CORRECT_PASSWORD) {
        authScreen.style.display = 'none';
        loadingScreen.style.display = 'flex';
        errorMsg.style.display = 'none';
        
        startLoadingAnimation();
    } else {
        errorMsg.style.display = 'block';
        passwordInput.value = '';
    }
}

// Плавная хакерская загрузка архива
function startLoadingAnimation() {
    const progressFill = document.querySelector('.progress-fill');
    const percentText = document.querySelector('.percent');
    let progress = 0;
    
    const interval = setInterval(() => {
        if (progress >= 100) {
            clearInterval(interval);
            loadingScreen.style.display = 'none';
            mainContent.style.display = 'flex';
        } else {
            progress += Math.floor(Math.random() * 18) + 4;
            if (progress > 100) progress = 100;
            progressFill.style.width = progress + '%';
            percentText.innerText = progress + '%';
        }
    }, 120);
}

// Выход из системы
document.getElementById('logout-btn').addEventListener('click', () => {
    mainContent.style.display = 'none';
    authScreen.style.display = 'flex';
    passwordInput.value = '';
});

loginBtn.addEventListener('click', checkPassword);
passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkPassword();
});