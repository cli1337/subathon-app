const overlayValue = document.getElementById('overlayValue');
const overlayUnit = document.getElementById('overlayUnit');
const overlayDisplay = document.getElementById('overlayDisplay');
const overlayCornerValue = document.getElementById('overlayCornerValue');
const overlayGifterCard = document.getElementById('overlayGifterCard');
const overlayGifterName = document.getElementById('overlayGifterName');
const overlayGifterAmount = document.getElementById('overlayGifterAmount');
const overlayGifterUnit = document.getElementById('overlayGifterUnit');

let lastValue = '';
let animationEnabled = true;
let lastGifterName = '';
let gifterCardTimeout = null;
let isGifterCardShowing = false;

let isFirstLoad = true;

function timeToSeconds(timeStr) {
  if (!/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return 0;
  const parts = timeStr.split(':').map(Number);
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function secondsToTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

let currentAnimationFrame = null;

function animateCounter(element, oldValue, newValue, duration, formatTime) {
  if (currentAnimationFrame) {
    cancelAnimationFrame(currentAnimationFrame);
    currentAnimationFrame = null;
  }
  
  const isTimeFormat = formatTime || /^\d{2}:\d{2}:\d{2}$/.test(oldValue) && /^\d{2}:\d{2}:\d{2}$/.test(newValue);
  
  let startValue, targetValue;
  
  if (isTimeFormat) {
    startValue = timeToSeconds(oldValue);
    targetValue = timeToSeconds(newValue);
  } else {
    startValue = parseFloat(String(oldValue).replace(/[^\d.-]/g, '')) || 0;
    targetValue = parseFloat(String(newValue).replace(/[^\d.-]/g, '')) || 0;
  }
  
  const startTime = performance.now();
  const difference = targetValue - startValue;
  
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const current = startValue + (difference * easeOutQuart);
    
    if (progress < 1) {
      if (isTimeFormat) {
        element.textContent = secondsToTime(Math.floor(current));
      } else {
        const hasDecimals = String(newValue).includes('.');
        if (hasDecimals) {
          element.textContent = current.toFixed(2);
        } else {
          element.textContent = Math.floor(current);
        }
      }
      currentAnimationFrame = requestAnimationFrame(animate);
    } else {
      element.textContent = newValue;
      currentAnimationFrame = null;
    }
  };
  
  currentAnimationFrame = requestAnimationFrame(animate);
}

function updateOverlay(data) {
  if (data.status === 'paused') {
    overlayValue.textContent = data.pausedText || 'PAUSED';
    overlayValue.style.color = data.pausedTextColor || '#ffaa00';
    overlayValue.style.fontSize = `${data.pausedTextSize || 48}px`;
    
    if (data.statusTextShadow && data.statusTextShadow.enabled !== false) {
      const shadow = data.statusTextShadow;
      overlayValue.style.textShadow = `${shadow.x || 0}px ${shadow.y || 4}px ${shadow.blur || 12}px ${shadow.color || '#000000'}`;
    } else {
      overlayValue.style.textShadow = 'none';
    }
    
    if (data.showValueWhenPaused !== false) {
      overlayCornerValue.textContent = data.value;
      overlayCornerValue.style.display = 'block';
    } else {
      overlayCornerValue.style.display = 'none';
    }
  } else if (data.status === 'stopped') {
    overlayValue.textContent = data.stoppedText || 'STOPPED';
    overlayValue.style.color = data.pausedTextColor || '#ffaa00';
    overlayValue.style.fontSize = `${data.pausedTextSize || 48}px`;
    
    if (data.statusTextShadow && data.statusTextShadow.enabled !== false) {
      const shadow = data.statusTextShadow;
      overlayValue.style.textShadow = `${shadow.x || 0}px ${shadow.y || 4}px ${shadow.blur || 12}px ${shadow.color || '#000000'}`;
    } else {
      overlayValue.style.textShadow = 'none';
    }
    
    if (data.showValueWhenStopped !== false) {
      overlayCornerValue.textContent = data.value;
      overlayCornerValue.style.display = 'block';
    } else {
      overlayCornerValue.style.display = 'none';
    }
  } else {
    const newValue = data.value || '00:00:00';
    overlayValue.style.color = data.textColor || '#ffffff';
    overlayValue.style.fontSize = `${data.fontSize || 72}px`;
    overlayCornerValue.style.display = 'none';
    
    if (data.textShadow && data.textShadow.enabled !== false) {
      const shadow = data.textShadow;
      overlayValue.style.textShadow = `${shadow.x || 0}px ${shadow.y || 4}px ${shadow.blur || 12}px ${shadow.color || '#000000'}`;
    } else {
      overlayValue.style.textShadow = 'none';
    }
    
    if (!isFirstLoad) {
      if (animationEnabled && data.enableValueAnimation !== false && newValue !== lastValue && lastValue !== '') {
        const animationSpeed = data.animationSpeed || 1000;
        const isTimeFormat = /^\d{2}:\d{2}:\d{2}$/.test(newValue);
        animateCounter(overlayValue, lastValue, newValue, animationSpeed, isTimeFormat);
      } else {
        overlayValue.textContent = newValue;
      }
    } else {
      overlayValue.textContent = newValue;
      isFirstLoad = false;
    }
    lastValue = newValue;
    
    if (data.enableValueAnimation !== undefined) {
      animationEnabled = data.enableValueAnimation !== false;
    }
  }

  const baseUnit = data.unit || 'TIME';
  const before = (data.unitPrefix || '').trim();
  const after = (data.unitSuffix || '').trim();
  const unitParts = [];
  if (before) unitParts.push(before);
  unitParts.push(baseUnit);
  if (after) unitParts.push(after);
  overlayUnit.textContent = unitParts.join(' ');
  overlayUnit.style.color = data.unitColor || data.textColor || 'rgba(255, 255, 255, 0.7)';
  overlayUnit.style.fontSize = `${data.unitSize || 24}px`;
  
  if (data.status === 'paused') {
    overlayUnit.style.display = (data.showUnitWhenPaused !== false && data.showUnitWhenPaused !== undefined) ? 'block' : 'none';
  } else if (data.status === 'stopped') {
    overlayUnit.style.display = (data.showUnitWhenStopped !== false && data.showUnitWhenStopped !== undefined) ? 'block' : 'none';
  } else {
    overlayUnit.style.display = 'block';
  }
  
  if (data.unitPosition === 'top') {
    overlayDisplay.style.flexDirection = 'column-reverse';
  } else {
    overlayDisplay.style.flexDirection = 'column';
  }
  
  const alignment = data.unitAlignment || 'center';
  overlayUnit.style.textAlign = alignment;
  overlayUnit.style.width = '100%';
  overlayUnit.style.alignSelf = 'stretch';
  overlayUnit.style.boxSizing = 'border-box';

  if (data.overlayPageBg) {
    document.body.style.background = data.overlayPageBg;
  }
  
  if (data.background === 'transparent') {
    overlayDisplay.style.background = 'transparent';
    overlayDisplay.style.border = 'none';
  } else if (data.background === 'solid') {
    overlayDisplay.style.background = data.bgColor || '#000000';
    overlayDisplay.style.border = '2px solid rgba(255, 255, 255, 0.1)';
  } else if (data.background === 'gradient') {
    overlayDisplay.style.background = `linear-gradient(135deg, #1a1a1a, ${data.bgColor || '#000000'})`;
    overlayDisplay.style.border = '2px solid rgba(255, 255, 255, 0.1)';
  }
  
  overlayGifterCard.style.display = 'none';
  if (gifterCardTimeout) {
    clearTimeout(gifterCardTimeout);
    gifterCardTimeout = null;
  }
  isGifterCardShowing = false;
  lastGifterName = '';
}

function loadOverlayData() {
  fetch('/data')
    .then(res => res.json())
    .then(data => {
      updateOverlay(data);
    })
    .catch(err => console.error('Error loading overlay data:', err));
}

loadOverlayData();

setInterval(loadOverlayData, 200);