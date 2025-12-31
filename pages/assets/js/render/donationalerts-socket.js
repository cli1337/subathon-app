const { state } = require("./state");
const { addEvent } = require("./events");
const { calculateDonationValue } = require("./utils");
const { showToast } = require("./toast");
const { updateConnectionStatus } = require("./display");
let refreshDonationalertsUI = null;

let ws = null;
let reconnectTimeout = null;
let isConnected = false;
let isConnecting = false;

function getWidgetToken() {
  const token = state.donationalerts?.accessToken;
  if (!token) return null;
  return String(token).trim();
}

function cleanupSocket() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (ws) {
    try {
      ws.close();
    } catch (e) {}
    ws = null;
  }
  isConnected = false;
  isConnecting = false;
}

function scheduleReconnect() {
  if (reconnectTimeout || !state.donationalerts?.configured || state.platforms?.donationalerts?.enabled === false) return;
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    connectDonationalertsSocket();
  }, 5000);
}

function handleDonationalertsEvent(donationData) {
  if (!donationData) return;

  const donationalertsValues = state.config.eventValues?.donationalerts || {};
  if (donationalertsValues.platformEnabled === false) return;
  if (donationalertsValues.donationEnabled === false) return;

  if (donationData.is_shown !== undefined && parseInt(donationData.is_shown) === 1) {
    return;
  }

  if (donationData.alert_type === 1 || donationData.alert_type === "1" || donationData.amount !== undefined || donationData.amount_main !== undefined) {
    const amount = parseFloat(donationData.amount_main || donationData.amount) || 0;
    const currency = donationData.currency || "USD";
    const donorName = donationData.username || donationData.name || "Anonymous";
    const messageText = donationData.message || "";
    
    console.log(`[DonationAlerts Donation] Processing: ${donorName}, ${currency} ${amount}, alert_type: ${donationData.alert_type}`);
    
    const currencyConfig = donationalertsValues.donationCurrencies?.[currency];
    
    if (!currencyConfig) {
      console.warn(`[DonationAlerts Donation] Currency ${currency} has no configuration. Please configure it in Metrics tab.`);
      return;
    }
    
    const totalValue = calculateDonationValue(amount, currencyConfig);
    
    console.log(`[DonationAlerts Donation] ${donorName}: ${currency} ${amount.toFixed(2)} = ${totalValue} units (mode: ${currencyConfig?.mode || "multiplier"})`);
    
    if (totalValue > 0) {
      addEvent(`Donation (${currency} ${amount.toFixed(2)})`, "DonationAlerts", totalValue, donorName);
    } else {
      console.warn(`[DonationAlerts Donation] Calculated value is 0. Amount: ${amount}, Config:`, currencyConfig);
    }
  } else {
    console.log(`[DonationAlerts] Ignoring non-donation event. alert_type: ${donationData.alert_type}, amount: ${donationData.amount}`);
  }
}

function connectDonationalertsSocket() {
  if (state.platforms?.donationalerts?.enabled === false) {
    cleanupSocket();
    return;
  }

  const widgetToken = getWidgetToken();
  if (!widgetToken) {
    cleanupSocket();
    return;
  }

  if (isConnecting) {
    console.log("[DonationAlerts Socket] Connection already in progress, skipping...");
    return;
  }

  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log("[DonationAlerts Socket] Already connected, skipping...");
    return;
  }

  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    console.log("[DonationAlerts Socket] WebSocket exists but not fully closed, cleaning up first...");
    cleanupSocket();
  }

  isConnecting = true;

  try {

    const socketUrl = 'wss://socket5.donationalerts.com:443/socket.io/?EIO=3&transport=websocket';
    
    ws = new WebSocket(socketUrl);
    
    ws.onopen = () => {
      console.log("[DonationAlerts Socket] WebSocket connected");
      ws.send('2');
    };

    ws.onmessage = (event) => {
      try {
        const data = event.data;
        console.log("[DonationAlerts Socket Message]", data);
        
        if (!data || data.length === 0) return;
        
        const packetType = parseInt(data[0]);
        
        if (packetType === 2) {
          ws.send('3');
          return;
        }
        
        if (packetType === 3) {
          return;
        }
        
        if (packetType === 0) {
          try {
            const handshake = JSON.parse(data.substring(1));
            console.log("[DonationAlerts Socket] Handshake received:", handshake);
            
            isConnected = true;
            isConnecting = false;
            console.log("[DonationAlerts Socket] Connected to DonationAlerts socket");
            
            const addUserMessage = '42["add-user",{"token":"' + widgetToken + '","type":"alert_widget"}]';
            ws.send(addUserMessage);
            
            showToast("Connected to DonationAlerts", "success");
            updateConnectionStatus();
            if (refreshDonationalertsUI) refreshDonationalertsUI();
          } catch (parseError) {
            console.error("[DonationAlerts Socket] Error parsing handshake:", parseError);
          }
          return;
        }
        
        if (packetType === 4 || data.startsWith('42')) {
          let messageData = data.substring(1);
          if (data.startsWith('42')) {
            messageData = data.substring(2);
          }
          
          try {
            const parsed = JSON.parse(messageData);
            
            if (Array.isArray(parsed) && parsed.length >= 2) {
              const eventName = parsed[0];
              let eventData = parsed[1];
              
              if (typeof eventData === 'string') {
                try {
                  eventData = JSON.parse(eventData);
                } catch (parseErr) {
                  console.error("[DonationAlerts Socket] Error parsing event data JSON string:", parseErr);
                  return;
                }
              }
              
              if (eventName === 'donation') {
                console.log("[DonationAlerts Socket Donation]", JSON.stringify(eventData, null, 2));
                handleDonationalertsEvent(eventData);
              }
            }
          } catch (parseError) {
            console.error("[DonationAlerts Socket] Error parsing message:", parseError, "Data:", messageData);
          }
        }
      } catch (error) {
        console.error("[DonationAlerts Socket] Error handling message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("[DonationAlerts Socket] WebSocket error:", error);
      isConnected = false;
      isConnecting = false;
      updateConnectionStatus();
      if (refreshDonationalertsUI) refreshDonationalertsUI();
      scheduleReconnect();
    };

    ws.onclose = (event) => {
      console.log("[DonationAlerts Socket] WebSocket closed:", event.code, event.reason);
      isConnected = false;
      isConnecting = false;
      updateConnectionStatus();
      if (refreshDonationalertsUI) refreshDonationalertsUI();
      
      if (state.donationalerts?.configured && event.code !== 1000) {
        scheduleReconnect();
      }
    };

  } catch (err) {
    console.error("DonationAlerts socket initialization error:", err);
    isConnecting = false;
    showToast("Failed to initialize DonationAlerts socket. Make sure socket.io-client is installed.", "error");
    scheduleReconnect();
  }
}

function ensureDonationalertsSocketRunning() {
  if (!state.donationalerts?.configured) {
    cleanupSocket();
    return;
  }

  if (isConnecting) {
    return;
  }

  if (!ws || ws.readyState !== WebSocket.OPEN) {
    connectDonationalertsSocket();
  }
}

function getConnectionStatus() {
  return isConnected && ws && ws.readyState === WebSocket.OPEN;
}

function setRefreshUICallback(callback) {
  refreshDonationalertsUI = callback;
}

module.exports = {
  connectDonationalertsSocket,
  cleanupDonationalertsSocket: cleanupSocket,
  ensureDonationalertsSocketRunning,
  getConnectionStatus,
  setRefreshUICallback
};
