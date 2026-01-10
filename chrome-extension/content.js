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

// ========== THEME MANAGEMENT (Dark Mode) ==========
let currentTheme = 'auto'; // light, dark, auto

async function getThemePreference() {
  try {
    const stored = await chrome.storage.local.get(['rr_theme']);
    return stored.rr_theme || 'auto';
  } catch (e) {
    return 'auto';
  }
}

async function setThemePreference(theme) {
  try {
    await chrome.storage.local.set({ rr_theme: theme });
    currentTheme = theme;
    applyTheme(theme);
  } catch (e) {
    console.error('Error saving theme preference:', e);
  }
}

function getSystemTheme() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function applyTheme(theme) {
  const effectiveTheme = theme === 'auto' ? getSystemTheme() : theme;

  // Apply to panel if it exists
  const panel = document.getElementById('rr-response-panel');
  if (panel) {
    if (effectiveTheme === 'dark') {
      panel.classList.add('rr-dark');
    } else {
      panel.classList.remove('rr-dark');
    }
    // Update toggle button icon
    const toggleBtn = panel.querySelector('.rr-theme-toggle');
    if (toggleBtn) {
      toggleBtn.textContent = effectiveTheme === 'dark' ? '☀️' : '🌙';
    }
    // Update active state in dropdown
    const themeOptions = panel.querySelectorAll('.rr-theme-option');
    themeOptions.forEach(opt => {
      opt.classList.toggle('active', opt.dataset.theme === theme);
    });
  }

  // Apply to queue panel if it exists
  const queuePanel = document.getElementById('rr-queue-panel');
  if (queuePanel) {
    if (effectiveTheme === 'dark') {
      queuePanel.classList.add('rr-dark');
    } else {
      queuePanel.classList.remove('rr-dark');
    }
  }
}

// Listen for OS theme changes
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentTheme === 'auto') {
      applyTheme('auto');
    }
  });
}

// Initialize theme on load
(async () => {
  currentTheme = await getThemePreference();
})();

// ========== SMART CLIPBOARD DETECTION ==========
async function checkClipboardForReview() {
  try {
    // Check if clipboard API is available
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      return { hasReview: false, text: '' };
    }

    const clipboardText = await navigator.clipboard.readText();

    // Skip if empty or too short
    if (!clipboardText || clipboardText.length < 20) {
      return { hasReview: false, text: '' };
    }

    // Skip if too long (probably not a review)
    if (clipboardText.length > 2000) {
      return { hasReview: false, text: '' };
    }

    // Check if it looks like a review
    const reviewIndicators = [
      // English
      /\b(stars?|rating|review|experience|service|staff|food|room|stay|visit)\b/i,
      // German
      /\b(sterne?|bewertung|erfahrung|service|essen|zimmer|aufenthalt|besuch)\b/i,
      // Dutch
      /\b(sterren|beoordeling|ervaring|dienst|eten|kamer|verblijf|bezoek)\b/i,
      // Common sentiment words
      /\b(terrible|amazing|worst|best|never|always|recommend|avoid|great|awful)\b/i,
      /\b(schrecklich|fantastisch|schlimmste|beste|empfehlen|vermeiden)\b/i
    ];

    const hasReviewIndicator = reviewIndicators.some(regex => regex.test(clipboardText));

    // Also check for typical review structure (opinion-like text)
    const hasOpinionStructure =
      clipboardText.includes('!') ||
      clipboardText.includes('.') ||
      /\b(I|we|my|our|ich|wir|mein|unser)\b/i.test(clipboardText);

    if (hasReviewIndicator || (hasOpinionStructure && clipboardText.length > 50)) {
      return { hasReview: true, text: clipboardText.trim() };
    }

    return { hasReview: false, text: '' };
  } catch (e) {
    // Clipboard access denied or not available
    console.log('Clipboard access not available:', e.message);
    return { hasReview: false, text: '' };
  }
}

function showClipboardBanner(panel, clipboardText) {
  // Remove existing banner if any
  const existingBanner = panel.querySelector('.rr-clipboard-banner');
  if (existingBanner) existingBanner.remove();

  const banner = document.createElement('div');
  banner.className = 'rr-clipboard-banner';
  banner.innerHTML = `
    <div class="rr-clipboard-icon">📋</div>
    <div class="rr-clipboard-content">
      <div class="rr-clipboard-title">Review detected in clipboard!</div>
      <div class="rr-clipboard-preview">"${clipboardText.substring(0, 60)}..."</div>
    </div>
    <div class="rr-clipboard-actions">
      <button class="rr-clipboard-use">Use This</button>
      <button class="rr-clipboard-dismiss">×</button>
    </div>
  `;

  // Insert after header
  const header = panel.querySelector('.rr-panel-header');
  if (header) {
    header.after(banner);
  }

  // Event listeners
  banner.querySelector('.rr-clipboard-use').addEventListener('click', () => {
    // Use clipboard text as review
    panel.dataset.reviewText = clipboardText;
    panel.querySelector('.rr-review-box').textContent = clipboardText.substring(0, 300) + (clipboardText.length > 300 ? '...' : '');

    // Detect language and issues
    const detectedLanguage = detectLanguage(clipboardText);
    panel.dataset.detectedLanguage = detectedLanguage;

    const issues = detectIssues(clipboardText);
    panel.dataset.detectedIssues = JSON.stringify(issues);

    // Update UI
    updateSentimentAndLanguage(panel, clipboardText);

    banner.remove();
    showToast('📋 Clipboard review loaded!', 'success');
  });

  banner.querySelector('.rr-clipboard-dismiss').addEventListener('click', () => {
    banner.remove();
  });

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (banner.parentNode) {
      banner.classList.add('rr-fade-out');
      setTimeout(() => banner.remove(), 300);
    }
  }, 10000);
}

// ========== SMART ISSUE DETECTION WITH COMPENSATION SUGGESTIONS ==========
const ISSUE_COMPENSATIONS = {
  cold_food: [
    { id: 'replacement', label: 'Offer replacement meal', text: 'a complimentary replacement meal' },
    { id: 'discount_10', label: '10% off next visit', text: '10% off your next visit' },
    { id: 'apology', label: 'Sincere apology only', text: null },
  ],
  undercooked: [
    { id: 'replacement', label: 'Offer replacement', text: 'a properly prepared replacement' },
    { id: 'refund', label: 'Full refund', text: 'a full refund' },
  ],
  overcooked: [
    { id: 'replacement', label: 'Offer replacement', text: 'a fresh replacement dish' },
    { id: 'discount_15', label: '15% off next visit', text: '15% off your next visit' },
  ],
  portion_size: [
    { id: 'free_side', label: 'Free side dish next time', text: 'a complimentary side dish on your next visit' },
    { id: 'apology', label: 'Explain portions', text: null },
  ],
  tasteless: [
    { id: 'chef_special', label: 'Chef special next visit', text: "a special dish prepared by our chef on your next visit" },
    { id: 'discount_10', label: '10% off next visit', text: '10% off your next visit' },
  ],
  slow_service: [
    { id: 'free_appetizer', label: 'Free appetizer next visit', text: 'a complimentary appetizer on your next visit' },
    { id: 'priority', label: 'Priority seating', text: 'priority seating on your next visit' },
    { id: 'apology', label: 'Apology only', text: null },
  ],
  rude_staff: [
    { id: 'talk_manager', label: 'Manager follow-up', text: 'a personal follow-up from our manager' },
    { id: 'discount_20', label: '20% off next visit', text: '20% off your next visit' },
  ],
  ignored: [
    { id: 'priority', label: 'VIP treatment next time', text: 'VIP treatment on your next visit' },
    { id: 'free_drink', label: 'Free drink next visit', text: 'a complimentary drink on your next visit' },
  ],
  wrong_order: [
    { id: 'replacement', label: 'Free correct order', text: 'the correct order at no charge' },
    { id: 'discount_25', label: '25% off next visit', text: '25% off your next visit' },
  ],
  dirty: [
    { id: 'discount_15', label: '15% off next visit', text: '15% off your next visit' },
    { id: 'apology', label: 'Apology + action plan', text: null },
  ],
  hygiene: [
    { id: 'refund', label: 'Full refund', text: 'a full refund' },
    { id: 'discount_30', label: '30% off next visit', text: '30% off your next visit' },
  ],
  pests: [
    { id: 'refund', label: 'Full refund', text: 'a full refund' },
    { id: 'apology', label: 'Apology + health assurance', text: null },
  ],
  overpriced: [
    { id: 'discount_10', label: '10% loyalty discount', text: 'a 10% loyalty discount' },
    { id: 'explain_value', label: 'Explain value', text: null },
  ],
  hidden_fees: [
    { id: 'waive_fees', label: 'Waive extra fees', text: 'to waive those fees' },
    { id: 'transparency', label: 'Promise transparency', text: null },
  ],
};

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
      const compensations = ISSUE_COMPENSATIONS[issue] || [];
      issues.push({ issue, label, compensations, selectedCompensation: null });
    }
  });

  return issues;
}

// ========== MULTI-PLATFORM AUTO-PASTE ==========
const PLATFORM_SELECTORS = {
  Google: {
    replyField: [
      'textarea[aria-label*="Reply"]',
      'textarea[aria-label*="reply"]',
      'textarea[aria-label*="Antwort"]',
      'textarea[aria-label*="Répondre"]',
      'textarea[jsname="YPqjbf"]',
      '.review-dialog-text textarea',
      '[data-value="Reply"] textarea',
      '.reply-text textarea',
      '.review-dialog textarea',
      '[role="dialog"] textarea',
    ],
    replyButton: [
      '[data-value="Reply"]',
      'button[aria-label*="Reply"]',
      'button[aria-label*="reply"]',
      'button[aria-label*="Antwort"]',
      '.review-action-button',
      '[jsaction*="reply"]',
    ],
    submitButton: [
      'button[aria-label*="Submit"]',
      'button[aria-label*="Send"]',
      'button[aria-label*="Senden"]',
      'button[aria-label*="Publier"]',
      'button[jsname="LgbsSe"]',
      '[role="dialog"] button[type="submit"]',
    ],
    submitText: ['submit', 'send', 'senden', 'publier', 'enviar', 'post']
  },
  Yelp: {
    replyField: [
      'textarea.comment-text',
      '.biz-owner-reply textarea',
      '[data-testid="reply-textarea"]',
      '.review-response textarea',
      'textarea[name="comment"]',
    ],
    replyButton: [
      'button[data-testid="reply-button"]',
      '.reply-link',
      'a[href*="respond"]',
      '.biz-owner-reply-link',
    ],
    submitButton: [
      'button.send-button',
      'button[type="submit"]',
      '.submit-response',
      'button[data-testid="submit-reply"]',
    ],
    submitText: ['submit', 'send', 'post', 'reply']
  },
  TripAdvisor: {
    replyField: [
      '.reviewResponse textarea',
      'textarea.responseText',
      '.management-response textarea',
      '[data-test-target="reply-textarea"]',
    ],
    replyButton: [
      '.management-response-link',
      'button[data-test-target="reply-button"]',
      '.respond-link',
    ],
    submitButton: [
      '.submitResponse',
      'button[data-test-target="submit-response"]',
      'button[type="submit"]',
    ],
    submitText: ['submit', 'post', 'respond']
  },
  Facebook: {
    replyField: [
      '[contenteditable="true"]',
      'div[role="textbox"]',
      '.notranslate._5rpu',
    ],
    replyButton: [
      '[aria-label="Reply"]',
      '[data-testid="UFI2CommentActionLink"]',
    ],
    submitButton: [
      '[aria-label="Submit"]',
      '[aria-label="Post"]',
      'div[aria-label*="Press enter"]',
    ],
    submitText: ['submit', 'post', 'send'],
    useEnter: true // Facebook often uses Enter to submit
  },
  Booking: {
    replyField: [
      '.review-reply-input',
      'textarea[data-testid="reply-input"]',
      '.response-textarea',
    ],
    replyButton: [
      '.reply-button',
      '[data-testid="reply-link"]',
    ],
    submitButton: [
      '.reply-submit',
      'button[data-testid="submit-reply"]',
      'button[type="submit"]',
    ],
    submitText: ['submit', 'send', 'reply', 'post']
  },
  Trustpilot: {
    replyField: [
      'textarea[data-service-review-reply-textarea]',
      '.reply-box textarea',
      '[data-testid="reply-textarea"]',
    ],
    replyButton: [
      'button[data-service-review-reply-button]',
      '.reply-link',
    ],
    submitButton: [
      'button[data-service-review-reply-submit]',
      'button[type="submit"]',
    ],
    submitText: ['submit', 'send', 'post', 'reply']
  }
};

function findReplyField(platform) {
  const selectors = PLATFORM_SELECTORS[platform.name]?.replyField || [];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.offsetParent !== null) {
      return el;
    }
  }

  // Generic fallback
  const genericSelectors = [
    'textarea[placeholder*="reply" i]',
    'textarea[placeholder*="response" i]',
    '[role="dialog"] textarea',
    '.reply-box textarea',
  ];

  for (const selector of genericSelectors) {
    const el = document.querySelector(selector);
    if (el && el.offsetParent !== null) {
      return el;
    }
  }

  return null;
}

function findReplyButton(platform) {
  const selectors = PLATFORM_SELECTORS[platform.name]?.replyButton || [];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.offsetParent !== null) {
      return el;
    }
  }

  return null;
}

function findSubmitButton(platform) {
  const selectors = PLATFORM_SELECTORS[platform.name]?.submitButton || [];

  for (const selector of selectors) {
    try {
      const el = document.querySelector(selector);
      if (el && el.offsetParent !== null && !el.disabled) {
        return el;
      }
    } catch (e) {
      // Some selectors might fail
    }
  }

  // Fallback: Find button with submit-like text
  const submitText = PLATFORM_SELECTORS[platform.name]?.submitText || ['submit', 'send', 'post'];
  const allButtons = document.querySelectorAll('button, [role="button"]');

  for (const btn of allButtons) {
    const text = btn.textContent.toLowerCase();
    if (submitText.some(t => text.includes(t)) && btn.offsetParent !== null && !btn.disabled) {
      return btn;
    }
  }

  return null;
}

// Legacy function names for backward compatibility
function findGoogleMapsReplyField() {
  return findReplyField(detectPlatform());
}

function findGoogleMapsReplyButton() {
  return findReplyButton(detectPlatform());
}

function findGoogleMapsSubmitButton() {
  return findSubmitButton(detectPlatform());
}

async function autoPasteToReviewField(text, panel, autoSubmit = false) {
  const platform = detectPlatform();
  const supportedPlatforms = ['Google', 'Yelp', 'TripAdvisor', 'Facebook', 'Booking', 'Trustpilot'];

  if (!supportedPlatforms.includes(platform.name)) {
    showToast(`⚠️ Auto-paste not yet supported on ${platform.name}`, 'warning');
    return false;
  }

  // First, try to find an existing reply field
  let replyField = findReplyField(platform);

  // If no field, try clicking the Reply button
  if (!replyField) {
    const replyButton = findReplyButton(platform);
    if (replyButton) {
      replyButton.click();
      // Wait for the reply field to appear
      await new Promise(resolve => setTimeout(resolve, 500));
      replyField = findReplyField(platform);
    }
  }

  if (!replyField) {
    showToast('📝 No reply field found - click "Reply" on a review first', 'info');
    return false;
  }

  // Focus the field
  replyField.focus();

  // Handle contenteditable fields (Facebook) differently
  if (replyField.getAttribute('contenteditable') === 'true') {
    replyField.textContent = text;
    replyField.innerHTML = text;
  } else {
    replyField.value = text;
  }

  // Trigger input events so the platform registers the change
  replyField.dispatchEvent(new Event('input', { bubbles: true }));
  replyField.dispatchEvent(new Event('change', { bubbles: true }));
  replyField.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));

  // Close our panel first
  if (panel) {
    closePanel(panel);
  }

  // Auto-submit if requested
  if (autoSubmit) {
    // Small delay for UI to register the input
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check if platform uses Enter to submit (Facebook)
    const useEnter = PLATFORM_SELECTORS[platform.name]?.useEnter;
    if (useEnter) {
      replyField.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      showToast(`🎉 Response submitted to ${platform.name}!`, 'success');
      return true;
    }

    const submitBtn = findSubmitButton(platform);
    if (submitBtn) {
      submitBtn.click();
      showToast(`🎉 Response submitted to ${platform.name}!`, 'success');
      return true;
    } else {
      showToast('🚀 Pasted! Click Submit manually', 'warning');
      return false;
    }
  }

  showToast(`🚀 Pasted to ${platform.name}! Ready to submit`, 'success');
  return true;
}

// Legacy alias for backward compatibility
async function autoPasteToGoogleMaps(text, panel, autoSubmit = false) {
  return autoPasteToReviewField(text, panel, autoSubmit);
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

// ========== QUALITY SCORE BADGE ==========
function showQualityBadge(panel, quality) {
  const badge = panel.querySelector('.rr-quality-badge');
  if (!badge) return;

  const indicator = badge.querySelector('.rr-quality-indicator');
  const label = badge.querySelector('.rr-quality-label');
  const feedback = badge.querySelector('.rr-quality-feedback');

  // Define badge styles by level
  const styles = {
    excellent: { emoji: '🟢', text: 'Excellent', className: 'rr-quality-excellent' },
    good: { emoji: '🟡', text: 'Good', className: 'rr-quality-good' },
    needs_work: { emoji: '🔴', text: 'Needs Work', className: 'rr-quality-needs-work' }
  };

  const style = styles[quality.level] || styles.good;

  // Update badge content
  indicator.textContent = style.emoji;
  label.textContent = `${style.text} (${quality.score}/100)`;
  feedback.textContent = quality.feedback || '';

  // Update badge class
  badge.className = 'rr-quality-badge ' + style.className;

  // Show with animation
  badge.classList.remove('hidden');
  badge.classList.add('rr-badge-show');

  // If there are suggestions, add tooltip
  if (quality.suggestions && quality.suggestions.length > 0) {
    badge.title = 'Tips: ' + quality.suggestions.join(', ');
  } else {
    badge.title = '';
  }
}

// ========== RESPONSE VARIATIONS ==========
let currentVariations = []; // Store variations for tab switching

async function generateVariations(panel) {
  const reviewText = panel.dataset.reviewText;
  const detectedLanguage = panel.dataset.detectedLanguage || 'en';
  const tone = panel.querySelector('.rr-tone-select').value;
  const length = panel.querySelector('.rr-length-select').value;
  const emojis = panel.querySelector('.rr-emoji-toggle').checked;

  const variationsBtn = panel.querySelector('.rr-variations-btn');
  const varText = panel.querySelector('.rr-var-text');
  const varLoading = panel.querySelector('.rr-var-loading');
  const responseSection = panel.querySelector('.rr-response-section');
  const variationsTabs = panel.querySelector('.rr-variations-tabs');

  if (!reviewText) {
    showToast('No review text found', 'error');
    return;
  }

  let stored;
  try {
    stored = await chrome.storage.local.get(['token', 'user']);
  } catch (e) {
    showToast('Extension error', 'error');
    return;
  }

  if (!stored.token) {
    showToast('Please login in the extension popup first', 'error');
    return;
  }

  // Show loading
  variationsBtn.disabled = true;
  varText.classList.add('hidden');
  varLoading.classList.remove('hidden');

  // Get business name
  let businessName = stored.user?.businessName || '';
  if (!businessName) {
    businessName = detectBusinessContext() || await getCachedBusinessName();
  }

  try {
    const response = await fetch(`${API_URL}/generate-variations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${stored.token}`
      },
      body: JSON.stringify({
        reviewText,
        tone,
        outputLanguage: detectedLanguage,
        responseLength: length,
        includeEmojis: emojis,
        businessName
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to generate variations');
    }

    // Store variations for tab switching
    currentVariations = data.variations;

    // Show response section with tabs
    responseSection.classList.remove('hidden');
    variationsTabs.classList.remove('hidden');

    // Show first variation
    switchVariation(panel, 0);

    // Hide undo button
    panel.querySelector('.rr-undo-btn').classList.add('hidden');
    panel.dataset.previousResponse = '';

    showToast('3 Options generated! (3 credits used)', 'success');

  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    variationsBtn.disabled = false;
    varText.classList.remove('hidden');
    varLoading.classList.add('hidden');
  }
}

function switchVariation(panel, index) {
  if (!currentVariations || !currentVariations[index]) return;

  const variation = currentVariations[index];
  const textarea = panel.querySelector('.rr-response-textarea');
  const tabs = panel.querySelectorAll('.rr-var-tab');

  // Update textarea
  textarea.value = variation.response;

  // Update active tab
  tabs.forEach((tab, i) => {
    tab.classList.toggle('active', i === index);
  });

  // Update character counter
  updateCharCounter(panel);

  // Show quality badge for this variation
  if (variation.quality) {
    showQualityBadge(panel, variation.quality);
  }
}

// ========== ANALYTICS WIDGET ==========
async function loadAnalytics() {
  try {
    const data = await chrome.storage.local.get(['rr_analytics']);
    return data.rr_analytics || { daily: {}, total: { count: 0 } };
  } catch (e) {
    return { daily: {}, total: { count: 0 } };
  }
}

async function updateAnalytics(panel) {
  const analytics = await loadAnalytics();

  // Calculate this week's responses
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  let weekCount = 0;
  const last7Days = [];

  // Get last 7 days data for sparkline
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    const dayData = analytics.daily[dateKey] || { count: 0 };
    last7Days.push(dayData.count);

    if (date >= startOfWeek) {
      weekCount += dayData.count;
    }
  }

  // Update stats
  panel.querySelector('.rr-stat-week').textContent = weekCount;
  panel.querySelector('.rr-stat-total').textContent = analytics.total.count || 0;

  // Generate sparkline
  const sparkline = panel.querySelector('.rr-sparkline');
  if (sparkline) {
    const max = Math.max(...last7Days, 1);
    const bars = last7Days.map(count => {
      const height = Math.max(4, (count / max) * 24);
      return `<div class="rr-spark-bar" style="height: ${height}px" title="${count}"></div>`;
    }).join('');
    sparkline.innerHTML = bars;
  }
}

async function recordAnalyticsResponse() {
  const analytics = await loadAnalytics();
  const today = new Date().toISOString().split('T')[0];

  if (!analytics.daily[today]) {
    analytics.daily[today] = { count: 0, tones: {} };
  }
  analytics.daily[today].count++;
  analytics.total.count = (analytics.total.count || 0) + 1;

  // Clean up old data (keep last 30 days)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  Object.keys(analytics.daily).forEach(date => {
    if (new Date(date) < cutoff) {
      delete analytics.daily[date];
    }
  });

  await chrome.storage.local.set({ rr_analytics: analytics });
}

// ========== REVIEW INSIGHTS ==========

async function loadInsights() {
  const result = await chrome.storage.local.get('rr_insights');
  return result.rr_insights || {
    issues: {},       // { issue_type: count }
    sentiments: { positive: 0, neutral: 0, negative: 0 },
    lastUpdated: null
  };
}

async function recordInsights(issues, sentiment) {
  const insights = await loadInsights();

  // Track issues
  issues.forEach(issue => {
    insights.issues[issue.issue] = (insights.issues[issue.issue] || 0) + 1;
  });

  // Track sentiment
  if (sentiment && insights.sentiments[sentiment] !== undefined) {
    insights.sentiments[sentiment]++;
  }

  insights.lastUpdated = new Date().toISOString();

  // Clean up old data - keep issues with count > 0
  await chrome.storage.local.set({ rr_insights: insights });
}

async function updateInsightsWidget(panel) {
  const insights = await loadInsights();

  // Calculate top issues
  const issueEntries = Object.entries(insights.issues)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const issueLabels = {
    cold_food: '🥶 Cold food',
    undercooked: '🍖 Undercooked',
    overcooked: '🔥 Overcooked',
    portion_size: '📏 Small portions',
    tasteless: '😐 Tasteless',
    slow_service: '⏰ Slow service',
    rude_staff: '😤 Rude staff',
    ignored: '👻 Ignored',
    wrong_order: '❌ Wrong order',
    dirty: '🧹 Cleanliness',
    hygiene: '🦠 Hygiene',
    pests: '🪳 Pests',
    overpriced: '💰 Overpriced',
    hidden_fees: '💸 Hidden fees',
  };

  const topIssuesEl = panel.querySelector('.rr-top-issues');
  if (issueEntries.length > 0) {
    topIssuesEl.innerHTML = issueEntries.map(([issue, count]) => {
      const label = issueLabels[issue] || issue;
      return `<div class="rr-top-issue-item">${label} <span class="rr-issue-freq">${count}x</span></div>`;
    }).join('');
  } else {
    topIssuesEl.innerHTML = '<div class="rr-no-data">No issues tracked yet</div>';
  }

  // Calculate sentiment percentages
  const totalSentiments = insights.sentiments.positive + insights.sentiments.neutral + insights.sentiments.negative;
  let positivePct = 0, neutralPct = 0, negativePct = 0;

  if (totalSentiments > 0) {
    positivePct = Math.round((insights.sentiments.positive / totalSentiments) * 100);
    neutralPct = Math.round((insights.sentiments.neutral / totalSentiments) * 100);
    negativePct = Math.round((insights.sentiments.negative / totalSentiments) * 100);
  }

  // Update sentiment bars
  const sentBars = panel.querySelectorAll('.rr-sentiment-bar');
  if (sentBars[0]) {
    sentBars[0].querySelector('.rr-sent-fill').style.width = `${positivePct}%`;
    sentBars[0].querySelector('.rr-sent-pct').textContent = `${positivePct}%`;
  }
  if (sentBars[1]) {
    sentBars[1].querySelector('.rr-sent-fill').style.width = `${neutralPct}%`;
    sentBars[1].querySelector('.rr-sent-pct').textContent = `${neutralPct}%`;
  }
  if (sentBars[2]) {
    sentBars[2].querySelector('.rr-sent-fill').style.width = `${negativePct}%`;
    sentBars[2].querySelector('.rr-sent-pct').textContent = `${negativePct}%`;
  }

  // Generate dynamic tip
  const tips = [
    { condition: negativePct > 30, tip: 'Many negative reviews - focus on apologetic responses and offer compensations.' },
    { condition: issueEntries.some(([issue]) => issue === 'slow_service'), tip: 'Slow service is common - consider offering priority seating.' },
    { condition: issueEntries.some(([issue]) => issue === 'cold_food'), tip: 'Cold food complaints - mention your quality standards.' },
    { condition: positivePct > 60, tip: 'Great positive sentiment! Use friendly tone to maintain relationships.' },
    { condition: true, tip: 'Personalize responses by using the customer\'s name when available.' },
  ];

  const tip = tips.find(t => t.condition)?.tip || tips[tips.length - 1].tip;
  panel.querySelector('.rr-tip-text').textContent = tip;
}

// ========== TEMPLATE LIBRARY ==========
function updateLibraryList(panel) {
  const category = panel.querySelector('.rr-library-category').value;
  const search = panel.querySelector('.rr-library-search').value.toLowerCase();
  const listEl = panel.querySelector('.rr-library-list');

  // Get templates from library
  let templates = filterTemplates(category, 'all');

  // Apply search filter
  if (search) {
    templates = templates.filter(t =>
      t.name.toLowerCase().includes(search) ||
      t.template.toLowerCase().includes(search)
    );
  }

  // Build list HTML
  if (templates.length === 0) {
    listEl.innerHTML = '<p class="rr-library-empty">No templates found. Try a different filter.</p>';
    return;
  }

  const categoryLabels = {
    restaurant: '🍴',
    hotel: '🏨',
    local_business: '🏪',
    generic: '📝'
  };

  const toneColors = {
    apologetic: '#ef4444',
    friendly: '#10b981',
    professional: '#667eea',
    formal: '#6b7280'
  };

  listEl.innerHTML = templates.map(t => `
    <div class="rr-library-item" data-template-id="${t.id}">
      <div class="rr-library-item-header">
        <span class="rr-library-category-badge">${categoryLabels[t.category] || '📝'}</span>
        <span class="rr-library-name">${t.name}</span>
        <span class="rr-library-tone" style="background: ${toneColors[t.tone] || '#667eea'}">${t.tone}</span>
      </div>
      <div class="rr-library-preview">${t.template.substring(0, 100)}${t.template.length > 100 ? '...' : ''}</div>
      <button class="rr-library-use-btn" data-id="${t.id}">Use This Template</button>
    </div>
  `).join('');

  // Add click handlers
  listEl.querySelectorAll('.rr-library-use-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const templateId = btn.dataset.id;
      const template = templates.find(t => t.id === templateId);
      if (template) {
        useLibraryTemplate(panel, template);
      }
    });
  });
}

function useLibraryTemplate(panel, template) {
  // Put template in textarea
  panel.querySelector('.rr-response-textarea').value = template.template;
  panel.querySelector('.rr-response-section').classList.remove('hidden');
  panel.querySelector('.rr-variations-tabs').classList.add('hidden');

  // Set tone (both slider and dropdown)
  setTone(panel, template.tone);

  // Update character counter
  updateCharCounter(panel);

  // Close overlay
  panel.querySelector('.rr-templates-overlay').classList.add('hidden');

  showToast(`📚 Template "${template.name}" loaded`, 'success');
}

// ========== TONE SLIDER ==========
const TONES = [
  { value: 'apologetic', emoji: '🙏', name: 'Apologetic' },
  { value: 'formal', emoji: '🎩', name: 'Formal' },
  { value: 'professional', emoji: '💼', name: 'Professional' },
  { value: 'friendly', emoji: '😊', name: 'Friendly' }
];

// Tone Preview Snippets - shown on hover
const TONE_PREVIEWS = {
  apologetic: {
    preview: "We sincerely apologize for any inconvenience. Your feedback is invaluable, and we're committed to making things right...",
    bestFor: "Negative reviews, complaints, service issues"
  },
  formal: {
    preview: "Thank you for taking the time to share your experience. We appreciate your feedback and will take it into consideration...",
    bestFor: "Corporate responses, official replies, legal-sensitive"
  },
  professional: {
    preview: "Thank you for your feedback. We're glad to hear about your experience and value your input as we continue to improve...",
    bestFor: "Most reviews, balanced approach, everyday use"
  },
  friendly: {
    preview: "Thanks so much for the kind words! We're thrilled you had a great experience. Can't wait to see you again soon!",
    bestFor: "Positive reviews, casual businesses, building rapport"
  }
};

function showTonePreview(panel, toneValue) {
  const preview = TONE_PREVIEWS[toneValue];
  if (!preview) return;

  let previewEl = panel.querySelector('.rr-tone-preview-popup');
  if (!previewEl) {
    previewEl = document.createElement('div');
    previewEl.className = 'rr-tone-preview-popup';
    panel.querySelector('.rr-tone-slider-container').appendChild(previewEl);
  }

  previewEl.innerHTML = `
    <div class="rr-preview-text">"${preview.preview}"</div>
    <div class="rr-preview-best">✓ Best for: ${preview.bestFor}</div>
  `;
  previewEl.classList.add('visible');
}

function hideTonePreview(panel) {
  const previewEl = panel.querySelector('.rr-tone-preview-popup');
  if (previewEl) {
    previewEl.classList.remove('visible');
  }
}

function updateToneSliderUI(panel, index) {
  const tone = TONES[index];
  panel.querySelector('.rr-tone-emoji').textContent = tone.emoji;
  panel.querySelector('.rr-tone-name').textContent = tone.name;
  panel.querySelector('.rr-tone-select').value = tone.value;
}

function setTone(panel, toneValue) {
  const index = TONES.findIndex(t => t.value === toneValue);
  if (index >= 0) {
    panel.querySelector('.rr-tone-slider').value = index;
    updateToneSliderUI(panel, index);
  }
}

function getToneFromSlider(sliderValue) {
  return TONES[parseInt(sliderValue)] || TONES[2];
}

// ========== MULTI-ACCOUNT SUPPORT ==========
const MAX_ACCOUNTS = 5;

async function loadAccounts() {
  try {
    const data = await chrome.storage.local.get(['rr_accounts', 'rr_active_account']);
    const accounts = data.rr_accounts || [];
    const activeId = data.rr_active_account || null;
    return { accounts, activeId };
  } catch (e) {
    return { accounts: [], activeId: null };
  }
}

async function saveAccounts(accounts, activeId) {
  await chrome.storage.local.set({ rr_accounts: accounts, rr_active_account: activeId });
}

async function getActiveAccount() {
  const { accounts, activeId } = await loadAccounts();
  return accounts.find(a => a.id === activeId) || accounts[0] || null;
}

async function addAccount(name, businessName) {
  const { accounts, activeId } = await loadAccounts();
  if (accounts.length >= MAX_ACCOUNTS) {
    return { success: false, error: 'Maximum accounts reached' };
  }

  const newAccount = {
    id: 'acc_' + Date.now(),
    name,
    businessName,
    createdAt: new Date().toISOString()
  };

  accounts.push(newAccount);
  await saveAccounts(accounts, newAccount.id);
  return { success: true, account: newAccount };
}

async function switchAccount(accountId) {
  const { accounts } = await loadAccounts();
  const account = accounts.find(a => a.id === accountId);
  if (account) {
    await saveAccounts(accounts, accountId);
    return { success: true, account };
  }
  return { success: false };
}

async function deleteAccount(accountId) {
  let { accounts, activeId } = await loadAccounts();
  accounts = accounts.filter(a => a.id !== accountId);

  // If deleted active account, switch to first remaining
  if (activeId === accountId) {
    activeId = accounts[0]?.id || null;
  }

  await saveAccounts(accounts, activeId);
  return { success: true };
}

function updateAccountSwitcher(panel, accounts, activeAccount) {
  const switcher = panel.querySelector('.rr-account-current');
  const dropdown = panel.querySelector('.rr-account-list');

  if (!switcher) return;

  if (activeAccount) {
    switcher.innerHTML = `<span class="rr-account-icon">🏪</span><span class="rr-account-name">${activeAccount.name}</span><span class="rr-account-arrow">▼</span>`;
  } else {
    switcher.innerHTML = `<span class="rr-account-icon">👤</span><span class="rr-account-name">Default</span><span class="rr-account-arrow">▼</span>`;
  }

  // Build dropdown
  let dropdownHTML = '';
  accounts.forEach(acc => {
    const isActive = activeAccount && acc.id === activeAccount.id;
    dropdownHTML += `
      <button class="rr-account-option ${isActive ? 'active' : ''}" data-account-id="${acc.id}">
        <span class="rr-acc-icon">🏪</span>
        <span class="rr-acc-name">${acc.name}</span>
        ${isActive ? '<span class="rr-acc-check">✓</span>' : ''}
      </button>
    `;
  });

  dropdownHTML += `
    <button class="rr-account-add">
      <span class="rr-acc-icon">➕</span>
      <span class="rr-acc-name">Add Account</span>
    </button>
  `;

  dropdown.innerHTML = dropdownHTML;

  // Add click handlers
  dropdown.querySelectorAll('.rr-account-option').forEach(btn => {
    btn.addEventListener('click', async () => {
      const accountId = btn.dataset.accountId;
      const result = await switchAccount(accountId);
      if (result.success) {
        showToast(`Switched to ${result.account.name}`, 'success');
        const { accounts } = await loadAccounts();
        updateAccountSwitcher(panel, accounts, result.account);
        dropdown.classList.add('hidden');
      }
    });
  });

  dropdown.querySelector('.rr-account-add')?.addEventListener('click', () => {
    dropdown.classList.add('hidden');
    panel.querySelector('.rr-add-account-modal').classList.remove('hidden');
  });
}

// ========== CHARACTER COUNTER ==========
// Platform-specific character limits
const PLATFORM_CHAR_LIMITS = {
  Google: { limit: 4096, name: 'Google Maps' },
  Yelp: { limit: 5000, name: 'Yelp' },
  TripAdvisor: { limit: 10000, name: 'TripAdvisor' },
  Facebook: { limit: 8000, name: 'Facebook' },
  Booking: { limit: 2000, name: 'Booking.com' },
  Trustpilot: { limit: 3000, name: 'Trustpilot' },
  default: { limit: 4000, name: 'Default' }
};

function getCharLimitForPlatform(panel) {
  const platformBadge = panel.querySelector('.rr-platform-badge');
  if (!platformBadge) return PLATFORM_CHAR_LIMITS.default;

  const platformText = platformBadge.textContent || '';
  for (const [key, value] of Object.entries(PLATFORM_CHAR_LIMITS)) {
    if (platformText.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  return PLATFORM_CHAR_LIMITS.default;
}

function updateCharCounter(panel) {
  const textarea = panel.querySelector('.rr-response-textarea');
  const charCount = panel.querySelector('.rr-char-count');
  const charLimit = panel.querySelector('.rr-char-limit');
  const charCounter = panel.querySelector('.rr-char-counter');

  if (!textarea || !charCount) return;

  const count = textarea.value.length;
  const platformLimit = getCharLimitForPlatform(panel);
  const limit = platformLimit.limit;

  charCount.textContent = count;
  if (charLimit) charLimit.textContent = limit;

  // Remove existing warning bar
  const existingWarning = panel.querySelector('.rr-limit-warning');
  if (existingWarning) existingWarning.remove();

  // Update counter color and show warning
  charCount.classList.remove('rr-warning', 'rr-danger');
  if (charCounter) charCounter.classList.remove('rr-limit-warning-active', 'rr-limit-danger-active');

  if (count > limit) {
    // Over limit - show danger
    charCount.classList.add('rr-danger');
    if (charCounter) charCounter.classList.add('rr-limit-danger-active');
    showLimitWarning(panel, 'danger', count - limit, platformLimit.name);
  } else if (count > limit * 0.9) {
    // 90%+ - show warning
    charCount.classList.add('rr-warning');
    if (charCounter) charCounter.classList.add('rr-limit-warning-active');
    showLimitWarning(panel, 'warning', limit - count, platformLimit.name);
  } else if (count > limit * 0.8) {
    // 80%+ - just color
    charCount.classList.add('rr-warning');
  }
}

function showLimitWarning(panel, type, chars, platformName) {
  const existingWarning = panel.querySelector('.rr-limit-warning');
  if (existingWarning) existingWarning.remove();

  const warning = document.createElement('div');
  warning.className = `rr-limit-warning rr-limit-${type}`;

  if (type === 'danger') {
    warning.innerHTML = `
      <span class="rr-limit-icon">⚠️</span>
      <span class="rr-limit-text">${chars} characters over ${platformName} limit! Response may be cut off.</span>
    `;
  } else {
    warning.innerHTML = `
      <span class="rr-limit-icon">📏</span>
      <span class="rr-limit-text">${chars} characters left for ${platformName}. Consider shortening.</span>
    `;
  }

  // Insert before action buttons
  const actionButtons = panel.querySelector('.rr-action-buttons');
  if (actionButtons) {
    actionButtons.before(warning);
  }
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

// ========== BUSINESS CONTEXT DETECTION ==========
function detectBusinessContext() {
  const hostname = window.location.hostname;
  let businessName = '';

  // Google Maps - Get business name from title or header
  if (hostname.includes('google.com')) {
    // Try to get from page title (format: "Business Name - Google Maps")
    const title = document.title;
    if (title && !title.startsWith('Google Maps')) {
      const match = title.match(/^(.+?)(?:\s*-\s*Google Maps)?$/);
      if (match && match[1]) {
        businessName = match[1].trim();
      }
    }

    // Also try h1 or main business name selector
    if (!businessName) {
      const h1 = document.querySelector('h1.fontHeadlineLarge, h1.DUwDvf');
      if (h1) businessName = h1.textContent.trim();
    }
  }

  // Yelp
  if (hostname.includes('yelp.com')) {
    const h1 = document.querySelector('h1[class*="heading"]');
    if (h1) businessName = h1.textContent.trim();
  }

  // TripAdvisor
  if (hostname.includes('tripadvisor.com')) {
    const h1 = document.querySelector('h1[data-automation="mainH1"]');
    if (h1) businessName = h1.textContent.trim();
  }

  // Facebook
  if (hostname.includes('facebook.com')) {
    const h1 = document.querySelector('h1[data-testid="entity-title"]');
    if (h1) businessName = h1.textContent.trim();
  }

  // Trustpilot
  if (hostname.includes('trustpilot.com')) {
    const h1 = document.querySelector('h1[class*="typography"]');
    if (h1) businessName = h1.textContent.trim();
  }

  // Clean up the business name
  if (businessName) {
    businessName = businessName
      .replace(/\s+/g, ' ')
      .replace(/^\"|\"$/g, '')
      .trim();

    // Don't use if it's too long or looks like a generic title
    if (businessName.length > 50 || businessName.includes('Search results')) {
      businessName = '';
    }
  }

  return businessName;
}

// Save detected business to storage for reuse
async function saveDetectedBusiness(name) {
  if (!name) return;
  try {
    await chrome.storage.local.set({ rr_detected_business: name });
  } catch (e) {}
}

// Get cached business name
async function getCachedBusinessName() {
  try {
    const stored = await chrome.storage.local.get(['rr_detected_business']);
    return stored.rr_detected_business || '';
  } catch (e) {
    return '';
  }
}

// ========== SMART REPLY CHIPS ==========
function getSmartReplyChips(sentiment) {
  if (sentiment === 'positive') {
    return [
      { id: 'thank_invite', label: '🙏 Thank & Invite', modifier: 'Thank the customer warmly and invite them to visit again. Mention you look forward to seeing them.' },
      { id: 'personal', label: '💬 Personal', modifier: 'Make the response very personal. Reference specific details from the review. Show genuine appreciation.' },
      { id: 'short', label: '⚡ Short', modifier: 'Keep the response very short and sweet - maximum 2 sentences. Be warm but concise.' }
    ];
  } else if (sentiment === 'negative') {
    return [
      { id: 'apologize_fix', label: '🙏 Apologize & Fix', modifier: 'Sincerely apologize for the issues. Explain what you will do to fix the problem. Show genuine concern.' },
      { id: 'offer_solution', label: '🎁 Offer Solution', modifier: 'Apologize and offer a concrete solution like a discount, refund, or free service. Include contact information.' },
      { id: 'request_details', label: '📞 Request Details', modifier: 'Apologize briefly and ask for more details to understand the situation better. Provide contact email/phone.' }
    ];
  } else {
    // Neutral
    return [
      { id: 'professional', label: '💼 Professional', modifier: 'Respond professionally. Acknowledge their feedback and express commitment to good service.' },
      { id: 'friendly', label: '😊 Friendly', modifier: 'Respond in a warm, friendly tone. Show appreciation and invite them back.' },
      { id: 'improve', label: '📈 Ask to Improve', modifier: 'Thank them and ask if there is anything you could do better to earn a higher rating.' }
    ];
  }
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

// ========== AUTO-TONE RECOMMENDATION (One-Shot Perfect Response) ==========
function getAutoToneRecommendation(sentiment, issues) {
  // Issue priority mapping for tone selection
  const issueToTone = {
    // Critical issues - always apologetic
    'hygiene': { tone: 'apologetic', priority: 10, reason: 'hygiene concerns' },
    'pests': { tone: 'apologetic', priority: 10, reason: 'pest issues reported' },
    'rude_staff': { tone: 'apologetic', priority: 9, reason: 'staff rudeness complaints' },

    // Service issues - apologetic
    'slow_service': { tone: 'apologetic', priority: 8, reason: 'slow service' },
    'ignored': { tone: 'apologetic', priority: 8, reason: 'customer felt ignored' },
    'wrong_order': { tone: 'apologetic', priority: 8, reason: 'order errors' },

    // Food issues - apologetic
    'cold_food': { tone: 'apologetic', priority: 7, reason: 'food temperature issues' },
    'undercooked': { tone: 'apologetic', priority: 7, reason: 'undercooked food' },
    'overcooked': { tone: 'apologetic', priority: 7, reason: 'overcooked food' },
    'tasteless': { tone: 'apologetic', priority: 6, reason: 'taste complaints' },
    'portion_size': { tone: 'apologetic', priority: 5, reason: 'portion size concerns' },

    // Cleanliness - apologetic
    'dirty': { tone: 'apologetic', priority: 7, reason: 'cleanliness issues' },

    // Price issues - professional (not apologetic, justify value)
    'overpriced': { tone: 'professional', priority: 4, reason: 'pricing concerns' },
    'hidden_fees': { tone: 'professional', priority: 4, reason: 'pricing transparency' },
  };

  let recommendation = {
    tone: 'professional',
    confidence: 'medium',
    reasons: [],
    emoji: '💼',
    label: 'Professional',
    shortReason: ''
  };

  // Find highest priority issue
  let highestPriority = 0;
  let primaryIssue = null;

  issues.forEach(issue => {
    const mapping = issueToTone[issue.issue];
    if (mapping && mapping.priority > highestPriority) {
      highestPriority = mapping.priority;
      primaryIssue = { ...mapping, label: issue.label };
    }
  });

  if (primaryIssue) {
    recommendation.tone = primaryIssue.tone;
    recommendation.reasons.push(primaryIssue.reason);
    recommendation.confidence = highestPriority >= 7 ? 'high' : 'medium';
    recommendation.shortReason = primaryIssue.reason;

    if (primaryIssue.tone === 'apologetic') {
      recommendation.emoji = '🙏';
      recommendation.label = 'Apologetic';
    }
  } else {
    // No specific issues - base on sentiment
    switch (sentiment) {
      case 'positive':
        recommendation.tone = 'friendly';
        recommendation.emoji = '😊';
        recommendation.label = 'Friendly';
        recommendation.shortReason = 'positive feedback';
        recommendation.confidence = 'high';
        break;
      case 'negative':
        recommendation.tone = 'apologetic';
        recommendation.emoji = '🙏';
        recommendation.label = 'Apologetic';
        recommendation.shortReason = 'negative experience';
        recommendation.confidence = 'medium';
        break;
      default:
        recommendation.tone = 'professional';
        recommendation.emoji = '💼';
        recommendation.label = 'Professional';
        recommendation.shortReason = 'neutral feedback';
        recommendation.confidence = 'medium';
    }
  }

  // Add additional context reasons
  if (issues.length > 1) {
    recommendation.reasons.push(`${issues.length} issues detected`);
  }

  return recommendation;
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

// ========== RESPONSE TEMPLATES ==========
const MAX_TEMPLATES = 10;

async function loadTemplates() {
  try {
    const stored = await chrome.storage.sync.get(['rr_templates']);
    return stored.rr_templates || [];
  } catch (e) {
    // Fallback to local storage if sync fails
    try {
      const local = await chrome.storage.local.get(['rr_templates']);
      return local.rr_templates || [];
    } catch (e2) {
      return [];
    }
  }
}

async function saveTemplates(templates) {
  try {
    // Limit to MAX_TEMPLATES
    const limited = templates.slice(0, MAX_TEMPLATES);
    await chrome.storage.sync.set({ rr_templates: limited });
    // Also save to local as backup
    await chrome.storage.local.set({ rr_templates: limited });
  } catch (e) {
    console.error('Failed to save templates:', e);
  }
}

async function addTemplate(name, content, tone = 'professional') {
  const templates = await loadTemplates();

  if (templates.length >= MAX_TEMPLATES) {
    return { success: false, error: `Maximum ${MAX_TEMPLATES} templates allowed` };
  }

  const newTemplate = {
    id: Date.now().toString(),
    name: name.trim().substring(0, 50),
    content: content.trim().substring(0, 1000),
    tone,
    createdAt: new Date().toISOString()
  };

  templates.unshift(newTemplate); // Add to beginning
  await saveTemplates(templates);
  return { success: true, template: newTemplate };
}

async function deleteTemplate(id) {
  const templates = await loadTemplates();
  const filtered = templates.filter(t => t.id !== id);
  await saveTemplates(filtered);
  return { success: true };
}

async function updateTemplate(id, updates) {
  const templates = await loadTemplates();
  const index = templates.findIndex(t => t.id === id);
  if (index === -1) return { success: false, error: 'Template not found' };

  templates[index] = { ...templates[index], ...updates };
  await saveTemplates(templates);
  return { success: true };
}

function populateTemplateDropdown(panel, templates) {
  const select = panel.querySelector('.rr-template-select');
  if (!select) return;

  // Clear existing options except the first one
  select.innerHTML = '<option value="">💾 Use a saved template...</option>';

  templates.forEach(t => {
    const option = document.createElement('option');
    option.value = t.id;
    option.textContent = `${t.name} (${t.tone})`;
    select.appendChild(option);
  });
}

function updateTemplatesOverlay(panel, templates) {
  const list = panel.querySelector('.rr-templates-list');
  const count = panel.querySelector('.rr-templates-count');
  const empty = panel.querySelector('.rr-templates-empty');

  if (!list) return;

  // Update count
  if (count) count.textContent = `${templates.length}/${MAX_TEMPLATES} templates`;

  // Show/hide empty message
  if (templates.length === 0) {
    if (empty) empty.style.display = 'block';
    list.querySelectorAll('.rr-template-item').forEach(el => el.remove());
    return;
  }

  if (empty) empty.style.display = 'none';

  // Clear existing items
  list.querySelectorAll('.rr-template-item').forEach(el => el.remove());

  // Add template items
  templates.forEach(t => {
    const item = document.createElement('div');
    item.className = 'rr-template-item';
    item.dataset.id = t.id;
    item.innerHTML = `
      <div class="rr-template-info">
        <span class="rr-template-name">${escapeHtml(t.name)}</span>
        <span class="rr-template-tone">${t.tone}</span>
      </div>
      <div class="rr-template-preview">${escapeHtml(t.content.substring(0, 60))}...</div>
      <div class="rr-template-actions">
        <button class="rr-template-use" title="Use this template">Use</button>
        <button class="rr-template-delete" title="Delete">🗑️</button>
      </div>
    `;
    list.appendChild(item);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========== DRAFTS (Auto-Save) ==========
const MAX_DRAFTS = 10;

async function loadDrafts() {
  try {
    const stored = await chrome.storage.local.get(['rr_drafts']);
    return stored.rr_drafts || [];
  } catch (e) {
    return [];
  }
}

async function saveDrafts(drafts) {
  try {
    const limited = drafts.slice(0, MAX_DRAFTS);
    await chrome.storage.local.set({ rr_drafts: limited });
  } catch (e) {
    console.error('Failed to save drafts:', e);
  }
}

async function saveDraft(reviewText, responseText, platform, url) {
  if (!reviewText || !responseText) return { success: false };

  const drafts = await loadDrafts();
  const reviewKey = reviewText.substring(0, 100);
  const existingIndex = drafts.findIndex(d => d.reviewText.substring(0, 100) === reviewKey);

  const newDraft = {
    id: Date.now().toString(),
    reviewText: reviewText.substring(0, 500),
    responseText: responseText.substring(0, 1000),
    platform: platform || 'Unknown',
    url: url || window.location.href,
    createdAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    drafts[existingIndex] = newDraft;
  } else {
    drafts.unshift(newDraft);
  }

  await saveDrafts(drafts);
  return { success: true, draft: newDraft };
}

async function deleteDraft(id) {
  const drafts = await loadDrafts();
  const filtered = drafts.filter(d => d.id !== id);
  await saveDrafts(filtered);
  return { success: true };
}

function formatDraftTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function updateDraftsButton(panel, drafts) {
  const btn = panel.querySelector('.rr-drafts-btn');
  if (!btn) return;

  if (drafts.length > 0) {
    btn.innerHTML = `📝 <span class="rr-drafts-count">${drafts.length}</span>`;
    btn.title = `${drafts.length} saved draft(s)`;
  } else {
    btn.innerHTML = '📝';
    btn.title = 'No drafts';
  }
}

function updateDraftsOverlay(panel, drafts) {
  const list = panel.querySelector('.rr-drafts-list');
  const empty = panel.querySelector('.rr-drafts-empty');

  if (!list) return;

  if (drafts.length === 0) {
    if (empty) empty.style.display = 'block';
    list.querySelectorAll('.rr-draft-item').forEach(el => el.remove());
    return;
  }

  if (empty) empty.style.display = 'none';
  list.querySelectorAll('.rr-draft-item').forEach(el => el.remove());

  drafts.forEach(d => {
    const item = document.createElement('div');
    item.className = 'rr-draft-item';
    item.dataset.id = d.id;
    item.innerHTML = `
      <div class="rr-draft-header">
        <span class="rr-draft-platform">${d.platform}</span>
        <span class="rr-draft-time">${formatDraftTime(d.createdAt)}</span>
      </div>
      <div class="rr-draft-review">"${escapeHtml(d.reviewText.substring(0, 60))}..."</div>
      <div class="rr-draft-response">${escapeHtml(d.responseText.substring(0, 80))}...</div>
      <div class="rr-draft-actions">
        <button class="rr-draft-continue">Continue</button>
        <button class="rr-draft-delete">🗑️</button>
      </div>
    `;
    list.appendChild(item);
  });
}

// ========== RESPONSE HISTORY ==========
async function loadHistory() {
  try {
    const stored = await chrome.storage.local.get(['token']);
    if (!stored.token) return { success: false, history: [] };

    const response = await fetch(`${API_URL}/responses/history?limit=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stored.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return { success: false, history: [] };
    }

    const data = await response.json();
    return { success: true, history: data.responses || [] };
  } catch (e) {
    console.error('Failed to load history:', e);
    return { success: false, history: [] };
  }
}

function formatHistoryTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function updateHistoryOverlay(panel, history) {
  const list = panel.querySelector('.rr-history-list');
  if (!list) return;

  // Clear existing items
  list.innerHTML = '';

  if (history.length === 0) {
    list.innerHTML = `
      <div class="rr-history-empty">
        <span>📭 No responses yet</span>
        <p>Generate your first response to see it here!</p>
      </div>
    `;
    return;
  }

  history.forEach(item => {
    const historyItem = document.createElement('div');
    historyItem.className = 'rr-history-item';
    historyItem.dataset.id = item.id;

    // Truncate text for display
    const reviewSnippet = item.review_text ? item.review_text.substring(0, 80) + '...' : 'No review text';
    const responseSnippet = item.response ? item.response.substring(0, 100) + '...' : '';

    // Get tone badge color
    const toneColors = {
      professional: '#667eea',
      friendly: '#10b981',
      formal: '#6b7280',
      apologetic: '#f59e0b'
    };
    const toneColor = toneColors[item.tone] || '#667eea';

    historyItem.innerHTML = `
      <div class="rr-history-meta">
        <span class="rr-history-tone" style="background: ${toneColor}">${item.tone || 'professional'}</span>
        <span class="rr-history-time">${formatHistoryTime(item.created_at)}</span>
      </div>
      <div class="rr-history-review">"${escapeHtml(reviewSnippet)}"</div>
      <div class="rr-history-response">${escapeHtml(responseSnippet)}</div>
      <div class="rr-history-actions">
        <button class="rr-history-use" data-response="${escapeHtml(item.response || '')}">📋 Use This</button>
        <button class="rr-history-copy" data-response="${escapeHtml(item.response || '')}">Copy</button>
      </div>
    `;
    list.appendChild(historyItem);
  });
}

// ========== CREATE KILLER PANEL ==========
async function createResponsePanel() {
  const existing = document.getElementById('rr-response-panel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.id = 'rr-response-panel';

  const platform = detectPlatform();
  const isGoogleMaps = platform.name === 'Google';
  const supportedPlatforms = ['Google', 'Yelp', 'TripAdvisor', 'Facebook', 'Booking', 'Trustpilot'];
  const isPasteSupported = supportedPlatforms.includes(platform.name);

  panel.innerHTML = `
    <div class="rr-panel-header">
      <div class="rr-header-left">
        <span class="rr-logo">⚡ ReviewResponder</span>
        <span class="rr-platform-badge" style="background: ${platform.color}">${platform.icon} ${platform.name}</span>
      </div>
      <div class="rr-header-right">
        <!-- Account Switcher -->
        <div class="rr-account-switcher">
          <button class="rr-account-current" title="Switch account">
            <span class="rr-account-icon">👤</span>
            <span class="rr-account-name">Default</span>
            <span class="rr-account-arrow">▼</span>
          </button>
          <div class="rr-account-list hidden">
            <!-- Accounts populated dynamically -->
          </div>
        </div>
        <button class="rr-drafts-btn" title="Drafts">📝</button>
        <button class="rr-templates-btn" title="My Templates">💾</button>
        <button class="rr-history-btn" title="Recent Responses">📜</button>
        <button class="rr-batch-btn" title="Batch Mode - Respond to all reviews">📋 <span class="rr-batch-count">0</span></button>
        <div class="rr-theme-wrapper" style="position: relative;">
          <button class="rr-theme-toggle" title="Toggle theme">🌙</button>
          <div class="rr-theme-dropdown hidden">
            <button class="rr-theme-option" data-theme="light"><span>☀️</span><span>Light</span></button>
            <button class="rr-theme-option" data-theme="dark"><span>🌙</span><span>Dark</span></button>
            <button class="rr-theme-option" data-theme="auto"><span>💻</span><span>Auto (OS)</span></button>
          </div>
        </div>
        <button class="rr-help-btn" title="How to use">?</button>
        <button class="rr-close-btn" title="Close (Esc)">×</button>
      </div>
    </div>

    <!-- Analytics Widget (collapsible) -->
    <div class="rr-analytics-widget">
      <div class="rr-analytics-header">
        <span class="rr-analytics-title">📊 Your Stats</span>
        <span class="rr-analytics-toggle">▼</span>
      </div>
      <div class="rr-analytics-body">
        <div class="rr-stat-item">
          <span class="rr-stat-value rr-stat-week">0</span>
          <span class="rr-stat-label">This Week</span>
        </div>
        <div class="rr-stat-item">
          <span class="rr-stat-value rr-stat-total">0</span>
          <span class="rr-stat-label">All Time</span>
        </div>
        <div class="rr-stat-item rr-stat-chart">
          <div class="rr-sparkline"></div>
          <span class="rr-stat-label">Last 7 Days</span>
        </div>
      </div>
    </div>

    <!-- Review Insights Widget (collapsible) -->
    <div class="rr-insights-widget collapsed">
      <div class="rr-insights-header">
        <span class="rr-insights-title">💡 Insights</span>
        <span class="rr-insights-toggle">▶</span>
      </div>
      <div class="rr-insights-body">
        <div class="rr-insights-section">
          <div class="rr-insights-label">Top Issues This Month</div>
          <div class="rr-top-issues">
            <div class="rr-top-issue-item"><span class="rr-issue-emoji">⏰</span> Slow service <span class="rr-issue-freq">5x</span></div>
            <div class="rr-top-issue-item"><span class="rr-issue-emoji">🥶</span> Cold food <span class="rr-issue-freq">3x</span></div>
            <div class="rr-top-issue-item"><span class="rr-issue-emoji">💰</span> Pricing <span class="rr-issue-freq">2x</span></div>
          </div>
        </div>
        <div class="rr-insights-section">
          <div class="rr-insights-label">Sentiment Distribution</div>
          <div class="rr-sentiment-bars">
            <div class="rr-sentiment-bar">
              <span class="rr-sent-label">😊</span>
              <div class="rr-sent-fill rr-sent-positive" style="width: 60%"></div>
              <span class="rr-sent-pct">60%</span>
            </div>
            <div class="rr-sentiment-bar">
              <span class="rr-sent-label">😐</span>
              <div class="rr-sent-fill rr-sent-neutral" style="width: 25%"></div>
              <span class="rr-sent-pct">25%</span>
            </div>
            <div class="rr-sentiment-bar">
              <span class="rr-sent-label">😞</span>
              <div class="rr-sent-fill rr-sent-negative" style="width: 15%"></div>
              <span class="rr-sent-pct">15%</span>
            </div>
          </div>
        </div>
        <div class="rr-insights-tip">
          <strong>💡 Tip:</strong> <span class="rr-tip-text">Use apologetic tone for negative reviews to show empathy.</span>
        </div>
      </div>
    </div>

    <div class="rr-panel-body">
      <!-- Review Section -->
      <div class="rr-review-box">
        <div class="rr-review-text"></div>
      </div>

      <!-- Issue Resolution UI (shown when issues detected) -->
      <div class="rr-issue-resolution hidden">
        <div class="rr-issue-header">
          <span class="rr-issue-icon">🔧</span>
          <span class="rr-issue-title">Issues Detected</span>
          <span class="rr-issue-count"></span>
        </div>
        <div class="rr-issue-list">
          <!-- Issues dynamically inserted -->
        </div>
        <div class="rr-compensation-note hidden">
          <span>💡 Selected compensations will be included in your response</span>
        </div>
      </div>

      <!-- AI Tone Recommendation (One-Shot Perfect Response) -->
      <div class="rr-ai-recommendation hidden">
        <div class="rr-ai-rec-header">
          <span class="rr-ai-rec-icon">🎯</span>
          <span class="rr-ai-rec-title">AI Recommendation</span>
          <span class="rr-ai-rec-confidence"></span>
        </div>
        <div class="rr-ai-rec-body">
          <div class="rr-ai-rec-tone">
            <span class="rr-ai-rec-emoji"></span>
            <span class="rr-ai-rec-label"></span>
          </div>
          <div class="rr-ai-rec-reason"></div>
        </div>
        <div class="rr-ai-rec-actions">
          <button class="rr-ai-rec-use">⚡ Generate with this</button>
          <button class="rr-ai-rec-other">Choose other</button>
        </div>
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

      <!-- Smart Reply Chips (Gmail-Style) -->
      <div class="rr-smart-replies">
        <span class="rr-smart-label">Quick replies:</span>
        <div class="rr-smart-chips">
          <!-- Chips are dynamically inserted based on sentiment -->
        </div>
      </div>

      <!-- Templates Quick Select -->
      <div class="rr-templates-row">
        <select class="rr-template-select">
          <option value="">💾 Use a saved template...</option>
        </select>
      </div>

      <!-- Tone Slider -->
      <div class="rr-tone-slider-container">
        <div class="rr-tone-slider-labels">
          <span class="rr-tone-label-left">🙏 Apologetic</span>
          <span class="rr-tone-label-right">😊 Friendly</span>
        </div>
        <input type="range" class="rr-tone-slider" min="0" max="3" step="1" value="1">
        <div class="rr-tone-current">
          <span class="rr-tone-emoji">💼</span>
          <span class="rr-tone-name">Professional</span>
        </div>
      </div>

      <!-- Simple Options Row (dropdown hidden, used for compatibility) -->
      <div class="rr-options-row">
        <div class="rr-option" style="display: none;">
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

      <!-- Generate Buttons -->
      <div class="rr-generate-buttons">
        <button class="rr-generate-btn">
          <span class="rr-btn-text">✨ Generate Response</span>
          <span class="rr-btn-loading hidden">
            <span class="rr-spinner"></span>
            Generating...
          </span>
        </button>
        <button class="rr-variations-btn" title="Generate 3 different options (uses 3 credits)">
          <span class="rr-var-text">🎯 3 Options</span>
          <span class="rr-var-loading hidden">
            <span class="rr-spinner"></span>
          </span>
        </button>
      </div>

      <!-- Response Section (hidden until generated) -->
      <div class="rr-response-section hidden">
        <!-- Variations Tabs (hidden if single response) -->
        <div class="rr-variations-tabs hidden">
          <button class="rr-var-tab active" data-var="0">
            <span class="rr-var-label">A</span>
            <span class="rr-var-style">Concise</span>
          </button>
          <button class="rr-var-tab" data-var="1">
            <span class="rr-var-label">B</span>
            <span class="rr-var-style">Detailed</span>
          </button>
          <button class="rr-var-tab" data-var="2">
            <span class="rr-var-label">C</span>
            <span class="rr-var-style">Actionable</span>
          </button>
        </div>

        <!-- Inline Editor Toolbar -->
        <div class="rr-editor-toolbar">
          <div class="rr-editor-group">
            <button class="rr-editor-btn" data-action="bold" title="Bold text">
              <strong>B</strong>
            </button>
            <button class="rr-editor-btn" data-action="italic" title="Italic text">
              <em>I</em>
            </button>
            <button class="rr-editor-btn" data-action="bullet" title="Add bullet point">
              •
            </button>
          </div>
          <div class="rr-editor-divider"></div>
          <div class="rr-emoji-picker">
            <button class="rr-emoji-btn" title="Insert emoji">😊</button>
            <div class="rr-emoji-dropdown hidden">
              <button class="rr-emoji-option" data-emoji="😊">😊</button>
              <button class="rr-emoji-option" data-emoji="🙏">🙏</button>
              <button class="rr-emoji-option" data-emoji="⭐">⭐</button>
              <button class="rr-emoji-option" data-emoji="👍">👍</button>
              <button class="rr-emoji-option" data-emoji="❤️">❤️</button>
              <button class="rr-emoji-option" data-emoji="🎉">🎉</button>
              <button class="rr-emoji-option" data-emoji="💪">💪</button>
              <button class="rr-emoji-option" data-emoji="✨">✨</button>
            </div>
          </div>
          <div class="rr-editor-divider"></div>
          <div class="rr-editor-group">
            <button class="rr-editor-btn rr-auto-shorten" data-action="auto-shorten" title="Auto-shorten for platform">
              📏 Fit
            </button>
          </div>
          <div class="rr-platform-limit-indicator">
            <span class="rr-limit-icon">📝</span>
            <span class="rr-limit-text">4000</span>
          </div>
        </div>

        <textarea class="rr-response-textarea" placeholder="Your response..."></textarea>

        <!-- Quality Score Badge (NEW) -->
        <div class="rr-quality-badge hidden">
          <span class="rr-quality-indicator"></span>
          <span class="rr-quality-label"></span>
          <span class="rr-quality-feedback"></span>
        </div>

        <!-- Character Counter -->
        <div class="rr-char-counter">
          <span class="rr-char-count">0</span>/<span class="rr-char-limit">4000</span> characters
          <button class="rr-undo-btn hidden" title="Undo last edit">↩️ Undo</button>
        </div>

        <div class="rr-action-buttons">
          <button class="rr-copy-btn">📋 Copy</button>
          <button class="rr-done-btn">✅ Copy & Done</button>
          ${isPasteSupported ? `
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

        <!-- Quick Edit Chips -->
        <div class="rr-quick-edits">
          <span class="rr-edit-label">Quick edit:</span>
          <div class="rr-edit-chips">
            <button class="rr-edit-chip" data-edit="shorter">📏 Shorter</button>
            <button class="rr-edit-chip" data-edit="longer">📝 Longer</button>
            <button class="rr-edit-chip" data-edit="emoji">😊 +Emoji</button>
            <button class="rr-edit-chip" data-edit="formal">🎩 Formal</button>
            <button class="rr-edit-chip" data-edit="casual">👋 Casual</button>
          </div>
        </div>

        <!-- Save as Template -->
        <div class="rr-save-template">
          <button class="rr-save-template-btn">💾 Save as Template</button>
        </div>
      </div>

      <!-- Keyboard Shortcuts Hint -->
      <div class="rr-shortcuts-hint">
        <kbd>Alt+R</kbd> generate · <kbd>Alt+C</kbd> copy · <kbd>?</kbd> help · <kbd>Esc</kbd> close
      </div>

      <!-- Keyboard Help Overlay -->
      <div class="rr-keyboard-help hidden">
        <div class="rr-keyboard-content">
          <h3>⌨️ Keyboard Shortcuts</h3>
          <div class="rr-shortcut-grid">
            <div class="rr-shortcut-item">
              <kbd>Alt</kbd> + <kbd>R</kbd>
              <span>Generate response</span>
            </div>
            <div class="rr-shortcut-item">
              <kbd>Alt</kbd> + <kbd>C</kbd>
              <span>Copy response</span>
            </div>
            <div class="rr-shortcut-item">
              <kbd>Alt</kbd> + <kbd>T</kbd>
              <span>Toggle Turbo mode</span>
            </div>
            <div class="rr-shortcut-item">
              <kbd>Alt</kbd> + <kbd>Q</kbd>
              <span>Batch mode</span>
            </div>
            <div class="rr-shortcut-item">
              <kbd>?</kbd>
              <span>Show this help</span>
            </div>
            <div class="rr-shortcut-item">
              <kbd>Esc</kbd>
              <span>Close panel</span>
            </div>
          </div>
          <button class="rr-keyboard-close">Got it!</button>
        </div>
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
          ${isPasteSupported ? `<p class="rr-help-tip">💡 On ${platform.name}: Use "Paste & Submit" to auto-fill!</p>` : ''}
          <button class="rr-help-close">Got it!</button>
        </div>
      </div>

      <!-- Templates Overlay -->
      <div class="rr-templates-overlay hidden">
        <div class="rr-templates-content">
          <div class="rr-templates-header">
            <h3>📋 Templates</h3>
            <button class="rr-templates-close">×</button>
          </div>

          <!-- Template Tabs -->
          <div class="rr-templates-tabs">
            <button class="rr-tpl-tab active" data-tab="my">💾 My Templates</button>
            <button class="rr-tpl-tab" data-tab="library">📚 Library (50+)</button>
          </div>

          <!-- My Templates Section -->
          <div class="rr-templates-section rr-my-templates-section">
            <div class="rr-templates-list">
              <p class="rr-templates-empty">No templates saved yet.<br>Generate a response and click "Save as Template"!</p>
            </div>
            <div class="rr-templates-footer">
              <span class="rr-templates-count">0/${MAX_TEMPLATES} templates</span>
            </div>
          </div>

          <!-- Library Section -->
          <div class="rr-templates-section rr-library-section hidden">
            <div class="rr-library-filters">
              <select class="rr-library-category">
                <option value="all">All Industries</option>
                <option value="restaurant">🍴 Restaurant</option>
                <option value="hotel">🏨 Hotel</option>
                <option value="local_business">🏪 Local Business</option>
                <option value="generic">📝 Generic</option>
              </select>
              <input type="text" class="rr-library-search" placeholder="Search templates...">
            </div>
            <div class="rr-library-list">
              <!-- Library templates will be populated dynamically -->
            </div>
          </div>
        </div>
      </div>

      <!-- Save Template Modal -->
      <div class="rr-save-modal hidden">
        <div class="rr-save-modal-content">
          <h3>💾 Save as Template</h3>
          <input type="text" class="rr-template-name-input" placeholder="Template name (e.g., 'Thank You')">
          <div class="rr-save-modal-buttons">
            <button class="rr-save-modal-cancel">Cancel</button>
            <button class="rr-save-modal-confirm">Save</button>
          </div>
        </div>
      </div>

      <!-- Add Account Modal -->
      <div class="rr-add-account-modal hidden">
        <div class="rr-add-account-content">
          <h3>🏪 Add Business Account</h3>
          <input type="text" class="rr-account-name-input" placeholder="Account name (e.g., 'My Restaurant')">
          <input type="text" class="rr-account-business-input" placeholder="Business name for responses">
          <div class="rr-add-account-buttons">
            <button class="rr-add-account-cancel">Cancel</button>
            <button class="rr-add-account-confirm">Add Account</button>
          </div>
        </div>
      </div>

      <!-- Drafts Overlay -->
      <div class="rr-drafts-overlay hidden">
        <div class="rr-drafts-content">
          <div class="rr-drafts-header">
            <h3>📝 Saved Drafts</h3>
            <button class="rr-drafts-close">×</button>
          </div>
          <div class="rr-drafts-list">
            <p class="rr-drafts-empty">No drafts yet.<br>Drafts are auto-saved when you close the panel.</p>
          </div>
        </div>
      </div>

      <!-- History Overlay -->
      <div class="rr-history-overlay hidden">
        <div class="rr-history-content">
          <div class="rr-history-header">
            <h3>📜 Recent Responses</h3>
            <button class="rr-history-close">×</button>
          </div>
          <div class="rr-history-list">
            <div class="rr-history-loading">Loading...</div>
          </div>
        </div>
      </div>

      <!-- Batch Mode Overlay -->
      <div class="rr-batch-overlay hidden">
        <div class="rr-batch-content">
          <div class="rr-batch-header">
            <h3>📋 Batch Mode</h3>
            <button class="rr-batch-close">×</button>
          </div>

          <!-- Batch Status -->
          <div class="rr-batch-status">
            <div class="rr-batch-found">
              <span class="rr-batch-found-count">0</span> reviews found on this page
            </div>
          </div>

          <!-- Batch Actions (before generation) -->
          <div class="rr-batch-actions-start">
            <div class="rr-batch-tone-select">
              <label>Default tone for all:</label>
              <select class="rr-batch-tone">
                <option value="auto">🤖 Auto (AI decides)</option>
                <option value="professional">💼 Professional</option>
                <option value="friendly">😊 Friendly</option>
                <option value="formal">🎩 Formal</option>
                <option value="apologetic">🙏 Apologetic</option>
              </select>
            </div>
            <button class="rr-batch-generate-all">
              <span class="rr-batch-gen-text">✨ Generate All Responses</span>
              <span class="rr-batch-gen-loading hidden">
                <span class="rr-spinner"></span>
                <span class="rr-batch-progress-text">0/0</span>
              </span>
            </button>
          </div>

          <!-- Batch Progress Bar -->
          <div class="rr-batch-progress-bar hidden">
            <div class="rr-batch-progress-fill"></div>
          </div>

          <!-- Batch Results (after generation) -->
          <div class="rr-batch-results hidden">
            <div class="rr-batch-tabs">
              <!-- Tabs populated dynamically -->
            </div>
            <div class="rr-batch-result-content">
              <div class="rr-batch-review-preview"></div>
              <textarea class="rr-batch-response-textarea" placeholder="Response..."></textarea>
              <div class="rr-batch-quality"></div>
            </div>
            <div class="rr-batch-result-actions">
              <button class="rr-batch-copy-one">📋 Copy This</button>
              <button class="rr-batch-regenerate">🔄 Regenerate</button>
              <button class="rr-batch-copy-all">📋 Copy All</button>
              <button class="rr-batch-export">📥 Export CSV</button>
            </div>
          </div>

          <!-- Empty State -->
          <div class="rr-batch-empty">
            <span>📭 No reviews found</span>
            <p>Navigate to a page with customer reviews to use batch mode.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(panel);
  initPanelEvents(panel);

  // Load saved settings
  loadSettings().then(settings => {
    const tone = settings.tone || 'professional';
    setTone(panel, tone);
    panel.querySelector('.rr-length-select').value = settings.length || 'medium';
    panel.querySelector('.rr-emoji-toggle').checked = settings.emojis || false;
    panel.querySelector('.rr-autocopy-toggle').checked = settings.autoCopy !== false;
    panel.querySelector('.rr-turbo-toggle').checked = settings.turboMode || false;
    cachedSettings = settings;
  });

  // Load templates into dropdown
  loadTemplates().then(templates => {
    populateTemplateDropdown(panel, templates);
    updateTemplatesOverlay(panel, templates);
  });

  // Load drafts and update button
  loadDrafts().then(drafts => {
    updateDraftsButton(panel, drafts);
    updateDraftsOverlay(panel, drafts);
  });

  return panel;
}

// ========== PANEL EVENTS ==========
function initPanelEvents(panel) {
  // Close button
  panel.querySelector('.rr-close-btn').addEventListener('click', () => closePanel(panel));

  // Analytics Widget toggle
  panel.querySelector('.rr-analytics-header').addEventListener('click', () => {
    const widget = panel.querySelector('.rr-analytics-widget');
    widget.classList.toggle('collapsed');
    const toggle = panel.querySelector('.rr-analytics-toggle');
    toggle.textContent = widget.classList.contains('collapsed') ? '▶' : '▼';
  });

  // Load analytics on panel open
  updateAnalytics(panel);

  // Insights Widget toggle
  panel.querySelector('.rr-insights-header').addEventListener('click', () => {
    const widget = panel.querySelector('.rr-insights-widget');
    widget.classList.toggle('collapsed');
    const toggle = panel.querySelector('.rr-insights-toggle');
    toggle.textContent = widget.classList.contains('collapsed') ? '▶' : '▼';

    // Load insights when opening
    if (!widget.classList.contains('collapsed')) {
      updateInsightsWidget(panel);
    }
  });

  // Account Switcher
  panel.querySelector('.rr-account-current').addEventListener('click', () => {
    panel.querySelector('.rr-account-list').classList.toggle('hidden');
  });

  // Load accounts and update switcher
  loadAccounts().then(({ accounts, activeId }) => {
    const activeAccount = accounts.find(a => a.id === activeId) || accounts[0] || null;
    updateAccountSwitcher(panel, accounts, activeAccount);
  });

  // Add Account Modal
  panel.querySelector('.rr-add-account-cancel').addEventListener('click', () => {
    panel.querySelector('.rr-add-account-modal').classList.add('hidden');
  });

  panel.querySelector('.rr-add-account-confirm').addEventListener('click', async () => {
    const name = panel.querySelector('.rr-account-name-input').value.trim();
    const businessName = panel.querySelector('.rr-account-business-input').value.trim();

    if (!name) {
      showToast('Please enter an account name', 'error');
      return;
    }

    const result = await addAccount(name, businessName);
    if (result.success) {
      showToast(`Account "${name}" created!`, 'success');
      panel.querySelector('.rr-add-account-modal').classList.add('hidden');
      panel.querySelector('.rr-account-name-input').value = '';
      panel.querySelector('.rr-account-business-input').value = '';

      const { accounts, activeId } = await loadAccounts();
      const activeAccount = accounts.find(a => a.id === activeId);
      updateAccountSwitcher(panel, accounts, activeAccount);
    } else {
      showToast(result.error || 'Failed to add account', 'error');
    }
  });

  // Help button
  panel.querySelector('.rr-help-btn').addEventListener('click', () => {
    panel.querySelector('.rr-help-overlay').classList.toggle('hidden');
  });

  panel.querySelector('.rr-help-close').addEventListener('click', () => {
    panel.querySelector('.rr-help-overlay').classList.add('hidden');
  });

  // Keyboard Help close button
  panel.querySelector('.rr-keyboard-close').addEventListener('click', () => {
    panel.querySelector('.rr-keyboard-help').classList.add('hidden');
  });

  // Character Counter - update on input
  const textarea = panel.querySelector('.rr-response-textarea');
  const charCount = panel.querySelector('.rr-char-count');
  const CHAR_LIMIT = 4000; // Google Maps limit

  textarea.addEventListener('input', () => {
    updateCharCounter(panel);
  });

  // Undo button - restore previous response
  panel.querySelector('.rr-undo-btn').addEventListener('click', () => {
    const previousResponse = panel.dataset.previousResponse;
    if (previousResponse) {
      panel.querySelector('.rr-response-textarea').value = previousResponse;
      panel.querySelector('.rr-undo-btn').classList.add('hidden');
      panel.dataset.previousResponse = '';
      updateCharCounter(panel);
      showToast('↩️ Undo successful', 'success');
    }
  });

  // Drafts button (header)
  panel.querySelector('.rr-drafts-btn').addEventListener('click', async () => {
    const drafts = await loadDrafts();
    updateDraftsOverlay(panel, drafts);
    panel.querySelector('.rr-drafts-overlay').classList.toggle('hidden');
  });

  panel.querySelector('.rr-drafts-close').addEventListener('click', () => {
    panel.querySelector('.rr-drafts-overlay').classList.add('hidden');
  });

  // History button (header)
  panel.querySelector('.rr-history-btn').addEventListener('click', async () => {
    const historyOverlay = panel.querySelector('.rr-history-overlay');
    const historyList = panel.querySelector('.rr-history-list');

    // Show loading state
    historyList.innerHTML = '<div class="rr-history-loading">Loading...</div>';
    historyOverlay.classList.toggle('hidden');

    // Load history if overlay is now visible
    if (!historyOverlay.classList.contains('hidden')) {
      const result = await loadHistory();
      updateHistoryOverlay(panel, result.history);
    }
  });

  panel.querySelector('.rr-history-close').addEventListener('click', () => {
    panel.querySelector('.rr-history-overlay').classList.add('hidden');
  });

  // History item actions (use delegation)
  panel.querySelector('.rr-history-list').addEventListener('click', async (e) => {
    const useBtn = e.target.closest('.rr-history-use');
    const copyBtn = e.target.closest('.rr-history-copy');

    if (useBtn) {
      const response = useBtn.dataset.response;
      if (response) {
        panel.querySelector('.rr-response-textarea').value = response;
        panel.querySelector('.rr-response-section').classList.remove('hidden');
        panel.querySelector('.rr-history-overlay').classList.add('hidden');
        updateCharCounter(panel);
        showToast('📋 Response loaded - edit as needed!', 'success');
      }
    }

    if (copyBtn) {
      const response = copyBtn.dataset.response;
      if (response) {
        await navigator.clipboard.writeText(response);
        showToast('✅ Copied to clipboard!', 'success');
      }
    }
  });

  // Theme toggle button
  const themeToggle = panel.querySelector('.rr-theme-toggle');
  const themeDropdown = panel.querySelector('.rr-theme-dropdown');

  themeToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    themeDropdown.classList.toggle('hidden');
  });

  // Theme options
  panel.querySelectorAll('.rr-theme-option').forEach(option => {
    option.addEventListener('click', async (e) => {
      e.stopPropagation();
      const theme = option.dataset.theme;
      await setThemePreference(theme);
      themeDropdown.classList.add('hidden');
      showToast(`${theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '💻'} Theme set to ${theme}`, 'success');
    });
  });

  // Close theme dropdown when clicking elsewhere
  document.addEventListener('click', () => {
    themeDropdown.classList.add('hidden');
  });

  // Drafts list - continue and delete buttons (event delegation)
  panel.querySelector('.rr-drafts-list').addEventListener('click', async (e) => {
    const continueBtn = e.target.closest('.rr-draft-continue');
    const deleteBtn = e.target.closest('.rr-draft-delete');
    const item = e.target.closest('.rr-draft-item');

    if (!item) return;
    const draftId = item.dataset.id;

    if (continueBtn) {
      const drafts = await loadDrafts();
      const draft = drafts.find(d => d.id === draftId);
      if (draft) {
        // Load draft into panel
        panel.querySelector('.rr-review-text').textContent = draft.reviewText;
        panel.dataset.reviewText = draft.reviewText;
        panel.querySelector('.rr-response-textarea').value = draft.responseText;
        panel.querySelector('.rr-response-section').classList.remove('hidden');
        panel.querySelector('.rr-drafts-overlay').classList.add('hidden');
        updateCharCounter(panel);
        showToast('📝 Draft loaded - continue editing!', 'success');

        // Delete the draft after loading
        await deleteDraft(draftId);
        const updatedDrafts = await loadDrafts();
        updateDraftsButton(panel, updatedDrafts);
      }
    }

    if (deleteBtn) {
      await deleteDraft(draftId);
      const drafts = await loadDrafts();
      updateDraftsOverlay(panel, drafts);
      updateDraftsButton(panel, drafts);
      showToast('🗑️ Draft deleted', 'success');
    }
  });

  // Templates button (header)
  panel.querySelector('.rr-templates-btn').addEventListener('click', async () => {
    const templates = await loadTemplates();
    updateTemplatesOverlay(panel, templates);
    panel.querySelector('.rr-templates-overlay').classList.toggle('hidden');
  });

  panel.querySelector('.rr-templates-close').addEventListener('click', () => {
    panel.querySelector('.rr-templates-overlay').classList.add('hidden');
  });

  // Template tabs switching
  panel.querySelectorAll('.rr-tpl-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;

      // Update active tab
      panel.querySelectorAll('.rr-tpl-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Show correct section
      if (tabName === 'my') {
        panel.querySelector('.rr-my-templates-section').classList.remove('hidden');
        panel.querySelector('.rr-library-section').classList.add('hidden');
      } else {
        panel.querySelector('.rr-my-templates-section').classList.add('hidden');
        panel.querySelector('.rr-library-section').classList.remove('hidden');
        updateLibraryList(panel);
      }
    });
  });

  // Library category filter
  panel.querySelector('.rr-library-category').addEventListener('change', () => {
    updateLibraryList(panel);
  });

  // Library search
  panel.querySelector('.rr-library-search').addEventListener('input', () => {
    updateLibraryList(panel);
  });

  // Template dropdown selection
  panel.querySelector('.rr-template-select').addEventListener('change', async (e) => {
    const templateId = e.target.value;
    if (!templateId) return;

    const templates = await loadTemplates();
    const template = templates.find(t => t.id === templateId);

    if (template) {
      // Put template content in textarea and show response section
      panel.querySelector('.rr-response-textarea').value = template.content;
      panel.querySelector('.rr-response-section').classList.remove('hidden');
      panel.querySelector('.rr-tone-select').value = template.tone;
      updateCharCounter(panel);
      showToast(`📝 Template "${template.name}" loaded`, 'success');

      // Reset dropdown
      e.target.value = '';
    }
  });

  // Save as Template button
  panel.querySelector('.rr-save-template-btn').addEventListener('click', () => {
    const text = panel.querySelector('.rr-response-textarea').value;
    if (!text) {
      showToast('⚠️ No response to save', 'warning');
      return;
    }
    // Show save modal
    panel.querySelector('.rr-save-modal').classList.remove('hidden');
    panel.querySelector('.rr-template-name-input').value = '';
    panel.querySelector('.rr-template-name-input').focus();
  });

  // Save modal cancel
  panel.querySelector('.rr-save-modal-cancel').addEventListener('click', () => {
    panel.querySelector('.rr-save-modal').classList.add('hidden');
  });

  // Save modal confirm
  panel.querySelector('.rr-save-modal-confirm').addEventListener('click', async () => {
    const name = panel.querySelector('.rr-template-name-input').value.trim();
    const content = panel.querySelector('.rr-response-textarea').value;
    const tone = panel.querySelector('.rr-tone-select').value;

    if (!name) {
      showToast('⚠️ Enter a template name', 'warning');
      return;
    }

    const result = await addTemplate(name, content, tone);
    if (result.success) {
      showToast(`💾 Template "${name}" saved!`, 'success');
      panel.querySelector('.rr-save-modal').classList.add('hidden');

      // Refresh dropdown
      const templates = await loadTemplates();
      populateTemplateDropdown(panel, templates);
    } else {
      showToast(`❌ ${result.error}`, 'error');
    }
  });

  // Template overlay - use and delete buttons (event delegation)
  panel.querySelector('.rr-templates-list').addEventListener('click', async (e) => {
    const useBtn = e.target.closest('.rr-template-use');
    const deleteBtn = e.target.closest('.rr-template-delete');
    const item = e.target.closest('.rr-template-item');

    if (!item) return;
    const templateId = item.dataset.id;

    if (useBtn) {
      const templates = await loadTemplates();
      const template = templates.find(t => t.id === templateId);
      if (template) {
        panel.querySelector('.rr-response-textarea').value = template.content;
        panel.querySelector('.rr-response-section').classList.remove('hidden');
        panel.querySelector('.rr-tone-select').value = template.tone;
        panel.querySelector('.rr-templates-overlay').classList.add('hidden');
        updateCharCounter(panel);
        showToast(`📝 Template "${template.name}" loaded`, 'success');
      }
    }

    if (deleteBtn) {
      if (confirm('Delete this template?')) {
        await deleteTemplate(templateId);
        const templates = await loadTemplates();
        updateTemplatesOverlay(panel, templates);
        populateTemplateDropdown(panel, templates);
        showToast('🗑️ Template deleted', 'success');
      }
    }
  });

  // Settings toggle
  panel.querySelector('.rr-settings-toggle').addEventListener('click', () => {
    panel.querySelector('.rr-advanced').classList.toggle('hidden');
  });

  // Generate button
  panel.querySelector('.rr-generate-btn').addEventListener('click', () => generateResponse(panel));

  // Variations button (3 Options)
  panel.querySelector('.rr-variations-btn').addEventListener('click', () => generateVariations(panel));

  // Variation tabs switching
  panel.querySelectorAll('.rr-var-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const index = parseInt(tab.dataset.var);
      switchVariation(panel, index);
    });
  });

  // Regenerate button
  panel.querySelector('.rr-regenerate-btn').addEventListener('click', () => generateResponse(panel));

  // Copy button
  panel.querySelector('.rr-copy-btn').addEventListener('click', () => copyResponse(panel));

  // Copy & Done button - copies and closes panel
  panel.querySelector('.rr-done-btn').addEventListener('click', async () => {
    const text = panel.querySelector('.rr-response-textarea').value;

    if (!text) {
      showToast('⚠️ Nothing to copy', 'warning');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      showToast('✅ Copied! Ready to paste', 'success');

      // Close panel after short delay
      setTimeout(() => closePanel(panel), 300);
    } catch (error) {
      showToast('❌ Failed to copy', 'error');
    }
  });

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

  // Quick Edit Chips - modify existing response
  panel.querySelectorAll('.rr-edit-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const editType = chip.dataset.edit;
      const currentResponse = panel.querySelector('.rr-response-textarea').value;

      if (!currentResponse) {
        showToast('⚠️ Generate a response first', 'warning');
        return;
      }

      // Highlight active chip
      panel.querySelectorAll('.rr-edit-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      editExistingResponse(panel, editType, currentResponse);
    });
  });

  // Tone Slider events
  const toneSlider = panel.querySelector('.rr-tone-slider');
  toneSlider.addEventListener('input', (e) => {
    const index = parseInt(e.target.value);
    updateToneSliderUI(panel, index);
    saveCurrentSettings(panel);
    // Show preview while sliding
    const tone = TONES[index];
    showTonePreview(panel, tone.value);
  });

  // Show preview on hover
  toneSlider.addEventListener('mouseenter', () => {
    const index = parseInt(toneSlider.value);
    const tone = TONES[index];
    showTonePreview(panel, tone.value);
  });

  // Hide preview when leaving slider
  toneSlider.addEventListener('mouseleave', () => {
    hideTonePreview(panel);
  });

  // Also hide after sliding stops (after a short delay)
  let previewTimeout;
  toneSlider.addEventListener('change', () => {
    clearTimeout(previewTimeout);
    previewTimeout = setTimeout(() => hideTonePreview(panel), 2000);
  });

  // Save settings on change
  panel.querySelector('.rr-tone-select').addEventListener('change', () => saveCurrentSettings(panel));
  panel.querySelector('.rr-length-select').addEventListener('change', () => saveCurrentSettings(panel));
  panel.querySelector('.rr-emoji-toggle').addEventListener('change', () => saveCurrentSettings(panel));
  panel.querySelector('.rr-autocopy-toggle').addEventListener('change', () => saveCurrentSettings(panel));
  panel.querySelector('.rr-turbo-toggle').addEventListener('change', () => saveCurrentSettings(panel));

  // ========== BATCH MODE EVENTS ==========

  // Batch button opens overlay and scans for reviews
  panel.querySelector('.rr-batch-btn').addEventListener('click', () => {
    const overlay = panel.querySelector('.rr-batch-overlay');
    overlay.classList.toggle('hidden');

    if (!overlay.classList.contains('hidden')) {
      initBatchMode(panel);
    }
  });

  // Batch close button
  panel.querySelector('.rr-batch-close').addEventListener('click', () => {
    panel.querySelector('.rr-batch-overlay').classList.add('hidden');
    // Reset batch state
    panel.dataset.batchResults = '';
    panel.dataset.batchIndex = '0';
  });

  // Generate All button
  panel.querySelector('.rr-batch-generate-all').addEventListener('click', () => {
    generateAllBatchResponses(panel);
  });

  // Batch result tabs (event delegation)
  panel.querySelector('.rr-batch-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.rr-batch-tab');
    if (tab) {
      const index = parseInt(tab.dataset.index);
      switchBatchTab(panel, index);
    }
  });

  // Copy single batch response
  panel.querySelector('.rr-batch-copy-one').addEventListener('click', async () => {
    const textarea = panel.querySelector('.rr-batch-response-textarea');
    const text = textarea.value;
    if (text) {
      await navigator.clipboard.writeText(text);
      showToast('✅ Copied!', 'success');
    }
  });

  // Regenerate single batch response
  panel.querySelector('.rr-batch-regenerate').addEventListener('click', () => {
    regenerateBatchResponse(panel);
  });

  // Copy all batch responses
  panel.querySelector('.rr-batch-copy-all').addEventListener('click', () => {
    copyAllBatchResponses(panel);
  });

  // Export batch responses as CSV
  panel.querySelector('.rr-batch-export').addEventListener('click', () => {
    exportBatchAsCSV(panel);
  });

  // Batch response textarea - update results when edited
  panel.querySelector('.rr-batch-response-textarea').addEventListener('input', (e) => {
    const index = parseInt(panel.dataset.batchIndex || '0');
    const results = JSON.parse(panel.dataset.batchResults || '[]');
    if (results[index]) {
      results[index].response = e.target.value;
      panel.dataset.batchResults = JSON.stringify(results);
    }
  });

  // ========== INLINE EDITOR TOOLBAR EVENTS ==========

  // Editor buttons (Bold, Italic, Bullet)
  panel.querySelectorAll('.rr-editor-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const textarea = panel.querySelector('.rr-response-textarea');
      applyEditorAction(textarea, action, panel);
    });
  });

  // Emoji picker toggle
  const emojiBtn = panel.querySelector('.rr-emoji-btn');
  const emojiDropdown = panel.querySelector('.rr-emoji-dropdown');

  emojiBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    emojiDropdown.classList.toggle('hidden');
  });

  // Emoji selection
  panel.querySelectorAll('.rr-emoji-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const emoji = opt.dataset.emoji;
      const textarea = panel.querySelector('.rr-response-textarea');
      insertAtCursor(textarea, emoji);
      emojiDropdown.classList.add('hidden');
      updateCharCounter(panel);
    });
  });

  // Close emoji dropdown when clicking elsewhere
  document.addEventListener('click', () => {
    emojiDropdown.classList.add('hidden');
  });

  // Auto-shorten button
  panel.querySelector('.rr-auto-shorten').addEventListener('click', () => {
    autoShortenForPlatform(panel);
  });
}

// ========== INLINE EDITOR HELPER FUNCTIONS ==========

function applyEditorAction(textarea, action, panel) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selectedText = text.substring(start, end);

  let newText = '';
  let cursorOffset = 0;

  switch (action) {
    case 'bold':
      if (selectedText) {
        // Wrap selection in asterisks (markdown bold simulation)
        newText = text.substring(0, start) + '**' + selectedText + '**' + text.substring(end);
        cursorOffset = end + 4;
      } else {
        // Insert placeholder
        newText = text.substring(0, start) + '**bold text**' + text.substring(end);
        cursorOffset = start + 2;
        // Select "bold text"
        setTimeout(() => {
          textarea.setSelectionRange(start + 2, start + 11);
          textarea.focus();
        }, 0);
      }
      break;

    case 'italic':
      if (selectedText) {
        newText = text.substring(0, start) + '*' + selectedText + '*' + text.substring(end);
        cursorOffset = end + 2;
      } else {
        newText = text.substring(0, start) + '*italic text*' + text.substring(end);
        cursorOffset = start + 1;
        setTimeout(() => {
          textarea.setSelectionRange(start + 1, start + 12);
          textarea.focus();
        }, 0);
      }
      break;

    case 'bullet':
      // Add bullet point at start of current line
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      newText = text.substring(0, lineStart) + '• ' + text.substring(lineStart);
      cursorOffset = start + 2;
      break;

    default:
      return;
  }

  textarea.value = newText;
  textarea.setSelectionRange(cursorOffset, cursorOffset);
  textarea.focus();
  updateCharCounter(panel);
}

function insertAtCursor(textarea, text) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;

  textarea.value = value.substring(0, start) + text + value.substring(end);
  textarea.setSelectionRange(start + text.length, start + text.length);
  textarea.focus();
}

async function autoShortenForPlatform(panel) {
  const textarea = panel.querySelector('.rr-response-textarea');
  const text = textarea.value;

  if (!text) {
    showToast('Generate a response first', 'warning');
    return;
  }

  // Get platform limit
  const platform = detectPlatform().name;
  const limits = {
    'Google': 4000,
    'Yelp': 5000,
    'TripAdvisor': 10000,
    'Facebook': 8000,
    'Trustpilot': 3000,
    'Booking': 2000,
    'default': 4000
  };
  const limit = limits[platform] || limits.default;

  if (text.length <= limit) {
    showToast(`Already within ${limit} char limit!`, 'info');
    return;
  }

  // Check login for API call
  let stored;
  try {
    stored = await chrome.storage.local.get(['token', 'user']);
  } catch (e) {
    showToast('Extension error', 'error');
    return;
  }

  if (!stored.token) {
    showToast('Please login first', 'error');
    return;
  }

  const btn = panel.querySelector('.rr-auto-shorten');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '...';

  try {
    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${stored.token}`
      },
      body: JSON.stringify({
        reviewText: panel.dataset.reviewText || 'customer review',
        tone: panel.querySelector('.rr-tone-select')?.value || 'professional',
        outputLanguage: panel.dataset.detectedLanguage || 'en',
        responseLength: 'short',
        additionalContext: `IMPORTANT: Shorten this existing response to fit within ${limit} characters while keeping the key message:\n\n${text}`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Shortening failed');
    }

    // Store previous for undo
    panel.dataset.previousResponse = text;
    panel.querySelector('.rr-undo-btn').classList.remove('hidden');

    textarea.value = data.response;
    updateCharCounter(panel);
    showToast(`Shortened to ${data.response.length} chars!`, 'success');
  } catch (error) {
    showToast(`Error: ${error.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// Update selected compensations in panel data
function updateSelectedCompensations(panel) {
  const selects = panel.querySelectorAll('.rr-compensation-select');
  const compensations = [];

  selects.forEach(select => {
    const selectedOption = select.options[select.selectedIndex];
    if (select.value && selectedOption) {
      const text = selectedOption.dataset.text;
      if (text) {
        compensations.push(text);
      }
    }
  });

  // Store in panel data
  panel.dataset.selectedCompensations = JSON.stringify(compensations);

  // Show/hide compensation note
  const note = panel.querySelector('.rr-compensation-note');
  if (compensations.length > 0) {
    note.classList.remove('hidden');
  } else {
    note.classList.add('hidden');
  }
}

// Get compensation context for API
function getCompensationContext(panel) {
  const compensations = JSON.parse(panel.dataset.selectedCompensations || '[]');
  if (compensations.length === 0) return '';

  return `\n\nIMPORTANT: Include these compensations in your response: ${compensations.join(', ')}. Offer them as a gesture of goodwill to resolve the customer's concerns.`;
}

async function closePanel(panel) {
  // Auto-save draft if there's unsaved content
  const responseText = panel.querySelector('.rr-response-textarea')?.value;
  const reviewText = panel.dataset.reviewText;
  const platform = panel.querySelector('.rr-platform-badge')?.textContent?.trim() || 'Unknown';

  if (responseText && responseText.length > 20 && reviewText) {
    // Save as draft
    await saveDraft(reviewText, responseText, platform, window.location.href);
    showToast('📝 Draft saved!', 'info');
  }

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
  const detectedLanguage = panel.dataset.detectedLanguage || 'en'; // Use stored language
  const tone = panel.querySelector('.rr-tone-select').value;
  const length = panel.querySelector('.rr-length-select').value;
  const emojis = panel.querySelector('.rr-emoji-toggle').checked;

  const generateBtn = panel.querySelector('.rr-generate-btn');
  const btnText = panel.querySelector('.rr-btn-text');
  const btnLoading = panel.querySelector('.rr-btn-loading');
  const responseSection = panel.querySelector('.rr-response-section');

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
    // IMPORTANT: Add explicit language instruction to fix language bug
    const languageNames = { de: 'German', en: 'English', nl: 'Dutch', fr: 'French', es: 'Spanish' };
    const languageName = languageNames[detectedLanguage] || 'the same language as the review';

    let context = `CRITICAL: You MUST respond in ${languageName}. The review is written in ${languageName}, so your response must also be in ${languageName}.`;

    if (detectedIssues.length > 0) {
      const issueLabels = detectedIssues.map(i => i.label.replace(/[^\w\s]/g, '').trim());
      context += ` Customer complaints detected: ${issueLabels.join(', ')}. Address these specific issues in your response.`;
    }

    // Add selected compensations to context
    const compensationContext = getCompensationContext(panel);
    if (compensationContext) {
      context += compensationContext;
    }

    // Get business name: prefer user's setting, fallback to auto-detected
    let businessName = stored.user?.businessName || '';
    if (!businessName) {
      businessName = detectBusinessContext() || await getCachedBusinessName();
      if (businessName) {
        saveDetectedBusiness(businessName); // Cache for future use
      }
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
        outputLanguage: detectedLanguage, // Send detected language instead of 'auto'
        responseLength: length,
        includeEmojis: emojis,
        businessName: businessName,
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

    // Update character counter
    updateCharCounter(panel);

    // Show quality badge if available
    if (data.quality) {
      showQualityBadge(panel, data.quality);
    }

    // Record analytics and insights
    await recordAnalyticsResponse();
    updateAnalytics(panel);

    // Record insights for tracking
    const currentSentiment = panel.dataset.sentiment || 'neutral';
    await recordInsights(detectedIssues, currentSentiment);

    // Hide undo button (fresh generation)
    panel.querySelector('.rr-undo-btn').classList.add('hidden');
    panel.dataset.previousResponse = '';

    // Update quick tone buttons
    panel.querySelectorAll('.rr-quick-tone').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tone === tone);
    });

    // Auto-copy if enabled
    const settings = cachedSettings || await loadSettings();
    if (settings.autoCopy) {
      try {
        await navigator.clipboard.writeText(data.response);
        showToast('✨ Generated & copied!', 'success');

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
        showToast('✨ Response generated!', 'success');
      }
    } else {
      showToast('✨ Response generated!', 'success');
    }




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

// ========== GENERATE WITH MODIFIER (Smart Chips) ==========
async function generateResponseWithModifier(panel, modifier) {
  const reviewText = panel.dataset.reviewText;
  const detectedIssues = panel.dataset.detectedIssues ? JSON.parse(panel.dataset.detectedIssues) : [];
  const detectedLanguage = panel.dataset.detectedLanguage || 'en'; // Use stored language
  const length = panel.querySelector('.rr-length-select').value;
  const emojis = panel.querySelector('.rr-emoji-toggle').checked;

  const generateBtn = panel.querySelector('.rr-generate-btn');
  const btnText = panel.querySelector('.rr-btn-text');
  const btnLoading = panel.querySelector('.rr-btn-loading');
  const responseSection = panel.querySelector('.rr-response-section');

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

  // Disable all smart chips while generating
  panel.querySelectorAll('.rr-smart-chip').forEach(c => c.disabled = true);

  try {
    // Build context with modifier + detected issues
    // IMPORTANT: Add explicit language instruction to fix language bug
    const languageNames = { de: 'German', en: 'English', nl: 'Dutch', fr: 'French', es: 'Spanish' };
    const languageName = languageNames[detectedLanguage] || 'the same language as the review';

    let context = `CRITICAL: You MUST respond in ${languageName}. ${modifier}`;
    if (detectedIssues.length > 0) {
      const issueLabels = detectedIssues.map(i => i.label.replace(/[^\w\s]/g, '').trim());
      context += ` Customer complaints: ${issueLabels.join(', ')}.`;
    }

    // Get business name: prefer user's setting, fallback to auto-detected
    let businessName = stored.user?.businessName || '';
    if (!businessName) {
      businessName = detectBusinessContext() || await getCachedBusinessName();
    }

    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${stored.token}`
      },
      body: JSON.stringify({
        reviewText,
        tone: 'professional', // Base tone, modifier overrides the style
        outputLanguage: detectedLanguage, // Send detected language
        responseLength: length,
        includeEmojis: emojis,
        businessName: businessName,
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

    // Update character counter
    updateCharCounter(panel);

    // Show quality badge if available
    if (data.quality) {
      showQualityBadge(panel, data.quality);
    }

    // Record analytics and insights
    await recordAnalyticsResponse();
    updateAnalytics(panel);

    // Record insights for tracking
    const currentSentiment = panel.dataset.sentiment || 'neutral';
    await recordInsights(detectedIssues, currentSentiment);

    // Hide undo button (fresh generation)
    panel.querySelector('.rr-undo-btn').classList.add('hidden');
    panel.dataset.previousResponse = '';

    // Auto-copy if enabled
    const settings = cachedSettings || await loadSettings();
    if (settings.autoCopy) {
      try {
        await navigator.clipboard.writeText(data.response);
        showToast('✨ Generated & copied!', 'success');

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
        showToast('✨ Response generated!', 'success');
      }
    } else {
      showToast('✨ Response generated!', 'success');
    }




  } catch (error) {
    showToast(`❌ ${error.message}`, 'error');
  } finally {
    generateBtn.disabled = false;
    btnText.classList.remove('hidden');
    btnLoading.classList.add('hidden');
    // Re-enable smart chips
    panel.querySelectorAll('.rr-smart-chip').forEach(c => c.disabled = false);
  }
}

// ========== EDIT EXISTING RESPONSE (Quick Edit Chips) ==========
async function editExistingResponse(panel, editType, currentResponse) {
  const editInstructions = {
    shorter: 'Make this response about 50% shorter. Keep the key points but be more concise.',
    longer: 'Expand this response with more detail and warmth. Add specific touches.',
    emoji: 'Add 2-3 relevant emojis to make this response more friendly and engaging.',
    formal: 'Rewrite this to be more formal and professional in tone.',
    casual: 'Rewrite this to be more casual, friendly, and approachable.'
  };

  const instruction = editInstructions[editType] || editInstructions.shorter;
  const detectedLanguage = panel.dataset.detectedLanguage || 'en'; // Keep same language

  const generateBtn = panel.querySelector('.rr-generate-btn');
  const btnText = panel.querySelector('.rr-btn-text');
  const btnLoading = panel.querySelector('.rr-btn-loading');

  let stored;
  try {
    stored = await chrome.storage.local.get(['token', 'user']);
  } catch (e) {
    showToast('⚠️ Extension error', 'error');
    return;
  }

  if (!stored.token) {
    showToast('🔐 Please login first', 'error');
    return;
  }

  // Save current response for undo
  panel.dataset.previousResponse = currentResponse;

  // Show loading
  generateBtn.disabled = true;
  btnText.classList.add('hidden');
  btnLoading.classList.remove('hidden');

  // Disable edit chips while processing
  panel.querySelectorAll('.rr-edit-chip').forEach(c => c.disabled = true);

  try {
    // Build context with language instruction
    const languageNames = { de: 'German', en: 'English', nl: 'Dutch', fr: 'French', es: 'Spanish' };
    const languageName = languageNames[detectedLanguage] || 'the same language';
    const editContext = `CRITICAL: Keep the response in ${languageName}. You are editing an existing review response. ${instruction} Here is the current response to modify: "${currentResponse}"`;

    // Get business name: prefer user's setting, fallback to auto-detected
    let businessName = stored.user?.businessName || '';
    if (!businessName) {
      businessName = detectBusinessContext() || await getCachedBusinessName();
    }

    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${stored.token}`
      },
      body: JSON.stringify({
        reviewText: currentResponse, // Use current response as input
        tone: 'professional',
        outputLanguage: detectedLanguage, // Keep same language
        responseLength: 'medium',
        includeEmojis: editType === 'emoji',
        businessName: businessName,
        additionalContext: editContext
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Edit failed');
    }

    // Update response
    panel.querySelector('.rr-response-textarea').value = data.response;

    // Update character counter
    updateCharCounter(panel);

    // Show undo button
    panel.querySelector('.rr-undo-btn').classList.remove('hidden');

    // Auto-copy if enabled
    const settings = cachedSettings || await loadSettings();
    if (settings.autoCopy) {
      try {
        await navigator.clipboard.writeText(data.response);
        showToast(`✨ ${editType.charAt(0).toUpperCase() + editType.slice(1)} & copied!`, 'success');

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
        showToast(`✨ Response ${editType}!`, 'success');
      }
    } else {
      showToast(`✨ Response ${editType}!`, 'success');
    }

  } catch (error) {
    showToast(`❌ ${error.message}`, 'error');
  } finally {
    generateBtn.disabled = false;
    btnText.classList.remove('hidden');
    btnLoading.classList.add('hidden');
    panel.querySelectorAll('.rr-edit-chip').forEach(c => c.disabled = false);
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
    const language = detectLanguage(cleaned); // Detect language for turbo mode

    // Build context with language instruction
    const languageNames = { de: 'German', en: 'English', nl: 'Dutch', fr: 'French', es: 'Spanish' };
    const languageName = languageNames[language.code] || 'the same language as the review';

    let context = `CRITICAL: You MUST respond in ${languageName}.`;
    if (issues.length > 0) {
      const issueLabels = issues.map(i => i.label.replace(/[^\w\s]/g, '').trim());
      context += ` Customer complaints detected: ${issueLabels.join(', ')}. Address these specific issues in your response.`;
    }

    // Get business name: prefer user's setting, fallback to auto-detected
    let businessName = cachedUser?.businessName || '';
    if (!businessName) {
      businessName = detectBusinessContext() || await getCachedBusinessName();
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
        outputLanguage: language.code, // Send detected language
        responseLength: settings.length || 'medium',
        includeEmojis: settings.emojis || false,
        businessName: businessName,
        additionalContext: context
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Generation failed');
    }

    // Copy to clipboard
    await navigator.clipboard.writeText(data.response);

    // Show success
    showToast('✅ Copied to clipboard! Paste with Ctrl+V', 'success');

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

  // Apply current theme
  applyTheme(currentTheme);

  // Clean and store review text
  const cleaned = cleanReviewText(reviewText);
  panel.dataset.reviewText = cleaned;

  // Update review preview
  const preview = cleaned.length > 120 ? cleaned.substring(0, 120) + '...' : cleaned;
  panel.querySelector('.rr-review-text').textContent = preview;

  // Analyze sentiment
  const sentiment = analyzeSentiment(cleaned);
  const sentimentDisplay = getSentimentDisplay(sentiment);

  // Store sentiment for insights tracking
  panel.dataset.sentiment = sentiment;

  panel.querySelector('.rr-sentiment-emoji').textContent = sentimentDisplay.emoji;
  panel.querySelector('.rr-sentiment-label').textContent = sentimentDisplay.label;
  panel.querySelector('.rr-sentiment-label').style.color = sentimentDisplay.color;

  // Auto-select recommended tone
  panel.querySelector('.rr-tone-select').value = sentimentDisplay.tone;

  // Populate Smart Reply Chips
  const smartChips = getSmartReplyChips(sentiment);
  const chipsContainer = panel.querySelector('.rr-smart-chips');
  chipsContainer.innerHTML = smartChips.map(chip =>
    `<button class="rr-smart-chip" data-modifier="${encodeURIComponent(chip.modifier)}">${chip.label}</button>`
  ).join('');

  // Add click handlers for smart chips
  chipsContainer.querySelectorAll('.rr-smart-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const modifier = decodeURIComponent(chip.dataset.modifier);
      generateResponseWithModifier(panel, modifier);

      // Visual feedback
      chip.classList.add('active');
      chipsContainer.querySelectorAll('.rr-smart-chip').forEach(c => {
        if (c !== chip) c.classList.remove('active');
      });
    });
  });

  // Detect language and store it for API calls
  const language = detectLanguage(cleaned);
  panel.dataset.detectedLanguage = language.code; // Store for generateResponse
  panel.querySelector('.rr-language-flag').textContent = language.flag;
  panel.querySelector('.rr-language-name').textContent = language.name;

  // Smart Issue Detection with Resolution UI
  const issues = detectIssues(cleaned);
  const issueResolution = panel.querySelector('.rr-issue-resolution');
  const issueList = panel.querySelector('.rr-issue-list');
  const issueCount = panel.querySelector('.rr-issue-count');
  const compensationNote = panel.querySelector('.rr-compensation-note');

  if (issues.length > 0) {
    // Store issues for generateResponse
    panel.dataset.detectedIssues = JSON.stringify(issues);

    // Update count badge
    issueCount.textContent = issues.length;

    // Render issues with compensation options
    issueList.innerHTML = issues.map((issue, idx) => `
      <div class="rr-issue-item" data-issue="${issue.issue}" data-index="${idx}">
        <div class="rr-issue-name">${issue.label}</div>
        ${issue.compensations.length > 0 ? `
          <select class="rr-compensation-select" data-issue="${issue.issue}">
            <option value="">No compensation</option>
            ${issue.compensations.map(c => `
              <option value="${c.id}" data-text="${c.text || ''}">${c.label}</option>
            `).join('')}
          </select>
        ` : ''}
      </div>
    `).join('');

    issueResolution.classList.remove('hidden');

    // Add event listeners for compensation selects
    issueList.querySelectorAll('.rr-compensation-select').forEach(select => {
      select.addEventListener('change', () => {
        updateSelectedCompensations(panel);
      });
    });
  } else {
    panel.dataset.detectedIssues = '[]';
    issueResolution.classList.add('hidden');
  }

  // AI Tone Recommendation (One-Shot Perfect Response)
  const recommendation = getAutoToneRecommendation(sentiment, issues);
  const aiRecBox = panel.querySelector('.rr-ai-recommendation');

  // Store recommendation for later use
  panel.dataset.recommendation = JSON.stringify(recommendation);

  // Update recommendation UI
  aiRecBox.querySelector('.rr-ai-rec-emoji').textContent = recommendation.emoji;
  aiRecBox.querySelector('.rr-ai-rec-label').textContent = recommendation.label;
  aiRecBox.querySelector('.rr-ai-rec-reason').textContent =
    `Based on ${recommendation.shortReason}${issues.length > 0 ? ` (${issues.length} issue${issues.length > 1 ? 's' : ''})` : ''}`;

  // Confidence badge
  const confidenceBadge = aiRecBox.querySelector('.rr-ai-rec-confidence');
  confidenceBadge.textContent = recommendation.confidence === 'high' ? '✓ High confidence' : '~ Medium';
  confidenceBadge.className = `rr-ai-rec-confidence ${recommendation.confidence}`;

  // Show recommendation box
  aiRecBox.classList.remove('hidden');

  // Auto-select the recommended tone
  panel.querySelector('.rr-tone-select').value = recommendation.tone;

  // Highlight recommended tone in Quick Tone buttons
  panel.querySelectorAll('.rr-quick-tone').forEach(btn => {
    btn.classList.remove('recommended');
    if (btn.dataset.tone === recommendation.tone) {
      btn.classList.add('recommended');
    }
  });

  // Add click handler for "Generate with this" button
  const useRecBtn = aiRecBox.querySelector('.rr-ai-rec-use');
  useRecBtn.onclick = () => {
    panel.querySelector('.rr-tone-select').value = recommendation.tone;
    generateResponse(panel);
    // Hide recommendation after use
    aiRecBox.classList.add('used');
  };

  // Add click handler for "Choose other" button
  const otherBtn = aiRecBox.querySelector('.rr-ai-rec-other');
  otherBtn.onclick = () => {
    aiRecBox.classList.add('hidden');
    // Focus on tone select
    panel.querySelector('.rr-tone-select').focus();
  };

  // Reset response section
  panel.querySelector('.rr-response-section').classList.add('hidden');
  panel.querySelector('.rr-response-textarea').value = '';
  panel.querySelector('.rr-advanced').classList.add('hidden');
  panel.querySelector('.rr-help-overlay').classList.add('hidden');

  // Reset position for desktop
  if (window.innerWidth > 640) {
    panel.style.left = '';
    panel.style.top = '';
    panel.style.transform = '';
    panel.style.bottom = '';
  }

  // Show panel
  panel.classList.add('rr-visible');

  // Check clipboard for review text (if no text was selected)
  if (!reviewText || reviewText.length < 20) {
    setTimeout(async () => {
      const clipboardResult = await checkClipboardForReview();
      if (clipboardResult.hasReview) {
        showClipboardBanner(panel, clipboardResult.text);
      }
    }, 500);
  }

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

// Keyboard shortcuts - using capture phase to intercept before browser handles them
document.addEventListener('keydown', async (e) => {
  // Skip if user is typing in an input field (except our own panel)
  const activeEl = document.activeElement;
  const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);
  const isOurPanel = activeEl && activeEl.closest('#rr-response-panel');

  // Alt+R: Generate from selection (respects turbo mode)
  if (e.altKey && !e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'r') {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

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
    return;
  }

  // Alt+T: Toggle Turbo Mode
  if (e.altKey && !e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 't') {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const settings = cachedSettings || await loadSettings();
    settings.turboMode = !settings.turboMode;
    cachedSettings = settings;
    saveSettings(settings);
    showToast(settings.turboMode ? '⚡ Turbo Mode ON' : '🐢 Turbo Mode OFF', 'info');
    return;
  }

  // Alt+C: Copy current response
  if (e.altKey && !e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'c') {
    const panel = document.getElementById('rr-response-panel');
    if (panel && panel.classList.contains('rr-visible')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      copyResponse(panel);
      return;
    }
  }

  // Alt+Q: Toggle Queue Mode
  if (e.altKey && !e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'q') {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    if (reviewQueue.isActive) {
      closeQueueMode();
      showToast('📋 Queue mode closed', 'info');
    } else {
      startQueueMode();
    }
    return;
  }

  // Escape: Close panel or overlays
  if (e.key === 'Escape') {
    const panel = document.getElementById('rr-response-panel');
    if (panel && panel.classList.contains('rr-visible')) {
      e.preventDefault();
      e.stopPropagation();
      // First close any open overlays
      const keyboardHelp = panel.querySelector('.rr-keyboard-help');
      if (keyboardHelp && !keyboardHelp.classList.contains('hidden')) {
        keyboardHelp.classList.add('hidden');
        return;
      }
      closePanel(panel);
      return;
    }
    hideFloatingButton();
  }

  // ?: Show keyboard help
  if (e.key === '?' || (e.ctrlKey && e.key === '/')) {
    const panel = document.getElementById('rr-response-panel');
    if (panel && panel.classList.contains('rr-visible')) {
      e.preventDefault();
      e.stopPropagation();
      panel.querySelector('.rr-keyboard-help').classList.toggle('hidden');
      return;
    }
  }
}, true); // capture: true - intercept events before they bubble

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

// ========== REVIEW QUEUE / BATCH MODE ==========
let reviewQueue = {
  reviews: [],
  currentIndex: 0,
  isActive: false
};

function scanPageForReviews() {
  const reviews = [];
  const platform = detectPlatform();

  // Platform-specific selectors
  const selectors = {
    'Google': ['.jftiEf', '[data-review-id]'],
    'Yelp': ['.review', '[data-review-id]'],
    'TripAdvisor': ['.review-container', '.reviewSelector'],
    'Facebook': ['[data-testid="UFI2Comment"]', '.userContentWrapper'],
    'Trustpilot': ['.review-card', '.styles_reviewCard'],
    'Booking': ['.review_item', '.c-review'],
    'default': ['.review', '[data-review]', '.review-item']
  };

  const platformSelectors = selectors[platform.name] || selectors.default;

  platformSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(reviewEl => {
      // Find review text - try multiple selectors
      const textSelectors = [
        '.wiI7pd', '.MyEned',  // Google Maps
        '.comment__373c0__Nsutg', '.raw__373c0__tQAx6', // Yelp
        '.partial_entry', '.entry', // TripAdvisor
        '.userContent', // Facebook
        '.review-content__text', // Trustpilot
        '.review_item_review_content', // Booking
        '.review-text', '.review-body', 'p' // Generic
      ];

      let text = '';
      for (const textSel of textSelectors) {
        const textEl = reviewEl.querySelector(textSel);
        if (textEl && textEl.textContent.trim().length > 20) {
          text = cleanReviewText(textEl.textContent);
          break;
        }
      }

      // Try to get rating
      let rating = null;
      const ratingEl = reviewEl.querySelector('[aria-label*="star"], .rating, .star-rating, .review-rating');
      if (ratingEl) {
        const ariaLabel = ratingEl.getAttribute('aria-label') || '';
        const ratingMatch = ariaLabel.match(/(\d)/);
        if (ratingMatch) rating = parseInt(ratingMatch[1]);
      }

      if (text && text.length >= 20) {
        reviews.push({
          element: reviewEl,
          text: text,
          rating: rating,
          sentiment: analyzeSentiment(text),
          processed: false
        });
      }
    });
  });

  return reviews;
}

// ========== BATCH MODE FUNCTIONS ==========

function initBatchMode(panel) {
  const reviews = scanPageForReviews();
  const foundCount = panel.querySelector('.rr-batch-found-count');
  const actionsStart = panel.querySelector('.rr-batch-actions-start');
  const emptyState = panel.querySelector('.rr-batch-empty');
  const resultsSection = panel.querySelector('.rr-batch-results');
  const progressBar = panel.querySelector('.rr-batch-progress-bar');

  // Store reviews in panel data
  panel.dataset.batchReviews = JSON.stringify(reviews);
  panel.dataset.batchResults = '[]';
  panel.dataset.batchIndex = '0';

  // Update UI based on found reviews
  foundCount.textContent = reviews.length;

  // Update batch button count in header
  const batchCount = panel.querySelector('.rr-batch-count');
  if (batchCount) {
    batchCount.textContent = reviews.length;
    batchCount.style.display = reviews.length > 0 ? 'inline' : 'none';
  }

  if (reviews.length > 0) {
    actionsStart.classList.remove('hidden');
    emptyState.classList.add('hidden');
    resultsSection.classList.add('hidden');
    progressBar.classList.add('hidden');

    // Reset generate button
    const genBtn = panel.querySelector('.rr-batch-generate-all');
    genBtn.disabled = false;
    panel.querySelector('.rr-batch-gen-text').classList.remove('hidden');
    panel.querySelector('.rr-batch-gen-loading').classList.add('hidden');
  } else {
    actionsStart.classList.add('hidden');
    emptyState.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    progressBar.classList.add('hidden');
  }
}

async function generateAllBatchResponses(panel) {
  const reviews = JSON.parse(panel.dataset.batchReviews || '[]');
  if (reviews.length === 0) return;

  // Check login
  let stored;
  try {
    stored = await chrome.storage.local.get(['token', 'user']);
  } catch (e) {
    showToast('Extension error', 'error');
    return;
  }

  if (!stored.token) {
    showToast('Please login first', 'error');
    return;
  }

  const tone = panel.querySelector('.rr-batch-tone').value;
  const genBtn = panel.querySelector('.rr-batch-generate-all');
  const genText = panel.querySelector('.rr-batch-gen-text');
  const genLoading = panel.querySelector('.rr-batch-gen-loading');
  const progressText = panel.querySelector('.rr-batch-progress-text');
  const progressBar = panel.querySelector('.rr-batch-progress-bar');
  const progressFill = panel.querySelector('.rr-batch-progress-fill');

  // Show loading state
  genBtn.disabled = true;
  genText.classList.add('hidden');
  genLoading.classList.remove('hidden');
  progressBar.classList.remove('hidden');

  const results = [];
  const total = reviews.length;

  for (let i = 0; i < total; i++) {
    const review = reviews[i];
    progressText.textContent = `${i + 1}/${total}`;
    progressFill.style.width = `${((i + 1) / total) * 100}%`;

    try {
      // Detect language
      const detectedLanguage = detectReviewLanguage(review.text);

      // Determine tone - auto or user selected
      let useTone = tone;
      if (tone === 'auto') {
        // Auto-detect best tone based on sentiment and rating
        if (review.sentiment === 'negative' || (review.rating && review.rating <= 2)) {
          useTone = 'apologetic';
        } else if (review.sentiment === 'positive' || (review.rating && review.rating >= 4)) {
          useTone = 'friendly';
        } else {
          useTone = 'professional';
        }
      }

      // Generate response
      const response = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${stored.token}`
        },
        body: JSON.stringify({
          reviewText: review.text,
          tone: useTone,
          outputLanguage: detectedLanguage,
          responseLength: 'medium',
          includeEmojis: false,
          businessName: stored.user?.businessName || '',
          additionalContext: `Rating: ${review.rating || 'unknown'}`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      results.push({
        review: review.text,
        rating: review.rating,
        sentiment: review.sentiment,
        response: data.response,
        quality: data.quality,
        tone: useTone,
        success: true
      });
    } catch (error) {
      results.push({
        review: review.text,
        rating: review.rating,
        sentiment: review.sentiment,
        response: '',
        error: error.message,
        success: false
      });
    }

    // Small delay between requests to avoid rate limiting
    if (i < total - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Store results
  panel.dataset.batchResults = JSON.stringify(results);

  // Show results
  showBatchResults(panel, results);

  // Update analytics
  await recordAnalyticsResponse();
  updateAnalytics(panel);

  showToast(`Generated ${results.filter(r => r.success).length}/${total} responses!`, 'success');
}

function showBatchResults(panel, results) {
  const actionsStart = panel.querySelector('.rr-batch-actions-start');
  const resultsSection = panel.querySelector('.rr-batch-results');
  const progressBar = panel.querySelector('.rr-batch-progress-bar');
  const tabsContainer = panel.querySelector('.rr-batch-tabs');

  actionsStart.classList.add('hidden');
  progressBar.classList.add('hidden');
  resultsSection.classList.remove('hidden');

  // Generate tabs
  tabsContainer.innerHTML = results.map((result, index) => {
    const statusIcon = result.success ? (result.sentiment === 'negative' ? '😞' : result.sentiment === 'positive' ? '😊' : '😐') : '❌';
    return `<button class="rr-batch-tab ${index === 0 ? 'active' : ''}" data-index="${index}">
      ${statusIcon} ${index + 1}
    </button>`;
  }).join('');

  // Show first result
  panel.dataset.batchIndex = '0';
  switchBatchTab(panel, 0);
}

function switchBatchTab(panel, index) {
  const results = JSON.parse(panel.dataset.batchResults || '[]');
  if (!results[index]) return;

  const result = results[index];
  panel.dataset.batchIndex = index.toString();

  // Update active tab
  panel.querySelectorAll('.rr-batch-tab').forEach((tab, i) => {
    tab.classList.toggle('active', i === index);
  });

  // Update review preview
  const previewEl = panel.querySelector('.rr-batch-review-preview');
  previewEl.innerHTML = `
    <div class="rr-batch-review-header">
      <span class="rr-batch-review-sentiment">${result.sentiment === 'negative' ? '😞' : result.sentiment === 'positive' ? '😊' : '😐'}</span>
      ${result.rating ? `<span class="rr-batch-review-rating">${'⭐'.repeat(result.rating)}</span>` : ''}
      <span class="rr-batch-review-tone">Tone: ${result.tone || 'auto'}</span>
    </div>
    <div class="rr-batch-review-text">${result.review.substring(0, 150)}${result.review.length > 150 ? '...' : ''}</div>
  `;

  // Update response textarea
  panel.querySelector('.rr-batch-response-textarea').value = result.response || '';

  // Update quality indicator
  const qualityEl = panel.querySelector('.rr-batch-quality');
  if (result.quality) {
    qualityEl.innerHTML = `<span class="rr-quality-score ${result.quality.score >= 8 ? 'high' : result.quality.score >= 6 ? 'medium' : 'low'}">Quality: ${result.quality.score}/10</span>`;
    qualityEl.classList.remove('hidden');
  } else if (!result.success) {
    qualityEl.innerHTML = `<span class="rr-batch-error">Error: ${result.error}</span>`;
    qualityEl.classList.remove('hidden');
  } else {
    qualityEl.classList.add('hidden');
  }
}

async function regenerateBatchResponse(panel) {
  const index = parseInt(panel.dataset.batchIndex || '0');
  const results = JSON.parse(panel.dataset.batchResults || '[]');
  const reviews = JSON.parse(panel.dataset.batchReviews || '[]');

  if (!results[index] || !reviews[index]) return;

  // Check login
  let stored;
  try {
    stored = await chrome.storage.local.get(['token', 'user']);
  } catch (e) {
    showToast('Extension error', 'error');
    return;
  }

  if (!stored.token) {
    showToast('Please login first', 'error');
    return;
  }

  const regenBtn = panel.querySelector('.rr-batch-regenerate');
  const originalText = regenBtn.textContent;
  regenBtn.disabled = true;
  regenBtn.textContent = '...';

  try {
    const review = reviews[index];
    const detectedLanguage = detectReviewLanguage(review.text);
    const tone = panel.querySelector('.rr-batch-tone').value;
    const useTone = tone === 'auto' ? 'professional' : tone;

    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${stored.token}`
      },
      body: JSON.stringify({
        reviewText: review.text,
        tone: useTone,
        outputLanguage: detectedLanguage,
        responseLength: 'medium',
        includeEmojis: false,
        businessName: stored.user?.businessName || ''
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Generation failed');
    }

    // Update result
    results[index] = {
      ...results[index],
      response: data.response,
      quality: data.quality,
      tone: useTone,
      success: true,
      error: null
    };
    panel.dataset.batchResults = JSON.stringify(results);

    // Update UI
    switchBatchTab(panel, index);
    showToast('Regenerated!', 'success');
  } catch (error) {
    showToast(`Error: ${error.message}`, 'error');
  } finally {
    regenBtn.disabled = false;
    regenBtn.textContent = originalText;
  }
}

async function copyAllBatchResponses(panel) {
  const results = JSON.parse(panel.dataset.batchResults || '[]');
  const successfulResults = results.filter(r => r.success && r.response);

  if (successfulResults.length === 0) {
    showToast('No responses to copy', 'warning');
    return;
  }

  // Format all responses
  const text = successfulResults.map((r, i) => {
    return `--- Response ${i + 1} ---\nReview: ${r.review.substring(0, 100)}...\n\nResponse:\n${r.response}\n`;
  }).join('\n');

  try {
    await navigator.clipboard.writeText(text);
    showToast(`Copied ${successfulResults.length} responses!`, 'success');
  } catch (error) {
    showToast('Failed to copy', 'error');
  }
}

function exportBatchAsCSV(panel) {
  const results = JSON.parse(panel.dataset.batchResults || '[]');

  if (results.length === 0) {
    showToast('No data to export', 'warning');
    return;
  }

  // Create CSV content
  const headers = ['Review', 'Rating', 'Sentiment', 'Response', 'Tone', 'Quality'];
  const rows = results.map(r => [
    `"${(r.review || '').replace(/"/g, '""')}"`,
    r.rating || '',
    r.sentiment || '',
    `"${(r.response || '').replace(/"/g, '""')}"`,
    r.tone || '',
    r.quality?.score || ''
  ]);

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

  // Download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `review-responses-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`Exported ${results.length} responses!`, 'success');
}

function startQueueMode() {
  // Check login first
  if (!isLoggedIn) {
    showToast('🔐 Please login first', 'error');
    return;
  }

  const reviews = scanPageForReviews();

  if (reviews.length === 0) {
    showToast('📝 No reviews found on this page', 'info');
    return;
  }

  reviewQueue = {
    reviews: reviews,
    currentIndex: 0,
    isActive: true
  };

  showToast(`📋 Found ${reviews.length} reviews! Starting queue...`, 'success');
  showQueuePanel();
}

function showQueuePanel() {
  const existing = document.getElementById('rr-queue-panel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.id = 'rr-queue-panel';

  const currentReview = reviewQueue.reviews[reviewQueue.currentIndex];
  const sentimentDisplay = getSentimentDisplay(currentReview.sentiment);
  const totalReviews = reviewQueue.reviews.length;
  const processed = reviewQueue.reviews.filter(r => r.processed).length;

  panel.innerHTML = `
    <div class="rr-queue-header">
      <div class="rr-queue-title">
        <span class="rr-queue-icon">📋</span>
        <span>Review Queue</span>
      </div>
      <div class="rr-queue-progress">
        <span class="rr-queue-counter">${reviewQueue.currentIndex + 1}/${totalReviews}</span>
        <span class="rr-queue-processed">(${processed} done)</span>
      </div>
      <button class="rr-queue-export" title="Export responses">📤</button>
      <button class="rr-queue-close">×</button>
    </div>

    <div class="rr-queue-body">
      <div class="rr-queue-progress-bar">
        <div class="rr-queue-progress-fill" style="width: ${((reviewQueue.currentIndex + 1) / totalReviews) * 100}%"></div>
      </div>

      <div class="rr-queue-review">
        <div class="rr-queue-sentiment">
          <span class="rr-queue-sentiment-emoji">${sentimentDisplay.emoji}</span>
          <span class="rr-queue-sentiment-label" style="color: ${sentimentDisplay.color}">${sentimentDisplay.label}</span>
          ${currentReview.rating ? `<span class="rr-queue-rating">⭐ ${currentReview.rating}</span>` : ''}
        </div>
        <div class="rr-queue-text">${currentReview.text.substring(0, 200)}${currentReview.text.length > 200 ? '...' : ''}</div>
      </div>

      <div class="rr-queue-response hidden">
        <textarea class="rr-queue-textarea" placeholder="Generated response will appear here..."></textarea>
      </div>

      <div class="rr-queue-actions">
        <button class="rr-queue-btn rr-queue-skip" ${reviewQueue.currentIndex === 0 ? 'disabled' : ''}>◀ Prev</button>
        <button class="rr-queue-btn rr-queue-generate">⚡ Generate</button>
        <button class="rr-queue-btn rr-queue-skip-next">Skip ▶</button>
      </div>

      <div class="rr-queue-done-actions hidden">
        <button class="rr-queue-btn rr-queue-copy">📋 Copy</button>
        <button class="rr-queue-btn rr-queue-copy-next">✅ Copy & Next</button>
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  // Apply current theme to queue panel
  applyTheme(currentTheme);

  // Scroll to current review
  currentReview.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  currentReview.element.classList.add('rr-queue-highlight');

  // Event listeners
  panel.querySelector('.rr-queue-close').addEventListener('click', () => {
    closeQueueMode();
  });

  panel.querySelector('.rr-queue-skip').addEventListener('click', () => {
    navigateQueue(-1);
  });

  panel.querySelector('.rr-queue-skip-next').addEventListener('click', () => {
    navigateQueue(1);
  });

  panel.querySelector('.rr-queue-generate').addEventListener('click', () => {
    generateQueueResponse(panel);
  });

  panel.querySelector('.rr-queue-copy').addEventListener('click', () => {
    copyQueueResponse(panel, false);
  });

  panel.querySelector('.rr-queue-copy-next').addEventListener('click', () => {
    copyQueueResponse(panel, true);
  });

  // Export button
  panel.querySelector('.rr-queue-export').addEventListener('click', () => {
    showExportOptions();
  });

  // Animate in
  setTimeout(() => panel.classList.add('rr-visible'), 10);
}

function navigateQueue(direction) {
  const newIndex = reviewQueue.currentIndex + direction;

  if (newIndex < 0 || newIndex >= reviewQueue.reviews.length) {
    if (newIndex >= reviewQueue.reviews.length) {
      const processed = reviewQueue.reviews.filter(r => r.processed).length;
      showToast(`🎉 Queue complete! ${processed}/${reviewQueue.reviews.length} processed`, 'success');
      closeQueueMode();
    }
    return;
  }

  // Remove highlight from current
  reviewQueue.reviews[reviewQueue.currentIndex].element.classList.remove('rr-queue-highlight');

  // Update index and refresh panel
  reviewQueue.currentIndex = newIndex;
  showQueuePanel();
}

async function generateQueueResponse(panel) {
  const currentReview = reviewQueue.reviews[reviewQueue.currentIndex];
  const generateBtn = panel.querySelector('.rr-queue-generate');
  const responseSection = panel.querySelector('.rr-queue-response');
  const doneActions = panel.querySelector('.rr-queue-done-actions');

  generateBtn.disabled = true;
  generateBtn.innerHTML = '<span class="rr-spinner"></span> Generating...';

  try {
    const sentimentDisplay = getSentimentDisplay(currentReview.sentiment);
    const language = detectLanguage(currentReview.text); // Detect language for queue mode

    // Build context with language instruction
    const languageNames = { de: 'German', en: 'English', nl: 'Dutch', fr: 'French', es: 'Spanish' };
    const languageName = languageNames[language.code] || 'the same language as the review';
    const context = `CRITICAL: You MUST respond in ${languageName}.`;

    // Get business name: prefer user's setting, fallback to auto-detected
    let businessName = cachedUser?.businessName || '';
    if (!businessName) {
      businessName = detectBusinessContext() || await getCachedBusinessName();
    }

    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cachedToken}`
      },
      body: JSON.stringify({
        reviewText: currentReview.text,
        tone: sentimentDisplay.tone,
        outputLanguage: language.code, // Send detected language
        responseLength: 'medium',
        includeEmojis: false,
        businessName: businessName,
        additionalContext: context
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Generation failed');
    }

    // Show response
    panel.querySelector('.rr-queue-textarea').value = data.response;
    responseSection.classList.remove('hidden');
    doneActions.classList.remove('hidden');

    // Mark as processed
    currentReview.processed = true;

    showToast('✨ Generated! Copy or move to next', 'success');

  } catch (error) {
    showToast(`❌ ${error.message}`, 'error');
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML = '⚡ Generate';
  }
}

async function copyQueueResponse(panel, moveToNext) {
  const text = panel.querySelector('.rr-queue-textarea').value;

  if (!text) {
    showToast('⚠️ Nothing to copy', 'warning');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast('📋 Copied!', 'success');

    if (moveToNext) {
      setTimeout(() => navigateQueue(1), 300);
    }
  } catch (error) {
    showToast('❌ Failed to copy', 'error');
  }
}

// ========== BATCH EXPORT ==========
function showExportOptions() {
  const processedReviews = reviewQueue.reviews.filter(r => r.processed && r.response);

  if (processedReviews.length === 0) {
    showToast('⚠️ No responses to export yet', 'warning');
    return;
  }

  // Create export modal
  let modal = document.getElementById('rr-export-modal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'rr-export-modal';
  modal.className = 'rr-export-modal';

  // Apply dark mode if active
  const effectiveTheme = currentTheme === 'auto' ? getSystemTheme() : currentTheme;
  if (effectiveTheme === 'dark') {
    modal.classList.add('rr-dark');
  }

  modal.innerHTML = `
    <div class="rr-export-content">
      <div class="rr-export-header">
        <h3>📤 Export Responses</h3>
        <button class="rr-export-close">×</button>
      </div>
      <div class="rr-export-summary">
        <div class="rr-export-stat">
          <span class="rr-export-value">${processedReviews.length}</span>
          <span class="rr-export-label">Responses</span>
        </div>
      </div>
      <div class="rr-export-actions">
        <button class="rr-export-btn rr-export-csv">
          📊 Download CSV
        </button>
        <button class="rr-export-btn rr-export-copy-all">
          📋 Copy All
        </button>
      </div>
      <p class="rr-export-tip">💡 CSV includes: Review text, Response, Tone, Timestamp</p>
    </div>
  `;

  document.body.appendChild(modal);

  // Event listeners
  modal.querySelector('.rr-export-close').addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelector('.rr-export-csv').addEventListener('click', () => {
    exportToCSV(processedReviews);
    modal.remove();
  });

  modal.querySelector('.rr-export-copy-all').addEventListener('click', async () => {
    await copyAllResponses(processedReviews);
    modal.remove();
  });

  // Animate in
  setTimeout(() => modal.classList.add('rr-visible'), 10);
}

function exportToCSV(reviews) {
  const headers = ['Review', 'Response', 'Sentiment', 'Timestamp'];
  const rows = reviews.map(r => [
    `"${(r.text || '').replace(/"/g, '""')}"`,
    `"${(r.response || '').replace(/"/g, '""')}"`,
    r.sentiment || 'neutral',
    new Date().toISOString()
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  // Create download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reviewresponder-export-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  showToast(`📊 Exported ${reviews.length} responses to CSV!`, 'success');
}

async function copyAllResponses(reviews) {
  const text = reviews.map((r, i) => {
    return `--- Review ${i + 1} ---\nReview: ${r.text}\n\nResponse: ${r.response}\n`;
  }).join('\n');

  try {
    await navigator.clipboard.writeText(text);
    showToast(`📋 Copied ${reviews.length} responses!`, 'success');
  } catch (error) {
    showToast('❌ Failed to copy', 'error');
  }
}

function closeQueueMode() {
  // Remove highlights
  reviewQueue.reviews.forEach(r => r.element.classList.remove('rr-queue-highlight'));

  // Reset queue
  reviewQueue = {
    reviews: [],
    currentIndex: 0,
    isActive: false
  };

  // Remove panel
  const panel = document.getElementById('rr-queue-panel');
  if (panel) {
    panel.classList.remove('rr-visible');
    setTimeout(() => panel.remove(), 300);
  }
}

// Alt+Q shortcut for Queue Mode is now handled in the main keyboard shortcuts handler above

// Add "Scan Page" button to floating UI
function createScanButton() {
  const existing = document.getElementById('rr-scan-btn');
  if (existing) return;

  const platform = detectPlatform();
  // Only show scan button on supported platforms
  if (!['Google', 'Yelp', 'TripAdvisor', 'Booking', 'Trustpilot'].includes(platform.name)) {
    return;
  }

  const btn = document.createElement('button');
  btn.id = 'rr-scan-btn';
  btn.innerHTML = '📋 Scan Reviews';
  btn.title = 'Scan page for reviews (Alt+Q)';
  btn.className = 'rr-scan-btn';

  btn.addEventListener('click', () => {
    startQueueMode();
  });

  document.body.appendChild(btn);
}

// Initialize scan button
setTimeout(createScanButton, 1000);

// Ready message
console.log('%c⚡ ReviewResponder ready!', 'font-size: 14px; font-weight: bold; color: #667eea;');
console.log('%cSelect text → Click ⚡ → Magic!', 'font-size: 12px; color: #764ba2;');
console.log('%cAlt+Q to scan page for reviews', 'font-size: 11px; color: #10b981;');
