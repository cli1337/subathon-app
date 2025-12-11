// main.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");               // ← THIS IS THE REAL path module
const fs = require("fs");
const express = require("express");
const http = require("http");
const axios = require("axios");
const crypto = require("crypto");
const os = require('os');

async function resolveKickDns() {
  try {
    const { dns } = require('dns');
    const ips = await new Promise((resolve, reject) => dns.resolve4('id.kick.com', (err, ips) => err ? reject(err) : resolve(ips)));
    console.log('Kick DNS resolved:', ips);
  } catch (e) { console.error('DNS fail in Node:', e); }
}

// ---------------------------
// GLOBALS
// ---------------------------
let mainWindow;
let overlayServer;
let overlayApp;
let dataDir = "";
let config = {};

// Default config
const defaultConfig = {
  overlayPort: 55814,

  kick: {
    clientId: "",
    clientSecret: "",
    accessToken: "",
    refreshToken: "",
    linkedUser: "",
    pkce_verifier: "",
    state: ""
  },

  metricState: {
    currentValue: 0,
    metricType: "time",
    customUnit: "",
    totalEvents: 0,
    valueAdded: 0
  },

  reducer: {
    enabled: false,
    amountPerSecond: 1
  },

  overlay: {
    fontSize: 72,
    textColor: "#ffffff",
    background: "transparent",
    bgColor: "#000000"
  },

  settings: {
    autoSave: false,
    soundAlerts: false,
    startMinimized: false
  }
};

// -----------------------------------------
// LOAD / SAVE CONFIG
// -----------------------------------------
function loadConfig() {
  const cfgPath = path.join(dataDir, "config.json");

  if (!fs.existsSync(cfgPath)) {
    config = JSON.parse(JSON.stringify(defaultConfig));
    saveConfig();
    return;
  }

  try {
    const saved = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
    config = JSON.parse(JSON.stringify(defaultConfig)); // start fresh

    if (saved.overlayPort !== undefined) config.overlayPort = saved.overlayPort;
    
    // Fixed: Only assign saved kick data, don't merge with defaults
    if (saved.kick) {
      config.kick = {
        clientId: saved.kick.clientId || "",
        clientSecret: saved.kick.clientSecret || "",
        accessToken: saved.kick.accessToken || "",
        refreshToken: saved.kick.refreshToken || "",
        linkedUser: saved.kick.linkedUser || "",
        // Only include these if they exist in saved config
        ...(saved.kick.pkce_verifier && { pkce_verifier: saved.kick.pkce_verifier }),
        ...(saved.kick.state && { state: saved.kick.state })
      };
    }
    
    if (saved.metricState) Object.assign(config.metricState, saved.metricState);
    if (saved.reducer) Object.assign(config.reducer, saved.reducer);
    if (saved.overlay) Object.assign(config.overlay, saved.overlay);
    if (saved.settings) Object.assign(config.settings, saved.settings);
    
    console.log("Loaded config.kick:", JSON.stringify(config.kick, null, 2));
  } catch (err) {
    console.error("Corrupted config.json – resetting", err);
    config = JSON.parse(JSON.stringify(defaultConfig));
    saveConfig();
  }
}


function saveConfig() {
  const cfgPath = path.join(dataDir, "config.json");
  fs.writeFileSync(cfgPath, JSON.stringify(config, null, 2));
}

// Partial autosave (timer, events, etc.)
ipcMain.on("autosave", (event, partial) => {
  if (partial.metricState) Object.assign(config.metricState, partial.metricState);
  if (partial.reducer) Object.assign(config.reducer, partial.reducer);
  saveConfig();
});

// Full save from settings page
ipcMain.on("save-config", (event, data) => {
  if (data.overlayPort !== undefined) config.overlayPort = data.overlayPort;
  if (data.kick) Object.assign(config.kick, data.kick);
  if (data.metricState) Object.assign(config.metricState, data.metricState);
  if (data.reducer) Object.assign(config.reducer, data.reducer);
  if (data.overlay) Object.assign(config.overlay, data.overlay);
  if (data.settings) Object.assign(config.settings, data.settings);

  saveConfig();

  // Keep renderer in sync
  if (mainWindow) {
    mainWindow.webContents.send("config-updated", config);
  }
});

// Renderer asks for config on startup
ipcMain.on("load-config", (event) => {
  event.reply("config-loaded", config);
});

function broadcastConfig() {
  if (mainWindow) mainWindow.webContents.send("config-updated", config);
}

// -----------------------------------------
// OVERLAY SERVER + KICK OAUTH
// -----------------------------------------
function startOverlayServer() {
  overlayApp = express();
  const server = http.createServer(overlayApp);
  overlayApp.use(express.json());

  // Serve static overlay files
  overlayApp.get("/overlay", (req, res) => res.sendFile(path.join(__dirname, "pages", "overlay.html")));
  overlayApp.get("/overlay.css", (req, res) => res.sendFile(path.join(__dirname, "pages", "overlay.css")));
  overlayApp.get("/overlay.js", (req, res) => res.sendFile(path.join(__dirname, "pages", "overlay.js")));
  overlayApp.get("/assets/:file", (req, res) => res.sendFile(path.join(__dirname, "pages", "assets", req.params.file)));

  // Data endpoint for overlay
  let lastValue = "00:00:00";
  let lastUnit = "TIME";
  overlayApp.get("/data", (req, res) => {
    res.json({ value: lastValue, unit: lastUnit, ...config.overlay });
  });

  ipcMain.on("overlay-update", (event, data) => {
    lastValue = data.value;
    lastUnit = data.unit;
  });

  // Kick OAuth – Step 1
  overlayApp.get("/kick/auth", (req, res) => {
    if (!config.kick.clientId || !config.kick.clientSecret) {
      return res.status(400).send("Kick app not configured.");
    }

    config.kick.pkce_verifier = crypto.randomBytes(32).toString("base64url");
    config.kick.state = crypto.randomBytes(16).toString("base64url");
    saveConfig();

    const challenge = crypto.createHash("sha256")
      .update(config.kick.pkce_verifier)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const authUrl = `https://id.kick.com/oauth/authorize?` +
      `response_type=code&client_id=${config.kick.clientId}` +
      `&redirect_uri=http://localhost:${config.overlayPort}/kick/callback` +
      `&scope=user:read events:subscribe` +
      `&code_challenge=${challenge}&code_challenge_method=S256` +
      `&state=${config.kick.state}`;

    res.redirect(authUrl);
  });

  // Kick OAuth – Step 2
  // Replace your /kick/callback endpoint with this improved version

overlayApp.get("/kick/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code || state !== config.kick.state) {
    return res.status(400).send("Invalid OAuth state");
  }

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.kick.clientId,
    client_secret: config.kick.clientSecret,
    redirect_uri: `http://localhost:${config.overlayPort}/kick/callback`,
    code,
    code_verifier: config.kick.pkce_verifier
  });

  try {
    // 1. Get tokens
    console.log("Requesting tokens from Kick...");
    const tokenRes = await axios.post(
      "https://id.kick.com/oauth/token",
      params.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenRes.data.access_token;
    const refreshToken = tokenRes.data.refresh_token;

    if (!accessToken) {
      throw new Error("No access token received");
    }

    console.log("Access token received successfully");

    // 2. Get authenticated user info
    let username = "Unknown";
    try {
      console.log("Fetching user info...");
      const userRes = await axios.get("https://api.kick.com/public/v1/users", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json"
        }
      });

      console.log(userRes.data)

      const userData = userRes.data.data?.[0] || userRes.data[0];
      username = userData?.name || userData?.username || userData?.slug || "KickUser";
      console.log(`Success! Found user: ${username}`);
    } catch (err) {
      console.warn("Could not fetch user info, but tokens are valid");
      console.error("User fetch error:", err.response?.status, err.response?.data);
      // Still save the tokens even if username fetch fails
      username = "Error_NotFound";
    }

    // 3. Save everything
    config.kick.accessToken = accessToken;
    config.kick.refreshToken = refreshToken || "";
    config.kick.linkedUser = username;

    // Clean up temporary PKCE data
    delete config.kick.pkce_verifier;
    delete config.kick.state;

    saveConfig();
    broadcastConfig();

    // Notify renderer
    if (mainWindow) {
      mainWindow.webContents.send("kick-linked", config.kick);
    }

    res.send(`
      <html>
        <head>
          <style>
            :root {
              --bg-primary: #0a0a0a;
              --bg-card: #1f1f1f;
              --border-color: #404040;
              --text-primary: #ffffff;
              --text-secondary: #a3a3a3;
              --text-muted: #737373;
              --kick-color: #53fc18;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: var(--bg-primary);
              color: var(--text-primary);
              -webkit-font-smoothing: antialiased;
            }
            .container {
              text-align: center;
              background: var(--bg-card);
              padding: 48px 40px;
              border-radius: 16px;
              border: 1px solid var(--border-color);
              box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
              min-width: 380px;
            }
            .success-icon {
              width: 72px;
              height: 72px;
              margin: 0 auto 24px;
              background: var(--kick-color);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 42px;
              animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            h1 {
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 8px;
              color: var(--text-primary);
            }
            h2 {
              font-size: 18px;
              font-weight: 500;
              color: var(--text-secondary);
              margin-bottom: 8px;
            }
            .username {
              color: var(--kick-color);
              font-weight: 700;
            }
            p {
              font-size: 14px;
              color: var(--text-muted);
              margin-top: 16px;
            }
            @keyframes scaleIn {
              0% { transform: scale(0); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✓</div>
            <h1>Connected Successfully!</h1>
            <h2>Linked as <span class="username">${username}</span></h2>
            <p>You can now close this window.</p>
          </div>
          <script>setTimeout(() => window.close(), 3000);</script>
        </body>
      </html>
    `);

  } catch (err) {
    console.error("Kick OAuth failed:", err.response?.data || err.message);
    
    // Detailed error logging
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Headers:", err.response.headers);
      console.error("Data:", err.response.data);
    }

    res.status(500).send(`
      <html>
        <head>
          <style>
            body {
              font-family: monospace;
              padding: 20px;
              background: #1a1a1a;
              color: #ff6b6b;
            }
            pre {
              background: #2a2a2a;
              padding: 15px;
              border-radius: 5px;
              overflow-x: auto;
            }
          </style>
        </head>
        <body>
          <h2>❌ OAuth Failed</h2>
          <p>Check the console for detailed error information.</p>
          <pre>${JSON.stringify(err.response?.data || err.message, null, 2)}</pre>
          <p><small>Error: ${err.message}</small></p>
        </body>
      </html>
    `);
  }
});

  server.listen(config.overlayPort, "127.0.0.1", () => {
    console.log(`Overlay server at http://localhost:${config.overlayPort}/overlay`);
  });

  overlayServer = server;
}

// -------------------------------------
// MAIN WINDOW
// -------------------------------------
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    nodeIntegration: true,
    contextIsolation: false,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: "#0a0a0a",
    webSecurity: false,
    icon: path.join(__dirname, "pages", "assets", "icon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "pages", "index.html"));
  mainWindow.webContents.openDevTools();

  // Window controls
  ipcMain.on("window-minimize", () => mainWindow.minimize());
  ipcMain.on("window-maximize", () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.on("window-close", () => mainWindow.close());

  mainWindow.on("maximize", () => mainWindow.webContents.send("window-maximized"));
  mainWindow.on("unmaximize", () => mainWindow.webContents.send("window-unmaximized"));
}

// -------------------------------------
// APP START
// -------------------------------------
app.whenReady().then(() => {
  dataDir = path.join(app.getPath("userData"), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  loadConfig();
  startOverlayServer();
  
  createMainWindow();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});