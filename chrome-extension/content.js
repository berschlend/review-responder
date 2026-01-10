// ReviewResponder - ULTRA Edition
// The most powerful review response generator ever built

const API_URL = 'https://review-responder.onrender.com/api';

// ========== CONFETTI CELEBRATION ==========
function createConfetti() {
  const colors = ['#667eea', '#764ba2', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
  const confettiCount = 50;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'rr-confetti';
    confetti.style.cssText = `
      position: fixed;
      width: ${Math.random() * 10 + 5}px;
      height: ${Math.random() * 10 + 5}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}vw;
      top: -20px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      z-index: 1000000;
      pointer-events: none;
      animation: rr-confetti-fall ${Math.random() * 2 + 2}s linear forwards;
      transform: rotate(${Math.random() * 360}deg);
    `;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 4000);
  }
}

// Inject confetti animation
const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
  @keyframes rr-confetti-fall {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }
`;
document.head.appendChild(confettiStyle);

// ========== PLATFORM DETECTION ==========
function detectPlatform() {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  if (hostname.includes('google.com') && pathname.includes('/maps')) {
    return { name: 'Google Maps', icon: '📍', color: '#4285f4', gradient: 'linear-gradient(135deg, #4285f4, #34a853)' };
  }
  if (hostname.includes('google.com') && pathname.includes('/business')) {
    return { name: 'Google Business', icon: '🏢', color: '#4285f4', gradient: 'linear-gradient(135deg, #4285f4, #ea4335)' };
  }
  if (hostname.includes('yelp.com')) {
    return { name: 'Yelp', icon: '🔥', color: '#d32323', gradient: 'linear-gradient(135deg, #d32323, #ff6b6b)' };
  }
  if (hostname.includes('tripadvisor.com')) {
    return { name: 'TripAdvisor', icon: '🦉', color: '#00aa6c', gradient: 'linear-gradient(135deg, #00aa6c, #00d4aa)' };
  }
  if (hostname.includes('facebook.com')) {
    return { name: 'Facebook', icon: '📘', color: '#1877f2', gradient: 'linear-gradient(135deg, #1877f2, #42b72a)' };
  }
  if (hostname.includes('trustpilot.com')) {
    return { name: 'Trustpilot', icon: '⭐', color: '#00b67a', gradient: 'linear-gradient(135deg, #00b67a, #00d4aa)' };
  }
  if (hostname.includes('booking.com')) {
    return { name: 'Booking.com', icon: '🏨', color: '#003580', gradient: 'linear-gradient(135deg, #003580, #0071c2)' };
  }
  if (hostname.includes('airbnb.com')) {
    return { name: 'Airbnb', icon: '🏠', color: '#ff5a5f', gradient: 'linear-gradient(135deg, #ff5a5f, #fc642d)' };
  }
  if (hostname.includes('amazon.com')) {
    return { name: 'Amazon', icon: '📦', color: '#ff9900', gradient: 'linear-gradient(135deg, #ff9900, #146eb4)' };
  }
  return { name: 'Review Site', icon: '💬', color: '#667eea', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' };
}

// ========== SENTIMENT ANALYSIS ==========
function analyzeSentiment(text) {
  const lowerText = text.toLowerCase();

  const positiveWords = [
    'great', 'amazing', 'awesome', 'excellent', 'fantastic', 'wonderful', 'love', 'loved', 'best', 'perfect',
    'outstanding', 'brilliant', 'superb', 'delicious', 'friendly', 'helpful', 'recommend', 'highly', 'thank',
    'toll', 'super', 'wunderbar', 'perfekt', 'ausgezeichnet', 'fantastisch', 'lecker', 'freundlich',
    'genial', 'klasse', 'prima', 'hervorragend', 'excelente', 'bueno', 'increíble', 'magnifique',
    'clean', 'fast', 'quick', 'professional', 'nice', 'good', 'happy', 'satisfied', 'impressed',
    '5 stars', 'five stars', '5 sterne', 'fünf sterne', 'definitely', 'must visit', 'muss man'
  ];

  const negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'worst', 'poor', 'disappointed', 'disappointing', 'rude',
    'slow', 'cold', 'dirty', 'disgusting', 'never', 'waste', 'overpriced', 'avoid', 'mediocre',
    'schlecht', 'furchtbar', 'schrecklich', 'enttäuscht', 'langsam', 'kalt', 'dreckig', 'teuer',
    'nie wieder', 'malo', 'horrible', 'décevant', 'mauvais', 'angry', 'upset', 'frustrated',
    '1 star', 'one star', '1 stern', 'ein stern', 'refund', 'complaint', 'manager'
  ];

  let positiveScore = 0;
  let negativeScore = 0;

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveScore++;
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeScore++;
  });

  // Check for star ratings in text
  const starMatch = lowerText.match(/(\d)\s*(star|stern|étoile|estrella)/i);
  if (starMatch) {
    const stars = parseInt(starMatch[1]);
    if (stars >= 4) positiveScore += 3;
    else if (stars <= 2) negativeScore += 3;
  }

  if (positiveScore > negativeScore + 1) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
}

function getSentimentInfo(sentiment) {
  switch (sentiment) {
    case 'positive':
      return {
        emoji: '🟢',
        label: 'Positive',
        recommendedTone: 'friendly',
        color: '#10b981',
        tip: 'Customer loved it! Keep it warm & grateful.',
        gradient: 'linear-gradient(135deg, #10b981, #34d399)'
      };
    case 'negative':
      return {
        emoji: '🔴',
        label: 'Negative',
        recommendedTone: 'apologetic',
        color: '#ef4444',
        tip: 'Handle with care. Acknowledge & offer solution.',
        gradient: 'linear-gradient(135deg, #ef4444, #f87171)'
      };
    default:
      return {
        emoji: '🟡',
        label: 'Neutral',
        recommendedTone: 'professional',
        color: '#f59e0b',
        tip: 'Mixed feelings. Stay professional & helpful.',
        gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)'
      };
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
      copyAndClose: true,
      showConfetti: true,
      darkMode: 'auto'
    };
  } catch (e) {
    return { tone: 'professional', length: 'medium', emojis: false, autoGenerate: true, copyAndClose: true, showConfetti: true, darkMode: 'auto' };
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

async function saveRecentResponse(reviewText, response, tone, platform) {
  try {
    let recent = await loadRecentResponses();
    recent.unshift({
      review: reviewText.substring(0, 60) + (reviewText.length > 60 ? '...' : ''),
      response: response,
      tone: tone,
      platform: platform,
      timestamp: Date.now()
    });
    recent = recent.slice(0, 10); // Keep last 10
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
    /Mehr lesen|Read more|Show more/gi,
  ];

  let cleaned = text;
  uiPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  return cleaned.replace(/\s+/g, ' ').trim();
}

// ========== DETECT DARK MODE ==========
function isDarkMode() {
  // Check if site uses dark mode
  const bgColor = window.getComputedStyle(document.body).backgroundColor;
  const rgb = bgColor.match(/\d+/g);
  if (rgb) {
    const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
    return brightness < 128;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// ========== CREATE RESPONSE PANEL ==========
function createResponsePanel() {
  // Remove existing panel if any
  const existing = document.getElementById('rr-response-panel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.id = 'rr-response-panel';

  const platform = detectPlatform();
  const darkMode = isDarkMode();

  panel.innerHTML = `
    <div class="rr-panel-header" id="rr-drag-handle">
      <div class="rr-header-left">
        <div class="rr-logo-container">
          <span class="rr-logo-icon">⚡</span>
          <span class="rr-logo-text">ReviewResponder</span>
        </div>
        <span class="rr-platform-badge">${platform.icon} ${platform.name}</span>
      </div>
      <div class="rr-header-right">
        <button class="rr-settings-btn" title="Settings">⚙️</button>
        <button class="rr-close-btn" title="Close (Esc)">&times;</button>
      </div>
    </div>

    <div class="rr-panel-body">
      <!-- Review Preview with animation -->
      <div class="rr-review-section">
        <div class="rr-section-label">📝 Review</div>
        <div class="rr-review-preview"></div>
        <div class="rr-review-meta">
          <span class="rr-char-count">0 chars</span>
          <span class="rr-word-count">0 words</span>
        </div>
      </div>

      <!-- Sentiment Analysis -->
      <div class="rr-sentiment-section">
        <div class="rr-sentiment-card">
          <div class="rr-sentiment-icon"></div>
          <div class="rr-sentiment-info">
            <span class="rr-sentiment-label"></span>
            <span class="rr-sentiment-tip"></span>
          </div>
        </div>
      </div>

      <!-- Options Grid -->
      <div class="rr-options-grid">
        <div class="rr-option-group">
          <label>🎭 Tone</label>
          <select class="rr-tone-select">
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="formal">Formal</option>
            <option value="apologetic">Apologetic</option>
          </select>
        </div>
        <div class="rr-option-group">
          <label>📏 Length</label>
          <select class="rr-length-select">
            <option value="short">Short</option>
            <option value="medium" selected>Medium</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>
      </div>

      <!-- Toggles -->
      <div class="rr-toggles-row">
        <label class="rr-toggle-label">
          <input type="checkbox" class="rr-emoji-toggle">
          <span class="rr-toggle-switch"></span>
          <span>😀 Emojis</span>
        </label>
        <label class="rr-toggle-label">
          <input type="checkbox" class="rr-copy-close-toggle" checked>
          <span class="rr-toggle-switch"></span>
          <span>📋 Copy & Close</span>
        </label>
        <label class="rr-toggle-label">
          <input type="checkbox" class="rr-confetti-toggle" checked>
          <span class="rr-toggle-switch"></span>
          <span>🎉 Confetti</span>
        </label>
      </div>

      <!-- Quick Actions -->
      <div class="rr-quick-actions hidden">
        <button class="rr-quick-btn rr-quick-thanks">⚡ Quick Thanks</button>
      </div>

      <!-- Generate Button -->
      <button class="rr-generate-btn">
        <span class="rr-btn-text">✨ Generate Response</span>
        <span class="rr-btn-loader hidden">
          <span class="rr-spinner"></span>
          Generating...
        </span>
      </button>

      <!-- Response Area -->
      <div class="rr-response-area hidden">
        <div class="rr-section-label">💬 Your Response</div>
        <div class="rr-response-wrapper">
          <textarea class="rr-response-text" placeholder="Your response will appear here..."></textarea>
          <div class="rr-response-meta">
            <span class="rr-response-chars">0 chars</span>
            <span class="rr-response-words">0 words</span>
          </div>
        </div>

        <!-- Quick Edit Buttons -->
        <div class="rr-quick-edit">
          <button class="rr-edit-btn" data-action="shorter">📉 Shorter</button>
          <button class="rr-edit-btn" data-action="longer">📈 Longer</button>
          <button class="rr-edit-btn" data-action="add-emoji">😊 Add Emoji</button>
          <button class="rr-edit-btn" data-action="more-formal">🎩 More Formal</button>
        </div>

        <!-- Action Buttons -->
        <div class="rr-button-row">
          <button class="rr-copy-btn">
            <span class="rr-copy-text">📋 Copy</span>
            <span class="rr-copy-success hidden">✅ Copied!</span>
          </button>
          <button class="rr-regenerate-btn">🔄 Regenerate</button>
        </div>

        <!-- Tone Quick Switch -->
        <div class="rr-tone-switch">
          <span class="rr-tone-label">Try different tone:</span>
          <div class="rr-tone-buttons">
            <button class="rr-tone-btn" data-tone="professional">💼 Pro</button>
            <button class="rr-tone-btn" data-tone="friendly">😊 Friendly</button>
            <button class="rr-tone-btn" data-tone="formal">🎩 Formal</button>
            <button class="rr-tone-btn" data-tone="apologetic">🙏 Sorry</button>
          </div>
        </div>

        <!-- Google Maps Preview -->
        <div class="rr-preview-section">
          <div class="rr-preview-header">
            <span>👁️ Preview</span>
            <button class="rr-preview-toggle">Show</button>
          </div>
          <div class="rr-preview-content hidden">
            <div class="rr-gm-preview">
              <div class="rr-gm-header">Response from the owner</div>
              <div class="rr-gm-body">
                <div class="rr-gm-avatar">B</div>
                <div class="rr-gm-text"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Responses -->
      <div class="rr-recent-section hidden">
        <div class="rr-recent-header">
          <span>🕐 Recent Responses</span>
          <button class="rr-recent-toggle">▼</button>
        </div>
        <div class="rr-recent-list hidden"></div>
      </div>

      <!-- Message Area -->
      <div class="rr-message"></div>
    </div>

    <!-- Settings Panel (hidden by default) -->
    <div class="rr-settings-panel hidden">
      <div class="rr-settings-header">
        <span>⚙️ Settings</span>
        <button class="rr-settings-close">&times;</button>
      </div>
      <div class="rr-settings-body">
        <label class="rr-setting-item">
          <span>Auto-generate on open</span>
          <input type="checkbox" class="rr-auto-generate-setting" checked>
        </label>
        <label class="rr-setting-item">
          <span>Show confetti on success</span>
          <input type="checkbox" class="rr-confetti-setting" checked>
        </label>
        <label class="rr-setting-item">
          <span>Copy & close panel</span>
          <input type="checkbox" class="rr-copy-close-setting" checked>
        </label>
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  // Make panel draggable
  makeDraggable(panel);

  // Initialize all event listeners
  initPanelEvents(panel);

  // Load and apply saved settings
  loadSettings().then(settings => {
    panel.querySelector('.rr-tone-select').value = settings.tone || 'professional';
    panel.querySelector('.rr-length-select').value = settings.length || 'medium';
    panel.querySelector('.rr-emoji-toggle').checked = settings.emojis || false;
    panel.querySelector('.rr-copy-close-toggle').checked = settings.copyAndClose !== false;
    panel.querySelector('.rr-confetti-toggle').checked = settings.showConfetti !== false;
  });

  // Load recent responses
  loadRecentResponses().then(recent => {
    if (recent.length > 0) {
      updateRecentResponsesList(panel, recent);
    }
  });

  return panel;
}

function initPanelEvents(panel) {
  // Close button
  panel.querySelector('.rr-close-btn').addEventListener('click', () => {
    panel.classList.remove('rr-visible');
    panel.classList.add('rr-closing');
    setTimeout(() => panel.classList.remove('rr-closing'), 300);
  });

  // Generate button
  panel.querySelector('.rr-generate-btn').addEventListener('click', () => generateResponse(panel));

  // Regenerate button
  panel.querySelector('.rr-regenerate-btn').addEventListener('click', () => generateResponse(panel));

  // Copy button
  panel.querySelector('.rr-copy-btn').addEventListener('click', () => copyResponse(panel));

  // Settings button
  panel.querySelector('.rr-settings-btn').addEventListener('click', () => {
    panel.querySelector('.rr-settings-panel').classList.toggle('hidden');
  });

  panel.querySelector('.rr-settings-close').addEventListener('click', () => {
    panel.querySelector('.rr-settings-panel').classList.add('hidden');
  });

  // Save settings on change
  ['rr-tone-select', 'rr-length-select'].forEach(cls => {
    panel.querySelector('.' + cls).addEventListener('change', () => saveCurrentSettings(panel));
  });

  ['rr-emoji-toggle', 'rr-copy-close-toggle', 'rr-confetti-toggle'].forEach(cls => {
    panel.querySelector('.' + cls).addEventListener('change', () => saveCurrentSettings(panel));
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
  panel.querySelector('.rr-quick-thanks').addEventListener('click', () => {
    panel.querySelector('.rr-tone-select').value = 'friendly';
    panel.querySelector('.rr-length-select').value = 'short';
    generateResponse(panel);
  });

  // Quick Edit buttons
  panel.querySelectorAll('.rr-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      quickEditResponse(panel, action);
    });
  });

  // Preview toggle
  panel.querySelector('.rr-preview-toggle').addEventListener('click', () => {
    const content = panel.querySelector('.rr-preview-content');
    const btn = panel.querySelector('.rr-preview-toggle');
    content.classList.toggle('hidden');
    btn.textContent = content.classList.contains('hidden') ? 'Show' : 'Hide';
  });

  // Recent toggle
  panel.querySelector('.rr-recent-toggle').addEventListener('click', () => {
    const list = panel.querySelector('.rr-recent-list');
    const btn = panel.querySelector('.rr-recent-toggle');
    list.classList.toggle('hidden');
    btn.textContent = list.classList.contains('hidden') ? '▼' : '▲';
  });

  // Response text change - update counters
  panel.querySelector('.rr-response-text').addEventListener('input', (e) => {
    updateResponseCounters(panel, e.target.value);
    updatePreview(panel, e.target.value);
  });
}

// Update recent responses list
function updateRecentResponsesList(panel, recent) {
  const recentSection = panel.querySelector('.rr-recent-section');
  const recentList = panel.querySelector('.rr-recent-list');
  recentSection.classList.remove('hidden');

  recentList.innerHTML = recent.map((r, i) => `
    <div class="rr-recent-item" data-index="${i}">
      <div class="rr-recent-info">
        <span class="rr-recent-review">${r.review}</span>
        <span class="rr-recent-meta">${r.tone} • ${formatTimeAgo(r.timestamp)}</span>
      </div>
      <span class="rr-recent-platform">${r.platform || '💬'}</span>
    </div>
  `).join('');

  // Click to use recent response
  recentList.querySelectorAll('.rr-recent-item').forEach(item => {
    item.addEventListener('click', async () => {
      const index = parseInt(item.dataset.index);
      const recent = await loadRecentResponses();
      panel.querySelector('.rr-response-text').value = recent[index].response;
      panel.querySelector('.rr-response-area').classList.remove('hidden');
      updateResponseCounters(panel, recent[index].response);
      updatePreview(panel, recent[index].response);
    });
  });
}

// Format time ago
function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  return Math.floor(seconds / 86400) + 'd ago';
}

// Save current settings
function saveCurrentSettings(panel) {
  const settings = {
    tone: panel.querySelector('.rr-tone-select').value,
    length: panel.querySelector('.rr-length-select').value,
    emojis: panel.querySelector('.rr-emoji-toggle').checked,
    copyAndClose: panel.querySelector('.rr-copy-close-toggle').checked,
    showConfetti: panel.querySelector('.rr-confetti-toggle').checked
  };
  saveSettings(settings);
}

// Make panel draggable
function makeDraggable(panel) {
  const handle = panel.querySelector('#rr-drag-handle');
  let isDragging = false;
  let startX, startY, startLeft, startTop;

  handle.addEventListener('mousedown', (e) => {
    if (e.target.closest('.rr-close-btn') || e.target.closest('.rr-settings-btn')) return;
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
    panel.classList.add('rr-dragging');
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    panel.style.left = (startLeft + dx) + 'px';
    panel.style.top = (startTop + dy) + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      handle.style.cursor = 'grab';
      panel.classList.remove('rr-dragging');
    }
  });
}

// Update response counters
function updateResponseCounters(panel, text) {
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  panel.querySelector('.rr-response-chars').textContent = `${chars} chars`;
  panel.querySelector('.rr-response-words').textContent = `${words} words`;
}

// Update preview
function updatePreview(panel, text) {
  panel.querySelector('.rr-gm-text').textContent = text;
}

// Quick edit response
async function quickEditResponse(panel, action) {
  const textarea = panel.querySelector('.rr-response-text');
  const currentText = textarea.value;

  if (!currentText) return;

  const btn = panel.querySelector(`[data-action="${action}"]`);
  btn.disabled = true;
  btn.classList.add('rr-loading');

  let instruction = '';
  switch (action) {
    case 'shorter':
      instruction = 'Make this response shorter while keeping the key message. Remove unnecessary words.';
      break;
    case 'longer':
      instruction = 'Expand this response with more detail and warmth. Add 1-2 more sentences.';
      break;
    case 'add-emoji':
      instruction = 'Add 1-2 appropriate emojis to this response to make it more friendly.';
      break;
    case 'more-formal':
      instruction = 'Make this response more formal and professional in tone.';
      break;
  }

  try {
    const stored = await chrome.storage.local.get(['token']);
    if (!stored.token) throw new Error('Please login first');

    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${stored.token}`
      },
      body: JSON.stringify({
        reviewText: currentText,
        tone: 'professional',
        customInstructions: instruction,
        outputLanguage: 'auto'
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    textarea.value = data.response;
    updateResponseCounters(panel, data.response);
    updatePreview(panel, data.response);

    // Flash effect
    textarea.classList.add('rr-flash');
    setTimeout(() => textarea.classList.remove('rr-flash'), 500);

  } catch (error) {
    showMessage(panel, error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.classList.remove('rr-loading');
  }
}

// ========== GENERATE RESPONSE ==========
async function generateResponse(panel) {
  const reviewText = panel?.dataset?.reviewText || '';
  const tone = panel.querySelector('.rr-tone-select').value;
  const length = panel.querySelector('.rr-length-select').value;
  const includeEmojis = panel.querySelector('.rr-emoji-toggle').checked;
  const generateBtn = panel.querySelector('.rr-generate-btn');
  const btnText = panel.querySelector('.rr-btn-text');
  const btnLoader = panel.querySelector('.rr-btn-loader');
  const responseArea = panel.querySelector('.rr-response-area');

  if (!reviewText || reviewText.trim().length === 0) {
    showMessage(panel, 'No review text found. Select some text first!', 'error');
    return;
  }

  let stored;
  try {
    stored = await chrome.storage.local.get(['token', 'user']);
  } catch (storageError) {
    showMessage(panel, 'Extension error. Please refresh the page.', 'error');
    return;
  }

  if (!stored.token) {
    showMessage(panel, '🔐 Please login in the extension popup first', 'error');
    return;
  }

  // Show loading state
  generateBtn.disabled = true;
  btnText.classList.add('hidden');
  btnLoader.classList.remove('hidden');
  panel.querySelector('.rr-message').textContent = '';

  try {
    const platform = detectPlatform();

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
        platform: platform.name
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Generation failed');
    }

    // Success!
    const responseTextarea = panel.querySelector('.rr-response-text');
    responseTextarea.value = data.response;
    responseArea.classList.remove('hidden');

    // Update counters and preview
    updateResponseCounters(panel, data.response);
    updatePreview(panel, data.response);

    // Update tone buttons
    panel.querySelectorAll('.rr-tone-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tone === tone);
    });

    // Update avatar
    const avatarLetter = (stored.user?.businessName || 'B').charAt(0).toUpperCase();
    panel.querySelector('.rr-gm-avatar').textContent = avatarLetter;

    // Save to recent
    await saveRecentResponse(reviewText, data.response, tone, platform.icon);

    // Update recent list
    const recent = await loadRecentResponses();
    updateRecentResponsesList(panel, recent);

    // Confetti celebration!
    const settings = await loadSettings();
    if (settings.showConfetti !== false) {
      createConfetti();
    }

    // Success animation on button
    generateBtn.classList.add('rr-success');
    setTimeout(() => generateBtn.classList.remove('rr-success'), 1000);

  } catch (error) {
    showMessage(panel, error.message, 'error');
  } finally {
    generateBtn.disabled = false;
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
  }
}

// Show message
function showMessage(panel, text, type = 'info') {
  const msgEl = panel.querySelector('.rr-message');
  msgEl.textContent = text;
  msgEl.className = `rr-message rr-${type}`;

  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (msgEl.textContent === text) {
      msgEl.textContent = '';
      msgEl.className = 'rr-message';
    }
  }, 5000);
}

// ========== COPY RESPONSE ==========
async function copyResponse(panel) {
  const responseText = panel.querySelector('.rr-response-text').value;
  const copyBtn = panel.querySelector('.rr-copy-btn');
  const copyText = panel.querySelector('.rr-copy-text');
  const copySuccess = panel.querySelector('.rr-copy-success');
  const copyAndClose = panel.querySelector('.rr-copy-close-toggle').checked;

  if (!responseText) {
    showMessage(panel, 'Nothing to copy!', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(responseText);

    // Success animation
    copyText.classList.add('hidden');
    copySuccess.classList.remove('hidden');
    copyBtn.classList.add('rr-copied');

    if (copyAndClose) {
      setTimeout(() => {
        panel.classList.remove('rr-visible');
        // Reset button state
        copyText.classList.remove('hidden');
        copySuccess.classList.add('hidden');
        copyBtn.classList.remove('rr-copied');
      }, 800);
    } else {
      setTimeout(() => {
        copyText.classList.remove('hidden');
        copySuccess.classList.add('hidden');
        copyBtn.classList.remove('rr-copied');
      }, 2000);
    }
  } catch (error) {
    showMessage(panel, 'Failed to copy', 'error');
  }
}

// ========== SHOW RESPONSE PANEL ==========
async function showResponsePanel(reviewText, autoGenerate = false) {
  let panel = document.getElementById('rr-response-panel');
  if (!panel) {
    panel = createResponsePanel();
  }

  const platform = detectPlatform();

  // Update platform badge
  const badge = panel.querySelector('.rr-platform-badge');
  if (badge) {
    badge.innerHTML = `${platform.icon} ${platform.name}`;
    badge.style.background = platform.color;
  }

  // Analyze sentiment
  const sentiment = analyzeSentiment(reviewText);
  const sentimentInfo = getSentimentInfo(sentiment);

  // Store review text
  panel.dataset.reviewText = reviewText;

  // Update review preview
  const previewText = reviewText.length > 150 ? reviewText.substring(0, 150) + '...' : reviewText;
  panel.querySelector('.rr-review-preview').textContent = previewText;

  // Update review counters
  const chars = reviewText.length;
  const words = reviewText.trim().split(/\s+/).length;
  panel.querySelector('.rr-char-count').textContent = `${chars} chars`;
  panel.querySelector('.rr-word-count').textContent = `${words} words`;

  // Update sentiment display
  const sentimentIcon = panel.querySelector('.rr-sentiment-icon');
  sentimentIcon.textContent = sentimentInfo.emoji;
  sentimentIcon.style.background = sentimentInfo.gradient;

  panel.querySelector('.rr-sentiment-label').textContent = sentimentInfo.label + ' Review';
  panel.querySelector('.rr-sentiment-label').style.color = sentimentInfo.color;
  panel.querySelector('.rr-sentiment-tip').textContent = sentimentInfo.tip;

  // Auto-select recommended tone for auto-generate
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

  // Reset response area
  panel.querySelector('.rr-response-area').classList.add('hidden');
  panel.querySelector('.rr-response-text').value = '';
  panel.querySelector('.rr-message').textContent = '';

  // Reset position to center
  panel.style.left = '';
  panel.style.top = '';
  panel.style.transform = 'translate(-50%, -50%)';

  // Show panel with animation
  panel.classList.add('rr-visible');

  // Auto-generate if enabled
  if (autoGenerate) {
    const settings = await loadSettings();
    if (settings.autoGenerate !== false) {
      setTimeout(() => generateResponse(panel), 200);
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
  floatingBtn.title = 'Generate Response';

  floatingBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const selection = window.getSelection().toString().trim();
    if (selection && selection.length > 10) {
      showResponsePanel(cleanReviewText(selection), true);
    }
    hideFloatingButton();
  });

  document.body.appendChild(floatingBtn);
  return floatingBtn;
}

function showFloatingButton(x, y) {
  const btn = createFloatingButton();
  btn.style.left = `${Math.min(x + 15, window.innerWidth - 60)}px`;
  btn.style.top = `${Math.min(y - 50, window.innerHeight - 60)}px`;
  btn.classList.add('rr-visible');
}

function hideFloatingButton() {
  if (floatingBtn) {
    floatingBtn.classList.remove('rr-visible');
  }
}

// ========== EVENT LISTENERS ==========

// Listen for text selection
document.addEventListener('mouseup', (e) => {
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

// Hide floating button on click elsewhere
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
      btn.innerHTML = '⚡ <span>Respond</span>';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showResponsePanel(reviewText, true);
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
    showResponsePanel(reviewText, true);
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
    e.preventDefault();
    const selection = window.getSelection().toString().trim();
    if (selection && selection.length > 10) {
      showResponsePanel(cleanReviewText(selection), true);
    }
  }

  // Alt+C: Copy current response
  if (e.altKey && e.key === 'c') {
    const panel = document.getElementById('rr-response-panel');
    if (panel && panel.classList.contains('rr-visible')) {
      e.preventDefault();
      copyResponse(panel);
    }
  }

  // Escape: Close panel
  if (e.key === 'Escape') {
    const panel = document.getElementById('rr-response-panel');
    if (panel && panel.classList.contains('rr-visible')) {
      panel.classList.remove('rr-visible');
    }
    hideFloatingButton();
  }
});

// Log ready message
console.log('%c⚡ ReviewResponder ULTRA loaded!', 'font-size: 16px; font-weight: bold; color: #667eea;');
console.log('%cSelect text → Click ⚡ → Magic happens!', 'font-size: 12px; color: #764ba2;');
