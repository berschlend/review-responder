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

// ========== CREATE KILLER PANEL ==========
async function createResponsePanel() {
  const existing = document.getElementById('rr-response-panel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.id = 'rr-response-panel';

  const platform = detectPlatform();
  const timeSaved = await getTimeSaved();
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
        <div class="rr-time-saved" title="Time saved using ReviewResponder">
          <span class="rr-time-icon">⏱️</span>
          <span class="rr-time-value">${formatTimeSaved(timeSaved.minutes)}</span>
          <span class="rr-time-label">saved</span>
        </div>
        <button class="rr-templates-btn" title="My Templates">💾</button>
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
          ${isPasteSupported ? `<p class="rr-help-tip">💡 On ${platform.name}: Use "Paste & Submit" to auto-fill!</p>` : ''}
          <button class="rr-help-close">Got it!</button>
        </div>
      </div>

      <!-- Templates Overlay -->
      <div class="rr-templates-overlay hidden">
        <div class="rr-templates-content">
          <div class="rr-templates-header">
            <h3>💾 My Templates</h3>
            <button class="rr-templates-close">×</button>
          </div>
          <div class="rr-templates-list">
            <!-- Templates will be populated dynamically -->
            <p class="rr-templates-empty">No templates saved yet.<br>Generate a response and click "Save as Template"!</p>
          </div>
          <div class="rr-templates-footer">
            <span class="rr-templates-count">0/${MAX_TEMPLATES} templates</span>
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

  // Load templates into dropdown
  loadTemplates().then(templates => {
    populateTemplateDropdown(panel, templates);
    updateTemplatesOverlay(panel, templates);
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

  // Templates button (header)
  panel.querySelector('.rr-templates-btn').addEventListener('click', async () => {
    const templates = await loadTemplates();
    updateTemplatesOverlay(panel, templates);
    panel.querySelector('.rr-templates-overlay').classList.toggle('hidden');
  });

  panel.querySelector('.rr-templates-close').addEventListener('click', () => {
    panel.querySelector('.rr-templates-overlay').classList.add('hidden');
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
  const detectedLanguage = panel.dataset.detectedLanguage || 'en'; // Use stored language
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
    // IMPORTANT: Add explicit language instruction to fix language bug
    const languageNames = { de: 'German', en: 'English', nl: 'Dutch', fr: 'French', es: 'Spanish' };
    const languageName = languageNames[detectedLanguage] || 'the same language as the review';

    let context = `CRITICAL: You MUST respond in ${languageName}. The review is written in ${languageName}, so your response must also be in ${languageName}.`;

    if (detectedIssues.length > 0) {
      const issueLabels = detectedIssues.map(i => i.label.replace(/[^\w\s]/g, '').trim());
      context += ` Customer complaints detected: ${issueLabels.join(', ')}. Address these specific issues in your response.`;
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

    // Auto-copy if enabled
    const settings = cachedSettings || await loadSettings();
    if (settings.autoCopy) {
      try {
        await navigator.clipboard.writeText(data.response);
        showToast('✨ Generated & copied! ~3 min saved', 'success');

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
        businessName: stored.user?.businessName || '',
        additionalContext: editContext
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Edit failed');
    }

    // Update response
    panel.querySelector('.rr-response-textarea').value = data.response;

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
        businessName: cachedUser?.businessName || '',
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

    // Track time saved
    await trackTimeSaved();

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

// Add keyboard shortcut for Queue Mode: Alt+Q
document.addEventListener('keydown', (e) => {
  if (e.altKey && e.key.toLowerCase() === 'q') {
    e.preventDefault();
    if (reviewQueue.isActive) {
      closeQueueMode();
      showToast('📋 Queue mode closed', 'info');
    } else {
      startQueueMode();
    }
  }
});

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
