const { state } = require("./state");
const { formatValue, formatTime } = require("./utils");
const { updateDisplay, updateStats } = require("./display");
const { saveAllConfig } = require("./config");

let eventsList = document.getElementById("eventsList");
let eventsListInitialized = false;
let currentPage = 1;
const eventsPerPage = 5;
let eventToDelete = null;

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

      eventToDelete = id;
      const deleteEventModal = document.getElementById("deleteEventModal");
      if (deleteEventModal) {
        deleteEventModal.classList.add("show");
      }
    });
  }
}

function addEvent(type, platform, rawValue, gifterName = null) {

  if (!state.isRunning || state.isPaused) {
    return; 

  }

  let delta = rawValue;
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
  
  if (currentPage === 1) {
    addEventToList(event, true);
  } else {

  }
  
  saveAllConfig();
}

function addEventToList(event, isNewEvent = false) {
  initEventsList();
  if (!eventsList) return;
  if (eventsList.querySelector(".empty-state")) eventsList.innerHTML = "";
  
  if (isNewEvent === true) {
    const existingPagination = eventsList.querySelector(".events-pagination");
    if (existingPagination) existingPagination.remove();
  }
  
  const item = document.createElement("div");
  item.className = "event-item";

  if (!event.id) {
    event.id = Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
  item.dataset.id = String(event.id);
  item.style.animation = "slideIn 0.3s ease";
  item.innerHTML = `
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
  
  if (isNewEvent === true && currentPage === 1) {
    const pagination = eventsList.querySelector(".events-pagination");
    if (pagination) {
      eventsList.insertBefore(item, pagination);
    } else {
      eventsList.insertBefore(item, eventsList.firstChild);
    }
  } else {
    eventsList.appendChild(item);
  }
}

function renderEventsList() {
  initEventsList();
  if (!eventsList) return;
  if (!state.events.length) {
    clearEvents();
    return;
  }
  
  eventsList.innerHTML = "";
  
  const totalPages = Math.ceil(state.events.length / eventsPerPage);
  const startIndex = (currentPage - 1) * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const eventsToShow = state.events.slice(startIndex, endIndex);
  
  eventsToShow.forEach(addEventToList);
  
  if (totalPages > 1) {
    const pagination = document.createElement("div");
    pagination.className = "events-pagination";
    pagination.style.cssText = "display: flex; align-items: center; justify-content: center; gap: 8px; padding: 16px; border-top: 1px solid var(--border-color);";
    
    const prevBtn = document.createElement("button");
    prevBtn.className = "btn btn-secondary";
    prevBtn.textContent = "Previous";
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        renderEventsList();
      }
    };
    
    const pageInfo = document.createElement("span");
    pageInfo.style.cssText = "font-size: 14px; color: var(--text-secondary);";
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    
    const nextBtn = document.createElement("button");
    nextBtn.className = "btn btn-secondary";
    nextBtn.textContent = "Next";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderEventsList();
      }
    };
    
    pagination.appendChild(prevBtn);
    pagination.appendChild(pageInfo);
    pagination.appendChild(nextBtn);
    
    eventsList.appendChild(pagination);
  } else {
    currentPage = 1;
  }
}

function deleteEventById(eventId) {
  const idx = state.events.findIndex(ev => String(ev.id) === eventId);
  if (idx === -1) return;
  
  const deletedEvent = state.events[idx];
  const deletedValue = deletedEvent.value || 0;
  
  state.events.splice(idx, 1);
  state.totalEvents = Math.max(0, state.totalEvents - 1);
  
  state.valueAdded = state.events.reduce((sum, ev) => sum + (ev.value || 0), 0);
  
  state.currentValue = Math.max(0, state.currentValue - deletedValue);
  
  const totalPages = Math.ceil(state.events.length / eventsPerPage);
  if (currentPage > totalPages && totalPages > 0) {
    currentPage = totalPages;
  }
  if (currentPage < 1) currentPage = 1;
  
  updateDisplay();
  updateStats();
  renderEventsList();
  saveAllConfig();
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
  const defaultValues = state.config.eventValues?.kick || {};
  const valuePerSub = defaultValues.subValue || 120;
  addEvent(`Subscription${count > 1 ? 's' : ''} (${count}x)`, "Manual", valuePerSub * count, gifterName);
};

module.exports = { addEvent, renderEventsList, clearEvents, updateGifterDisplay, deleteEventById };

