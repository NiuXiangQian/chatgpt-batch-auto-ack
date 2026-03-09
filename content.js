let currentQuestion = null, currentAnswer = "", currentSources = [], currentReferences = [], isProcessing = !1,
    isParsing = !1, sseChunks = [];

function injectSSEInterceptor() {
    try {
        const e = document.createElement("script");
        e.src = chrome.runtime.getURL("injected.js"), e.onload = function () {
            this.remove()
        }, e.onerror = function () {
            this.remove()
        }, (document.head || document.documentElement).appendChild(e)
    } catch (e) {
    }
}

function handleSSEData(e) {
    isProcessing && currentQuestion && sseChunks.push(e)
}

async function handleSSEDone() {
    isParsing || isProcessing && currentQuestion && sseChunks.length > 0 && (isParsing = !0, await parseSSEWithBackend())
}

async function handleStreamEnd() {
}

async function parseSSEWithBackend() {
    if (!currentQuestion) return;
    try {
        const { answer, sources, references } = parseSSELocally(sseChunks);
        currentAnswer = answer || "";
        currentSources = sources || [];
        currentReferences = references || [];
        handleAnswerComplete();
    } catch (e) {
        sendQuestionResult(false, `SSE parse error: ${e.message}`);
    } finally {
        isParsing = false;
    }
}

/**
 * Parse SSE chunks locally (no backend). Extracts assistant text from delta events.
 * SSE format: event: delta / data: {"p":"","o":"add","v":{...}} or data: {"v":[{"p":"/message/content/parts/0","o":"append","v":"..."}]}
 * For thinking mode: only collects from channel "final", skips channel "commentary" (thinking preview).
 */
function parseSSELocally(chunks) {
    let answer = "";
    const sources = [];
    const references = [];

    if (!Array.isArray(chunks) || chunks.length === 0) {
        return { answer, sources, references };
    }

    // In thinking mode: "commentary" = thinking preview (skip), "final" = actual answer (collect)
    // When null/undefined = non-thinking mode, collect all
    let currentChannel = null;

    for (const chunk of chunks) {
        if (!chunk || typeof chunk !== "object") continue;

        // Skip non-delta payloads (and delta_encoding string payload)
        if (typeof chunk.type === "string" && ["resume_conversation_token", "message_marker", "server_ste_metadata", "message_stream_complete", "conversation_detail_metadata", "url_moderation"].includes(chunk.type)) {
            continue;
        }

        // Full message add: update currentChannel for thinking mode
        if (chunk.v && chunk.v.message && typeof chunk.v.message === "object") {
            const msg = chunk.v.message;
            const ch = msg.channel;
            if (ch === "commentary" || ch === "final") {
                currentChannel = ch;
            } else if (ch === null || ch === undefined) {
                currentChannel = null; // non-thinking, collect all
            }
            const content = msg.content;
            if (content && content.parts && Array.isArray(content.parts)) {
                const textPart = content.parts.find(p => typeof p === "string");
                if (typeof textPart === "string" && textPart.length > 0) {
                    if (currentChannel !== "commentary") {
                        answer += textPart;
                    }
                }
            }
            if (msg.metadata && Array.isArray(msg.metadata.citations)) {
                sources.push(...msg.metadata.citations);
            }
            if (msg.metadata && Array.isArray(msg.metadata.content_references)) {
                references.push(...msg.metadata.content_references);
            }
            continue;
        }

        // Delta with patch list: { "o": "patch", "v": [ { "p", "o", "v" }, ... ] } or { "v": [ ... ] }
        const patchList = chunk.v;
        if (Array.isArray(patchList)) {
            for (const op of patchList) {
                if (op && op.p === "/message/content/parts/0" && op.o === "append" && typeof op.v === "string") {
                    if (currentChannel !== "commentary") {
                        answer += op.v;
                    }
                }
            }
            continue;
        }

        // Single patch: { "p": "/message/content/parts/0", "o": "append", "v": "..." }
        if (chunk.p === "/message/content/parts/0" && chunk.o === "append" && typeof chunk.v === "string") {
            if (currentChannel !== "commentary") {
                answer += chunk.v;
            }
        }
    }

    // Some models返回JSON对象：{ question: "...", status: "...", answer: "...", ... }
    // 这种情况下，只保留其中的 answer 字段内容。
    let finalAnswer = answer.trim();
    if (finalAnswer.startsWith("{") && finalAnswer.endsWith("}")) {
        try {
            const parsed = JSON.parse(finalAnswer);
            if (parsed && typeof parsed.answer === "string") {
                finalAnswer = parsed.answer.trim();
            }
        } catch {
            // 如果不是合法 JSON，则按普通文本返回
        }
    }

    return { answer: finalAnswer, sources, references };
}

function handleSSEError(e) {
    isProcessing && currentQuestion && sendQuestionResult(!1, e)
}

function handleAnswerComplete() {
    isProcessing && currentQuestion && (currentAnswer.length, sendQuestionResult(!0))
}

function sendQuestionResult(e, t = null) {
    const n = {
        success: e,
        questionId: currentQuestion.questionId,
        question: currentQuestion.question,
        answer: currentAnswer,
        sources: currentSources,
        error: t
    };
    // Send to extension sidepanel
    chrome.runtime.sendMessage({type: "QUESTION_COMPLETE", result: n}, e => {
        chrome.runtime.lastError
    });
    // Also send to external API if configured
    sendResultToExternalApi(n);
    isProcessing = !1;
    currentQuestion = null;
    currentAnswer = "";
    currentSources = [];
    currentReferences = [];
    sseChunks = [];
}

function sendResultToExternalApi(result) {
    try {
        if (!chrome || !chrome.storage || !chrome.storage.local) return;
        chrome.storage.local.get(["resultApiUrl"], (data) => {
            if (chrome.runtime && chrome.runtime.lastError) {
                return;
            }
            let url = "";
            if (data && typeof data.resultApiUrl === "string") {
                url = data.resultApiUrl.trim();
            }
            if (!url) return;
            const lower = url.toLowerCase();
            if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
                return;
            }
            const payload = {
                question: result.question,
                status: result.success ? "completed" : "failed",
                answer: result.answer || "",
                timestamp: Date.now(),
                error: result.error
            };
            try {
                // 记录调用结果回调地址的日志
                try {
                    chrome.runtime.sendMessage({
                        type: "LOG_MESSAGE",
                        message: `检测到结果回调地址：${url}，即将发送本次回答结果。`,
                        level: "info"
                    }, () => {
                        if (chrome.runtime && chrome.runtime.lastError) {
                        }
                    });
                } catch (e) {
                }
                fetch(url, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(payload)
                }).then(resp => {
                    try {
                        const status = typeof resp.status === "number" ? resp.status : 0;
                        const ok = status >= 200 && status < 300;
                        const msg = ok
                            ? `已向结果回调地址发送成功（状态码：${status}）。`
                            : `向结果回调地址发送失败（状态码：${status}）。`;
                        chrome.runtime.sendMessage({
                            type: "LOG_MESSAGE",
                            message: msg,
                            level: ok ? "success" : "error"
                        }, () => {
                            if (chrome.runtime && chrome.runtime.lastError) {
                            }
                        });
                    } catch (e) {
                    }
                }).catch(err => {
                    try {
                        chrome.runtime.sendMessage({
                            type: "LOG_MESSAGE",
                            message: `向结果回调地址发送失败：${err && err.message ? err.message : String(err)}`,
                            level: "error"
                        }, () => {
                            if (chrome.runtime && chrome.runtime.lastError) {
                            }
                        });
                    } catch (e) {
                    }
                });
            } catch {
                // ignore fetch errors
            }
        });
    } catch {
        // ignore storage errors
    }
}

function waitForElement(e, t = 1e4) {
    return new Promise((n, r) => {
        const s = document.querySelector(e);
        if (s) return void n(s);
        const c = new MutationObserver(() => {
            const t = document.querySelector(e);
            t && (c.disconnect(), n(t))
        });
        c.observe(document.body, {childList: !0, subtree: !0}), setTimeout(() => {
            c.disconnect(), r(new Error(`Timeout waiting for element: ${e}`))
        }, t)
    })
}

function clickElement(e) {
    if (!e) return !1;
    try {
        e.scrollIntoView({behavior: "instant", block: "center"})
    } catch (e) {
    }
    try {
        return e.click(), !0
    } catch (e) {
    }
    try {
        return e.dispatchEvent(new MouseEvent("mousedown", {
            bubbles: !0,
            cancelable: !0,
            view: window
        })), e.dispatchEvent(new MouseEvent("mouseup", {
            bubbles: !0,
            cancelable: !0,
            view: window
        })), e.dispatchEvent(new MouseEvent("click", {bubbles: !0, cancelable: !0, view: window})), !0
    } catch (e) {
    }
    try {
        return e.dispatchEvent(new PointerEvent("pointerdown", {
            bubbles: !0,
            cancelable: !0
        })), e.dispatchEvent(new PointerEvent("pointerup", {bubbles: !0, cancelable: !0})), e.click(), !0
    } catch (e) {
    }
    return !1
}

function findSearchMenuItem(e) {
    const t = Array.from(e.querySelectorAll(".__menu-item")), n = t.find(e => {
        const t = e.querySelector("svg path");
        if (!t) return !1;
        const n = t.getAttribute("d");
        return n && (n.startsWith("M10 2.125C14.3492") || n.includes("17.875 10C17.875 14.3492"))
    });
    if (n) return n;
    const r = e.querySelectorAll('[role="group"]');
    if (r.length >= 2) {
        const e = r[1], t = Array.from(e.querySelectorAll(".__menu-item")).filter(e => {
            const t = null !== e.querySelector("svg"), n = null !== e.querySelector("img"), r = e.textContent.trim();
            return t && !n && r.length <= 10
        });
        if (t.length > 0) {
            return t[t.length - 1]
        }
    }
    const s = t.find(e => {
        const t = e.textContent.trim(), n = t.toLowerCase();
        if (["搜索", "搜尋", "Search", "网页搜索", "網頁搜尋", "Web Search", "Suche", "Web-Suche", "Recherche", "Recherche Web", "Buscar", "Búsqueda Web", "検索", "ウェブ検索", "검색", "웹 검색", "Поиск", "Веб-поиск"].includes(t)) return !0;
        if (t.length <= 10) {
            if (t.startsWith("搜索") && !t.includes("聊天") && !t.includes("对话")) return !0;
            if (t.startsWith("搜尋") && !t.includes("聊天") && !t.includes("對話")) return !0;
            if (n.startsWith("search") && !n.includes("chat") && !n.includes("conversation")) return !0
        }
        return !1
    });
    return s || null
}

async function enableWebSearchViaSlash() {
    try {
        const e = document.querySelector('div[contenteditable="true"]#prompt-textarea, textarea#prompt-textarea');
        if (!e) return !1;
        e.focus(), await sleep(500), e.innerHTML = "";
        const t = new KeyboardEvent("keydown", {
            key: "/",
            code: "Slash",
            keyCode: 191,
            which: 191,
            bubbles: !0,
            cancelable: !0
        });
        e.dispatchEvent(t), e.innerHTML = "/";
        const n = document.createRange(), r = window.getSelection();
        e.childNodes.length > 0 ? (n.setStart(e.childNodes[0], 1), n.collapse(!0)) : (n.selectNodeContents(e), n.collapse(!1)), r.removeAllRanges(), r.addRange(n);
        const s = new InputEvent("input", {bubbles: !0, cancelable: !0, inputType: "insertText", data: "/"});
        e.dispatchEvent(s);
        const c = new KeyboardEvent("keyup", {
            key: "/",
            code: "Slash",
            keyCode: 191,
            which: 191,
            bubbles: !0,
            cancelable: !0
        });
        e.dispatchEvent(c), await sleep(2e3);
        const i = document.querySelectorAll('div[style*="position: absolute"], div[style*="position: fixed"]');
        let o = null;
        for (const e of i) {
            const t = e.querySelectorAll(".__menu-item");
            if (t.length > 0 && t.length < 20) {
                const t = e.querySelectorAll("svg path");
                let n = !1;
                for (const e of t) {
                    const t = e.getAttribute("d");
                    if (t && (t.startsWith("M10 2.125C14.3492") || t.includes("17.875 10C17.875 14.3492"))) {
                        n = !0;
                        break
                    }
                }
                if (n) {
                    o = e;
                    break
                }
            }
        }
        if (!o) for (const e of i) {
            const t = e.querySelectorAll(".__menu-item"), n = e.querySelectorAll('[role="group"]');
            if (t.length >= 3 && t.length <= 15 && n.length >= 1 && n.length <= 4) {
                o = e;
                break
            }
        }
        if (!o) return e.innerHTML = "", e.dispatchEvent(new Event("input", {bubbles: !0})), !1;
        const a = findSearchMenuItem(o);
        return a ? (await clickWithEvents(a), await sleep(1e3), e.innerHTML = "", e.dispatchEvent(new Event("input", {bubbles: !0})), !0) : (e.innerHTML = "", e.dispatchEvent(new Event("input", {bubbles: !0})), !1)
    } catch (e) {
        return !1
    }
}

async function enableWebSearch() {
    try {
        const e = document.querySelectorAll('button[data-is-selected="true"]');
        for (const t of e) {
            const e = t.textContent || "";
            if (e.includes("搜索") || e.toLowerCase().includes("search")) return !0
        }
        return !!await enableWebSearchViaSlash()
    } catch (e) {
        return !1
    }
}

async function clickWithEvents(e) {
    const t = e.getBoundingClientRect(), n = t.left + t.width / 2, r = t.top + t.height / 2,
        s = new MouseEvent("mouseover", {bubbles: !0, cancelable: !0, view: window, clientX: n, clientY: r}),
        c = new MouseEvent("mousedown", {bubbles: !0, cancelable: !0, view: window, clientX: n, clientY: r, button: 0}),
        i = new MouseEvent("mouseup", {bubbles: !0, cancelable: !0, view: window, clientX: n, clientY: r, button: 0}),
        o = new MouseEvent("click", {bubbles: !0, cancelable: !0, view: window, clientX: n, clientY: r, button: 0});
    e.dispatchEvent(s), await sleep(50), e.dispatchEvent(c), await sleep(50), e.dispatchEvent(i), await sleep(50), e.dispatchEvent(o), e.click()
}

async function inputQuestion(e) {
    try {
        let t = document.querySelector('div[contenteditable="true"]#prompt-textarea');
        if (t || (t = document.querySelector("textarea#prompt-textarea, textarea[placeholder]")), !t) throw new Error("Input element not found (tried both contenteditable div and textarea)");
        if (t.focus(), await sleep(300), t.hasAttribute("contenteditable")) {
            t.innerHTML = "";
            const n = document.createTextNode(e), r = document.createElement("p");
            r.appendChild(n), t.appendChild(r), t.dispatchEvent(new InputEvent("input", {
                bubbles: !0,
                cancelable: !0
            })), t.dispatchEvent(new Event("change", {bubbles: !0}));
            const s = new InputEvent("input", {bubbles: !0, cancelable: !0, composed: !0, data: e});
            t.dispatchEvent(s)
        } else t.value = e, t.dispatchEvent(new Event("input", {bubbles: !0})), t.dispatchEvent(new Event("change", {bubbles: !0}));
        return await sleep(500), !0
    } catch (e) {
        console.error("Error inputting question:", e)
        return !1
    }
}

async function submitQuestion() {
    try {
        await sleep(500);
        const e = document.querySelector('div[contenteditable="true"]#prompt-textarea');
        if (e) {
            e.focus(), await sleep(200);
            const t = new KeyboardEvent("keydown", {
                key: "Enter",
                code: "Enter",
                keyCode: 13,
                which: 13,
                bubbles: !0,
                cancelable: !0,
                composed: !0
            }), n = new KeyboardEvent("keypress", {
                key: "Enter",
                code: "Enter",
                keyCode: 13,
                which: 13,
                bubbles: !0,
                cancelable: !0,
                composed: !0
            });
            return e.dispatchEvent(t), e.dispatchEvent(n), await sleep(1e3), !0
        }
        let t = document.querySelector("button#composer-submit-button");
        if (t || (t = document.querySelector('button[data-testid="send-button"]')), t || (t = document.querySelector('button[aria-label*="发送"], button[aria-label*="Send"]')), !t) return !0;
        if (t.disabled) for (let e = 0; e < 10 && (await sleep(500), t.disabled); e++) ;
        return t.disabled || clickElement(t), await sleep(1e3), !0
    } catch (e) {
        return !1
    }
}

function sleep(e) {
    return new Promise(t => setTimeout(t, e))
}

async function askQuestion(e, t, n = !0, r = !0) {
    currentQuestion = {
        question: e,
        questionId: t
    }, currentAnswer = "", currentSources = [], currentReferences = [], sseChunks = [], isProcessing = !0, isParsing = !1;
    try {
        r && await enableWebSearch();
        if (!await inputQuestion(e)) throw new Error("Failed to input question");
        if (!await submitQuestion()) throw new Error("Failed to submit question");

        let timeoutMs = 600000; // default 10 minutes
        try {
            const settings = await chrome.storage.local.get(["timeoutMinutes"]);
            const minutes = typeof settings.timeoutMinutes === "number" ? settings.timeoutMinutes : 10;
            if (minutes && minutes > 0 && minutes <= 60) {
                timeoutMs = minutes * 60000;
            }
        } catch (e) {
        }

        return setTimeout(() => {
            isProcessing && currentQuestion && currentQuestion.questionId === t && (currentAnswer ? handleAnswerComplete() : sendQuestionResult(!1, "Timeout waiting for answer"))
        }, timeoutMs), {success: !0, message: "Question submitted, waiting for answer"}
    } catch (e) {
        return sendQuestionResult(!1, e.message), {success: !1, error: e.message}
    }
}

function initializeContentScript() {
    "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", () => {
        injectSSEInterceptor()
    }) : injectSSEInterceptor()
}

window.addEventListener("message", e => {
    if (e.source !== window) return;
    const {type: t, data: n} = e.data;
    switch (t) {
        case"SSE_DATA":
            handleSSEData(n);
            break;
        case"SSE_DONE":
            handleSSEDone();
            break;
        case"SSE_STREAM_END":
            handleStreamEnd();
            break;
        case"SSE_ERROR":
            handleSSEError(e.data.error)
    }
}), chrome.runtime.onMessage.addListener((e, t, n) => {
    if ("PING" === e.type) return n({ready: !0}), !0;
    if ("ASK_QUESTION" === e.type) {
        const t = void 0 === e.useTempChat || e.useTempChat, r = void 0 === e.useWebSearch || e.useWebSearch;
        return askQuestion(e.question, e.questionId, t, r).then(e => n(e)).catch(e => n({
            success: !1,
            error: e.message
        })), !0
    }
    if ("GET_PROJECTS" === e.type) {
        (async () => {
            try {
                try {
                    await waitForElement('a.__menu-item[data-sidebar-item="true"][href*="/project"]', 1e4);
                } catch (o) {
                    // ignore timeout and still try to read whatever is available
                }
                const projects = getChatGPTProjects();
                n({success: !0, projects});
            } catch (r) {
                n({success: !1, error: r.message || String(r)});
            }
        })();
        return !0;
    }
}), initializeContentScript();

function getChatGPTProjects() {
    const results = [];
    const links = document.querySelectorAll('a.__menu-item[data-sidebar-item="true"][href*="/project"]');
    links.forEach(a => {
        let href = a.getAttribute("href") || "";
        if (!href) return;
        if (href.startsWith("/")) {
            href = location.origin + href;
        }
        const nameEl = a.querySelector(".truncate") || a;
        const name = (nameEl.textContent || "").trim() || href;
        results.push({name, url: href});
    });
    return results;
}