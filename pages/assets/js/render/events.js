const { state } = require("./state");
const { formatValue, formatTime } = require("./utils");
const { updateDisplay, updateStats } = require("./display");
const { saveAllConfig } = require("./config");

let eventsList = document.getElementById("eventsList");
let eventsListInitialized = false;

function initEventsList() {
  if (!eventsList) eventsList = document.getElementById("eventsList");

  if (eventsList && !eventsListInitialized) {
    eventsListInitialized = true;
    eventsList.addEventListener("click", (e) => {
      const deleteBtn = e.target.closest(".event-delete-btn");
      if (!deleteBtn) return;

      const item = deleteBtn.closest(".event-item");
      if (!item) return;

      const id = item.dataset.id;
      if (!id) return;

      const idx = state.events.findIndex(ev => String(ev.id) === id);
      if (idx !== -1) {
        state.events.splice(idx, 1);
      }

      item.style.animation = "fadeOut 0.2s ease forwards";
      setTimeout(() => {
        if (item.parentNode) {
          item.parentNode.removeChild(item);
        }
        if (!state.events.length) {
          clearEvents();
        }
        saveAllConfig();
      }, 180);
    });
  }
}

function addEvent(type, platform, rawValue, gifterName = null) {

  if (!state.isRunning || state.isPaused) {
    return; 

  }

  let delta = state.metricType === "distance" ? rawValue / 1000 : rawValue;
  state.currentValue += delta;
  state.totalEvents++;
  state.valueAdded += delta;

  const event = { 
    type, 
    platform, 
    value: delta, 
    rawValue, 
    gifterName: gifterName || null,
    timestamp: new Date().toISOString(),

    id: Date.now().toString(36) + Math.random().toString(36).slice(2)
  };
  state.events.unshift(event);
  if (state.events.length > 50) state.events.pop();

  if (gifterName) {
    updateGifterDisplay(gifterName, delta);
  }

  updateDisplay();
  updateStats();
  addEventToList(event);
  saveAllConfig();
}

function addEventToList(event) {
  initEventsList();
  if (!eventsList) return;
  if (eventsList.querySelector(".empty-state")) eventsList.innerHTML = "";
  const item = document.createElement("div");
  item.className = "event-item";

  if (!event.id) {
    event.id = Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
  item.dataset.id = String(event.id);
  item.style.animation = "slideIn 0.3s ease";
  const iconBg = event.platform === "Twitch" ? "#9146ff" : "#53fc18";
  const icon = event.platform === "Twitch" ? "TV" : "K";
  item.innerHTML = `
    <div class="event-icon" style="background:${iconBg};">${icon}</div>
    <div class="event-content">
      <div class="event-title">${event.type}</div>
      <div class="event-meta">${event.platform} • ${formatTime(event.timestamp)}</div>
    </div>
    <div class="event-value">+${formatValue(event.value)}</div>
    <button class="btn btn-icon event-delete-btn" title="Delete event" aria-label="Delete event">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;
  eventsList.insertBefore(item, eventsList.firstChild);
}

function renderEventsList() {
  initEventsList();
  if (!eventsList) return;
  if (!state.events.length) return clearEvents();
  eventsList.innerHTML = "";
  state.events.forEach(addEventToList);
}

function clearEvents() {
  initEventsList();
  if (!eventsList) return;
  eventsList.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>No events yet. Connect a platform or add manual events.</p>
    </div>`;
}

function updateGifterDisplay(gifterName, value) {
  const { formatValue } = require("./utils");
  const { getUnitDisplay } = require("./utils");
  const { ipcRenderer } = require("electron");

  const formatted = formatValue(value);
  const unit = getUnitDisplay();

  const dashboardGifterName = document.getElementById("dashboardGifterName");
  const dashboardGifterAmount = document.getElementById("dashboardGifterAmount");
  const dashboardGifterUnit = document.getElementById("dashboardGifterAmountUnit");
  const dashboardGifterCard = document.getElementById("dashboardGifterCard");

  if (dashboardGifterCard) {
    if (dashboardGifterName) dashboardGifterName.textContent = gifterName;
    if (dashboardGifterAmount) dashboardGifterAmount.textContent = formatted;
    if (dashboardGifterUnit) dashboardGifterUnit.textContent = unit;
    dashboardGifterCard.style.display = "flex";
    dashboardGifterCard.style.animation = "fadeIn 0.3s ease";

    setTimeout(() => {
      if (dashboardGifterCard) {
        dashboardGifterCard.style.animation = "fadeOut 0.3s ease";
        setTimeout(() => {
          if (dashboardGifterCard) dashboardGifterCard.style.display = "none";
        }, 300);
      }
    }, 5000);
  }

  ipcRenderer.send("gifter-update", {
    name: gifterName,
    amount: formatted,
    unit: unit
  });
}

window.handleSubs = function(count, gifterName = null) {
  if (typeof count !== "number" || count <= 0) return;
  const valuePerSub = state.config.subValue || 120;
  addEvent(`Subscription${count > 1 ? 's' : ''} (${count}x)`, "Manual", valuePerSub * count, gifterName);
};

module.exports = { addEvent, renderEventsList, clearEvents, updateGifterDisplay };

