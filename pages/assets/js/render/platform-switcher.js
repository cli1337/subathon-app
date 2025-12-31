const { refreshKickUI } = require("./kick");
const { refreshTwitchUI } = require("./twitch");
const { refreshStreamlabsUI } = require("./streamlabs");
const { refreshDonationalertsUI } = require("./donationalerts");

let currentPlatform = "kick";

function initPlatformSwitcher() {
  const switchKickBtn = document.getElementById("switchKickBtn");
  const switchTwitchBtn = document.getElementById("switchTwitchBtn");
  const switchStreamlabsBtn = document.getElementById("switchStreamlabsBtn");
  const switchDonationalertsBtn = document.getElementById("switchDonationalertsBtn");
  const kickContent = document.getElementById("kickPlatformContent");
  const twitchContent = document.getElementById("twitchPlatformContent");
  const streamlabsContent = document.getElementById("streamlabsPlatformContent");
  const donationalertsContent = document.getElementById("donationalertsPlatformContent");
  const indicator = document.getElementById("platformSwitchIndicator");

  if (!switchKickBtn || !switchTwitchBtn || !switchStreamlabsBtn || !switchDonationalertsBtn || !kickContent || !twitchContent || !streamlabsContent || !donationalertsContent || !indicator) {
    return;
  }

  function switchPlatform(platform) {
    if (platform === currentPlatform) return;

    const buttons = [switchKickBtn, switchTwitchBtn, switchStreamlabsBtn, switchDonationalertsBtn];
    const contents = [kickContent, twitchContent, streamlabsContent, donationalertsContent];
    
    buttons.forEach(btn => {
      if (btn && btn.dataset.platform === platform) {
        btn.classList.add("active");
      } else if (btn) {
        btn.classList.remove("active");
      }
    });

    const activeBtn = buttons.find(btn => btn && btn.dataset.platform === platform);
    if (activeBtn) {
      const btnRect = activeBtn.getBoundingClientRect();
      const containerRect = activeBtn.parentElement.getBoundingClientRect();
      
      indicator.style.width = `${btnRect.width}px`;
      indicator.style.left = `${btnRect.left - containerRect.left}px`;
    }

    contents.forEach(content => {
      if (content) {
        if (content.id === `${platform}PlatformContent`) {
          content.classList.remove("hidden");
        } else {
          content.classList.add("hidden");
        }
      }
    });

    setTimeout(() => {
      if (platform === "kick") {
        refreshKickUI();
      } else if (platform === "twitch") {
        refreshTwitchUI();
      } else if (platform === "streamlabs") {
        refreshStreamlabsUI();
      } else if (platform === "donationalerts") {
        refreshDonationalertsUI();
      }
    }, 150);

    currentPlatform = platform;
  }

  switchKickBtn.classList.add("active");
  switchTwitchBtn.classList.remove("active");
  switchStreamlabsBtn.classList.remove("active");
  switchDonationalertsBtn.classList.remove("active");
  twitchContent.classList.add("hidden");
  streamlabsContent.classList.add("hidden");
  donationalertsContent.classList.add("hidden");
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
  switchStreamlabsBtn.addEventListener("click", () => switchPlatform("streamlabs"));
  switchDonationalertsBtn.addEventListener("click", () => switchPlatform("donationalerts"));
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

