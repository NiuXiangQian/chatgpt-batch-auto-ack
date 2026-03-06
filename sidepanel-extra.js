const RESULT_API_URL_KEY = "resultApiUrl";

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("resultApiUrlInput");
  const docsLink = document.getElementById("apiDocsLink");
  const modal = document.getElementById("apiDocsModal");
  const modalClose = document.getElementById("apiDocsModalClose");

  if (input && chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get([RESULT_API_URL_KEY], (data) => {
      if (chrome.runtime && chrome.runtime.lastError) return;
      const value =
        data && typeof data[RESULT_API_URL_KEY] === "string"
          ? data[RESULT_API_URL_KEY]
          : "";
      if (value) {
        input.value = value;
      }
    });

    let saveTimer = null;
    const save = (raw) => {
      const value = (raw || "").trim();
      try {
        chrome.storage.local.set({ [RESULT_API_URL_KEY]: value });
      } catch {
        // ignore
      }
    };

    const onInput = (event) => {
      const value = event && event.target ? event.target.value : "";
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => save(value), 180);
    };

    input.addEventListener("input", onInput);
    input.addEventListener("change", onInput);
  }

  const openModal = () => {
    if (!modal) return;
    modal.style.display = "flex";
  };

  const closeModal = () => {
    if (!modal) return;
    modal.style.display = "none";
  };

  if (docsLink) {
    docsLink.addEventListener("click", (event) => {
      event.preventDefault();
      openModal();
    });
  }

  if (modalClose) {
    modalClose.addEventListener("click", (event) => {
      event.preventDefault();
      closeModal();
    });
  }

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (!modal) return;
    if (modal.style.display !== "flex") return;
    if (event.key === "Escape") {
      closeModal();
    }
  });
});

