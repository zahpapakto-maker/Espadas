const GENERAL_PASSWORD = "ESPADA1997"; 
const BERSERK_PASSWORD = "ESPADA1488"; 

let isLevel2Unlocked = false; 
let currentSelectedTab = "history"; 
let currentTypewriterTimeout = null;

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

// МАТРИЧНЫЙ ЭФФЕКТ
const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');
let matrixInterval = null;
const matrixChars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const fontSize = 16;
let rainDrops = [];

function initMatrix() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const columns = canvas.width / fontSize;
    rainDrops = Array(Math.floor(columns)).fill(1);
}

function drawMatrix() {
    ctx.fillStyle = 'rgba(2, 8, 4, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ff66';
    ctx.font = fontSize + 'px monospace';
    for (let i = 0; i < rainDrops.length; i++) {
        const text = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);
        if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            rainDrops[i] = 0;
        }
        rainDrops[i]++;
    }
}

function startMatrix() {
    if (matrixInterval) clearInterval(matrixInterval);
    canvas.style.display = 'block';
    initMatrix();
    matrixInterval = setInterval(drawMatrix, 35);
}

function stopMatrix() {
    if (matrixInterval) clearInterval(matrixInterval);
    canvas.style.display = 'none';
}

window.addEventListener('resize', () => {
    if (canvas.style.display === 'block') initMatrix();
});


// СИСТЕМА САМОУНИЧТОЖЕНИЯ / БЛОКИРОВКИ
function getFailedAttempts() {
    return parseInt(localStorage.getItem('edc_failed_attempts')) || 0;
}

function incrementFailedAttempts(boxElement) {
    let failed = getFailedAttempts() + 1;
    localStorage.setItem('edc_failed_attempts', failed);
    
    // Запуск глитча при неверном пароле
    boxElement.classList.remove('glitch-error');
    void boxElement.offsetWidth; 
    boxElement.classList.add('glitch-error');
    setTimeout(() => boxElement.classList.remove('glitch-error'), 400);

    if (failed >= 3) {
        activateLockdown();
    }
}

function activateLockdown() {
    const lockTime = Date.now() + 5 * 60 * 1000; // 5 минут
    localStorage.setItem('edc_lockdown_until', lockTime);
    checkLockdownStatus();
}

function checkLockdownStatus() {
    const lockdownUntil = localStorage.getItem('edc_lockdown_until');
    if (lockdownUntil && Date.now() < parseInt(lockdownUntil)) {
        authScreen.style.display = 'none';
        mainContent.style.display = 'none';
        loadingScreen.style.display = 'none';
        stopMatrix();
        document.getElementById('lockdown-screen').style.display = 'flex';
        
        const timerInterval = setInterval(() => {
            const remaining = parseInt(lockdownUntil) - Date.now();
            if (remaining <= 0) {
                clearInterval(timerInterval);
                localStorage.removeItem('edc_lockdown_until');
                localStorage.setItem('edc_failed_attempts', 0);
                document.getElementById('lockdown-screen').style.display = 'none';
                authScreen.style.display = 'flex';
            } else {
                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);
                document.getElementById('lockdown-timer').innerText = 
                    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        }, 1000);
        return true;
    }
    return false;
}


// ЭФФЕКТ ПЕЧАТАЮЩЕГОСЯ ТЕКСТА (HTML-SAFE)
function runTabTypewriter(container) {
    if (currentTypewriterTimeout) clearTimeout(currentTypewriterTimeout);

    const elements = container.querySelectorAll('.doc-header, .doc-block, .meta-grid, .doc-text > p, .doc-text > h5, .doc-text > ul, .styled-list > li, .leader-card, .danger-box');
    
    // Сохраняем исходный HTML и скрываем блоки
    elements.forEach(el => {
        if (!el.hasAttribute('data-raw-html')) {
            el.setAttribute('data-raw-html', el.innerHTML);
        }
        el.innerHTML = '';
        el.style.display = 'none';
    });

    let currentIdx = 0;

    function typeNextBlock() {
        if (currentIdx >= elements.length) return;
        
        const el = elements[currentIdx];
        // Списки обрабатываем блоком, элементы списка печатаем отдельно
        if (el.tagName === 'UL') {
            el.style.display = 'block';
            currentIdx++;
            typeNextBlock();
            return;
        }

        el.style.display = el.classList.contains('doc-header') || el.classList.contains('doc-title-row') ? 'flex' : 'block';
        
        let fullHTML = el.getAttribute('data-raw-html');
        let progress = 0;
        
        function characterStep() {
            if (progress >= fullHTML.length) {
                currentIdx++;
                currentTypewriterTimeout = setTimeout(typeNextBlock, 30); // Пауза перед следующим абзацем
                return;
            }
            
            // Защита от разрыва HTML тегов
            if (fullHTML[progress] === '<') {
                let endTag = fullHTML.indexOf('>', progress);
                if (endTag !== -1) progress = endTag + 1;
                else progress++;
            } else {
                progress++;
            }
            
            el.innerHTML = fullHTML.substring(0, progress);
            currentTypewriterTimeout = setTimeout(characterStep, 3); // Скорость печати букв
        }
        characterStep();
    }
    typeNextBlock();
}


// АВТОРИЗАЦИЯ 1 УРОВНЯ
function checkMainPassword() {
    if (checkLockdownStatus()) return;

    if (passwordInput.value === GENERAL_PASSWORD) {
        authScreen.style.display = 'none';
        loadingScreen.style.display = 'flex';
        errorMsg.style.display = 'none';
        localStorage.setItem('edc_failed_attempts', 0);
        startLoadingAnimation();
    } else {
        errorMsg.style.display = 'block';
        passwordInput.value = '';
        incrementFailedAttempts(document.getElementById('auth-box-l1'));
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
    }, 40);
}


// УПРАВЛЕНИЕ ВКЛАДКАМИ
function renderActiveTab(tabName) {
    btnTabHistory.classList.remove('active');
    btnTabReglement.classList.remove('active');
    btnTabOperations.classList.remove('active');
    
    contentHistory.style.display = 'none';
    contentReglement.style.display = 'none';
    contentOperations.style.display = 'none';
    tabLockScreen.style.display = 'none';
    
    document.body.classList.remove('theme-blue', 'theme-red', 'theme-green');
    stopMatrix();

    if (tabName === "history") {
        btnTabHistory.classList.add('active');
        document.body.classList.add('theme-blue');
        contentHistory.style.display = 'block';
        runTabTypewriter(contentHistory);
    } 
    else if (tabName === "reglement") {
        btnTabReglement.classList.add('active');
        if (isLevel2Unlocked) {
            document.body.classList.add('theme-red');
            contentReglement.style.display = 'block';
            runTabTypewriter(contentReglement);
        } else {
            document.body.classList.add('theme-blue');
            tabLockScreen.style.display = 'flex';
        }
    }
    else if (tabName === "operations") {
        btnTabOperations.classList.add('active');
        if (isLevel2Unlocked) {
            document.body.classList.add('theme-green');
            contentOperations.style.display = 'block';
            startMatrix();
            runTabTypewriter(contentOperations);
        } else {
            document.body.classList.add('theme-blue');
            tabLockScreen.style.display = 'flex';
        }
    }
}

btnTabHistory.addEventListener('click', () => { currentSelectedTab = "history"; renderActiveTab("history"); });
btnTabReglement.addEventListener('click', () => { currentSelectedTab = "reglement"; renderActiveTab("reglement"); });
btnTabOperations.addEventListener('click', () => { currentSelectedTab = "operations"; renderActiveTab("operations"); });


// ПРОВЕРКА 2 УРОВНЯ ДОСТУПА
function checkLevel2Password() {
    if (checkLockdownStatus()) return;

    if (level2Password.value === BERSERK_PASSWORD) {
        isLevel2Unlocked = true;
        level2Error.style.display = 'none';
        level2Password.value = '';
        localStorage.setItem('edc_failed_attempts', 0);
        renderActiveTab(currentSelectedTab);
    } else {
        level2Error.style.display = 'block';
        level2Password.value = '';
        incrementFailedAttempts(document.getElementById('auth-box-l2'));
    }
}

level2Btn.addEventListener('click', checkLevel2Password);
level2Password.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkLevel2Password();
});


// ВЫХОД И ИНИЦИАЛИЗАЦИЯ СТАРТА
document.getElementById('logout-btn').addEventListener('click', () => {
    if (currentTypewriterTimeout) clearTimeout(currentTypewriterTimeout);
    mainContent.style.display = 'none';
    authScreen.style.display = 'flex';
    passwordInput.value = '';
    level2Password.value = '';
    isLevel2Unlocked = false;
    currentSelectedTab = "history";
    document.body.classList.remove('theme-red', 'theme-green');
    document.body.classList.add('theme-blue');
    stopMatrix();
});

loginBtn.addEventListener('click', checkMainPassword);
passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkMainPassword();
});

// Проверка блокировки сразу при загрузке страницы
checkLockdownStatus();