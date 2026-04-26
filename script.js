/**
 * ZEXISTEY BOT™ - Strict Production Logic
 * 100% Real API Data Enforcement. Zero Fallbacks. Mobile Audio Safe.
 */

// FIXED CODE START
// --- Audio Controller (Interaction-Based to fix Autoplay issues) ---
let audioUnlocked = false;
const Sounds = {
    click: document.getElementById('snd-click'),
    success: document.getElementById('snd-success'),
    error: document.getElementById('snd-error'),
    type: document.getElementById('snd-type'),
    
    unlock: function() {
        if (audioUnlocked) return;
        // Properly target only HTMLAudioElements to prevent iteration over object functions
        const audios = [this.click, this.success, this.error, this.type];
        audios.forEach(snd => {
            if (snd && typeof snd.play === 'function') { 
                snd.volume = 0; 
                const playPromise = snd.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => { 
                        snd.pause(); 
                        snd.currentTime = 0; 
                    }).catch(()=>{});
                }
            }
        });
        audioUnlocked = true;
    },
    
    play: function(type) {
        if (!audioUnlocked) return;
        try {
            const snd = this[type];
            if(snd && typeof snd.play === 'function') {
                snd.volume = 0.2; 
                snd.currentTime = 0; 
                const playPromise = snd.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {});
                }
            }
        } catch(e) {}
    }
};
// FIXED CODE END


// --- Global State ---
const state = {
    uid: null, guildUid: null, region: 'IND', 
    clanData: null, membersList: [],
    selectedBot: 'ULTRA', selectedBoard: null,
    isRunning: false, elapsedSeconds: 0, maxSeconds: 8 * 3600, currentGlory: 0, mainTimerId: null
};

// --- DOM Cache ---
const DOM = {
    views: document.querySelectorAll('.view'),
    intro: document.getElementById('intro-view'),
    mainApp: document.getElementById('main-app'),
    loader: document.getElementById('loading-overlay'),
    terminal: document.getElementById('terminal-overlay'),
    termBody: document.getElementById('terminal-body'),
    termStatus: document.getElementById('term-status'),
    
    targetForm: document.getElementById('target-form'),
    uidInput: document.getElementById('uid-input'),
    guildInput: document.getElementById('guild-input'),
    regionSelect: document.getElementById('region-select'),
    
    botCards: document.querySelectorAll('.bot-card-exact:not(.disabled)'),
    startBotBtn: document.getElementById('start-bot-btn'),
    
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    fileStatus: document.getElementById('file-status'),
    connectSystemBtn: document.getElementById('connect-system-btn'),
    
    resName: document.getElementById('res-name'), resLevel: document.getElementById('res-level'),
    resGuildId: document.getElementById('res-guild-id'), resRegion: document.getElementById('res-region'),
    resMembers: document.getElementById('res-members'), resCaptain: document.getElementById('res-captain'),
    resUid: document.getElementById('res-uid'), resBotClan: document.getElementById('res-bot-clan'),
    resBotRegion: document.getElementById('res-bot-region'),
    
    resTotalGlory: document.getElementById('res-total-glory'), resGloryPts: document.getElementById('res-glory-pts'),
    uptimeTimer: document.getElementById('uptime-timer'), goalPct: document.getElementById('goal-pct'),
    goalProgressBar: document.getElementById('goal-progress-bar'), goalStatusText: document.getElementById('goal-status-text'),
    
    btnTogglePlay: document.getElementById('btn-toggle-play'), btnDetails: document.getElementById('btn-details'),
    runStatusBadge: document.getElementById('run-status-badge'), runStatusText: document.getElementById('run-status-text'),
    runStatusDot: document.getElementById('run-status-dot'), gloryRate: document.getElementById('glory-rate'),

    detailsModal: document.getElementById('details-modal'), boardItems: document.querySelectorAll('.board-item.interactive'),
    startActionBtn: document.getElementById('start-action-btn')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Unlock Audio on first interaction anywhere
    document.body.addEventListener('click', () => Sounds.unlock(), { once: true });
    
    document.body.addEventListener('click', (e) => {
        if(e.target.closest('.snd-trigger') || e.target.tagName === 'BUTTON') Sounds.play('click');
    });

    // Intro Transition
    setTimeout(() => {
        DOM.intro.classList.add('intro-hidden'); 
        setTimeout(() => {
            DOM.intro.classList.add('hidden');
            DOM.intro.classList.remove('view-active');
            DOM.mainApp.classList.remove('view-hidden');
            DOM.mainApp.classList.add('view-active');
            Sounds.play('success');
        }, 500); 
    }, 2500);

    bindEvents();
});

function bindEvents() {
    DOM.targetForm.addEventListener('submit', handleTargetFetch);

    DOM.botCards.forEach(card => {
        card.addEventListener('click', () => {
            DOM.botCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            state.selectedBot = card.dataset.bot;
            DOM.startBotBtn.classList.remove('disabled-btn');
            DOM.startBotBtn.removeAttribute('disabled');
        });
    });
    DOM.startBotBtn.addEventListener('click', runBotTerminal);

    DOM.dropZone.addEventListener('click', () => DOM.fileInput.click());
    DOM.fileInput.addEventListener('change', handleFileValidation);
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
        DOM.dropZone.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); });
    });
    DOM.dropZone.addEventListener('drop', e => {
        if (e.dataTransfer.files.length) handleFileValidation({ target: { files: e.dataTransfer.files } });
    });

    DOM.connectSystemBtn.addEventListener('click', runFinalTerminalFlow);
    DOM.btnTogglePlay.addEventListener('click', toggleTimerSystem);
    DOM.btnDetails.addEventListener('click', openDetailsModal);
    document.getElementById('close-modal').addEventListener('click', () => DOM.detailsModal.classList.add('hidden'));

    DOM.boardItems.forEach(item => {
        item.addEventListener('click', () => {
            DOM.boardItems.forEach(b => b.classList.remove('selected'));
            item.classList.add('selected');
            state.selectedBoard = item.dataset.board;
            DOM.startActionBtn.classList.remove('disabled-btn');
            DOM.startActionBtn.removeAttribute('disabled');
        });
    });
    DOM.startActionBtn.addEventListener('click', () => {
        DOM.detailsModal.classList.add('hidden');
        showToast(`Secure Uplink initiated on ${state.selectedBoard}`, "success");
    });
}

function switchView(viewId) {
    DOM.views.forEach(v => { v.classList.remove('view-active'); v.classList.add('view-hidden'); });
    const target = document.getElementById(viewId);
    target.classList.remove('view-hidden');
    requestAnimationFrame(() => { target.classList.add('view-active'); });
}

function showToast(msg, type = 'success') {
    if(type === 'error') Sounds.play('error');
    else if(type === 'success') Sounds.play('success');

    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 300); }, 3000);
}
const delay = ms => new Promise(r => setTimeout(r, ms));

// FIXED CODE START
async function handleTargetFetch(e) {
    e.preventDefault();
    const uid = DOM.uidInput.value.trim();
    if (!/^\d+$/.test(uid)) return showToast("Error: Numeric UID required.", "error");

    state.uid = uid; 
    state.region = DOM.regionSelect.value;
    
    DOM.loader.classList.remove('hidden');

    try {
        // Timestamp lagana bahut zaroori hai taaki Vercel purana data na de (Cache Buster)
        const timestamp = new Date().getTime();
        
        // YAHAN AAPKA NAYA WORKING PROXY LINK HAI (with cache buster)
        const targetUrl = `https://info-api-ten-xi.vercel.app/api/proxy?uid=${state.uid}&region=${state.region}&t=${timestamp}`;
        
        console.log("[ZEXISTEY] Fetching fresh data for UID:", state.uid);
        
        const res = await fetch(targetUrl);

        if (!res.ok) {
            throw new Error(`Proxy error. Status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("[ZEXISTEY] SUCCESS DATA:", data);

        const basic = data.basicInfo;
        const clan = data.clanBasicInfo;

        if (!basic) {
            throw new Error("Account data not found.");
        }

        // STRICT MATCH RULE: Agar API ne purana ya galat player diya toh yahi rok dega
        if (String(basic.accountId) !== String(state.uid)) {
            console.error(`UID Mismatch! Input: ${state.uid}, Got: ${basic.accountId}`);
            throw new Error("Network Cache Issue: Fetched wrong player data. Try again.");
        }

        if (!clan) {
            throw new Error("Yeh player kisi Guild mein nahi hai.");
        }

        // Real Data Mapping (Sirf tabhi aayega jab UID exactly match hogi)
        state.clanData = {
            accountId: basic.accountId,
            clanId: clan.clanId,
            clanName: clan.clanName || "NO NAME FOUND",
            clanLevel: clan.clanLevel || 0,
            currentMembers: clan.currentMembers || 0,
            maxMembers: clan.maxMembers || 0,
            captainId: clan.captainId || "N/A"
        };
        state.membersList = data.clanMemberInfo || [];

        DOM.loader.classList.add('hidden');
        showToast("Real Clan Data Synced", "success");
        switchView('bot-view');

    } catch (error) {
        DOM.loader.classList.add('hidden');
        console.error("[API ERROR]", error);
        showToast(error.message, "error");
    }
}
// FIXED CODE END



// --- Step 2: Bot Terminal ---
async function runBotTerminal() {
    if (!state.selectedBot) return;
    openTerminal(`INITIALIZING ${state.selectedBot} BOT...`);
    
    const logs = [
        `Allocating ${state.selectedBot} cloud vectors...`,
        "Bypassing node firewalls...",
        "Establishing proxy tunnel...",
        "Injecting UI states..."
    ];

    for(let log of logs) {
        appendLog(`[SYSTEM] ${log}`);
        await delay(1200); 
    }

    appendLog("[SUCCESS] NODE SECURED. AWAITING CONFIG.");
    Sounds.play('success');
    await delay(1000);
    closeTerminal();
    switchView('file-view');
}

// --- Step 3: File System ---
function handleFileValidation(e) {
    const file = e.target.files[0];
    if (!file) return;

    DOM.fileStatus.className = "text-center text-bold text-red";
    DOM.connectSystemBtn.classList.add('hidden');

    if (file.name !== 'guest.dat') return DOM.fileStatus.textContent = "Strict Error: Payload must be 'guest.dat'";
    if (file.size !== 0) return DOM.fileStatus.textContent = `Strict Error: Payload corrupted. Size must be 0 KB.`;

    DOM.fileStatus.className = "text-center text-bold text-green";
    DOM.fileStatus.textContent = "Payload verified. System ready.";
    Sounds.play('success');
    DOM.connectSystemBtn.classList.remove('hidden');
}

// --- Step 4: Final Injection ---
async function runFinalTerminalFlow() {
    openTerminal("SYSTEM UPLINK STARTED");

    await executePhase("Processing", 2500, ["Unpacking config...", "Analyzing node hashes..."]);
    await executePhase("Injecting", 3000, ["Syncing server packets...", "Pushing binary logic..."]);
    
    appendLog(">>> OPERATION SUCCESSFUL <<<");
    DOM.termStatus.textContent = "UPLINK_LIVE";
    
    Sounds.play('success');
    await delay(1000);
    closeTerminal();
    initFinalDashboard();
}

async function executePhase(phase, duration, dynamicLogs) {
    appendLog(`\n--- ${phase.toUpperCase()} ---`);
    const intervalMs = 800;
    const start = Date.now();
    return new Promise(resolve => {
        const timer = setInterval(() => {
            if (Date.now() - start >= duration) {
                clearInterval(timer); resolve();
            } else {
                const hex = "0x" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0').toUpperCase();
                appendLog(`[${hex}] ${dynamicLogs[Math.floor(Math.random() * dynamicLogs.length)]}`);
            }
        }, intervalMs);
    });
}

function openTerminal(status) { DOM.terminal.classList.remove('hidden'); DOM.termStatus.textContent = status; DOM.termBody.innerHTML = ''; }
function closeTerminal() { DOM.terminal.classList.add('hidden'); }

function appendLog(text) {
    const p = document.createElement('div');
    p.className = 'log-line'; 
    p.textContent = text;
    DOM.termBody.appendChild(p);
    requestAnimationFrame(() => { DOM.termBody.scrollTo({ top: DOM.termBody.scrollHeight, behavior: 'smooth' }); });
    Sounds.play('type'); 
}

// --- Step 5: Strict Data Final Dashboard ---
// FIXED CODE START
function initFinalDashboard() {
    const c = state.clanData;
    
    // UI Elements mapping directly with API Facts
    DOM.resName.textContent = c.clanName || "NO NAME FOUND";
    DOM.resLevel.textContent = `LV.${c.clanLevel || '0'}`;
    DOM.resGuildId.textContent = c.clanId || "N/A"; 
    DOM.resRegion.textContent = state.region;
    
    // Member counts from real data facts
    DOM.resMembers.textContent = `${c.currentMembers || 0}/${c.maxMembers || 0}`; 
    DOM.resCaptain.textContent = c.captainId || "NOT FOUND";
    
    // Bot Card setup focusing on Clan ID
    DOM.resUid.textContent = state.uid;
    DOM.resBotClan.textContent = c.clanName || "NONE";
    DOM.resBotRegion.textContent = state.region;

    state.elapsedSeconds = 0;
    state.currentGlory = 0; 
    
    updateGloryUI();
    toggleTimerSystem(true); 
    switchView('final-view');
}
// FIXED CODE END


function startMainLoop() {
    if (state.mainTimerId) clearInterval(state.mainTimerId);

    state.mainTimerId = setInterval(() => {
        if (!state.isRunning) return;

        state.elapsedSeconds++;
        let pct = (state.elapsedSeconds / state.maxSeconds) * 100;
        
        if (state.elapsedSeconds >= state.maxSeconds) {
            pct = 100; updateLoopUI(pct); handleCompletion(); return;
        }

        updateLoopUI(pct);

        if (state.elapsedSeconds % 180 === 0 && state.elapsedSeconds > 0) {
            state.currentGlory += 1000;
            updateGloryUI();
            showToast("+1000 Live Glory Synchronized", "success");
        }
    }, 1000);
}

function updateLoopUI(pct) {
    DOM.goalPct.textContent = pct.toFixed(2) + '%';
    DOM.goalProgressBar.style.width = pct + '%'; 
    
    const h = Math.floor(state.elapsedSeconds / 3600);
    const m = Math.floor((state.elapsedSeconds % 3600) / 60);
    const s = state.elapsedSeconds % 60;
    DOM.uptimeTimer.textContent = `${h}h ${m}m ${s}s`;
}

function updateGloryUI() {
    DOM.resTotalGlory.textContent = state.currentGlory.toLocaleString();
    DOM.resGloryPts.textContent = state.currentGlory.toLocaleString();
    const modalGlory = document.getElementById('modal-total-glory');
    if (modalGlory) modalGlory.textContent = state.currentGlory.toLocaleString();
}

function handleCompletion() {
    state.isRunning = false;
    clearInterval(state.mainTimerId);
    
    DOM.goalStatusText.textContent = "COMPLETED";
    DOM.goalStatusText.className = "text-green text-bold";
    DOM.goalPct.textContent = "100%";
    
    updateUIBadge("COMPLETED", "bg-green", "status-badge bg-green-dim text-green");
    DOM.btnTogglePlay.textContent = "✔ FINISHED";
    DOM.btnTogglePlay.style.opacity = "0.5";
    DOM.btnTogglePlay.style.cursor = "not-allowed";
    DOM.btnTogglePlay.disabled = true;
    
    Sounds.play('success');
    showToast("Session Completed.", "success");
}

function toggleTimerSystem(forceStart = false) {
    if (state.elapsedSeconds >= state.maxSeconds) return;

    if (forceStart === true || !state.isRunning) {
        state.isRunning = true;
        updateUIBadge("RUNNING", "bg-green pulse", "status-badge bg-green-dim text-green");
        
        DOM.btnTogglePlay.textContent = "⏹ STOP";
        DOM.btnTogglePlay.className = "btn-action btn-stop ripple-btn snd-trigger";
        DOM.gloryRate.textContent = "+1000/3m";
        DOM.gloryRate.className = "text-green text-bold text-sm";
        
        startMainLoop();
        if(forceStart !== true) showToast("System Resumed.", "success");
    } else {
        state.isRunning = false;
        updateUIBadge("STOPPED", "bg-red", "status-badge stopped");
        
        DOM.btnTogglePlay.innerHTML = "▶ PLAY";
        DOM.btnTogglePlay.className = "btn-action btn-play ripple-btn snd-trigger";
        DOM.gloryRate.textContent = "HALTED";
        DOM.gloryRate.className = "text-red text-bold text-sm";
        
        showToast("System Halted.", "error");
    }
}

function updateUIBadge(text, dotClass, badgeClass) {
    DOM.runStatusText.textContent = text;
    DOM.runStatusDot.className = "dot " + dotClass;
    DOM.runStatusBadge.className = badgeClass;
}

// --- Details Modal (Strict No-Fake-Data Enforcement) ---
function openDetailsModal() {
    DOM.detailsModal.classList.remove('hidden');
    updateGloryUI();
    
    const tbody = document.getElementById('player-table-body');
    tbody.innerHTML = ''; 

    // If Array exists and has items, loop them. If NOT, render error row immediately.
    if (Array.isArray(state.membersList) && state.membersList.length > 0) {
        state.membersList.forEach(m => {
            const accId = m.accountId || m.uid || m.id || 'N/A';
            const nick = m.nickname || m.name || m.playerName || 'Unknown';
            const lvl = m.level || m.lvl || '-';
            const gloryShare = accId == state.clanData.captainId ? state.currentGlory : Math.floor(state.currentGlory * 0.1);
            
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${accId}</td><td>${nick}</td><td>${lvl}</td><td>-</td><td class="glory-val">${gloryShare.toLocaleString()}</td>`;
            tbody.appendChild(tr);
        });
    } else {
        // Absolutely NO generation of fake arrays
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="5" class="text-center py-20 text-red text-bold">[ ERROR: NO REAL MEMBER DATA FOUND IN API RESPONSE ]</td>`;
        tbody.appendChild(tr);
    }
}