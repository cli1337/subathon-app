const { state } = require("./state");
const { addEvent } = require("./events");
const { calculateDonationValue } = require("./utils");
const { showToast } = require("./toast");
const { updateConnectionStatus } = require("./display");
let refreshStreamlabsUI = null;

const isDev = typeof window === 'undefined' || window.DEV_MODE !== false;

let socket = null;
let reconnectTimeout = null;
let isConnected = false;
let isConnecting = false;

function getSocketToken() {
  const token = state.streamlabs?.socketToken;
  if (!token) return null;
  return String(token).trim();
}

function cleanupSocket() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (socket) {
    try {
      socket.removeAllListeners();
      socket.disconnect();
    } catch (e) {}
    socket = null;
  }
  isConnected = false;
  isConnecting = false;
}

function scheduleReconnect() {
  if (reconnectTimeout || !state.streamlabs?.configured || state.platforms?.streamlabs?.enabled === false) return;
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    connectStreamlabsSocket();
  }, 5000);
}

function handleStreamlabsEvent(eventData) {
  if (!eventData) return;

  const streamlabsValues = state.config.eventValues?.streamlabs || {};
  if (streamlabsValues.platformEnabled === false) return;
  if (streamlabsValues.donationEnabled === false) return;

  if (eventData.type === "donation" && (!eventData.for || eventData.for === "streamlabs")) {
    const messages = Array.isArray(eventData.message) ? eventData.message : [eventData.message];
    
    messages.forEach(donation => {
      if (!donation) return;
      
      const amount = parseFloat(donation.amount) || 0;
      const currency = donation.currency || "USD";
      const donorName = donation.name || donation.from || "Anonymous";
      const message = donation.message || "";
      
      const currencyConfig = streamlabsValues.donationCurrencies?.[currency];
      const totalValue = calculateDonationValue(amount, currencyConfig);
      
      console.log(`[Streamlabs Donation] ${donorName}: ${currency} ${amount.toFixed(2)} = ${totalValue} units (mode: ${currencyConfig?.mode || "multiplier"})`);
      
      if (totalValue > 0) {
        addEvent(`Donation (${currency} ${amount.toFixed(2)})`, "Streamlabs", totalValue, donorName);
      } else {
        console.warn(`[Streamlabs Donation] Currency ${currency} has no value configured. Donation ignored.`);
      }
    });
  }
}

function connectStreamlabsSocket() {
  if (state.platforms?.streamlabs?.enabled === false) {
    cleanupSocket();
    return;
  }

  const socketToken = getSocketToken();
  if (!socketToken) {
    cleanupSocket();
    return;
  }

  if (isConnecting) {
    console.log("[Streamlabs Socket] Connection already in progress, skipping...");
    return;
  }

  if (socket && socket.connected) {
    console.log("[Streamlabs Socket] Already connected, skipping...");
    return;
  }

  if (socket && (socket.connecting || socket.disconnected === false)) {
    console.log("[Streamlabs Socket] Socket exists but not fully connected, cleaning up first...");
    cleanupSocket();
  }

  isConnecting = true;

  try {
    let io;
    try {
      io = require("socket.io-client");
    } catch (err) {
      console.error("socket.io-client not found. Please install it: npm install socket.io-client");
      showToast("socket.io-client package required. Install with: npm install socket.io-client", "error");
      return;
    }
    
    const socketUrl = `https://sockets.streamlabs.com?token=${socketToken}`;
    
    socket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    });

    socket.on("connect", () => {
      isConnected = true;
      isConnecting = false;
      console.log("[Streamlabs Socket] Connected to Streamlabs socket");
      showToast("Connected to Streamlabs", "success");
      updateConnectionStatus();
      if (refreshStreamlabsUI) refreshStreamlabsUI();
    });

    socket.on("event", (eventData) => {
      console.log("[Streamlabs Socket Event]", JSON.stringify(eventData, null, 2));
      handleStreamlabsEvent(eventData);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Streamlabs Socket] Disconnected:", reason);
      isConnected = false;
      isConnecting = false;
      updateConnectionStatus();
      if (refreshStreamlabsUI) refreshStreamlabsUI();
      if (state.streamlabs?.configured && reason !== "io client disconnect") {
        scheduleReconnect();
      }
    });

    socket.on("connect_error", (err) => {
      console.error("[Streamlabs Socket] Connection error:", err);
      isConnected = false;
      isConnecting = false;
      updateConnectionStatus();
      if (refreshStreamlabsUI) refreshStreamlabsUI();
      scheduleReconnect();
    });

    socket.on("error", (err) => {
      console.error("[Streamlabs Socket] Error:", err);
      isConnected = false;
      updateConnectionStatus();
      if (refreshStreamlabsUI) refreshStreamlabsUI();
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("[Streamlabs Socket] Reconnected after", attemptNumber, "attempts");
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log("[Streamlabs Socket] Reconnection attempt", attemptNumber);
    });

    socket.on("reconnect_error", (error) => {
      console.error("[Streamlabs Socket] Reconnection error:", error);
    });

    socket.on("reconnect_failed", () => {
      console.error("[Streamlabs Socket] Reconnection failed");
    });


  } catch (err) {
    console.error("Streamlabs socket initialization error:", err);
    isConnecting = false;
    showToast("Failed to initialize Streamlabs socket. Make sure socket.io-client is installed.", "error");
    scheduleReconnect();
  }
}

function ensureStreamlabsSocketRunning() {
  if (!state.streamlabs?.configured) {
    cleanupSocket();
    return;
  }

  if (isConnecting) {
    return;
  }

  if (!socket || !socket.connected) {
    connectStreamlabsSocket();
  }
}

function getConnectionStatus() {
  return isConnected && socket && socket.connected;
}

function setRefreshUICallback(callback) {
  refreshStreamlabsUI = callback;
}

module.exports = {
  connectStreamlabsSocket,
  cleanupStreamlabsSocket: cleanupSocket,
  ensureStreamlabsSocketRunning,
  getConnectionStatus,
  setRefreshUICallback
};

