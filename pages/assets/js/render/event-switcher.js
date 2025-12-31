let currentPlatform = "kick";

function initEventSwitcher() {
  const switchKickBtn = document.getElementById("switchKickEventBtn");
  const switchTwitchBtn = document.getElementById("switchTwitchEventBtn");
  const switchStreamlabsBtn = document.getElementById("switchStreamlabsEventBtn");
  const switchDonationalertsBtn = document.getElementById("switchDonationalertsEventBtn");
  const kickContent = document.getElementById("kickEventContent");
  const twitchContent = document.getElementById("twitchEventContent");
  const streamlabsContent = document.getElementById("streamlabsEventContent");
  const donationalertsContent = document.getElementById("donationalertsEventContent");
  const indicator = document.getElementById("eventSwitchIndicator");

  if (!switchKickBtn || !indicator) {
    return;
  }

  function switchPlatform(platform) {
    if (platform === currentPlatform) return;

    const buttons = [switchKickBtn, switchTwitchBtn, switchStreamlabsBtn, switchDonationalertsBtn].filter(Boolean);
    const contents = [kickContent, twitchContent, streamlabsContent, donationalertsContent].filter(Boolean);
    
    buttons.forEach(btn => {
      if (btn && btn.dataset.platform === platform) {
        btn.classList.add("active");
      } else if (btn) {
        btn.classList.remove("active");
      }
    });

    const activeBtn = buttons.find(btn => btn && btn.dataset.platform === platform);
    if (activeBtn && indicator) {
      const btnRect = activeBtn.getBoundingClientRect();
      const containerRect = activeBtn.parentElement.getBoundingClientRect();
      
      indicator.style.width = `${btnRect.width}px`;
      indicator.style.left = `${btnRect.left - containerRect.left}px`;
    }

    contents.forEach(content => {
      if (content) {
        if (content.id === `${platform}EventContent`) {
          content.classList.remove("hidden");
        } else {
          content.classList.add("hidden");
        }
      }
    });

    currentPlatform = platform;
  }

  switchKickBtn.classList.add("active");
  [switchTwitchBtn, switchStreamlabsBtn, switchDonationalertsBtn].forEach(btn => {
    if (btn) btn.classList.remove("active");
  });
  
  [twitchContent, streamlabsContent, donationalertsContent].forEach(content => {
    if (content) content.classList.add("hidden");
  });
  if (kickContent) kickContent.classList.remove("hidden");
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

  if (switchKickBtn) switchKickBtn.addEventListener("click", () => switchPlatform("kick"));
  if (switchTwitchBtn) switchTwitchBtn.addEventListener("click", () => switchPlatform("twitch"));
  if (switchStreamlabsBtn) switchStreamlabsBtn.addEventListener("click", () => switchPlatform("streamlabs"));
  if (switchDonationalertsBtn) switchDonationalertsBtn.addEventListener("click", () => switchPlatform("donationalerts"));
}

function delayedInit() {
  setTimeout(() => {
    initEventSwitcher();
  }, 100);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", delayedInit);
} else {
  delayedInit();
}

const mainContent = document.getElementById("mainContent");
if (mainContent) {
  const observer = new MutationObserver(() => {
    setTimeout(() => {
      if (document.getElementById("switchSubBtn") && !document.getElementById("switchSubBtn").hasAttribute("data-initialized")) {
        initEventSwitcher();
        const btn = document.getElementById("switchSubBtn");
        if (btn) btn.setAttribute("data-initialized", "true");
      }
    }, 50);
  });

  observer.observe(mainContent, {
    childList: true,
    subtree: true
  });
}

module.exports = { initEventSwitcher };

