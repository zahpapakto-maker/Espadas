const GENERAL_PASSWORD = "ESPADA1997"; 
const BERSERK_PASSWORD = "ESPADA1488"; 

let isLevel2Unlocked = false; 
let currentSelectedTab = "history"; 
let currentTypewriterTimeout = null;
let currentUsername = "EDC-OFFICER"; // По умолчанию

// Элементы
const loginBtn = document.getElementById('login-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('error-msg');
const authScreen = document.getElementById('auth-screen');
const loadingScreen = document.getElementById('loading-screen');
const mainContent = document.getElementById('main-content');
const welcomeUsernameSlot = document.getElementById('welcome-username');

const scanContainer = document.getElementById('scan-container');

// Элементы для экспорта
const exportOverlay = document.getElementById('export-overlay');
const redactedContent = document.getElementById('redacted-content');
const closeExportBtn = document.getElementById('close-export');
const exportDateSlot = document.getElementById('export-date');

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

// --- 1. МАТРИЧНЫЙ ЭФФЕКТ (Старый, без изменений) ---
const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');
let matrixInterval = null;
const matrixChars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const fontSize = 16;
let rainDrops = [];

function initMatrix() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const columns = canvas.width / fontSize;
    rainDrops = Array(Math.floor(columns)).fill(1);
}

function drawMatrix() {
    ctx.fillStyle = 'rgba(2, 8, 4, 0.05)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ff66'; ctx.font = fontSize + 'px monospace';
    for (let i = 0; i < rainDrops.length; i++) {
        const text = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);
        if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) rainDrops[i] = 0;
        rainDrops[i]++;
    }
}

function startMatrix() { if (matrixInterval) clearInterval(matrixInterval); canvas.style.display = 'block'; initMatrix(); matrixInterval = setInterval(drawMatrix, 35); }
function stopMatrix() { if (matrixInterval) clearInterval(matrixInterval); canvas.style.display = 'none'; }
window.addEventListener('resize', () => { if (canvas.style.display === 'block') initMatrix(); });

// --- 2. СИСТЕМА БЛОКИРОВКИ (Старый, без изменений) ---
function getFailedAttempts() { return parseInt(localStorage.getItem('edc_failed_attempts')) || 0; }
function incrementFailedAttempts(boxElement) {
    let failed = getFailedAttempts() + 1; localStorage.setItem('edc_failed_attempts', failed);
    boxElement.classList.add('glitch-error'); setTimeout(() => boxElement.classList.remove('glitch-error'), 400);
    if (failed >= 3) activateLockdown();
}
function activateLockdown() { localStorage.setItem('edc_lockdown_until', Date.now() + 5 * 60 * 1000); checkLockdownStatus(); }
function checkLockdownStatus() {
    const lockdownUntil = localStorage.getItem('edc_lockdown_until');
    if (lockdownUntil && Date.now() < parseInt(lockdownUntil)) {
        [authScreen, mainContent, loadingScreen].forEach(el => el.style.display = 'none'); stopMatrix();
        document.getElementById('lockdown-screen').style.display = 'flex';
        const timerInterval = setInterval(() => {
            const remaining = parseInt(lockdownUntil) - Date.now();
            if (remaining <= 0) {
                clearInterval(timerInterval); localStorage.removeItem('edc_lockdown_until'); localStorage.setItem('edc_failed_attempts', 0);
                document.getElementById('lockdown-screen').style.display = 'none'; authScreen.style.display = 'flex';
            } else {
                const minutes = Math.floor(remaining / 60000); const seconds = Math.floor((remaining % 60000) / 1000);
                document.getElementById('lockdown-timer').innerText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        }, 1000); return true;
    } return false;
}

// --- 3. ЭФФЕКТ ПЕЧАТАЮЩЕГОСЯ ТЕКСТА (Старый, без изменений) ---
function runTabTypewriter(container) {
    if (currentTypewriterTimeout) clearTimeout(currentTypewriterTimeout);
    const elements = container.querySelectorAll('.doc-header, .doc-block, .leader-card, .doc-text > p, .doc-text > h5, .doc-text > ul, .danger-box');
    elements.forEach(el => { if (!el.hasAttribute('data-raw-html')) el.setAttribute('data-raw-html', el.innerHTML); el.innerHTML = ''; el.style.display = 'none'; });
    let currentIdx = 0;
    function typeNextBlock() {
        if (currentIdx >= elements.length) return;
        const el = elements[currentIdx];
        if (el.tagName === 'UL') { el.style.display = 'block'; currentIdx++; typeNextBlock(); return; }
        el.style.display = el.classList.contains('doc-header') || el.classList.contains('doc-title-row') ? 'flex' : 'block';
        let fullHTML = el.getAttribute('data-raw-html'); let progress = 0;
        function characterStep() {
            if (progress >= fullHTML.length) { currentIdx++; currentTypewriterTimeout = setTimeout(typeNextBlock, 30); return; }
            if (fullHTML[progress] === '<') { let endTag = fullHTML.indexOf('>', progress); if (endTag !== -1) progress = endTag + 1; else progress++; } else { progress++; }
            el.innerHTML = fullHTML.substring(0, progress); currentTypewriterTimeout = setTimeout(characterStep, 3);
        } characterStep();
    } typeNextBlock();
}

// --- 4. АВТОРИЗАЦИЯ 1 УРОВНЯ С СИМУЛЯЦИЕЙ СКАНЕРА (Новый) ---
function checkMainPassword() {
    if (checkLockdownStatus()) return;

    // Прячем кнопку и вводы, показываем сканер
    loginBtn.style.display = 'none';
    scanContainer.style.display = 'block';
    errorMsg.style.display = 'none';

    // Эмулируем время сканирования сетчатки
    setTimeout(() => {
        // Убираем сканер, возвращаем кнопку (на случай ошибки)
        scanContainer.style.display = 'none';
        loginBtn.style.display = 'block';

        if (passwordInput.value === GENERAL_PASSWORD) {
            // Успех
            authScreen.style.display = 'none';
            loadingScreen.style.display = 'flex';
            localStorage.setItem('edc_failed_attempts', 0);
            
            // Запоминаем логин для приветствия
            currentUsername = usernameInput.value.trim() || "EDC-OFFICER";
            
            startLoadingAnimation();
        } else {
            // Ошибка
            errorMsg.style.display = 'block';
            passwordInput.value = '';
            incrementFailedAttempts(document.getElementById('auth-box-l1'));
        }
    }, 2500); // 2.5 секунды на скан
}

function startLoadingAnimation() {
    const progressFill = document.querySelector('.progress-fill');
    const percentText = document.querySelector('.percent');
    let progress = 0;
    const interval = setInterval(() => {
        if (progress >= 100) {
            clearInterval(interval); loadingScreen.style.display = 'none'; mainContent.style.display = 'flex';
            welcomeUsernameSlot.innerText = currentUsername; // Вставляем имя в приветствие
            renderActiveTab("history"); 
        } else {
            progress += Math.floor(Math.random() * 15) + 5; if (progress > 100) progress = 100;
            progressFill.style.width = progress + '%'; percentText.innerText = progress + '%';
        }
    }, 50);
}

// --- 5. УПРАВЛЕНИЕ ВКЛАДКАМИ (Старый + Приветствие) ---
function renderActiveTab(tabName) {
    [btnTabHistory, btnTabReglement, btnTabOperations].forEach(b => b.classList.remove('active'));
    [contentHistory, contentReglement, contentOperations, tabLockScreen].forEach(c => c.style.display = 'none');
    document.body.classList.remove('theme-blue', 'theme-red', 'theme-green'); stopMatrix();

    if (tabName === "history") {
        btnTabHistory.classList.add('active'); document.body.classList.add('theme-blue'); contentHistory.style.display = 'block';
        runTabTypewriter(contentHistory);
    } 
    else if (tabName === "reglement") {
        btnTabReglement.classList.add('active');
        if (isLevel2Unlocked) {
            document.body.classList.add('theme-red'); contentReglement.style.display = 'block'; runTabTypewriter(contentReglement);
        } else {
            document.body.classList.add('theme-blue'); tabLockScreen.style.display = 'flex';
        }
    }
    else if (tabName === "operations") {
        btnTabOperations.classList.add('active');
        if (isLevel2Unlocked) {
            document.body.classList.add('theme-green'); contentOperations.style.display = 'block';
            startMatrix(); // Запускаем матрицу
            runTabTypewriter(contentOperations); // TFB текст
        } else {
            document.body.classList.add('theme-blue'); tabLockScreen.style.display = 'flex';
        }
    }
}

[btnTabHistory, btnTabReglement, btnTabOperations].forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentSelectedTab = e.currentTarget.id.replace('btn-tab-', '');
        renderActiveTab(currentSelectedTab);
    });
});

// --- 6. ПРОВЕРКА 2 УРОВНЯ ДОСТУПА (Старый, без сканера) ---
function checkLevel2Password() {
    if (checkLockdownStatus()) return;
    if (level2Password.value === BERSERK_PASSWORD) {
        isLevel2Unlocked = true; level2Error.style.display = 'none'; level2Password.value = '';
        localStorage.setItem('edc_failed_attempts', 0); renderActiveTab(currentSelectedTab);
    } else {
        level2Error.style.display = 'block'; level2Password.value = '';
        incrementFailedAttempts(document.getElementById('auth-box-l2'));
    }
}
level2Btn.addEventListener('click', checkLevel2Password);
level2Password.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkLevel2Password(); });

// --- 7. ЭКСПОРТ И "ЦЕНЗУРА" ДОСЬЕ (Новый) ---
// Функция, которая берет текст и цензурирует 90% слов
function redactedTextGenerator(htmlContent) {
    let tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Получаем все абзацы, заголовки, списки
    let elements = tempDiv.querySelectorAll('p, li, h5, h6, .doc-title-row > h4');
    
    elements.forEach(el => {
        let text = el.innerText;
        let words = text.split(' ');
        
        // Оставляем только заголовок досье и мета-сетку нетронутыми
        if (el.classList.contains('italic-note') || el.classList.contains('meta-grid')) return;

        let redactedWords = words.map(word => {
            // Шанс 90% что слово будет зацензурено
            if (Math.random() < 0.90 && word.length > 2) {
                // Генерируем плашку █████ такой же длины как слово
                let blocks = "█".repeat(word.length);
                return `<span class="censored-block">${blocks}</span>`;
            }
            // 10% оставляем (чтобы заголовок был виден)
            return word;
        });
        
        el.innerHTML = redactedWords.join(' ');
    });
    
    return tempDiv.innerHTML;
}

function openRedactedDoc() {
    // Получаем HTML-контент текущей активной вкладки
    let currentContentHtml = "";
    if (currentSelectedTab === "history") currentContentHtml = contentHistory.querySelector('.doc-text').innerHTML;
    else if (currentSelectedTab === "reglement") currentContentHtml = contentReglement.querySelector('.doc-text').innerHTML;
    else if (currentSelectedTab === "operations") currentContentHtml = contentOperations.querySelector('.doc-text').innerHTML;

    // Цензурируем его
    redactedContent.innerHTML = redactedTextGenerator(currentContentHtml);
    
    // Вставляем текущую дату
    exportDateSlot.innerText = new Date().toLocaleDateString();
    
    exportOverlay.style.display = 'flex';
}

function closeRedactedDoc() {
    exportOverlay.style.display = 'none';
}

// Привязываем кнопки экспорта (в каждой вкладке она есть)
document.querySelectorAll('.export-btn').forEach(btn => {
    btn.addEventListener('click', openRedactedDoc);
});

closeExportBtn.addEventListener('click', closeRedactedDoc);


// ВЫХОД
document.getElementById('logout-btn').addEventListener('click', () => {
    if (currentTypewriterTimeout) clearTimeout(currentTypewriterTimeout);
    mainContent.style.display = 'none'; authScreen.style.display = 'flex';
    [passwordInput, usernameInput, level2Password].forEach(i => i.value = '');
    isLevel2Unlocked = false; currentSelectedTab = "history";
    document.body.classList.remove('theme-red', 'theme-green'); document.body.classList.add('theme-blue');
    stopMatrix(); closeRedactedDoc();
});

loginBtn.addEventListener('click', checkMainPassword);
passwordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkMainPassword(); });

checkLockdownStatus();