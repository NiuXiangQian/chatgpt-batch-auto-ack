const BROWSER_LANG = chrome.i18n.getUILanguage().toLowerCase().startsWith("zh") ? "zh" : "en", KEY_MAP = {
    title: "title",
    "login.title": "loginTitle",
    "login.subtitle": "loginSubtitle",
    "login.email": "loginEmail",
    "login.password": "loginPassword",
    "login.loginBtn": "loginLoginBtn",
    "login.registerBtn": "loginRegisterBtn",
    "login.browseWithoutLogin": "loginBrowseWithoutLogin",
    "login.noAccount": "loginNoAccount",
    "login.goToRegister": "loginGoToRegister",
    "login.loggingIn": "loginLoggingIn",
    "login.registering": "loginRegistering",
    "login.loginSuccess": "loginSuccess",
    "login.registerSuccess": "loginRegisterSuccess",
    "login.loginFailed": "loginFailed",
    "login.registerFailed": "loginRegisterFailed",
    "login.invalidEmail": "loginInvalidEmail",
    "login.passwordTooShort": "loginPasswordTooShort",
    "login.pleaseLoginFirst": "loginPleaseLoginFirst",
    "register.title": "registerTitle",
    "register.subtitle": "registerSubtitle",
    "register.passwordConfirm": "registerPasswordConfirm",
    "register.backToLogin": "registerBackToLogin",
    "register.hasAccount": "registerHasAccount",
    "register.goToLogin": "registerGoToLogin",
    registerPasswordMismatch: "registerPasswordMismatch",
    "header.title": "headerTitle",
    "header.openChatGPT": "headerOpenChatGPT",
    "header.login": "headerLogin",
    "header.logout": "headerLogout",
    "header.loggedInAs": "headerLoggedInAs",
    "header.guestMode": "headerGuestMode",
    "header.register": "headerRegister",
    "notice.title": "noticeTitle",
    "notice.chatgptLogin": "noticeChatgptLogin",
    "input.title": "inputTitle",
    "input.placeholder": "inputPlaceholder",
    "input.addBtn": "inputAddBtn",
    "input.clearBtn": "inputClearBtn",
    "control.title": "controlTitle",
    "control.startBtn": "controlStartBtn",
    "control.pauseBtn": "controlPauseBtn",
    "control.resumeBtn": "controlResumeBtn",
    "control.stopBtn": "controlStopBtn",
    "control.retryBtn": "controlRetryBtn",
    "control.useTempChat": "controlUseTempChat",
    "control.useTempChatHint": "controlUseTempChatHint",
    "control.useWebSearch": "controlUseWebSearch",
    "control.useWebSearchHint": "controlUseWebSearchHint",
    "stats.total": "statsTotal",
    "stats.completed": "statsCompleted",
    "stats.success": "statsSuccess",
    "stats.failed": "statsFailed",
    "progress.ready": "progressReady",
    "progress.running": "progressRunning",
    "progress.processing": "progressProcessing",
    "progress.paused": "progressPaused",
    "progress.completed": "progressCompleted",
    "log.title": "logTitle",
    "questions.title": "questionsTitle",
    "questions.exportBtn": "questionsExportBtn",
    "questions.clearBtn": "questionsClearBtn",
    "questions.question": "questionsQuestion",
    "questions.answer": "questionsAnswer",
    "questions.sources": "questionsSources",
    "questions.viewAnswer": "questionsViewAnswer",
    "questions.hideAnswer": "questionsHideAnswer",
    "questions.noQuestions": "questionsNoQuestions",
    "questions.addToStart": "questionsAddToStart",
    "questions.noAnswer": "questionsNoAnswer",
    "questions.errorInfo": "questionsErrorInfo",
    "questions.unknownError": "questionsUnknownError",
    "questions.status.pending": "statusPending",
    "questions.status.processing": "statusProcessing",
    "questions.status.completed": "statusCompleted",
    "questions.status.failed": "statusFailed",
    "messages.pleaseEnterQuestion": "msgPleaseEnterQuestion",
    "messages.questionsAdded": "msgQuestionsAdded",
    "messages.inputCleared": "msgInputCleared",
    "messages.alreadyRunning": "msgAlreadyRunning",
    "messages.noQuestions": "msgNoQuestions",
    "messages.pleaseAddQuestions": "msgPleaseAddQuestions",
    "messages.executionStarted": "msgExecutionStarted",
    "messages.executionPaused": "msgExecutionPaused",
    "messages.executionResumed": "msgExecutionResumed",
    "messages.executionStopped": "msgExecutionStopped",
    "messages.noFailedQuestions": "msgNoFailedQuestions",
    "messages.retryingFailed": "msgRetryingFailed",
    "messages.noResults": "msgNoResults",
    "messages.resultsExported": "msgResultsExported",
    "messages.pleaseStopFirst": "msgPleaseStopFirst",
    "messages.confirmClearAll": "msgConfirmClearAll",
    "messages.allCleared": "msgAllCleared",
    "messages.completed": "msgCompleted",
    "messages.failed": "msgFailed",
    "messages.waitingNext": "msgWaitingNext",
    "messages.allCompleted": "msgAllCompleted",
    "messages.chatGPTOpened": "msgChatGPTOpened",
    "messages.chatGPTOpenFailed": "msgChatGPTOpenFailed",
    "messages.openingChatGPT": "msgOpeningChatGPT",
    "messages.cannotOpenChatGPT": "msgCannotOpenChatGPT",
    "messages.error": "msgError",
    "messages.startingBatch": "msgStartingBatch",
    "messages.foundPending": "msgFoundPending",
    "messages.waitingPage": "msgWaitingPage",
    "messages.startingFirst": "msgStartingFirst",
    "messages.resetFailed": "msgResetFailed",
    "messages.submittedWaiting": "msgSubmittedWaiting",
    "messages.processingFailed": "msgProcessingFailed",
    "messages.loadedQuestions": "msgLoadedQuestions",
    "messages.loadFailed": "msgLoadFailed",
    "messages.ready": "msgReady"
};
let questions = [], isRunning = !1, isPaused = !1, currentIndex = 0, maxRetryCount = 3, timeoutMinutes = 10;
const questionsInput = document.getElementById("questionsInput"),
    addQuestionsBtn = document.getElementById("addQuestionsBtn"),
    clearInputBtn = document.getElementById("clearInputBtn"), startBtn = document.getElementById("startBtn"),
    pauseBtn = document.getElementById("pauseBtn"), resumeBtn = document.getElementById("resumeBtn"),
    stopBtn = document.getElementById("stopBtn"), stopBtn2 = document.getElementById("stopBtn2"),
    retryFailedBtn = document.getElementById("retryFailedBtn"), exportBtn = document.getElementById("exportBtn"),
    useTempChatCheckbox = document.getElementById("useTempChatCheckbox"),
    projectSelect = document.getElementById("projectSelect"),
    systemCommandInput = document.getElementById("systemCommandInput"),
    clearAllBtn = document.getElementById("clearAllBtn"), progressText = document.getElementById("progressText"),
    progressPercent = document.getElementById("progressPercent"), idleButtons = document.getElementById("idleButtons"),
    runningButtons = document.getElementById("runningButtons"),
    pausedButtons = document.getElementById("pausedButtons"),
    retryButtonContainer = document.getElementById("retryButtonContainer"),
    questionsList = document.getElementById("questionsList"), logContainer = document.getElementById("logContainer"),
    totalCount = document.getElementById("totalCount"), completedCount = document.getElementById("completedCount"),
    successCount = document.getElementById("successCount"), failedCount = document.getElementById("failedCount"),
    progressFill = document.getElementById("progressFill"),
    retryCountInput = document.getElementById("retryCountInput"),
    timeoutMinutesInput = document.getElementById("timeoutMinutesInput");

let projects = [];
const SELECTED_PROJECT_URL_KEY = "selectedProjectUrl";

function setupEventListeners() {
    addQuestionsBtn.addEventListener("click", handleAddQuestions),
        clearInputBtn.addEventListener("click", handleClearInput),
        startBtn.addEventListener("click", handleStart),
        pauseBtn.addEventListener("click", handlePause),
        resumeBtn.addEventListener("click", handleResume),
        stopBtn.addEventListener("click", handleStop),
        stopBtn2.addEventListener("click", handleStop),
        retryFailedBtn.addEventListener("click", handleRetryFailed),
        useTempChatCheckbox.addEventListener("change", handleTempChatChange),
        projectSelect && projectSelect.addEventListener("change", handleProjectChange),
        systemCommandInput && systemCommandInput.addEventListener("input", handleSystemCommandChange),
        exportBtn.addEventListener("click", handleExport),
        clearAllBtn.addEventListener("click", handleClearAll),
        retryCountInput && retryCountInput.addEventListener("change", handleRetryCountChange),
        timeoutMinutesInput && timeoutMinutesInput.addEventListener("change", handleTimeoutMinutesChange)
}

function t(e, t) {
    let s, n = KEY_MAP[e];
    if (n || (n = e), t) if ("object" != typeof t || Array.isArray(t)) s = Array.isArray(t) ? chrome.i18n.getMessage(n, t.map(String)) : chrome.i18n.getMessage(n, String(t)); else {
        const e = Object.values(t);
        s = chrome.i18n.getMessage(n, e.map(String))
    } else s = chrome.i18n.getMessage(n);
    return s ? (t && "object" == typeof t && !Array.isArray(t) && (s = s.replace(/\{(\w+)\}/g, (e, s) => void 0 !== t[s] ? t[s] : e)), s) : e
}

function applyTranslations() {
    document.title = t("title"), document.documentElement.lang = BROWSER_LANG, document.querySelectorAll("[data-i18n]").forEach(e => {
        const s = e.getAttribute("data-i18n");
        e.textContent = t(s)
    }), document.querySelectorAll("[data-i18n-placeholder]").forEach(e => {
        const s = e.getAttribute("data-i18n-placeholder");
        e.placeholder = t(s)
    }), updateUI()
}

function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (e) {
        const t = 16 * Math.random() | 0;
        return ("x" === e ? t : 3 & t | 8).toString(16)
    })
}

function handleAddQuestions() {
    const e = questionsInput.value.trim();
    if (!e) return void addLog(t("messages.pleaseEnterQuestion"), "warning");
    const s = e.split("\n").filter(e => e.trim());
    let n = 0;
    s.forEach(e => {
        const t = e.trim();
        t && (questions.push({
            id: generateUUID(),
            question: t,
            status: "pending",
            answer: "",
            sources: [],
            timestamp: Date.now(),
            error: null,
            retryCount: 0
        }), n++)
    }), n > 0 && (questionsInput.value = "", saveQuestions(), updateUI(), addLog(`${n} ${t("messages.questionsAdded")}`, "success"))
}

function handleClearInput() {
    questionsInput.value = ""
}

async function handleStart() {
    if (isRunning) return void addLog(t("messages.alreadyRunning"), "warning");
    if (0 === questions.length) return void addLog(t("messages.noQuestions"), "warning");
    const e = questions.filter(e => "pending" === e.status || "failed" === e.status);
    if (0 === e.length) return void addLog(t("messages.noQuestions"), "warning");
    questions.forEach(e => {
        "failed" === e.status && (e.status = "pending", e.error = null, e.retryCount = 0)
    }), saveQuestions(), updateUI(), saveRuntimeSettings();

    const useTemp = useTempChatCheckbox.checked;
    let projectUrl = null;
    if (!useTemp && projectSelect) {
        projectUrl = projectSelect.value || null;
        if (!projectUrl) return void addLog("请先选择一个项目，或者勾选“使用临时聊天”。", "warning");
    }

    addLog(t("messages.openingChatGPT"), "info");
    try {
        const e = await chrome.runtime.sendMessage({
            type: "OPEN_CHATGPT",
            useTempChat: useTemp,
            projectUrl: projectUrl,
            useWebSearch: !1
        });
        if (!e.success) return void addLog(t("messages.cannotOpenChatGPT") + ": " + e.error, "error")
    } catch (e) {
        return void addLog(t("messages.error") + ": " + e.message, "error")
    }
    isRunning = !0, isPaused = !1, currentIndex = 0, updateControlButtons(), addLog(t("messages.startingBatch"), "info"), addLog(t("messages.foundPending", {count: e.length}), "info"), addLog(t("messages.waitingPage"), "info"), await sleep(3e3), addLog(t("messages.startingFirst"), "info"), processNextQuestion()
}

function handlePause() {
    isPaused = !0, updateControlButtons(), addLog(t("messages.executionPaused"), "warning")
}

function handleResume() {
    if (!isRunning) return;
    // reset any possibly stuck "processing" question back to pending
    const e = questions.find(t => "processing" === t.status);
    e && (e.status = "pending", e.error || (e.error = "手动恢复时重置为待处理"), saveQuestions(), updateUI(), addLog("检测到上一个问题可能未结束，已重置为待处理。", "warning"));
    isPaused = !1;
    updateControlButtons();
    addLog(t("messages.executionResumed"), "info");
    processNextQuestion()
}

function handleStop() {
    isRunning = !1, isPaused = !1, updateControlButtons(), addLog(t("messages.executionStopped"), "warning")
}

function handleRetryFailed() {
    if (isRunning) return void addLog(t("messages.pleaseStopFirst"), "warning");
    const e = questions.filter(e => "failed" === e.status);
    0 !== e.length ? (e.forEach(e => {
        e.status = "pending", e.error = null, e.retryCount = 0
    }), saveQuestions(), updateUI(), addLog(t("messages.resetFailed").replace("{count}", e.length), "success")) : addLog(t("messages.noFailedQuestions"), "info")
}

async function processNextQuestion() {
    if (!isRunning || isPaused) return;
    let e = null;
    for (let t = currentIndex; t < questions.length; t++) if ("pending" === questions[t].status) {
        e = questions[t], currentIndex = t;
        break
    }
    if (!e) {
        isRunning = !1, updateControlButtons();
        questions.filter(e => "completed" === e.status).length, questions.filter(e => "failed" === e.status).length;
        return void addLog(t("messages.allCompleted"), "success")
    }
    e.status = "processing", void 0 === e.retryCount && (e.retryCount = 0), saveQuestions(), updateUI();
    const s = e.question.substring(0, 50);
    addLog(`[${currentIndex + 1}/${questions.length}]: ${s}...`, "info");
    try {
        const useTemp = useTempChatCheckbox.checked;
        let projectUrl = null;
        if (!useTemp && projectSelect) {
            projectUrl = projectSelect.value || null;
            if (!projectUrl) throw new Error("请先选择一个项目，或者勾选“使用临时聊天”。");
        }
        const r = systemCommandInput ? systemCommandInput.value.trim() : "",
            o = await chrome.runtime.sendMessage({
                type: "PROCESS_QUESTION",
                question: r ? r + "\n\n" + e.question : e.question,
                questionId: e.id,
                useTempChat: useTemp,
                projectUrl: projectUrl,
                useWebSearch: !1
            });
        if (!o || !o.success) throw new Error(o?.error || "No response from background script");
        addLog(t("messages.submittedWaiting"), "info")
    } catch (s) {
        if (e.retryCount = void 0 === e.retryCount ? 0 : e.retryCount, maxRetryCount > 0 && e.retryCount < maxRetryCount) e.retryCount++, e.status = "pending", e.error = s.message, saveQuestions(), updateUI(), addLog(t("messages.processingFailed") + ": " + s.message, "error"), addLog(`将重试该问题 (${e.retryCount}/${maxRetryCount})`, "warning"), isRunning && !isPaused && (await sleep(2e3), processNextQuestion()); else {
            e.status = "failed", e.error = s.message, saveQuestions(), updateUI(), addLog(t("messages.processingFailed") + ": " + s.message, "error"), currentIndex++, isRunning && !isPaused && (await sleep(2e3), processNextQuestion())
        }
    }
}

function handleQuestionComplete(e) {
    const s = questions.find(t => t.id === e.questionId);
    if (!s || "completed" === s.status || "failed" === s.status) return;
    void 0 === s.retryCount && (s.retryCount = 0), e.success ? (s.status = "completed", s.answer = e.answer, s.sources = e.sources || [], s.completedAt = Date.now(), s.retryCount = 0, addLog(t("messages.completed") + ": " + s.question.substring(0, 50) + "...", "success"), saveQuestions(), updateUI(), currentIndex++) : (maxRetryCount > 0 && s.retryCount < maxRetryCount ? (s.retryCount++, s.status = "pending", s.error = e.error, s.completedAt = Date.now(), addLog(t("messages.failed") + ": " + s.question.substring(0, 50) + "... - " + e.error, "error"), addLog(`将重试该问题 (${s.retryCount}/${maxRetryCount})`, "warning")) : (s.status = "failed", s.error = e.error, s.completedAt = Date.now(), addLog(t("messages.failed") + ": " + s.question.substring(0, 50) + "... - " + e.error, "error"), currentIndex++), saveQuestions(), updateUI()), isRunning && !isPaused && (addLog(t("messages.waitingNext"), "info"), sleep(3e3).then(() => {
        processNextQuestion()
    }))
}

function handleExport() {
    if (0 === questions.length) return void addLog(t("messages.noResults"), "warning");
    const e = {
            exportTime: (new Date).toISOString(),
            totalQuestions: questions.length,
            completedQuestions: questions.filter(e => "completed" === e.status).length,
            questions: questions.map(e => ({
                question: e.question,
                status: e.status,
                answer: e.answer,
                sources: e.sources,
                timestamp: e.timestamp,
                completedAt: e.completedAt,
                error: e.error
            }))
        }, s = new Blob([JSON.stringify(e, null, 2)], {type: "application/json"}), n = URL.createObjectURL(s),
        o = document.createElement("a");
    o.href = n, o.download = `chatgpt-answers-${Date.now()}.json`, document.body.appendChild(o), o.click(), document.body.removeChild(o), URL.revokeObjectURL(n), addLog(t("messages.resultsExported"), "success")
}

function handleClearAll() {
    isRunning ? addLog("请先停止处理", "warning") : confirm("确定要清空所有问题吗？") && (questions = [], saveQuestions(), updateUI(), addLog(t("messages.allCleared"), "info"))
}

function updateUI() {
    updateStatistics(), updateQuestionsList(), updateControlButtons(), retryCountInput && (retryCountInput.value = String(maxRetryCount)), timeoutMinutesInput && (timeoutMinutesInput.value = String(timeoutMinutes))
}

function updateStatValue(e, t) {
    const s = parseInt(e.textContent) || 0;
    e.textContent = t, t > s && (e.classList.remove("updated"), e.offsetWidth, e.classList.add("updated"), setTimeout(() => {
        e.classList.remove("updated")
    }, 400))
}

function updateStatistics() {
    const e = questions.length, s = questions.filter(e => "completed" === e.status || "failed" === e.status).length,
        n = questions.filter(e => "completed" === e.status).length,
        o = questions.filter(e => "failed" === e.status).length,
        a = questions.filter(e => "processing" === e.status).length;
    updateStatValue(totalCount, e), updateStatValue(completedCount, s), updateStatValue(successCount, n), updateStatValue(failedCount, o);
    const i = e > 0 ? s / e * 100 : 0;
    if (progressFill.style.width = i + "%", progressPercent.textContent = Math.round(i) + "%", isRunning && a > 0) {
        const s = questions.findIndex(e => "processing" === e.status);
        if (-1 !== s) {
            const n = s + 1;
            progressText.textContent = t("progress.processing", {current: n, total: e})
        } else progressText.textContent = t("progress.running")
    } else progressText.textContent = t(isPaused ? "progress.paused" : e > 0 && s === e ? "progress.completed" : "progress.ready");
    const r = document.querySelector(".stat-failed");
    r && (0 === o ? r.classList.add("stat-muted") : r.classList.remove("stat-muted"))
}

function updateQuestionsList() {
    if (0 === questions.length) return void (questionsList.innerHTML = `\n      <div class="empty-state">\n        <p data-i18n="questions.noQuestions">${t("questions.noQuestions")}</p>\n        <p data-i18n="questions.addToStart">${t("questions.addToStart")}</p>\n      </div>\n    `);
    questionsList.innerHTML = "";
    questions.forEach((e, t) => {
        const s = createQuestionItem(e, t);
        s.draggable = !0;
        s.addEventListener("dragstart", handleDragStart);
        s.addEventListener("dragover", handleDragOver);
        s.addEventListener("drop", handleDrop);
        s.addEventListener("dragend", handleDragEnd);
        questionsList.appendChild(s)
    })
}

let draggedItem = null;

function handleDragStart(e) {
    draggedItem = e.currentTarget, e.dataTransfer && (e.dataTransfer.effectAllowed = "move"), draggedItem.classList.add("dragging")
}

function handleDragOver(e) {
    e.preventDefault();
    const t = e.currentTarget;
    if (!draggedItem || draggedItem === t) return;
    const s = t.getBoundingClientRect(), n = e.clientY - s.top, o = n > s.height / 2;
    questionsList.insertBefore(draggedItem, o ? t.nextSibling : t)
}

function handleDrop(e) {
    e.preventDefault(), updateQuestionsOrderFromDOM()
}

function handleDragEnd() {
    draggedItem && draggedItem.classList.remove("dragging"), draggedItem = null
}

function updateQuestionsOrderFromDOM() {
    const e = Array.from(questionsList.querySelectorAll(".question-item")).map(e => e.dataset.id), t = [];
    e.forEach(e => {
        const s = questions.find(t => t.id === e);
        s && t.push(s)
    }), t.length === questions.length && (questions = t, saveQuestions(), updateUI())
}

function createQuestionItem(e, s) {
    const n = document.createElement("div");
    n.className = "question-item", n.dataset.id = e.id;
    const o = e.status, a = t("questions.status." + e.status);
    const r = e.completedAt ? new Date(e.completedAt).toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    }) : "";
    return n.innerHTML = `\n    <div class="question-header">\n      <span class="question-order">${s + 1}</span>\n      <span class="status-badge ${o}">${a}</span>\n      <div class="question-text" title="${escapeHtml(e.question)}">\n        ${escapeHtml(e.question)}\n      </div>\n      ${r ? `<span class="question-time">${r}</span>` : ""}\n      <div class="question-actions">\n        <button type="button" class="question-edit-btn" title="编辑问题">✏️</button>\n        <button type="button" class="question-remove-btn" title="从队列中移除">✕</button>\n      </div>\n    </div>\n  `, function () {
        const i = n.querySelector(".question-header"), r = n.querySelector(".question-edit-btn"),
            l = n.querySelector(".question-remove-btn");
        i && i.addEventListener("click", t => {
            t.target && (t.target.classList.contains("question-edit-btn") || t.target.classList.contains("question-remove-btn")) || showQuestionDetailModal(e)
        }), r && r.addEventListener("click", s => {
            s.stopPropagation();
            if (!questionEditModal || !questionEditTextarea) return;
            currentEditingQuestion = e;
            questionEditTextarea.value = e.question || "";
            questionEditModal.style.display = "flex";
            questionEditTextarea.focus()
        }), l && l.addEventListener("click", s => {
            s.stopPropagation();
            if (!confirm("确定从队列中移除这条问题吗？")) return;
            questions = questions.filter(t => t.id !== e.id), saveQuestions(), updateUI()
        })
    }(), n
}

function updateControlButtons() {
    idleButtons.style.display = "none", runningButtons.style.display = "none", pausedButtons.style.display = "none", isRunning ? isPaused ? pausedButtons.style.display = "flex" : runningButtons.style.display = "flex" : idleButtons.style.display = "flex";
    questions.filter(e => "failed" === e.status).length > 0 && !isRunning ? retryButtonContainer.style.display = "flex" : retryButtonContainer.style.display = "none"
}

function addLog(e, t = "info") {
    const s = document.createElement("div");
    s.className = `log-entry ${t}`;
    const n = (new Date).toLocaleTimeString();
    for (s.textContent = `[${n}] ${e}`, logContainer.appendChild(s), logContainer.scrollTop = logContainer.scrollHeight; logContainer.children.length > 100;) logContainer.removeChild(logContainer.firstChild)
}

function saveQuestions() {
    chrome.storage.local.set({questions: questions})
}

function saveTempChatSetting(e) {
    chrome.storage.local.set({useTempChat: e})
}

function handleTempChatChange(e) {
    const s = e.target.checked;
    saveTempChatSetting(s),
        s && projectSelect && (projectSelect.value = ""),
        addLog(t(s ? "msgTempChatEnabled" : "msgTempChatDisabled"), "info")
}

function handleProjectChange(e) {
    const value = e.target.value || "";
    chrome.storage.local.set({[SELECTED_PROJECT_URL_KEY]: value});
    if (value && useTempChatCheckbox.checked) {
        useTempChatCheckbox.checked = !1;
        saveTempChatSetting(!1);
        addLog("已选择项目，将不再使用临时聊天。", "info");
    }
}

async function loadQuestions() {
    try {
        const e = await chrome.storage.local.get(["questions"]);
        e.questions && (questions = e.questions, updateUI(), addLog(t("messages.loadedQuestions").replace("{count}", questions.length), "info"))
    } catch (e) {
        addLog(t("messages.loadFailed") + ": " + e.message, "error")
    }
}

async function loadTempChatSetting() {
    try {
        const e = await chrome.storage.local.get(["useTempChat"]), t = void 0 === e.useTempChat || e.useTempChat;
        useTempChatCheckbox.checked = t
    } catch (e) {
        useTempChatCheckbox.checked = !0
    }
}

function saveSystemCommandSetting(e) {
    chrome.storage.local.set({systemCommand: e})
}

function handleSystemCommandChange(e) {
    saveSystemCommandSetting(e.target.value)
}

async function loadSystemCommandSetting() {
    try {
        const e = await chrome.storage.local.get(["systemCommand"]);
        systemCommandInput && (systemCommandInput.value = e.systemCommand || "")
    } catch (e) {
        systemCommandInput && (systemCommandInput.value = "")
    }
}

function handleRetryCountChange(e) {
    let t = parseInt(e.target.value, 10);
    isNaN(t) && (t = 3), t < 0 && (t = 0), t > 10 && (t = 10), maxRetryCount = t, e.target.value = String(t), chrome.storage.local.set({maxRetryCount: t})
}

function handleTimeoutMinutesChange(e) {
    let t = parseInt(e.target.value, 10);
    isNaN(t) && (t = 10), t < 1 && (t = 1), t > 60 && (t = 60), timeoutMinutes = t, e.target.value = String(t), chrome.storage.local.set({timeoutMinutes: t})
}

async function loadRuntimeSettings() {
    try {
        const e = await chrome.storage.local.get(["maxRetryCount", "timeoutMinutes"]);
        let t = e.maxRetryCount;
        ("number" != typeof t || t < 0 || t > 10) && (t = 3), maxRetryCount = t;
        let s = e.timeoutMinutes;
        ("number" != typeof s || s < 1 || s > 60) && (s = 10), timeoutMinutes = s, updateUI()
    } catch (e) {
        maxRetryCount = 3, timeoutMinutes = 10, updateUI()
    }
}

function saveRuntimeSettings() {
    chrome.storage.local.set({maxRetryCount: maxRetryCount, timeoutMinutes: timeoutMinutes})
}

document.addEventListener("DOMContentLoaded", () => {
    applyTranslations(), loadQuestions(), loadRuntimeSettings(), setupEventListeners(), updateUI()
}), chrome.runtime.onMessage.addListener((e, t, s) => {
    switch (e.type) {
        case"QUESTION_COMPLETE":
            handleQuestionComplete(e.result), s({received: !0});
            break;
        case"UPDATE_PROGRESS":
            s({received: !0});
            break;
        case"LOG_MESSAGE":
            addLog(e.message, e.level || "info"), s({received: !0});
            break;
        default:
            s({received: !1})
    }
    return !0
});
let lastProcessedMessageTimestamp = 0;

function sleep(e) {
    return new Promise(t => setTimeout(t, e))
}

function escapeHtml(e) {
    if (!e) return "";
    const t = document.createElement("div");
    return t.textContent = e, t.innerHTML
}

chrome.storage.onChanged.addListener((e, t) => {
    if ("local" === t && e.pendingMessage) {
        const t = e.pendingMessage.newValue;
        if (!t) return;
        if (t.timestamp && t.timestamp <= lastProcessedMessageTimestamp) return;
        switch (t.timestamp && (lastProcessedMessageTimestamp = t.timestamp), t.type) {
            case"QUESTION_COMPLETE":
                handleQuestionComplete(t.result), chrome.storage.local.remove("pendingMessage");
                break;
            case"UPDATE_PROGRESS":
                chrome.storage.local.remove("pendingMessage");
                break;
            case"LOG_MESSAGE":
                addLog(t.message, t.level || "info"), chrome.storage.local.remove("pendingMessage")
        }
    }
}), window.handleBackgroundMessage = function (e) {
    chrome.runtime.onMessage.addListener(arguments[0])
};

let questionDetailModal = null, questionDetailContent = null, questionDetailModalClose = null;
let questionEditModal = null, questionEditTextarea = null, questionEditSave = null, questionEditCancel = null,
    questionEditModalClose = null, currentEditingQuestion = null;

function initQuestionDetailModal() {
    questionDetailModal = document.getElementById("questionDetailModal");
    questionDetailContent = document.getElementById("questionDetailContent");
    questionDetailModalClose = document.getElementById("questionDetailModalClose");
    if (questionDetailModal && questionDetailContent && questionDetailModalClose) {
        questionDetailModalClose.addEventListener("click", () => {
            questionDetailModal.style.display = "none"
        });
        questionDetailModal.addEventListener("click", e => {
            e.target === questionDetailModal && (questionDetailModal.style.display = "none")
        })
    }
    questionEditModal = document.getElementById("questionEditModal");
    questionEditTextarea = document.getElementById("questionEditTextarea");
    questionEditSave = document.getElementById("questionEditSave");
    questionEditCancel = document.getElementById("questionEditCancel");
    questionEditModalClose = document.getElementById("questionEditModalClose");
    if (questionEditModal && questionEditTextarea && questionEditSave && questionEditCancel && questionEditModalClose) {
        const closeEditModal = () => {
            questionEditModal.style.display = "none";
            currentEditingQuestion = null
        };
        questionEditModalClose.addEventListener("click", closeEditModal);
        questionEditCancel.addEventListener("click", closeEditModal);
        questionEditModal.addEventListener("click", e => {
            e.target === questionEditModal && closeEditModal()
        });
        questionEditSave.addEventListener("click", () => {
            if (!currentEditingQuestion) return;
            const e = questionEditTextarea.value.trim();
            if (!e) return;
            currentEditingQuestion.question = e;
            saveQuestions();
            updateUI();
            closeEditModal()
        })
    }
}

function showQuestionDetailModal(e) {
    if (!questionDetailModal || !questionDetailContent) return;
    let s = "";
    if ("completed" === e.status) {
        let n = "";
        e.sources && e.sources.length > 0 && (n = `\n      <div class="detail-section">\n        <h4>${t("questions.sources")} (${e.sources.length})</h4>\n        <ul class="sources-list">\n          ${e.sources.map(e => `\n            <li class="source-item">\n              <div class="source-title">${escapeHtml(e.title)}</div>\n              <a href="${escapeHtml(e.url)}" target="_blank" class="source-url">${escapeHtml(e.url)}</a>\n              ${e.snippet ? `<div class="source-snippet">${escapeHtml(e.snippet)}</div>` : ""}\n            </li>\n          `).join("")}\n        </ul>\n      </div>\n    `), s = `\n    <div class="detail-section">\n      <h4>${t("questions.question")}</h4>\n      <div class="answer-text">${escapeHtml(e.question)}</div>\n    </div>\n    <div class="detail-section">\n      <h4>${t("questions.answer")}</h4>\n      <div class="answer-text">${escapeHtml(e.answer || t("questions.noAnswer"))}</div>\n    </div>\n    ${n}\n  `
    } else "failed" === e.status ? s = `\n    <div class="detail-section">\n      <h4>${t("questions.question")}</h4>\n      <div class="answer-text">${escapeHtml(e.question)}</div>\n    </div>\n    <div class="detail-section">\n      <h4>${t("questions.errorInfo")}</h4>\n      <div class="error-text">${escapeHtml(e.error || t("questions.unknownError"))}</div>\n    </div>\n  ` : s = `\n    <div class="detail-section">\n      <h4>${t("questions.question")}</h4>\n      <div class="answer-text">${escapeHtml(e.question)}</div>\n    </div>\n  `;
    questionDetailContent.innerHTML = s;
    questionDetailModal.style.display = "flex"
}

async function initializeApp() {
    await loadTempChatSetting(),
        await loadSystemCommandSetting(),
        initQuestionDetailModal(),
        await loadProjects(),
        addLog(t("messages.ready"), "success")
}

async function loadProjects() {
    if (!projectSelect) return;
    try {
        const tokenData = await chrome.storage.local.get([SELECTED_PROJECT_URL_KEY]);
        const savedProjectUrl = tokenData[SELECTED_PROJECT_URL_KEY] || "";
        projectSelect.innerHTML = '<option value="">从 ChatGPT 加载项目列表中...</option>';

        const resp = await chrome.runtime.sendMessage({type: "GET_PROJECTS"});
        if (!resp || !resp.success) {
            throw new Error(resp && resp.error ? resp.error : "No response");
        }
        const list = Array.isArray(resp.projects) ? resp.projects : [];
        projects = list.map(p => ({
            id: p.id || p.url || p.name,
            name: p.name || p.title || p.label || p.url,
            url: p.url
        })).filter(p => p.url);
        projectSelect.innerHTML = "";
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "不使用项目（走临时聊天或默认对话）";
        projectSelect.appendChild(placeholder);
        projects.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.url;
            opt.textContent = p.name;
            projectSelect.appendChild(opt);
        });
        if (savedProjectUrl) {
            const match = projects.find(p => p.url === savedProjectUrl);
            if (match) {
                projectSelect.value = savedProjectUrl;
                if (useTempChatCheckbox.checked) {
                    useTempChatCheckbox.checked = !1;
                    saveTempChatSetting(!1);
                }
            }
        }
    } catch (e) {
        projectSelect.innerHTML = '<option value="">加载项目失败</option>';
        addLog("加载项目列表失败: " + e.message, "error");
    }
}

initializeApp();
    