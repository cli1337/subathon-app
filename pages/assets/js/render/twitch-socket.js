const WebSocket = require("ws");
const { state } = require("./state");
const { addEvent } = require("./events");
const { showToast } = require("./toast");
const { updateConnectionStatus } = require("./display");

// Check if we're in development mode (defaults to true for safety)
const isDev = typeof window === 'undefined' || window.DEV_MODE !== false;

let ws = null;
let reconnectTimeout = null;
let isConnected = false;

function getChannel() {
  const channel = state.twitch?.channel;
  if (!channel) return null;
  return String(channel).trim().toLowerCase();
}

function getOAuth() {
  const oauth = state.twitch?.oauth;
  if (!oauth) return null;
  return String(oauth).trim();
}

function getUsername() {
  const username = state.twitch?.username;
  if (!username) return null;
  return String(username).trim().toLowerCase();
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
  if (reconnectTimeout || !state.twitch?.configured) return;
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    connectTwitchSocket();
  }, 5000);
}

function parseTwitchMessage(raw) {
  const parts = raw.split(" ");
  if (parts.length < 2) return null;
  
  const tags = {};
  let idx = 0;
  
  if (parts[0].startsWith("@")) {
    const tagStr = parts[0].substring(1);
    tagStr.split(";").forEach(tag => {
      const [key, value] = tag.split("=");
      if (key && value) tags[key] = value;
    });
    idx = 1;
  }
  
  if (parts[idx]?.startsWith(":")) {
    const prefix = parts[idx].substring(1);
    idx++;
  }
  
  const command = parts[idx];
  const params = parts.slice(idx + 1);
  
  return { tags, command, params, raw };
}

function handleTwitchMessage(raw) {
  const msg = parseTwitchMessage(raw);
  if (!msg) return;
  
  if (isDev) {
    console.log("[Twitch Socket Event]", { command: msg.command, tags: msg.tags, params: msg.params });
  }
  
  if (msg.command === "PRIVMSG") {
    const badges = msg.tags.badges || "";
    const displayName = msg.tags["display-name"] || "";
    const userId = msg.tags["user-id"] || "";
    
    if (badges.includes("subscriber") || badges.includes("premium")) {
      const months = parseInt(msg.tags["msg-param-cumulative-months"] || "1");
      const subPlan = msg.tags["msg-param-sub-plan"] || "";
      
      if (msg.raw.includes("msg-id=sub") || msg.raw.includes("msg-id=resub")) {
        const valuePerSub = state.config.subValue || 120;
        addEvent("Subscription", "Twitch", valuePerSub, displayName || userId);
        return;
      }
    }
    
    if (msg.raw.includes("msg-id=subgift") || msg.raw.includes("msg-id=anonsubgift")) {
      const giftCount = parseInt(msg.tags["msg-param-gift-months"] || "1");
      const gifterName = displayName || msg.tags["msg-param-sender-name"] || "Anonymous";
      const valuePerGift = state.config.giftValue || 60;
      const totalValue = valuePerGift * giftCount;
      
      addEvent(`Gift Subscription${giftCount > 1 ? "s" : ""} (${giftCount}x)`, "Twitch", totalValue, gifterName);
      return;
    }
  }
  
  if (msg.command === "USERNOTICE") {
    const msgId = msg.tags["msg-id"] || "";
    const displayName = msg.tags["display-name"] || "";
    
    if (msgId === "sub" || msgId === "resub") {
      const valuePerSub = state.config.subValue || 120;
      addEvent("Subscription", "Twitch", valuePerSub, displayName);
      return;
    }
    
    if (msgId === "subgift" || msgId === "anonsubgift") {
      const giftCount = parseInt(msg.tags["msg-param-gift-months"] || "1");
      const gifterName = displayName || msg.tags["msg-param-sender-name"] || "Anonymous";
      const valuePerGift = state.config.giftValue || 60;
      const totalValue = valuePerGift * giftCount;
      
      addEvent(`Gift Subscription${giftCount > 1 ? "s" : ""} (${giftCount}x)`, "Twitch", totalValue, gifterName);
      return;
    }
  }
}

function connectTwitchSocket() {
  const channel = getChannel();
  const oauth = getOAuth();
  const username = getUsername();
  
  if (!channel || !oauth || !username) {
    return;
  }
  
  if (ws) return;
  
  try {
    ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
  } catch (err) {
    console.error("Twitch WebSocket error on connect:", err);
    showToast("Failed to connect to Twitch IRC", "error");
    scheduleReconnect();
    return;
  }
  
  ws.on("open", () => {
    try {
      ws.send(`PASS ${oauth}`);
      ws.send(`NICK ${username}`);
      ws.send(`JOIN #${channel}`);
      
      isConnected = true;
      console.log("Connected to Twitch channel", channel);
      showToast("Connected to Twitch channel", "success");
      updateConnectionStatus();
      if (refreshTwitchUI) refreshTwitchUI();
    } catch (e) {
      console.error("Twitch WebSocket send error:", e);
      isConnected = false;
      updateConnectionStatus();
      if (refreshTwitchUI) refreshTwitchUI();
    }
  });
  
  ws.on("message", (data) => {
    const messages = data.toString().split("\r\n").filter(m => m.trim());
    messages.forEach(msg => {
      if (msg.startsWith("PING")) {
        ws.send("PONG :tmi.twitch.tv");
        return;
      }
      handleTwitchMessage(msg);
    });
  });
  
  ws.on("close", () => {
    console.log("Twitch WebSocket closed");
    isConnected = false;
    cleanupSocket();
    updateConnectionStatus();
    if (refreshTwitchUI) refreshTwitchUI();
    if (state.twitch?.configured) {
      scheduleReconnect();
    }
  });
  
  ws.on("error", (err) => {
    console.error("Twitch WebSocket error:", err);
    isConnected = false;
    cleanupSocket();
    updateConnectionStatus();
    if (refreshTwitchUI) refreshTwitchUI();
    scheduleReconnect();
  });
}

function ensureTwitchSocketRunning() {
  if (!state.twitch?.configured) {
    cleanupSocket();
    return;
  }
  
  if (!ws) {
    connectTwitchSocket();
  }
}

function getConnectionStatus() {
  return isConnected && ws && ws.readyState === 1; // WebSocket.OPEN = 1
}

let refreshTwitchUI = null;

function setRefreshUICallback(callback) {
  refreshTwitchUI = callback;
}

module.exports = {
  ensureTwitchSocketRunning,
  connectTwitchSocket,
  cleanupTwitchSocket: cleanupSocket,
  getConnectionStatus,
  setRefreshUICallback,
};

