document.addEventListener("DOMContentLoaded", function () {
  const textarea = document.getElementById("questionsInput");
  const lineNumberElem = document.getElementById("questionsLineNumbers");

  if (!textarea || !lineNumberElem) {
    return;
  }

  function updateLineNumbers() {
    const value = textarea.value || "";
    const lines = value.split("\n").length || 1;

    let content = "";
    for (let i = 1; i <= lines; i++) {
      content += i + "\n";
    }
    lineNumberElem.textContent = content.trimEnd() || "1";
  }

  function syncScroll() {
    lineNumberElem.scrollTop = textarea.scrollTop;
  }

  textarea.addEventListener("input", function () {
    updateLineNumbers();
    syncScroll();
  });

  textarea.addEventListener("scroll", syncScroll);

  // 初始化时也根据已有内容刷新一次
  updateLineNumbers();
  syncScroll();
});

