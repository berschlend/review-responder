// ReviewResponder - Speed Edition
// Focus: FAST, Easy, One-Click

const API_URL = 'https://review-responder.onrender.com/api';

// ========== PRE-FLIGHT LOGIN CHECK ==========
let isLoggedIn = false;
let cachedUser = null;
let cachedToken = null;

async function checkLoginStatus() {
  try {
    const stored = await chrome.storage.local.get(['token', 'user']);
    isLoggedIn = !!stored.token;
    cachedToken = stored.token;
    cachedUser = stored.user;
    return isLoggedIn;
  } catch (e) {
    return false;
  }
}

// Check login on load
checkLoginStatus();

// Re-check when storage changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.token) {
    checkLoginStatus();
  }
});

// ========== TIME SAVED TRACKING ==========
const TIME_PER_RESPONSE_MINUTES = 3; // Average time to write a response manually

async function getTimeSaved() {
  try {
    const stored = await chrome.storage.local.get(['rr_responses_generated', 'rr_time_saved_minutes']);
    return {
      count: stored.rr_responses_generated || 0,
      minutes: stored.rr_time_saved_minutes || 0
    };
  } catch (e) {
    return { count: 0, minutes: 0 };
  }
}

async function trackTimeSaved() {
  try {
    const current = await getTimeSaved();
    await chrome.storage.local.set({
      rr_responses_generated: current.count + 1,
      rr_time_saved_minutes: current.minutes + TIME_PER_RESPONSE_MINUTES
    });
    return current.minutes + TIME_PER_RESPONSE_MINUTES;
  } catch (e) {
    return 0;
  }
}

function formatTimeSaved(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// ========== SMART ISSUE DETECTION ==========
function detectIssues(text) {
  const lowerText = text.toLowerCase();
  const issues = [];

  // Food-related issues
  const foodIssues = [
    { keywords: ['cold food', 'food was cold', 'cold meal', 'kalt', 'froid'], issue: 'cold_food', label: '🥶 Cold food' },
    { keywords: ['undercooked', 'raw', 'not cooked', 'roh'], issue: 'undercooked', label: '🍖 Undercooked' },
    { keywords: ['overcooked', 'burnt', 'verbrannt', 'angebrannt'], issue: 'overcooked', label: '🔥 Overcooked' },
    { keywords: ['small portion', 'tiny portion', 'not enough food', 'kleine portion'], issue: 'portion_size', label: '📏 Small portions' },
    { keywords: ['tasteless', 'no flavor', 'bland', 'geschmacklos', 'fade'], issue: 'tasteless', label: '😐 Tasteless' },
  ];

  // Service-related issues
  const serviceIssues = [
    { keywords: ['slow service', 'waited forever', 'took too long', 'lange gewartet', 'ewig gewartet'], issue: 'slow_service', label: '⏰ Slow service' },
    { keywords: ['rude', 'unfriendly', 'impolite', 'unhöflich', 'unfreundlich'], issue: 'rude_staff', label: '😤 Rude staff' },
    { keywords: ['ignored', 'no attention', 'couldn\'t find waiter', 'ignoriert'], issue: 'ignored', label: '👻 Ignored' },
    { keywords: ['wrong order', 'incorrect order', 'falsche bestellung'], issue: 'wrong_order', label: '❌ Wrong order' },
  ];

  // Cleanliness issues
  const cleanIssues = [
    { keywords: ['dirty', 'unclean', 'filthy', 'dreckig', 'schmutzig'], issue: 'dirty', label: '🧹 Cleanliness' },
    { keywords: ['hair in', 'found hair', 'haare im', 'haar im'], issue: 'hygiene', label: '🦠 Hygiene' },
    { keywords: ['bug', 'insect', 'cockroach', 'fly in', 'fliege', 'insekt'], issue: 'pests', label: '🪳 Pests' },
  ];

  // Pricing issues
  const priceIssues = [
    { keywords: ['overpriced', 'too expensive', 'not worth', 'zu teuer', 'überteuert'], issue: 'overpriced', label: '💰 Overpriced' },
    { keywords: ['hidden charges', 'extra fees', 'versteckte kosten'], issue: 'hidden_fees', label: '💸 Hidden fees' },
  ];

  // Check all issue categories
  const allIssueTypes = [...foodIssues, ...serviceIssues, ...cleanIssues, ...priceIssues];

  allIssueTypes.forEach(({ keywords, issue, label }) => {
    if (keywords.some(kw => lowerText.includes(kw))) {
      issues.push({ issue, label });
    }
  });

  return issues;
}

// ========== GOOGLE MAPS AUTO-PASTE ==========
function findGoogleMapsReplyField() {
  // Try different selectors for Google Maps reply fields
  const selectors = [
    // Reply to review textarea
    'textarea[aria-label*="Reply"]',
    'textarea[aria-label*="reply"]',
    'textarea[aria-label*="Antwort"]',
    'textarea[aria-label*="Répondre"]',
    'textarea[jsname="YPqjbf"]',
    // Business response fields
    '.review-dialog-text textarea',
    '[data-value="Reply"] textarea',
    '.reply-text textarea',
    // Generic textarea in review dialogs
    '.review-dialog textarea',
    '[role="dialog"] textarea',
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.offsetParent !== null) { // Check if visible
      return el;
    }
  }

  return null;
}

function findGoogleMapsReplyButton() {
  // Find the "Reply" button on Google Maps reviews
  const selectors = [
    '[data-value="Reply"]',
    'button[aria-label*="Reply"]',
    'button[aria-label*="reply"]',
    'button[aria-label*="Antwort"]',
    '.review-action-button',
    '[jsaction*="reply"]',
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.offsetParent !== null) {
      return el;
    }
  }

  return null;
}

function findGoogleMapsSubmitButton() {
  // Find the Submit/Send button after entering reply text
  const selectors = [
    // Google Maps Business Profile submit buttons
    'button[aria-label*="Submit"]',
    'button[aria-label*="submit"]',
    'button[aria-label*="Send"]',
    'button[aria-label*="send"]',
    'button[aria-label*="Senden"]',
    'button[aria-label*="Absenden"]',
    'button[aria-label*="Publier"]',
    'button[aria-label*="Enviar"]',
    // Generic submit in dialogs
    '[role="dialog"] button[type="submit"]',
    '[role="dialog"] button.submit-button',
    // By text content
    'button:has-text("Submit")',
    'button:has-text("Send")',
    // Google's internal classes
    'button[jsname="LgbsSe"]',
    'button[data-mdc-dialog-action="accept"]',
    // The primary action button (usually blue)
    '[role="dialog"] button[class*="primary"]',
    '[role="dialog"] button[class*="action"]',
  ];

  for (const selector of selectors) {
    try {
      const el = document.querySelector(selector);
      if (el && el.offsetParent !== null && !el.disabled) {
        return el;
      }
    } catch (e) {
      // :has-text selector might not work, skip
    }
  }

  // Fallback: Find button with submit-like text
  const allButtons = document.querySelectorAll('[role="dialog"] button');
  for (const btn of allButtons) {
    const text = btn.textContent.toLowerCase();
    if ((text.includes('submit') || text.includes('send') || text.includes('senden') ||
         text.includes('publier') || text.includes('enviar') || text.includes('post')) &&
        btn.offsetParent !== null && !btn.disabled) {
      return btn;
    }
  }

  return null;
}

async function autoPasteToGoogleMaps(text, panel, autoSubmit = false) {
  const platform = detectPlatform();

  if (platform.name !== 'Google') {
    showToast('⚠️ Auto-paste only works on Google Maps', 'warning');
    return false;
  }

  // First, try to find an existing reply field
  let replyField = findGoogleMapsReplyField();

  // If no field, try clicking the Reply button
  if (!replyField) {
    const replyButton = findGoogleMapsReplyButton();
    if (replyButton) {
      replyButton.click();
      // Wait for the reply field to appear
      await new Promise(resolve => setTimeout(resolve, 500));
      replyField = findGoogleMapsReplyField();
    }
  }

  if (!replyField) {
    showToast('📝 No reply field found - click "Reply" on a review first', 'info');
    return false;
  }

  // Focus and paste
  replyField.focus();
  replyField.value = text;

  // Trigger input events so Google Maps registers the change
  replyField.dispatchEvent(new Event('input', { bubbles: true }));
  replyField.dispatchEvent(new Event('change', { bubbles: true }));

  // Close our panel first
  if (panel) {
    closePanel(panel);
  }

  // Auto-submit if requested
  if (autoSubmit) {
    // Small delay for UI to register the input
    await new Promise(resolve => setTimeout(resolve, 300));

    const submitBtn = findGoogleMapsSubmitButton();
    if (submitBtn) {
      submitBtn.click();
      showToast('🎉 Response submitted!', 'success');
      return true;
    } else {
      showToast('🚀 Pasted! Click Submit manually', 'warning');
      return false;
    }
  }

  showToast('🚀 Pasted! Ready to submit', 'success');
  return true;
}

// ========== TOAST NOTIFICATIONS ==========
function showToast(message, type = 'success') {
  // Remove existing toasts
  document.querySelectorAll('.rr-toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `rr-toast rr-toast-${type}`;
  toast.innerHTML = message;
  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add('rr-visible'), 10);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('rr-visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ========== ONBOARDING ==========
async function checkOnboarding() {
  try {
    const stored = await chrome.storage.local.get(['rr_onboarding_seen']);
    return stored.rr_onboarding_seen || false;
  } catch (e) {
    return false;
  }
}

async function markOnboardingSeen() {
  try {
    await chrome.storage.local.set({ rr_onboarding_seen: true });
  } catch (e) {}
}

function showOnboardingTip(panel) {
  const tip = document.createElement('div');
  tip.className = 'rr-onboarding-tip';
  tip.innerHTML = `
    <div class="rr-tip-content">
      <span class="rr-tip-icon">💡</span>
      <span class="rr-tip-text">Tip: Press <kbd>Alt+R</kbd> to generate, <kbd>Alt+C</kbd> to copy!</span>
      <button class="rr-tip-close">Got it!</button>
    </div>
  `;

  tip.querySelector('.rr-tip-close').addEventListener('click', () => {
    tip.classList.add('rr-hiding');
    setTimeout(() => tip.remove(), 300);
  });

  panel.querySelector('.rr-panel-body').appendChild(tip);
}

// ========== CONFETTI (Limited to 3x) ==========
async function maybeShowConfetti() {
  try {
    const stored = await chrome.storage.local.get(['rr_confetti_count']);
    let count = stored.rr_confetti_count || 0;

    if (count < 3) {
      createConfetti();
      await chrome.storage.local.set({ rr_confetti_count: count + 1 });
    }
  } catch (e) {
    // Fallback: just show it
    createConfetti();
  }
}

function createConfetti() {
  const colors = ['#667eea', '#764ba2', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'rr-confetti';
    confetti.style.cssText = `
      position: fixed;
      width: ${Math.random() * 8 + 4}px;
      height: ${Math.random() * 8 + 4}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}vw;
      top: -10px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      z-index: 1000001;
      pointer-events: none;
      animation: rr-confetti-fall ${Math.random() * 2 + 1.5}s linear forwards;
    `;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 3500);
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

// ========== LANGUAGE DETECTION ==========
function detectLanguage(text) {
  const lowerText = text.toLowerCase();

  // German indicators
  const germanWords = ['und', 'der', 'die', 'das', 'ist', 'war', 'sehr', 'gut', 'nicht', 'aber', 'haben', 'wurde', 'toll', 'super', 'leider', 'immer', 'auch'];
  const germanCount = germanWords.filter(w => lowerText.includes(` ${w} `) || lowerText.startsWith(w + ' ')).length;

  // Dutch indicators
  const dutchWords = ['en', 'het', 'een', 'van', 'zijn', 'naar', 'niet', 'maar', 'heel', 'goed', 'mooi', 'lekker', 'altijd'];
  const dutchCount = dutchWords.filter(w => lowerText.includes(` ${w} `) || lowerText.startsWith(w + ' ')).length;

  // French indicators
  const frenchWords = ['et', 'est', 'très', 'bien', 'pas', 'mais', 'pour', 'avec', 'dans', 'leur', 'nous'];
  const frenchCount = frenchWords.filter(w => lowerText.includes(` ${w} `) || lowerText.startsWith(w + ' ')).length;

  // Spanish indicators
  const spanishWords = ['y', 'es', 'muy', 'bien', 'pero', 'para', 'con', 'los', 'las', 'que', 'del'];
  const spanishCount = spanishWords.filter(w => lowerText.includes(` ${w} `) || lowerText.startsWith(w + ' ')).length;

  if (germanCount >= 2) return { code: 'de', name: 'Deutsch', flag: '🇩🇪' };
  if (dutchCount >= 2) return { code: 'nl', name: 'Nederlands', flag: '🇳🇱' };
  if (frenchCount >= 2) return { code: 'fr', name: 'Français', flag: '🇫🇷' };
  if (spanishCount >= 2) return { code: 'es', name: 'Español', flag: '🇪🇸' };

  return { code: 'en', name: 'English', flag: '🇬🇧' };
}

// ========== PLATFORM DETECTION ==========
function detectPlatform() {
  const hostname = window.location.hostname;

  if (hostname.includes('google.com')) return { name: 'Google', icon: '📍', color: '#4285f4' };
  if (hostname.includes('yelp.com')) return { name: 'Yelp', icon: '🔥', color: '#d32323' };
  if (hostname.includes('tripadvisor.com')) return { name: 'TripAdvisor', icon: '🦉', color: '#00aa6c' };
  if (hostname.includes('facebook.com')) return { name: 'Facebook', icon: '📘', color: '#1877f2' };
  if (hostname.includes('trustpilot.com')) return { name: 'Trustpilot', icon: '⭐', color: '#00b67a' };
  if (hostname.includes('booking.com')) return { name: 'Booking', icon: '🏨', color: '#003580' };
  if (hostname.includes('airbnb.com')) return { name: 'Airbnb', icon: '🏠', color: '#ff5a5f' };
  if (hostname.includes('amazon.com')) return { name: 'Amazon', icon: '📦', color: '#ff9900' };

  return { name: 'Reviews', icon: '💬', color: '#667eea' };
}

// ========== SENTIMENT ANALYSIS ==========
function analyzeSentiment(text) {
  const lowerText = text.toLowerCase();

  const positiveWords = [
    'great', 'amazing', 'awesome', 'excellent', 'fantastic', 'wonderful', 'love', 'loved', 'best', 'perfect',
    'outstanding', 'brilliant', 'superb', 'delicious', 'friendly', 'helpful', 'recommend', 'thank',
    'toll', 'super', 'wunderbar', 'perfekt', 'ausgezeichnet', 'lecker', 'freundlich', 'genial', 'klasse',
    'clean', 'fast', 'professional', 'nice', 'good', 'happy', 'satisfied', 'impressed', '5 star'
  ];

  const negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'worst', 'poor', 'disappointed', 'rude',
    'slow', 'cold', 'dirty', 'disgusting', 'never', 'waste', 'overpriced', 'avoid',
    'schlecht', 'furchtbar', 'schrecklich', 'enttäuscht', 'langsam', 'kalt', 'dreckig',
    'nie wieder', 'angry', 'upset', 'frustrated', '1 star', 'refund', 'complaint'
  ];

  let positive = 0, negative = 0;
  positiveWords.forEach(w => { if (lowerText.includes(w)) positive++; });
  negativeWords.forEach(w => { if (lowerText.includes(w)) negative++; });

  // Star rating detection
  const starMatch = lowerText.match(/(\d)\s*(star|stern|étoile)/i);
  if (starMatch) {
    const stars = parseInt(starMatch[1]);
    if (stars >= 4) positive += 3;
    else if (stars <= 2) negative += 3;
  }

  if (positive > negative + 1) return 'positive';
  if (negative > positive) return 'negative';
  return 'neutral';
}

function getSentimentDisplay(sentiment) {
  switch (sentiment) {
    case 'positive':
      return { emoji: '🟢', label: 'Positive', color: '#10b981', tone: 'friendly' };
    case 'negative':
      return { emoji: '🔴', label: 'Negative', color: '#ef4444', tone: 'apologetic' };
    default:
      return { emoji: '🟡', label: 'Neutral', color: '#f59e0b', tone: 'professional' };
  }
}

// ========== CLEAN REVIEW TEXT ==========
function cleanReviewText(text) {
  const uiPatterns = [
    /vor \d+ (Sekunden?|Minuten?|Stunden?|Tagen?|Wochen?|Monaten?|Jahren?)/gi,
    /\d+ (second|minute|hour|day|week|month|year)s? ago/gi,
    /Antwort vom Inhaber|Owner response|Response from the owner/gi,
    /\d+ (Person|Personen|person|people) (fanden?|found).*helpful/gi,
    /Von Google übersetzt|Translated by Google/gi,
    /Local Guide\s*·?\s*\d*\s*(Rezension|review)/gi,
    /Mehr lesen|Read more|Show more/gi,
  ];

  let cleaned = text;
  uiPatterns.forEach(p => { cleaned = cleaned.replace(p, ''); });
  return cleaned.replace(/\s+/g, ' ').trim();
}

// ========== SETTINGS ==========
async function loadSettings() {
  try {
    const stored = await chrome.storage.local.get(['rr_settings']);
    return stored.rr_settings || {
      tone: 'professional',
      length: 'medium',
      emojis: false,
      autoCopy: true,       // NEW: Auto-copy after generation
      turboMode: false      // NEW: Skip panel, instant generate
    };
  } catch (e) {
    return { tone: 'professional', length: 'medium', emojis: false, autoCopy: true, turboMode: false };
  }
}

async function saveSettings(settings) {
  try {
    await chrome.storage.local.set({ rr_settings: settings });
  } catch (e) {}
}

// Cache settings for speed
let cachedSettings = null;
loadSettings().then(s => cachedSettings = s);

// ========== CREATE KILLER PANEL ==========
async function createResponsePanel() {
  const existing = document.getElementById('rr-response-panel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.id = 'rr-response-panel';

  const platform = detectPlatform();
  const timeSaved = await getTimeSaved();
  const isGoogleMaps = platform.name === 'Google';

  panel.innerHTML = `
    <div class="rr-panel-header">
      <div class="rr-header-left">
        <span class="rr-logo">⚡ ReviewResponder</span>
        <span class="rr-platform-badge" style="background: ${platform.color}">${platform.icon} ${platform.name}</span>
      </div>
      <div class="rr-header-right">
        <div class="rr-time-saved" title="Time saved using ReviewResponder">
          <span class="rr-time-icon">⏱️</span>
          <span class="rr-time-value">${formatTimeSaved(timeSaved.minutes)}</span>
          <span class="rr-time-label">saved</span>
        </div>
        <button class="rr-help-btn" title="How to use">?</button>
        <button class="rr-close-btn" title="Close (Esc)">×</button>
      </div>
    </div>

    <div class="rr-panel-body">
      <!-- Review Section -->
      <div class="rr-review-box">
        <div class="rr-review-text"></div>
      </div>

      <!-- Issue Detection Tags (shown when issues detected) -->
      <div class="rr-issues-row hidden">
        <span class="rr-issues-label">Issues detected:</span>
        <div class="rr-issues-tags"></div>
      </div>

      <!-- Sentiment + Language Row -->
      <div class="rr-info-row">
        <div class="rr-sentiment">
          <span class="rr-sentiment-emoji"></span>
          <span class="rr-sentiment-label"></span>
        </div>
        <div class="rr-language">
          <span class="rr-language-flag"></span>
          <span class="rr-language-name"></span>
        </div>
      </div>

      <!-- Simple Options Row -->
      <div class="rr-options-row">
        <div class="rr-option">
          <label>Tone</label>
          <select class="rr-tone-select">
            <option value="professional">💼 Professional</option>
            <option value="friendly">😊 Friendly</option>
            <option value="formal">🎩 Formal</option>
            <option value="apologetic">🙏 Apologetic</option>
          </select>
        </div>
        <button class="rr-settings-toggle" title="More options">⚙️</button>
      </div>

      <!-- Advanced Settings (hidden by default) -->
      <div class="rr-advanced hidden">
        <div class="rr-advanced-row">
          <label>Length</label>
          <select class="rr-length-select">
            <option value="short">Short</option>
            <option value="medium" selected>Medium</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>
        <label class="rr-checkbox-label">
          <input type="checkbox" class="rr-emoji-toggle">
          <span>Include emojis</span>
        </label>
        <div class="rr-speed-options">
          <label class="rr-checkbox-label">
            <input type="checkbox" class="rr-autocopy-toggle" checked>
            <span>Auto-copy after generate</span>
          </label>
          <label class="rr-checkbox-label rr-turbo-label">
            <input type="checkbox" class="rr-turbo-toggle">
            <span>⚡ Turbo Mode (instant, no panel)</span>
          </label>
        </div>
      </div>

      <!-- Generate Button -->
      <button class="rr-generate-btn">
        <span class="rr-btn-text">✨ Generate Response</span>
        <span class="rr-btn-loading hidden">
          <span class="rr-spinner"></span>
          Generating...
        </span>
      </button>

      <!-- Response Section (hidden until generated) -->
      <div class="rr-response-section hidden">
        <textarea class="rr-response-textarea" placeholder="Your response..."></textarea>

        <!-- Time Saved Badge (shown after generation) -->
        <div class="rr-time-saved-badge hidden">
          <span>⏱️ ~3 min saved!</span>
        </div>

        <div class="rr-action-buttons">
          <button class="rr-copy-btn">📋 Copy</button>
          ${isGoogleMaps ? `
            <button class="rr-paste-btn">🚀 Paste</button>
            <button class="rr-submit-btn">⚡ Paste & Submit</button>
          ` : ''}
          <button class="rr-regenerate-btn">🔄</button>
        </div>

        <!-- Quick Tone Switch -->
        <div class="rr-quick-tones">
          <span>Try:</span>
          <button class="rr-quick-tone" data-tone="professional">Pro</button>
          <button class="rr-quick-tone" data-tone="friendly">Friendly</button>
          <button class="rr-quick-tone" data-tone="formal">Formal</button>
          <button class="rr-quick-tone" data-tone="apologetic">Sorry</button>
        </div>
      </div>

      <!-- Keyboard Shortcuts Hint -->
      <div class="rr-shortcuts-hint">
        <kbd>Alt+R</kbd> generate · <kbd>Alt+C</kbd> copy · <kbd>Alt+T</kbd> turbo · <kbd>Esc</kbd> close
      </div>

      <!-- Help Overlay -->
      <div class="rr-help-overlay hidden">
        <div class="rr-help-content">
          <h3>🎯 How to use</h3>
          <ol>
            <li>Select review text on any page</li>
            <li>Click the ⚡ button that appears</li>
            <li>Choose your tone & generate</li>
            <li>Copy & paste your response!</li>
          </ol>
          ${isGoogleMaps ? '<p class="rr-help-tip">💡 On Google Maps: Use "Paste & Reply" to auto-fill!</p>' : ''}
          <button class="rr-help-close">Got it!</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(panel);
  initPanelEvents(panel);

  // Load saved settings
  loadSettings().then(settings => {
    panel.querySelector('.rr-tone-select').value = settings.tone || 'professional';
    panel.querySelector('.rr-length-select').value = settings.length || 'medium';
    panel.querySelector('.rr-emoji-toggle').checked = settings.emojis || false;
    panel.querySelector('.rr-autocopy-toggle').checked = settings.autoCopy !== false;
    panel.querySelector('.rr-turbo-toggle').checked = settings.turboMode || false;
    cachedSettings = settings;
  });

  return panel;
}

// ========== PANEL EVENTS ==========
function initPanelEvents(panel) {
  // Close button
  panel.querySelector('.rr-close-btn').addEventListener('click', () => closePanel(panel));

  // Help button
  panel.querySelector('.rr-help-btn').addEventListener('click', () => {
    panel.querySelector('.rr-help-overlay').classList.toggle('hidden');
  });

  panel.querySelector('.rr-help-close').addEventListener('click', () => {
    panel.querySelector('.rr-help-overlay').classList.add('hidden');
  });

  // Settings toggle
  panel.querySelector('.rr-settings-toggle').addEventListener('click', () => {
    panel.querySelector('.rr-advanced').classList.toggle('hidden');
  });

  // Generate button
  panel.querySelector('.rr-generate-btn').addEventListener('click', () => generateResponse(panel));

  // Regenerate button
  panel.querySelector('.rr-regenerate-btn').addEventListener('click', () => generateResponse(panel));

  // Copy button
  panel.querySelector('.rr-copy-btn').addEventListener('click', () => copyResponse(panel));

  // Paste button (Google Maps only)
  const pasteBtn = panel.querySelector('.rr-paste-btn');
  if (pasteBtn) {
    pasteBtn.addEventListener('click', () => {
      const text = panel.querySelector('.rr-response-textarea').value;
      if (text) {
        autoPasteToGoogleMaps(text, panel, false);
      } else {
        showToast('⚠️ Generate a response first', 'warning');
      }
    });
  }

  // Paste & Submit button (Google Maps only) - THE KILLER FEATURE
  const submitBtn = panel.querySelector('.rr-submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const text = panel.querySelector('.rr-response-textarea').value;
      if (text) {
        autoPasteToGoogleMaps(text, panel, true); // autoSubmit = true
      } else {
        showToast('⚠️ Generate a response first', 'warning');
      }
    });
  }

  // Quick tone buttons
  panel.querySelectorAll('.rr-quick-tone').forEach(btn => {
    btn.addEventListener('click', () => {
      const tone = btn.dataset.tone;
      panel.querySelector('.rr-tone-select').value = tone;

      // Highlight active
      panel.querySelectorAll('.rr-quick-tone').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      generateResponse(panel);
    });
  });

  // Save settings on change
  panel.querySelector('.rr-tone-select').addEventListener('change', () => saveCurrentSettings(panel));
  panel.querySelector('.rr-length-select').addEventListener('change', () => saveCurrentSettings(panel));
  panel.querySelector('.rr-emoji-toggle').addEventListener('change', () => saveCurrentSettings(panel));
  panel.querySelector('.rr-autocopy-toggle').addEventListener('change', () => saveCurrentSettings(panel));
  panel.querySelector('.rr-turbo-toggle').addEventListener('change', () => saveCurrentSettings(panel));
}

function closePanel(panel) {
  panel.classList.remove('rr-visible');
  panel.classList.add('rr-closing');
  setTimeout(() => {
    panel.classList.remove('rr-closing');
  }, 300);
}

function saveCurrentSettings(panel) {
  const settings = {
    tone: panel.querySelector('.rr-tone-select').value,
    length: panel.querySelector('.rr-length-select').value,
    emojis: panel.querySelector('.rr-emoji-toggle').checked,
    autoCopy: panel.querySelector('.rr-autocopy-toggle').checked,
    turboMode: panel.querySelector('.rr-turbo-toggle').checked
  };
  cachedSettings = settings;
  saveSettings(settings);
}

// ========== GENERATE RESPONSE ==========
async function generateResponse(panel) {
  const reviewText = panel.dataset.reviewText;
  const detectedIssues = panel.dataset.detectedIssues ? JSON.parse(panel.dataset.detectedIssues) : [];
  const tone = panel.querySelector('.rr-tone-select').value;
  const length = panel.querySelector('.rr-length-select').value;
  const emojis = panel.querySelector('.rr-emoji-toggle').checked;

  const generateBtn = panel.querySelector('.rr-generate-btn');
  const btnText = panel.querySelector('.rr-btn-text');
  const btnLoading = panel.querySelector('.rr-btn-loading');
  const responseSection = panel.querySelector('.rr-response-section');
  const timeSavedBadge = panel.querySelector('.rr-time-saved-badge');

  if (!reviewText) {
    showToast('⚠️ No review text found', 'error');
    return;
  }

  let stored;
  try {
    stored = await chrome.storage.local.get(['token', 'user']);
  } catch (e) {
    showToast('⚠️ Extension error', 'error');
    return;
  }

  if (!stored.token) {
    showToast('🔐 Please login in the extension popup first', 'error');
    return;
  }

  // Show loading
  generateBtn.disabled = true;
  btnText.classList.add('hidden');
  btnLoading.classList.remove('hidden');

  try {
    // Build context with detected issues for smarter AI response
    let context = '';
    if (detectedIssues.length > 0) {
      const issueLabels = detectedIssues.map(i => i.label.replace(/[^\w\s]/g, '').trim());
      context = `Customer complaints detected: ${issueLabels.join(', ')}. Address these specific issues in your response.`;
    }

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
        includeEmojis: emojis,
        businessName: stored.user?.businessName || '',
        additionalContext: context
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Generation failed');
    }

    // Show response
    panel.querySelector('.rr-response-textarea').value = data.response;
    responseSection.classList.remove('hidden');

    // Track time saved
    const totalMinutes = await trackTimeSaved();

    // Update time saved in header
    const timeValue = panel.querySelector('.rr-time-value');
    if (timeValue) {
      timeValue.textContent = formatTimeSaved(totalMinutes);
      timeValue.classList.add('rr-time-updated');
      setTimeout(() => timeValue.classList.remove('rr-time-updated'), 1000);
    }

    // Show time saved badge
    if (timeSavedBadge) {
      timeSavedBadge.classList.remove('hidden');
      setTimeout(() => timeSavedBadge.classList.add('hidden'), 4000);
    }

    // Update quick tone buttons
    panel.querySelectorAll('.rr-quick-tone').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tone === tone);
    });

    // Auto-copy if enabled
    const settings = cachedSettings || await loadSettings();
    if (settings.autoCopy) {
      try {
        await navigator.clipboard.writeText(data.response);
        showToast('✨ Generated & copied! ~3 min saved', 'success');

        // Update copy button
        const copyBtn = panel.querySelector('.rr-copy-btn');
        if (copyBtn) {
          copyBtn.textContent = '✅ Copied!';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.textContent = '📋 Copy';
            copyBtn.classList.remove('copied');
          }, 2000);
        }
      } catch (e) {
        showToast('✨ Response generated! ~3 min saved', 'success');
      }
    } else {
      showToast('✨ Response generated! ~3 min saved', 'success');
    }

    // Maybe show confetti
    await maybeShowConfetti();

    // Show onboarding tip first time
    const onboardingSeen = await checkOnboarding();
    if (!onboardingSeen) {
      showOnboardingTip(panel);
      await markOnboardingSeen();
    }

  } catch (error) {
    showToast(`❌ ${error.message}`, 'error');
  } finally {
    generateBtn.disabled = false;
    btnText.classList.remove('hidden');
    btnLoading.classList.add('hidden');
  }
}

// ========== TURBO MODE: Instant generation without panel ==========
async function turboGenerate(reviewText) {
  // Pre-flight checks
  if (!isLoggedIn) {
    showToast('🔐 Please login first (click extension icon)', 'error');
    return;
  }

  const cleaned = cleanReviewText(reviewText);
  if (!cleaned || cleaned.length < 10) {
    showToast('⚠️ Select more text', 'warning');
    return;
  }

  // Show loading toast
  showToast('⚡ Generating...', 'info');

  try {
    const settings = cachedSettings || await loadSettings();
    const sentiment = analyzeSentiment(cleaned);
    const sentimentDisplay = getSentimentDisplay(sentiment);
    const issues = detectIssues(cleaned);

    // Build context
    let context = '';
    if (issues.length > 0) {
      const issueLabels = issues.map(i => i.label.replace(/[^\w\s]/g, '').trim());
      context = `Customer complaints detected: ${issueLabels.join(', ')}. Address these specific issues in your response.`;
    }

    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cachedToken}`
      },
      body: JSON.stringify({
        reviewText: cleaned,
        tone: sentimentDisplay.tone, // Auto-select based on sentiment
        outputLanguage: 'auto',
        responseLength: settings.length || 'medium',
        includeEmojis: settings.emojis || false,
        businessName: cachedUser?.businessName || '',
        additionalContext: context
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Generation failed');
    }

    // Copy to clipboard
    await navigator.clipboard.writeText(data.response);

    // Track time saved
    await trackTimeSaved();

    // Show success
    showToast('✅ Copied to clipboard! Paste with Ctrl+V', 'success');

    // Maybe show confetti
    await maybeShowConfetti();

  } catch (error) {
    showToast(`❌ ${error.message}`, 'error');
  }
}

// ========== COPY RESPONSE ==========
async function copyResponse(panel) {
  const text = panel.querySelector('.rr-response-textarea').value;

  if (!text) {
    showToast('⚠️ Nothing to copy', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast('📋 Copied to clipboard!', 'success');

    // Animate button
    const copyBtn = panel.querySelector('.rr-copy-btn');
    copyBtn.textContent = '✅ Copied!';
    copyBtn.classList.add('copied');

    setTimeout(() => {
      copyBtn.textContent = '📋 Copy';
      copyBtn.classList.remove('copied');
    }, 2000);

  } catch (error) {
    showToast('❌ Failed to copy', 'error');
  }
}

// ========== SHOW PANEL ==========
async function showResponsePanel(reviewText, autoGenerate = false) {
  let panel = document.getElementById('rr-response-panel');
  if (!panel) {
    panel = await createResponsePanel();
  }

  // Clean and store review text
  const cleaned = cleanReviewText(reviewText);
  panel.dataset.reviewText = cleaned;

  // Update review preview
  const preview = cleaned.length > 120 ? cleaned.substring(0, 120) + '...' : cleaned;
  panel.querySelector('.rr-review-text').textContent = preview;

  // Analyze sentiment
  const sentiment = analyzeSentiment(cleaned);
  const sentimentDisplay = getSentimentDisplay(sentiment);

  panel.querySelector('.rr-sentiment-emoji').textContent = sentimentDisplay.emoji;
  panel.querySelector('.rr-sentiment-label').textContent = sentimentDisplay.label;
  panel.querySelector('.rr-sentiment-label').style.color = sentimentDisplay.color;

  // Auto-select recommended tone
  panel.querySelector('.rr-tone-select').value = sentimentDisplay.tone;

  // Detect language
  const language = detectLanguage(cleaned);
  panel.querySelector('.rr-language-flag').textContent = language.flag;
  panel.querySelector('.rr-language-name').textContent = language.name;

  // Smart Issue Detection
  const issues = detectIssues(cleaned);
  const issuesRow = panel.querySelector('.rr-issues-row');
  const issuesTags = panel.querySelector('.rr-issues-tags');

  if (issues.length > 0) {
    // Store issues for generateResponse
    panel.dataset.detectedIssues = JSON.stringify(issues);

    // Show issues in UI
    issuesTags.innerHTML = issues.map(i => `<span class="rr-issue-tag">${i.label}</span>`).join('');
    issuesRow.classList.remove('hidden');

    // Auto-select apologetic tone for negative issues
    if (sentiment === 'negative') {
      panel.querySelector('.rr-tone-select').value = 'apologetic';
    }
  } else {
    panel.dataset.detectedIssues = '[]';
    issuesRow.classList.add('hidden');
  }

  // Reset response section
  panel.querySelector('.rr-response-section').classList.add('hidden');
  panel.querySelector('.rr-response-textarea').value = '';
  panel.querySelector('.rr-advanced').classList.add('hidden');
  panel.querySelector('.rr-help-overlay').classList.add('hidden');

  // Hide time saved badge
  const timeSavedBadge = panel.querySelector('.rr-time-saved-badge');
  if (timeSavedBadge) timeSavedBadge.classList.add('hidden');

  // Reset position for desktop
  if (window.innerWidth > 640) {
    panel.style.left = '';
    panel.style.top = '';
    panel.style.transform = '';
    panel.style.bottom = '';
  }

  // Show panel
  panel.classList.add('rr-visible');

  // Auto-generate if requested
  if (autoGenerate) {
    setTimeout(() => generateResponse(panel), 100);
  }
}

// ========== FLOATING BUTTON ==========
let floatingBtn = null;

function createFloatingButton() {
  if (floatingBtn) return floatingBtn;

  floatingBtn = document.createElement('button');
  floatingBtn.id = 'rr-floating-btn';
  floatingBtn.innerHTML = '⚡';
  floatingBtn.title = 'Generate response (Alt+R)';

  floatingBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const selection = window.getSelection().toString().trim();
    if (!selection || selection.length < 10) {
      hideFloatingButton();
      return;
    }

    // Pre-flight login check
    if (!isLoggedIn) {
      showToast('🔐 Please login first (click extension icon)', 'error');
      hideFloatingButton();
      return;
    }

    // Check if turbo mode is enabled
    const settings = cachedSettings || await loadSettings();
    if (settings.turboMode) {
      hideFloatingButton();
      turboGenerate(selection);
    } else {
      showResponsePanel(selection, true);
      hideFloatingButton();
    }
  });

  document.body.appendChild(floatingBtn);
  return floatingBtn;
}

function showFloatingButton(x, y) {
  const btn = createFloatingButton();

  // Position near cursor but keep on screen
  const btnX = Math.min(x + 15, window.innerWidth - 70);
  const btnY = Math.max(y - 60, 10);

  btn.style.left = `${btnX}px`;
  btn.style.top = `${btnY}px`;
  btn.classList.add('rr-visible');
}

function hideFloatingButton() {
  if (floatingBtn) {
    floatingBtn.classList.remove('rr-visible');
  }
}

// ========== EVENT LISTENERS ==========

// Text selection - show floating button (threshold: 10 chars)
document.addEventListener('mouseup', (e) => {
  // Don't trigger if clicking on our UI
  if (e.target.closest('#rr-response-panel') || e.target.closest('#rr-floating-btn')) {
    return;
  }

  setTimeout(() => {
    const selection = window.getSelection().toString().trim();

    // Show button for 10+ character selections
    if (selection && selection.length >= 10) {
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

// Double-click on text = Instant Generate (Turbo shortcut)
document.addEventListener('dblclick', async (e) => {
  // Don't trigger if clicking on our UI or inputs
  if (e.target.closest('#rr-response-panel') ||
      e.target.closest('#rr-floating-btn') ||
      e.target.closest('input') ||
      e.target.closest('textarea')) {
    return;
  }

  // Wait a moment for text selection to complete
  await new Promise(r => setTimeout(r, 50));

  const selection = window.getSelection().toString().trim();
  if (!selection || selection.length < 10) return;

  // Only in turbo mode OR if logged in and holding Alt
  const settings = cachedSettings || await loadSettings();

  if (settings.turboMode || e.altKey) {
    if (!isLoggedIn) {
      showToast('🔐 Please login first', 'error');
      return;
    }
    turboGenerate(selection);
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', async (e) => {
  // Alt+R: Generate from selection (respects turbo mode)
  if (e.altKey && e.key.toLowerCase() === 'r') {
    e.preventDefault();
    const selection = window.getSelection().toString().trim();
    if (!selection || selection.length < 10) {
      showToast('⚠️ Select at least 10 characters', 'warning');
      return;
    }

    if (!isLoggedIn) {
      showToast('🔐 Please login first', 'error');
      return;
    }

    const settings = cachedSettings || await loadSettings();
    if (settings.turboMode) {
      turboGenerate(selection);
    } else {
      showResponsePanel(selection, true);
    }
  }

  // Alt+T: Toggle Turbo Mode
  if (e.altKey && e.key.toLowerCase() === 't') {
    e.preventDefault();
    const settings = cachedSettings || await loadSettings();
    settings.turboMode = !settings.turboMode;
    cachedSettings = settings;
    saveSettings(settings);
    showToast(settings.turboMode ? '⚡ Turbo Mode ON' : '🐢 Turbo Mode OFF', 'info');
  }

  // Alt+C: Copy current response
  if (e.altKey && e.key.toLowerCase() === 'c') {
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
      closePanel(panel);
    }
    hideFloatingButton();
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showPanelWithText') {
    showResponsePanel(message.reviewText, true);
    sendResponse({ success: true });
  }

  if (message.action === 'getSelection') {
    const selection = window.getSelection().toString().trim();
    sendResponse({ text: selection });
  }

  return true;
});

// Add inline buttons to Google Maps reviews (optional enhancement)
function addInlineButtons() {
  const selectors = ['.jftiEf', '[data-review-id]'];

  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(review => {
      if (review.querySelector('.rr-inline-btn')) return;

      const textEl = review.querySelector('.wiI7pd, .MyEned');
      if (!textEl) return;

      const text = cleanReviewText(textEl.textContent);
      if (!text || text.length < 10) return;

      const btn = document.createElement('button');
      btn.className = 'rr-inline-btn';
      btn.innerHTML = '⚡ Respond';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showResponsePanel(text, true);
      });

      const target = review.querySelector('.k8MTF, .GBkF3d') || review;
      target.appendChild(btn);
    });
  });
}

// Initialize
addInlineButtons();

// Watch for dynamic content (Google Maps)
const observer = new MutationObserver(() => {
  setTimeout(addInlineButtons, 500);
});
observer.observe(document.body, { childList: true, subtree: true });

// Ready message
console.log('%c⚡ ReviewResponder ready!', 'font-size: 14px; font-weight: bold; color: #667eea;');
console.log('%cSelect text → Click ⚡ → Magic!', 'font-size: 12px; color: #764ba2;');
