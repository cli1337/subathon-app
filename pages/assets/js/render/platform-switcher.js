const { refreshKickUI } = require("./kick");
const { refreshTwitchUI } = require("./twitch");

let currentPlatform = "kick";

function initPlatformSwitcher() {
  const switchKickBtn = document.getElementById("switchKickBtn");
  const switchTwitchBtn = document.getElementById("switchTwitchBtn");
  const kickContent = document.getElementById("kickPlatformContent");
  const twitchContent = document.getElementById("twitchPlatformContent");
  const indicator = document.getElementById("platformSwitchIndicator");

  if (!switchKickBtn || !switchTwitchBtn || !kickContent || !twitchContent || !indicator) {
    return;
  }

  function switchPlatform(platform) {
    if (platform === currentPlatform) return;

    const buttons = [switchKickBtn, switchTwitchBtn];
    const contents = [kickContent, twitchContent];
    
    buttons.forEach(btn => {
      if (btn.dataset.platform === platform) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    const activeBtn = platform === "kick" ? switchKickBtn : switchTwitchBtn;
    const btnRect = activeBtn.getBoundingClientRect();
    const containerRect = activeBtn.parentElement.getBoundingClientRect();
    
    indicator.style.width = `${btnRect.width}px`;
    indicator.style.left = `${btnRect.left - containerRect.left}px`;

    if (platform === "kick") {
      twitchContent.classList.add("hidden");
      setTimeout(() => {
        kickContent.classList.remove("hidden");
        refreshKickUI();
      }, 150);
    } else {
      kickContent.classList.add("hidden");
      setTimeout(() => {
        twitchContent.classList.remove("hidden");
        refreshTwitchUI();
      }, 150);
    }

    currentPlatform = platform;
  }

  switchKickBtn.classList.add("active");
  switchTwitchBtn.classList.remove("active");
  twitchContent.classList.add("hidden");
  kickContent.classList.remove("hidden");
  currentPlatform = "kick";

  function setInitialIndicatorPosition() {
    const initialBtn = switchKickBtn;
    if (initialBtn && indicator) {
      const btnRect = initialBtn.getBoundingClientRect();
      const containerRect = initialBtn.parentElement.getBoundingClientRect();
      if (btnRect.width > 0 && containerRect.width > 0) {
        indicator.style.width = `${btnRect.width}px`;
        indicator.style.left = `${btnRect.left - containerRect.left}px`;
      } else {
        requestAnimationFrame(setInitialIndicatorPosition);
      }
    }
  }
  
  setInitialIndicatorPosition();

  switchKickBtn.addEventListener("click", () => switchPlatform("kick"));
  switchTwitchBtn.addEventListener("click", () => switchPlatform("twitch"));
}

function delayedInit() {
  setTimeout(() => {
    initPlatformSwitcher();
    setTimeout(() => {
      const switchKickBtn = document.getElementById("switchKickBtn");
      const indicator = document.getElementById("platformSwitchIndicator");
      if (switchKickBtn && indicator) {
        const btnRect = switchKickBtn.getBoundingClientRect();
        const containerRect = switchKickBtn.parentElement.getBoundingClientRect();
        indicator.style.width = `${btnRect.width}px`;
        indicator.style.left = `${btnRect.left - containerRect.left}px`;
      }
    }, 50);
  }, 100);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", delayedInit);
} else {
  delayedInit();
}

module.exports = { initPlatformSwitcher };

