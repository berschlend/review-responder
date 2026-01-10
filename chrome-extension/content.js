// Content script for ReviewResponder
// Universal review response generator - works on any website

const API_URL = 'https://review-responder.onrender.com/api';

// ========== PLATFORM DETECTION ==========
function detectPlatform() {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  if (hostname.includes('google.com') && pathname.includes('/maps')) {
    return { name: 'Google Maps', icon: '📍', color: '#4285f4' };
  }
  if (hostname.includes('google.com') && pathname.includes('/business')) {
    return { name: 'Google Business', icon: '🏢', color: '#4285f4' };
  }
  if (hostname.includes('yelp.com')) {
    return { name: 'Yelp', icon: '⭐', color: '#d32323' };
  }
  if (hostname.includes('tripadvisor.com')) {
    return { name: 'TripAdvisor', icon: '🦉', color: '#00aa6c' };
  }
  if (hostname.includes('facebook.com')) {
    return { name: 'Facebook', icon: '📘', color: '#1877f2' };
  }
  if (hostname.includes('trustpilot.com')) {
    return { name: 'Trustpilot', icon: '⭐', color: '#00b67a' };
  }
  if (hostname.includes('booking.com')) {
    return { name: 'Booking.com', icon: '🏨', color: '#003580' };
  }
  if (hostname.includes('airbnb.com')) {
    return { name: 'Airbnb', icon: '🏠', color: '#ff5a5f' };
  }
  return { name: 'Review Site', icon: '💬', color: '#667eea' };
}

// ========== SENTIMENT ANALYSIS ==========
function analyzeSentiment(text) {
  const lowerText = text.toLowerCase();

  const positiveWords = [
    'great', 'amazing', 'awesome', 'excellent', 'fantastic', 'wonderful', 'love', 'loved', 'best', 'perfect',
    'outstanding', 'brilliant', 'superb', 'delicious', 'friendly', 'helpful', 'recommend', 'highly',
    'toll', 'super', 'wunderbar', 'perfekt', 'ausgezeichnet', 'fantastisch', 'lecker', 'freundlich',
    'genial', 'klasse', 'prima', 'hervorragend', 'excelente', 'bueno', 'increíble', 'magnifique',
    'clean', 'fast', 'quick', 'professional', 'nice', 'good', 'happy', 'satisfied', 'impressed'
  ];

  const negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'worst', 'poor', 'disappointed', 'disappointing', 'rude',
    'slow', 'cold', 'dirty', 'disgusting', 'never', 'waste', 'overpriced', 'avoid', 'mediocre',
    'schlecht', 'furchtbar', 'schrecklich', 'enttäuscht', 'langsam', 'kalt', 'dreckig', 'teuer',
    'nie wieder', 'malo', 'horrible', 'décevant', 'mauvais', 'angry', 'upset', 'frustrated'
  ];

  let positiveScore = 0;
  let negativeScore = 0;

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveScore++;
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeScore++;
  });

  if (positiveScore > negativeScore + 1) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
}

function getSentimentInfo(sentiment) {
  switch (sentiment) {
    case 'positive':
      return { emoji: '🟢', label: 'Positive', recommendedTone: 'friendly', color: '#10b981' };
    case 'negative':
      return { emoji: '🔴', label: 'Negative', recommendedTone: 'apologetic', color: '#ef4444' };
    default:
      return { emoji: '🟡', label: 'Neutral', recommendedTone: 'professional', color: '#f59e0b' };
  }
}

// ========== SETTINGS PERSISTENCE ==========
async function loadSettings() {
  try {
    const stored = await chrome.storage.local.get(['rr_settings']);
    return stored.rr_settings || {
      tone: 'professional',
      length: 'medium',
      emojis: false,
      autoGenerate: true,
      copyAndClose: true
    };
  } catch (e) {
    return { tone: 'professional', length: 'medium', emojis: false, autoGenerate: true, copyAndClose: true };
  }
}

async function saveSettings(settings) {
  try {
    await chrome.storage.local.set({ rr_settings: settings });
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

// ========== RECENT RESPONSES ==========
async function loadRecentResponses() {
  try {
    const stored = await chrome.storage.local.get(['rr_recent']);
    return stored.rr_recent || [];
  } catch (e) {
    return [];
  }
}

async function saveRecentResponse(reviewText, response, tone) {
  try {
    let recent = await loadRecentResponses();
    recent.unshift({
      review: reviewText.substring(0, 50) + (reviewText.length > 50 ? '...' : ''),
      response: response,
      tone: tone,
      timestamp: Date.now()
    });
    // Keep only last 5
    recent = recent.slice(0, 5);
    await chrome.storage.local.set({ rr_recent: recent });
  } catch (e) {
    console.error('Failed to save recent response:', e);
  }
}

// ========== CLEAN REVIEW TEXT ==========
function cleanReviewText(text) {
  const uiPatterns = [
    /vor \d+ (Sekunden?|Minuten?|Stunden?|Tagen?|Wochen?|Monaten?|Jahren?)/gi,
    /\d+ (second|minute|hour|day|week|month|year)s? ago/gi,
    /Antwort vom Inhaber/gi,
    /Owner response/gi,
    /Response from the owner/gi,
    /\d+ (Person|Personen) fanden? diese Rezension hilfreich/gi,
    /\d+ (person|people) found this (review )?helpful/gi,
    /Von Google übersetzt/gi,
    /Translated by Google/gi,
    /Local Guide\s*·?\s*\d*\s*(Rezension(en)?|reviews?)?/gi,
  ];

  let cleaned = text;
  uiPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  return cleaned.replace(/\s+/g, ' ').trim();
}

// ========== CREATE RESPONSE PANEL ==========
function createResponsePanel() {
  const panel = document.createElement('div');
  panel.id = 'rr-response-panel';

  const platform = detectPlatform();

  panel.innerHTML = `
    <div class="rr-panel-header" id="rr-drag-handle">
      <div class="rr-header-left">
        <span class="rr-logo">⚡ ReviewResponder</span>
        <span class="rr-platform-badge" style="background: ${platform.color}">${platform.icon} ${platform.name}</span>
      </div>
      <button class="rr-close-btn">&times;</button>
    </div>
    <div class="rr-panel-body">
      <div class="rr-review-preview"></div>

      <div class="rr-sentiment-row">
        <span class="rr-sentiment-badge"></span>
        <span class="rr-sentiment-tip"></span>
      </div>

      <div class="rr-options-row">
        <select class="rr-tone-select">
          <option value="professional">Professional</option>
          <option value="friendly">Friendly</option>
          <option value="formal">Formal</option>
          <option value="apologetic">Apologetic</option>
        </select>
        <select class="rr-length-select">
          <option value="short">Short</option>
          <option value="medium" selected>Medium</option>
          <option value="detailed">Detailed</option>
        </select>
      </div>

      <div class="rr-checkbox-row">
        <label class="rr-checkbox-label">
          <input type="checkbox" class="rr-emoji-toggle">
          Include emojis
        </label>
        <label class="rr-checkbox-label">
          <input type="checkbox" class="rr-copy-close-toggle" checked>
          Copy & Close
        </label>
      </div>

      <div class="rr-quick-actions hidden">
        <button class="rr-quick-btn" data-type="thanks">⚡ Quick Thanks</button>
      </div>

      <button class="rr-generate-btn">Generate Response</button>

      <div class="rr-response-area hidden">
        <textarea class="rr-response-text" placeholder="Generated response will appear here..."></textarea>
        <div class="rr-button-row">
          <button class="rr-copy-btn">📋 Copy</button>
          <button class="rr-regenerate-btn">🔄 Regenerate</button>
        </div>
        <div class="rr-tone-switch">
          <span class="rr-tone-label">Try different tone:</span>
          <div class="rr-tone-buttons">
            <button class="rr-tone-btn" data-tone="professional">Pro</button>
            <button class="rr-tone-btn" data-tone="friendly">Friendly</button>
            <button class="rr-tone-btn" data-tone="formal">Formal</button>
            <button class="rr-tone-btn" data-tone="apologetic">Sorry</button>
          </div>
        </div>
      </div>

      <!-- Recent Responses -->
      <div class="rr-recent-section hidden">
        <div class="rr-recent-header">
          <span>Recent Responses</span>
          <button class="rr-recent-toggle">▼</button>
        </div>
        <div class="rr-recent-list hidden"></div>
      </div>

      <div class="rr-message"></div>
    </div>
  `;
  document.body.appendChild(panel);

  // Make panel draggable
  makeDraggable(panel);

  // Load and apply saved settings
  loadSettings().then(settings => {
    panel.querySelector('.rr-tone-select').value = settings.tone || 'professional';
    panel.querySelector('.rr-length-select').value = settings.length || 'medium';
    panel.querySelector('.rr-emoji-toggle').checked = settings.emojis || false;
    panel.querySelector('.rr-copy-close-toggle').checked = settings.copyAndClose !== false;
  });

  // Load recent responses
  loadRecentResponses().then(recent => {
    if (recent.length > 0) {
      const recentSection = panel.querySelector('.rr-recent-section');
      const recentList = panel.querySelector('.rr-recent-list');
      recentSection.classList.remove('hidden');

      recentList.innerHTML = recent.map((r, i) => `
        <div class="rr-recent-item" data-index="${i}">
          <span class="rr-recent-review">${r.review}</span>
          <span class="rr-recent-tone">${r.tone}</span>
        </div>
      `).join('');

      // Click to use recent response
      recentList.querySelectorAll('.rr-recent-item').forEach(item => {
        item.addEventListener('click', () => {
          const index = parseInt(item.dataset.index);
          panel.querySelector('.rr-response-text').value = recent[index].response;
          panel.querySelector('.rr-response-area').classList.remove('hidden');
        });
      });
    }
  });

  // Event listeners
  panel.querySelector('.rr-close-btn').addEventListener('click', () => {
    panel.classList.remove('rr-visible');
  });

  panel.querySelector('.rr-generate-btn').addEventListener('click', () => {
    generateResponse(panel);
  });

  panel.querySelector('.rr-regenerate-btn').addEventListener('click', () => {
    generateResponse(panel);
  });

  panel.querySelector('.rr-copy-btn').addEventListener('click', () => copyResponse(panel));

  // Save settings on change
  panel.querySelector('.rr-tone-select').addEventListener('change', (e) => {
    saveCurrentSettings(panel);
  });
  panel.querySelector('.rr-length-select').addEventListener('change', () => {
    saveCurrentSettings(panel);
  });
  panel.querySelector('.rr-emoji-toggle').addEventListener('change', () => {
    saveCurrentSettings(panel);
  });
  panel.querySelector('.rr-copy-close-toggle').addEventListener('change', () => {
    saveCurrentSettings(panel);
  });

  // Quick tone switch buttons
  panel.querySelectorAll('.rr-tone-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tone = btn.dataset.tone;
      panel.querySelector('.rr-tone-select').value = tone;
      panel.querySelectorAll('.rr-tone-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      generateResponse(panel);
    });
  });

  // Quick Thanks button
  panel.querySelector('.rr-quick-btn').addEventListener('click', () => {
    panel.querySelector('.rr-tone-select').value = 'friendly';
    panel.querySelector('.rr-length-select').value = 'short';
    generateResponse(panel);
  });

  // Recent toggle
  panel.querySelector('.rr-recent-toggle').addEventListener('click', () => {
    const list = panel.querySelector('.rr-recent-list');
    const btn = panel.querySelector('.rr-recent-toggle');
    list.classList.toggle('hidden');
    btn.textContent = list.classList.contains('hidden') ? '▼' : '▲';
  });

  return panel;
}

// Save current settings
function saveCurrentSettings(panel) {
  const settings = {
    tone: panel.querySelector('.rr-tone-select').value,
    length: panel.querySelector('.rr-length-select').value,
    emojis: panel.querySelector('.rr-emoji-toggle').checked,
    copyAndClose: panel.querySelector('.rr-copy-close-toggle').checked
  };
  saveSettings(settings);
}

// Make panel draggable
function makeDraggable(panel) {
  const handle = panel.querySelector('#rr-drag-handle');
  let isDragging = false;
  let startX, startY, startLeft, startTop;

  handle.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('rr-close-btn')) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = panel.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    panel.style.transform = 'none';
    panel.style.left = startLeft + 'px';
    panel.style.top = startTop + 'px';
    handle.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    panel.style.left = (startLeft + dx) + 'px';
    panel.style.top = (startTop + dy) + 'px';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    handle.style.cursor = 'grab';
  });
}

// ========== GENERATE RESPONSE ==========
async function generateResponse(panel, autoTriggered = false) {
  const reviewText = panel?.dataset?.reviewText || '';
  const tone = panel.querySelector('.rr-tone-select').value;
  const length = panel.querySelector('.rr-length-select').value;
  const includeEmojis = panel.querySelector('.rr-emoji-toggle').checked;
  const generateBtn = panel.querySelector('.rr-generate-btn');
  const messageEl = panel.querySelector('.rr-message');
  const responseArea = panel.querySelector('.rr-response-area');

  if (!reviewText || reviewText.trim().length === 0) {
    messageEl.textContent = 'Error: No review text found.';
    messageEl.className = 'rr-message rr-error';
    return;
  }

  let stored;
  try {
    stored = await chrome.storage.local.get(['token', 'user']);
  } catch (storageError) {
    messageEl.textContent = 'Extension error. Please refresh the page.';
    messageEl.className = 'rr-message rr-error';
    return;
  }

  if (!stored.token) {
    messageEl.textContent = 'Please login in the extension popup first';
    messageEl.className = 'rr-message rr-error';
    return;
  }

  generateBtn.disabled = true;
  generateBtn.textContent = 'Generating...';
  messageEl.textContent = '';

  try {
    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${stored.token}`
      },
      body: JSON.stringify({
        reviewText,
        tone,
        outputLanguage: 'auto',
        responseLength: length,
        includeEmojis: includeEmojis,
        businessName: stored.user?.businessName || '',
        platform: detectPlatform().name
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Generation failed');
    }

    panel.querySelector('.rr-response-text').value = data.response;
    responseArea.classList.remove('hidden');
    messageEl.textContent = '';

    // Update active tone button
    panel.querySelectorAll('.rr-tone-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tone === tone);
    });

    // Save to recent responses
    await saveRecentResponse(reviewText, data.response, tone);

  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.className = 'rr-message rr-error';
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate Response';
  }
}

// ========== COPY RESPONSE ==========
async function copyResponse(panel) {
  const responseText = panel.querySelector('.rr-response-text').value;
  const messageEl = panel.querySelector('.rr-message');
  const copyBtn = panel.querySelector('.rr-copy-btn');
  const copyAndClose = panel.querySelector('.rr-copy-close-toggle').checked;

  try {
    await navigator.clipboard.writeText(responseText);
    copyBtn.textContent = '✅ Copied!';
    messageEl.textContent = '';

    if (copyAndClose) {
      setTimeout(() => {
        panel.classList.remove('rr-visible');
        copyBtn.textContent = '📋 Copy';
      }, 500);
    } else {
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy';
      }, 2000);
    }
  } catch (error) {
    messageEl.textContent = 'Failed to copy';
    messageEl.className = 'rr-message rr-error';
  }
}

// ========== SHOW RESPONSE PANEL ==========
async function showResponsePanel(reviewText, autoGenerate = false) {
  let panel = document.getElementById('rr-response-panel');
  if (!panel) {
    panel = createResponsePanel();
  }

  // Update platform badge
  const platform = detectPlatform();
  const badge = panel.querySelector('.rr-platform-badge');
  if (badge) {
    badge.style.background = platform.color;
    badge.innerHTML = `${platform.icon} ${platform.name}`;
  }

  // Analyze sentiment
  const sentiment = analyzeSentiment(reviewText);
  const sentimentInfo = getSentimentInfo(sentiment);

  // Reset panel
  panel.dataset.reviewText = reviewText;
  panel.querySelector('.rr-review-preview').textContent =
    reviewText.length > 120 ? reviewText.substring(0, 120) + '...' : reviewText;

  // Update sentiment display
  const sentimentBadge = panel.querySelector('.rr-sentiment-badge');
  sentimentBadge.textContent = `${sentimentInfo.emoji} ${sentimentInfo.label}`;
  sentimentBadge.style.color = sentimentInfo.color;

  const sentimentTip = panel.querySelector('.rr-sentiment-tip');
  sentimentTip.textContent = `💡 Recommended: ${sentimentInfo.recommendedTone.charAt(0).toUpperCase() + sentimentInfo.recommendedTone.slice(1)}`;

  // Auto-select recommended tone (but respect saved settings for manual triggers)
  if (autoGenerate) {
    panel.querySelector('.rr-tone-select').value = sentimentInfo.recommendedTone;
  }

  // Show Quick Thanks for positive reviews
  const quickActions = panel.querySelector('.rr-quick-actions');
  if (sentiment === 'positive') {
    quickActions.classList.remove('hidden');
  } else {
    quickActions.classList.add('hidden');
  }

  panel.querySelector('.rr-response-area').classList.add('hidden');
  panel.querySelector('.rr-response-text').value = '';
  panel.querySelector('.rr-message').textContent = '';

  // Reset position to center
  panel.style.left = '';
  panel.style.top = '';
  panel.style.transform = 'translate(-50%, -50%)';

  // Show panel
  panel.classList.add('rr-visible');

  // Auto-generate if enabled
  if (autoGenerate) {
    const settings = await loadSettings();
    if (settings.autoGenerate !== false) {
      setTimeout(() => generateResponse(panel, true), 100);
    }
  }
}

// ========== FLOATING MINI-BUTTON ==========
let floatingBtn = null;

function createFloatingButton() {
  if (floatingBtn) return floatingBtn;

  floatingBtn = document.createElement('button');
  floatingBtn.id = 'rr-floating-btn';
  floatingBtn.innerHTML = '⚡';
  floatingBtn.title = 'Generate Response (Auto)';
  floatingBtn.style.cssText = `
    position: fixed;
    display: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: 2px solid white;
    font-size: 20px;
    cursor: pointer;
    z-index: 999998;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.5);
    transition: transform 0.2s, box-shadow 0.2s;
  `;

  floatingBtn.addEventListener('mouseenter', () => {
    floatingBtn.style.transform = 'scale(1.15)';
    floatingBtn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
  });

  floatingBtn.addEventListener('mouseleave', () => {
    floatingBtn.style.transform = 'scale(1)';
    floatingBtn.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.5)';
  });

  floatingBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const selection = window.getSelection().toString().trim();
    if (selection && selection.length > 10) {
      showResponsePanel(cleanReviewText(selection), true); // Auto-generate!
    }
    hideFloatingButton();
  });

  document.body.appendChild(floatingBtn);
  return floatingBtn;
}

function showFloatingButton(x, y) {
  const btn = createFloatingButton();
  btn.style.left = `${Math.min(x + 10, window.innerWidth - 50)}px`;
  btn.style.top = `${Math.min(y - 45, window.innerHeight - 50)}px`;
  btn.style.display = 'block';
}

function hideFloatingButton() {
  if (floatingBtn) {
    floatingBtn.style.display = 'none';
  }
}

// ========== EVENT LISTENERS ==========

// Listen for text selection
document.addEventListener('mouseup', (e) => {
  // Don't show on our own panel
  if (e.target.closest('#rr-response-panel') || e.target.closest('#rr-floating-btn')) {
    return;
  }

  setTimeout(() => {
    const selection = window.getSelection().toString().trim();
    if (selection && selection.length > 20) {
      showFloatingButton(e.clientX, e.clientY);
    } else {
      hideFloatingButton();
    }
  }, 10);
});

// Hide floating button on scroll or click elsewhere
document.addEventListener('mousedown', (e) => {
  if (!e.target.closest('#rr-floating-btn')) {
    hideFloatingButton();
  }
});

// Add buttons to Google Maps reviews (legacy support)
function addButtonsToReviews() {
  const reviewSelectors = ['.jftiEf', '[data-review-id]', '.WMbnJf'];

  for (const selector of reviewSelectors) {
    const reviews = document.querySelectorAll(selector);
    reviews.forEach(review => {
      if (review.querySelector('.rr-btn')) return;

      const textEl = review.querySelector('.wiI7pd, .MyEned, .Jtu6Td');
      if (!textEl) return;

      const reviewText = cleanReviewText(textEl.textContent);
      if (!reviewText || reviewText.length < 10) return;

      const btn = document.createElement('button');
      btn.className = 'rr-btn';
      btn.textContent = '⚡ Respond';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showResponsePanel(reviewText, true); // Auto-generate!
      });

      const actionArea = review.querySelector('.k8MTF, .GBkF3d') || review;
      actionArea.appendChild(btn);
    });
  }
}

// Initialize
addButtonsToReviews();

// Watch for dynamic content
const observer = new MutationObserver((mutations) => {
  let shouldCheck = false;
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      shouldCheck = true;
      break;
    }
  }
  if (shouldCheck) {
    setTimeout(addButtonsToReviews, 500);
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showPanelWithText') {
    const reviewText = cleanReviewText(message.reviewText);
    showResponsePanel(reviewText, true); // Auto-generate on right-click!
    sendResponse({ success: true });
  }

  if (message.action === 'getSelection') {
    const selection = window.getSelection().toString().trim();
    sendResponse({ text: selection });
  }

  return true;
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Alt+R: Generate from selection
  if (e.altKey && e.key === 'r') {
    const selection = window.getSelection().toString().trim();
    if (selection && selection.length > 10) {
      showResponsePanel(cleanReviewText(selection), true);
    }
  }

  // Alt+C: Copy current response
  if (e.altKey && e.key === 'c') {
    const panel = document.getElementById('rr-response-panel');
    if (panel && panel.classList.contains('rr-visible')) {
      copyResponse(panel);
    }
  }

  // Escape: Close panel
  if (e.key === 'Escape') {
    const panel = document.getElementById('rr-response-panel');
    if (panel) {
      panel.classList.remove('rr-visible');
    }
    hideFloatingButton();
  }
});

console.log('⚡ ReviewResponder loaded! Select review text → Click ⚡ → Auto-generate response!');
