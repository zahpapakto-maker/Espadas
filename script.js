const GENERAL_PASSWORD = "ESPADA1997"; 
const BERSERK_PASSWORD = "ESPADA1488"; 

let isLevel2Unlocked = false; 
let currentSelectedTab = "history"; 
let currentTypewriterTimeout = null;
let currentUsername = "EDC-OFFICER";

// Звуковой движок (Web Audio API) — Синтезирует звуки на лету!
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSoundClick() {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.04);
}

function playSoundScan() {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 2.3);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.5);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 2.5);
}

function playSoundError() {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.35);
}

function playSoundGlitch() {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(Math.random() * 400 + 50, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}

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

const exportOverlay = document.getElementById('export-overlay');
const redactedContent = document.getElementById('redacted-content');
const closeExportBtn = document.getElementById('close-export');
const exportDateSlot = document.getElementById('export-date');
const exportLevelSlot = document.getElementById('export-level');

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

// --- 1. МАТРИЧНЫЙ ЭФФЕКТ ---
const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');
let matrixInterval = null;
const matrixChars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const fontSize = 16;
let rainDrops = [];

function initMatrix() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const columns = canvas.width / fontSize; rainDrops = Array(Math.floor(columns)).fill(1);
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

// --- 2. СИСТЕМА БЛОКИРОВКИ ---
function getFailedAttempts() { return parseInt(localStorage.getItem('edc_failed_attempts')) || 0; }
function incrementFailedAttempts(boxElement) {
    let failed = getFailedAttempts() + 1; localStorage.setItem('edc_failed_attempts', failed);
    boxElement.classList.add('glitch-error'); setTimeout(() => boxElement.classList.remove('glitch-error'), 400);
    playSoundError();
    if (failed >= 3) activateLockdown();
}
function activateLockdown() { localStorage.setItem('edc_lockdown_until', Date.now() + 5 * 60 * 1000); checkLockdownStatus(); }
function checkLockdownStatus() {
    const lockdownUntil = localStorage.getItem('edc_lockdown_until');
    if (lockdownUntil && Date.now() < parseInt(lockdownUntil)) {
        [authScreen, mainContent, loadingScreen].forEach(el => el.style.display = 'none'); stopMatrix();
        document.getElementById('lockdown-screen').style.display = 'flex';
        // Звук тревоги при локдауне
        if(audioCtx) playSoundError();
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

// --- 3. ЭФФЕКТ ПЕЧАТАЮЩЕГОСЯ ТЕКСТА ---
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
            el.innerHTML = fullHTML.substring(0, progress);
            if (Math.random() > 0.7) playSoundClick(); // Механический звук печати букв
            currentTypewriterTimeout = setTimeout(characterStep, 3);
        } characterStep();
    } typeNextBlock();
}

// --- 4. АВТОРИЗАЦИЯ СО СКАНЕРОМ СЕТЧАТКИ ---
function checkMainPassword() {
    initAudio();
    if (checkLockdownStatus()) return;

    loginBtn.style.display = 'none';
    scanContainer.style.display = 'block';
    errorMsg.style.display = 'none';
    playSoundScan(); // Звук сканирования

    setTimeout(() => {
        scanContainer.style.display = 'none';
        loginBtn.style.display = 'block';

        if (passwordInput.value === GENERAL_PASSWORD) {
            authScreen.style.display = 'none';
            loadingScreen.style.display = 'flex';
            localStorage.setItem('edc_failed_attempts', 0);
            currentUsername = usernameInput.value.trim() || "EDC-OFFICER";
            startLoadingAnimation();
        } else {
            errorMsg.style.display = 'block';
            passwordInput.value = '';
            incrementFailedAttempts(document.getElementById('auth-box-l1'));
        }
    }, 2500);
}

function startLoadingAnimation() {
    const progressFill = document.querySelector('.progress-fill');
    const percentText = document.querySelector('.percent');
    let progress = 0;
    const interval = setInterval(() => {
        if (progress >= 100) {
            clearInterval(interval); loadingScreen.style.display = 'none'; mainContent.style.display = 'flex';
            welcomeUsernameSlot.innerText = currentUsername;
            renderActiveTab("history"); 
        } else {
            progress += Math.floor(Math.random() * 15) + 5; if (progress > 100) progress = 100;
            progressFill.style.width = progress + '%'; percentText.innerText = progress + '%';
            playSoundClick();
        }
    }, 60);
}

// --- 5. УПРАВЛЕНИЕ ВКЛАДКАМИ ---
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
            startMatrix(); runTabTypewriter(contentOperations);
        } else {
            document.body.classList.add('theme-blue'); tabLockScreen.style.display = 'flex';
        }
    }
}

[btnTabHistory, btnTabReglement, btnTabOperations].forEach(btn => {
    btn.addEventListener('click', (e) => {
        playSoundClick();
        currentSelectedTab = e.currentTarget.id.replace('btn-tab-', '');
        renderActiveTab(currentSelectedTab);
    });
});

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

// --- 6. ЭКСПОРТ И ИСПРАВЛЕННАЯ ЦЕНЗУРА ДОСЬЕ ---
function redactedTextGenerator(htmlContent) {
    let tempDiv = document.createElement('div'); tempDiv.innerHTML = htmlContent;
    let elements = tempDiv.querySelectorAll('p, li, h5, h6, .doc-title-row > h4');
    elements.forEach(el => {
        let text = el.innerText; let words = text.split(' ');
        if (el.classList.contains('italic-note') || el.classList.contains('meta-grid')) return;
        let redactedWords = words.map(word => {
            if (Math.random() < 0.90 && word.length > 2) {
                return `<span class="censored-block">${"█".repeat(word.length)}</span>`;
            } return word;
        });
        el.innerHTML = redactedWords.join(' ');
    });
    return tempDiv.innerHTML;
}

function openRedactedDoc() {
    playSoundClick();
    let currentContentHtml = "";
    
    // ИСПРАВЛЕНИЕ: Динамическое выставление уровня секретности
    if (currentSelectedTab === "history") {
        currentContentHtml = contentHistory.querySelector('.doc-text').innerHTML;
        exportLevelSlot.innerText = "01-LEVEL / GENERAL";
        exportLevelSlot.style.color = "#00a2ff";
    } else if (currentSelectedTab === "reglement") {
        currentContentHtml = contentReglement.querySelector('.doc-text').innerHTML;
        exportLevelSlot.innerText = "02-LEVEL / TFB OVERRIDE";
        exportLevelSlot.style.color = "#ff3344";
    } else if (currentSelectedTab === "operations") {
        currentContentHtml = contentOperations.querySelector('.doc-text').innerHTML;
        exportLevelSlot.innerText = "02-LEVEL / TFB OVERRIDE";
        exportLevelSlot.style.color = "#ff3344";
    }

    redactedContent.innerHTML = redactedTextGenerator(currentContentHtml);
    exportDateSlot.innerText = new Date().toLocaleDateString();
    exportOverlay.style.display = 'flex';
}
document.querySelectorAll('.export-btn').forEach(btn => btn.addEventListener('click', openRedactedDoc));
closeExportBtn.addEventListener('click', () => { playSoundClick(); exportOverlay.style.display = 'none'; });

// --- 7. СЛУЧАЙНЫЕ АТМОСФЕРНЫЕ АНОМАЛИИ ---
const toastContainer = document.getElementById('tactical-toast');
const toastBody = document.getElementById('toast-body');
const anomalyBlip = document.getElementById('anomaly-blip');

const notificationTexts = [
    "Запрос проверки целостности данных от САЭ...",
    "Внимание: Зафиксирован всплеск активности в эфире TFB-GREEN.",
    "Синхронизация тактических ретрансляторов завершена.",
    "Перехват зашифрованного пакета... Ошибка декомпиляции."
];

setInterval(() => {
    // Аномалии срабатывают, только если пользователь вошел в архив
    if (mainContent.style.display === 'flex') {
        let dice = Math.random();

        // 1. Аномалия: Глитч экрана
        if (dice < 0.3) {
            document.body.classList.add('ambient-glitch');
            playSoundGlitch();
            setTimeout(() => document.body.classList.remove('ambient-glitch'), 150);
        } 
        // 2. Аномалия: Военное уведомление в углу
        else if (dice < 0.6) {
            let randomText = notificationTexts[Math.floor(Math.random() * notificationTexts.length)];
            toastBody.innerText = randomText;
            toastContainer.style.display = 'block';
            playSoundGlitch();
            setTimeout(() => { toastContainer.style.display = 'none'; }, 4000);
        } 
        // 3. Аномалия: Появление угрозы на радаре
        else if (dice < 0.9 && currentSelectedTab === "operations") {
            if (anomalyBlip) {
                anomalyBlip.style.display = 'block';
                setTimeout(() => { anomalyBlip.style.display = 'none'; }, 5000);
            }
        }
    }
}, 15000); // Проверка каждые 15 секунд для динамики


// ВЫХОД
document.getElementById('logout-btn').addEventListener('click', () => {
    playSoundClick(); if (currentTypewriterTimeout) clearTimeout(currentTypewriterTimeout);
    mainContent.style.display = 'none'; authScreen.style.display = 'flex';
    [passwordInput, usernameInput, level2Password].forEach(i => i.value = '');
    isLevel2Unlocked = false; currentSelectedTab = "history";
    document.body.classList.remove('theme-red', 'theme-green', 'theme-blue'); document.body.classList.add('theme-blue');
    stopMatrix(); exportOverlay.style.display = 'none';
});

loginBtn.addEventListener('click', checkMainPassword);
passwordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkMainPassword(); });
level2Password.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkLevel2Password(); });

// Отслеживание кликов по полям ввода для звука
document.querySelectorAll('input').forEach(input => input.addEventListener('click', initAudio));

checkLockdownStatus();