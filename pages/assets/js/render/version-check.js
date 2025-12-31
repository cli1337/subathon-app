const { showToast } = require("./toast");
const { shell, ipcRenderer } = require("electron");

const GITHUB_PACKAGE_JSON_URL = "https://raw.githubusercontent.com/cli1337/subathon-app/refs/heads/main/package.json";

let CURRENT_VERSION = null;

async function getCurrentVersion() {
  if (CURRENT_VERSION) return CURRENT_VERSION;
  try {
    CURRENT_VERSION = await ipcRenderer.invoke("get-app-version");
    return CURRENT_VERSION;
  } catch (error) {
    console.error("[Version Check] Error getting app version:", error);
    return null;
  }
}

function compareVersions(version1, version2) {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    
    if (v1Part < v2Part) return -1;
    if (v1Part > v2Part) return 1;
  }
  
  return 0;
}

async function checkVersion() {
  try {
    const currentVersion = await getCurrentVersion();
    if (!currentVersion) {
      console.warn("[Version Check] Could not get current version");
      return;
    }
    
    const response = await fetch(GITHUB_PACKAGE_JSON_URL, {
      cache: 'no-cache',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.warn("[Version Check] Failed to fetch version from GitHub:", response.status);
      return;
    }
    
    const remotePackageJson = await response.json();
    const remoteVersion = remotePackageJson.version;
    
    if (!remoteVersion) {
      console.warn("[Version Check] No version found in remote package.json");
      return;
    } 
    
    console.log(`[Version Check] Current: ${currentVersion}, Remote: ${remoteVersion}`);
    
    const comparison = compareVersions(currentVersion, remoteVersion);
    
    if (comparison < 0) {
      showVersionOutdatedAlert(remoteVersion, currentVersion);
    } else {
      console.log("[Version Check] App is up to date");
    }
  } catch (error) {
    console.error("[Version Check] Error checking version:", error);
  }
}

function showVersionOutdatedAlert(latestVersion, currentVersion) {
  const alertBanner = document.createElement('div');
  alertBanner.id = 'versionOutdatedAlert';
  alertBanner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
    color: white;
    padding: 12px 20px;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    font-size: 14px;
    font-weight: 500;
  `;
  
  const message = document.createElement('div');
  message.style.cssText = 'display: flex; align-items: center; gap: 8px; flex: 1;';
  message.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
    </svg>
    <span>New version available: <strong>v${latestVersion}</strong> (You have v${currentVersion})</span>
  `;
  
  const actions = document.createElement('div');
  actions.style.cssText = 'display: flex; align-items: center; gap: 12px;';
  
  const downloadBtn = document.createElement('button');
  downloadBtn.textContent = 'Download';
  downloadBtn.style.cssText = `
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 6px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s;
  `;
  downloadBtn.onmouseover = () => {
    downloadBtn.style.background = 'rgba(255, 255, 255, 0.3)';
  };
  downloadBtn.onmouseout = () => {
    downloadBtn.style.background = 'rgba(255, 255, 255, 0.2)';
  };
  downloadBtn.onclick = () => {
    shell.openExternal('https://github.com/cli1337/subathon-app/releases/latest');
  };
  
  const dismissBtn = document.createElement('button');
  dismissBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;
  dismissBtn.style.cssText = `
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    opacity: 0.8;
    transition: opacity 0.2s;
  `;
  dismissBtn.onmouseover = () => {
    dismissBtn.style.opacity = '1';
  };
  dismissBtn.onmouseout = () => {
    dismissBtn.style.opacity = '0.8';
  };
  dismissBtn.onclick = () => {
    alertBanner.remove();
    localStorage.setItem('versionAlertDismissed', latestVersion);
  };
  
  actions.appendChild(downloadBtn);
  actions.appendChild(dismissBtn);
  
  alertBanner.appendChild(message);
  alertBanner.appendChild(actions);
  
  const dismissedVersion = localStorage.getItem('versionAlertDismissed');
  if (dismissedVersion === latestVersion) {
    return;
  }
  
  document.body.appendChild(alertBanner);
  
  const mainContent = document.getElementById('mainContent');
  if (mainContent) {
    mainContent.style.paddingTop = '48px';
  }
  
  showToast(`New version v${latestVersion} is available!`, "info", 5000);
}

function initVersionCheck() {
  setTimeout(() => {
    checkVersion();
  }, 3000);
}

module.exports = {
  checkVersion,
  initVersionCheck
};
