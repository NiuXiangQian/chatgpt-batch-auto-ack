async function handleProcessQuestion(e, t, a) {
    try {
        let targetUrl;
        if (e.projectUrl) {
            targetUrl = e.projectUrl;
        } else {
            targetUrl = void 0 === e.useTempChat || e.useTempChat ? "https://chatgpt.com/?temporary-chat=true" : "https://chatgpt.com/";
        }
        const r = await chrome.tabs.query({url: "https://chatgpt.com/*"});
        let s;
        r.length > 0 ? (s = r[0], await chrome.tabs.update(s.id, {
            url: targetUrl,
            active: !0
        }), await sleep(2e3)) : (s = await chrome.tabs.create({url: targetUrl, active: !0}), await waitForTabLoad(s.id));
        let c = await waitForContentScript(s.id);
        if (!c && (await chrome.tabs.reload(s.id), await sleep(3e3), await waitForTabLoad(s.id), c = await waitForContentScript(s.id), !c)) throw new Error("Content script not ready even after page refresh. Please try manually refreshing the ChatGPT page (F5).");
        a(await chrome.tabs.sendMessage(s.id, {
            type: "ASK_QUESTION",
            question: e.question,
            questionId: e.questionId,
            useTempChat: void 0 === e.useTempChat || e.useTempChat,
            useWebSearch: void 0 === e.useWebSearch || e.useWebSearch
        }))
    } catch (e) {
        a({success: !1, error: e.message})
    }
}

async function waitForContentScript(e, t = 25) {
    for (let a = 0; a < t; a++) try {
        const t = await chrome.tabs.sendMessage(e, {type: "PING"});
        if (t && t.ready) return !0
    } catch (e) {
        await sleep(1200)
    }
    return !1
}

function sleep(e) {
    return new Promise(t => setTimeout(t, e))
}

async function handleGetProjects(e, t, a) {
    try {
        const targetUrl = "https://chatgpt.com/";
        const tabs = await chrome.tabs.query({url: "https://chatgpt.com/*"});
        let tab;
        if (tabs.length > 0) {
            tab = tabs[0];
            await chrome.tabs.update(tab.id, {url: targetUrl, active: !1});
        } else {
            tab = await chrome.tabs.create({url: targetUrl, active: !1});
        }
        await waitForTabLoad(tab.id);
        const ready = await waitForContentScript(tab.id);
        if (!ready) throw new Error("Content script not ready on ChatGPT page.");
        const resp = await chrome.tabs.sendMessage(tab.id, {type: "GET_PROJECTS"});
        a(resp || {success: !1, error: "No response from content script"});
    } catch (r) {
        a({success: !1, error: r.message || String(r)});
    }
}

async function handleOpenChatGPT(e, t) {
    try {
        let targetUrl;
        if (e.projectUrl) {
            targetUrl = e.projectUrl;
        } else {
            targetUrl = void 0 === e.useTempChat || e.useTempChat ? "https://chatgpt.com/?temporary-chat=true" : "https://chatgpt.com/";
        }
        const r = await chrome.tabs.query({url: "https://chatgpt.com/*"});
        if (r.length > 0) await chrome.tabs.update(r[0].id, {url: targetUrl, active: !0}), t({
            success: !0,
            tabId: r[0].id
        }); else {
            t({success: !0, tabId: (await chrome.tabs.create({url: targetUrl, active: !0})).id})
        }
    } catch (e) {
        t({success: !1, error: e.message})
    }
}

function waitForTabLoad(e) {
    return new Promise(t => {
        chrome.tabs.onUpdated.addListener(function a(r, s) {
            r === e && "complete" === s.status && (chrome.tabs.onUpdated.removeListener(a), setTimeout(t, 5e3))
        })
    })
}

async function forwardToSidePanel(e) {
    try {
        await chrome.runtime.sendMessage(e)
    } catch (e) {
    }
    try {
        await chrome.storage.local.set({pendingMessage: {...e, timestamp: Date.now()}})
    } catch (e) {
    }
}

chrome.action.onClicked.addListener(e => {
    chrome.sidePanel.open({windowId: e.windowId})
}), chrome.runtime.onMessage.addListener((e, t, a) => {
    switch (e.type) {
        case"PROCESS_QUESTION":
            return handleProcessQuestion(e, t, a), !0;
        case"GET_PROJECTS":
            return handleGetProjects(e, t, a), !0;
        case"UPDATE_PROGRESS":
        case"LOG_MESSAGE":
            forwardToSidePanel(e);
            break;
        case"QUESTION_COMPLETE":
            return forwardToSidePanel(e), a({received: !0}), !0;
        case"OPEN_CHATGPT":
            return handleOpenChatGPT(e, a), !0
    }
}), chrome.tabs.onUpdated.addListener((e, t, a) => {
    "complete" === t.status && a.url && a.url.includes("chatgpt.com")
});