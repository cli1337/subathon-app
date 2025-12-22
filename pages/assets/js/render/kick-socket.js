const WebSocket = require("ws");
const { state } = require("./state");
const { addEvent } = require("./events");
const { showToast } = require("./toast");
const { updateConnectionStatus } = require("./display");
let refreshKickUI = null;

// Check if we're in development mode (defaults to true for safety)
const isDev = typeof window === 'undefined' || window.DEV_MODE !== false;

let ws = null;
let reconnectTimeout = null;
let isConnected = false;

function getChatroomId() {
  const id = state.kick?.chatroomId;
  if (!id) return null;
  return String(id).trim();
}

function getPusherUrl() {
  const region = (state.kick?.pusherRegion || "ws-us2").trim();
  const key = (state.kick?.pusherKey || "32cbd69e4b950bf97679").trim();
  return `wss://${region}.pusher.com/app/${key}?protocol=7&client=js&version=7.4.0&flash=false`;
}

function cleanupSocket() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (ws) {
    try { ws.terminate(); } catch (e) {}
    ws = null;
  }
  isConnected = false;
}

function scheduleReconnect() {
  if (reconnectTimeout || !state.kick?.configured) return;
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    connectKickSocket();
  }, 5000);
}

function handleKickMessage(raw) {
  let msg;
  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }
  if (!msg.event || msg.event === "pusher:pong" || msg.event === "pusher:connection_established") return;
  if (!msg.data) return;
  
  if (isDev) {
    console.log("[Kick Socket Event]", { event: msg.event, data: msg.data });
  }

  let data;
  try {
    data = typeof msg.data === "string" ? JSON.parse(msg.data) : msg.data;
  } catch {
    return;
  }

  if (msg.event === "GiftedSubscriptionsEvent") {
    const count = Array.isArray(data.gifted_usernames) ? data.gifted_usernames.length : (data.quantity || 0);
    if (!count || count <= 0) return;

    const gifterName = data.gifter_username || data.username || "Anonymous";
    const valuePerGift = state.config.giftValue || 60;
    const totalValue = valuePerGift * count;

    addEvent(`Gift Subscription${count > 1 ? "s" : ""} (${count}x)`, "KICK", totalValue, gifterName);
    return;
  }

  if (msg.event === "App\\Events\\SubscriptionEvent") {
    const username = data.username || data.sender_username || "Unknown";
    const valuePerSub = state.config.subValue || 120;

    addEvent("Subscription", "KICK", valuePerSub, username);
    return;
  }
}

function connectKickSocket() {
  const chatroomId = getChatroomId();
  if (!chatroomId) {
    return;
  }

  if (ws) return;

  const url = getPusherUrl();

  try {
    ws = new WebSocket(url);
  } catch (err) {
    console.error("Kick WebSocket error on connect:", err);
    showToast("Failed to connect to Kick chat", "error");
    scheduleReconnect();
    return;
  }

  ws.on("open", () => {
    try {
      ws.send(JSON.stringify({
        event: "pusher:subscribe",
        data: {
          auth: "",
          channel: `chatrooms.${chatroomId}.v2`
        }
      }));
      ws.send(JSON.stringify({
        event: "pusher:subscribe",
        data: {
          auth: "",
          channel: `channel_${chatroomId}`
        }
      }));
      ws.send(JSON.stringify({
        event: "pusher:subscribe",
        data: {
          auth: "",
          channel: `channel.${chatroomId}`
        }
      }));
      ws.send(JSON.stringify({
        event: "pusher:subscribe",
        data: {
          auth: "",
          channel: `chatrooms.${chatroomId}`
        }
      }));
      ws.send(JSON.stringify({
        event: "pusher:subscribe",
        data: {
          auth: "",
          channel: `chatroom_${chatroomId}`
        }
      }));
      ws.send(JSON.stringify({
        event: "pusher:subscribe",
        data: {
          auth: "",
          channel: `predictions-channel-${chatroomId}`
        }
      }));

      
      isConnected = true;
      console.log("Connected to Kick chatroom", chatroomId);
      showToast("Connected to Kick chatroom", "success");
      updateConnectionStatus();
      if (refreshKickUI) refreshKickUI();
    } catch (e) {
      console.error("Kick WebSocket send error:", e);
      isConnected = false;
      updateConnectionStatus();
      if (refreshKickUI) refreshKickUI();
    }
  });

  ws.on("message", handleKickMessage);

  ws.on("close", () => {
    console.log("Kick WebSocket closed");
    isConnected = false;
    cleanupSocket();
    updateConnectionStatus();
    if (refreshKickUI) refreshKickUI();
    if (state.kick?.configured) {
      scheduleReconnect();
    }
  });

  ws.on("error", (err) => {
    console.error("Kick WebSocket error:", err);
    isConnected = false;
    cleanupSocket();
    updateConnectionStatus();
    if (refreshKickUI) refreshKickUI();
    scheduleReconnect();
  });
}

function ensureKickSocketRunning() {

  if (!state.kick?.configured) {
    cleanupSocket();
    return;
  }

  if (!ws) {
    connectKickSocket();
  }
}

function getConnectionStatus() {
  return isConnected && ws && ws.readyState === 1; // WebSocket.OPEN = 1
}

function setRefreshUICallback(callback) {
  refreshKickUI = callback;
}

module.exports = {
  ensureKickSocketRunning,
  connectKickSocket,
  cleanupKickSocket: cleanupSocket,
  getConnectionStatus,
  setRefreshUICallback,
};

