
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  if (container.children.length >= 5) container.children[0].remove();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.style.animation = "toastSlideIn 0.4s ease forwards";
  toast.innerHTML = `<div class="toast-body"><div class="toast-message">${message}</div><button class="toast-close">×</button></div><div class="toast-progress"><div class="toast-progress-bar"></div></div>`;
  container.appendChild(toast);
  toast.querySelector(".toast-close").onclick = () => {
    toast.style.animation = "toastFadeOut 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  };
  setTimeout(() => {
    toast.style.animation = "toastFadeOut 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

module.exports = { showToast };