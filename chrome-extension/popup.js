const API_URL = 'https://review-responder.onrender.com/api';

// Detect language from review text (must be called BEFORE cleaning!)
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

  if (germanCount >= 2) return { code: 'de', name: 'Deutsch' };
  if (dutchCount >= 2) return { code: 'nl', name: 'Nederlands' };
  if (frenchCount >= 2) return { code: 'fr', name: 'Français' };
  if (spanishCount >= 2) return { code: 'es', name: 'Español' };

  return { code: 'en', name: 'English' };
}

// Clean review text - remove ONLY UI elements, preserve actual review content
function cleanReviewText(text) {
  // Only remove very specific UI patterns that won't appear in actual reviews
  // Be conservative - it's better to leave UI text than remove review content
  const uiPatterns = [
    // Time stamps (German)
    /vor \d+ (Sekunden?|Minuten?|Stunden?|Tagen?|Wochen?|Monaten?|Jahren?)/gi,
    // Time stamps (English)
    /\d+ (second|minute|hour|day|week|month|year)s? ago/gi,
    // Owner response labels
    /Antwort vom Inhaber/gi,
    /Owner response/gi,
    /Response from the owner/gi,
    // Helpful counts (specific patterns)
    /\d+ (Person|Personen) fanden? diese Rezension hilfreich/gi,
    /\d+ (person|people) found this (review )?helpful/gi,
    // Google translate indicators
    /Von Google übersetzt/gi,
    /Translated by Google/gi,
    /Übersetzung anzeigen/gi,
    /Original anzeigen/gi,
    // Local Guide badge
    /Local Guide\s*·?\s*\d*\s*(Rezension(en)?|reviews?)?/gi,
    /Lokal Guide\s*·?\s*\d*\s*(Rezension(en)?|reviews?)?/gi,
  ];

  let cleaned = text;
  uiPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  return cleaned.replace(/\s+/g, ' ').trim();
}

// DOM Elements
const loginSection = document.getElementById('login-section');
const mainSection = document.getElementById('main-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const mainError = document.getElementById('main-error');
const successMsg = document.getElementById('success-msg');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const usageCount = document.getElementById('usage-count');
const usageLimit = document.getElementById('usage-limit');
const progress = document.getElementById('progress');
const planBadge = document.getElementById('plan-badge');
const upgradeLink = document.getElementById('upgrade-link');
const reviewText = document.getElementById('review-text');
const toneSelect = document.getElementById('tone-select');
const generateBtn = document.getElementById('generate-btn');
const responseSection = document.getElementById('response-section');
const responseText = document.getElementById('response-text');
const copyBtn = document.getElementById('copy-btn');
const regenerateBtn = document.getElementById('regenerate-btn');

// Preview elements
const previewTab = document.getElementById('preview-tab');
const textTab = document.getElementById('text-tab');
const previewView = document.getElementById('preview-view');
const textView = document.getElementById('text-view');
const previewText = document.getElementById('preview-text');
const businessAvatar = document.getElementById('business-avatar');
const previewBusinessName = document.getElementById('preview-business-name');
const toneButtons = document.querySelectorAll('.tone-btn');

// Stats elements
const statToday = document.getElementById('stat-today');
const statWeek = document.getElementById('stat-week');
const statTotal = document.getElementById('stat-total');

// Onboarding elements
const onboardingCard = document.getElementById('onboarding-card');
const dismissOnboarding = document.getElementById('dismiss-onboarding');

// Upgrade elements
const upgradeBanner = document.getElementById('upgrade-banner');
const limitModal = document.getElementById('limit-modal');
const closeLimitModal = document.getElementById('close-limit-modal');

// State
let token = null;
let user = null;
let currentResponse = '';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Check for stored token
  const stored = await chrome.storage.local.get(['token', 'user']);
  if (stored.token && stored.user) {
    token = stored.token;
    user = stored.user;
    showMainSection();
    fetchUsage();
    fetchStats();
  }
});

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    token = data.token;
    user = data.user;

    // Store in extension storage
    await chrome.storage.local.set({ token, user });

    showMainSection();
    fetchUsage();
    fetchStats();
  } catch (error) {
    loginError.textContent = error.message;
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  token = null;
  user = null;
  await chrome.storage.local.remove(['token', 'user']);
  showLoginSection();
});

// Generate Response
generateBtn.addEventListener('click', () => generateResponse());
regenerateBtn.addEventListener('click', () => generateResponse());

async function generateResponse(overrideTone = null) {
  const review = reviewText.value.trim();
  const tone = overrideTone || toneSelect.value;

  if (!review) {
    mainError.textContent = 'Please enter a review';
    return;
  }

  // CRITICAL: Detect language from RAW text BEFORE cleaning!
  // The cleanReviewText() removes UI elements that could contain language indicators
  const detectedLang = detectLanguage(review);

  // Clean the review text to remove UI elements
  const cleanedReview = cleanReviewText(review);

  if (!cleanedReview || cleanedReview.length < 5) {
    mainError.textContent = 'Please enter a valid review text';
    return;
  }

  // Update tone select if overridden
  if (overrideTone) {
    toneSelect.value = overrideTone;
  }

  mainError.textContent = '';
  successMsg.textContent = '';
  generateBtn.disabled = true;
  generateBtn.innerHTML = '<span class="loading"></span>Generating...';

  // Disable tone buttons during generation
  toneButtons.forEach(btn => btn.disabled = true);

  try {
    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      // Send explicit language code instead of 'auto' to fix wrong-language responses
      body: JSON.stringify({ reviewText: cleanedReview, tone, outputLanguage: detectedLang.code })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Generation failed');
    }

    currentResponse = data.response;
    responseText.textContent = data.response;
    previewText.textContent = data.response;
    responseSection.classList.remove('hidden');

    // Update tone button states
    updateToneButtons(tone);

    // Update usage and check for upgrade triggers
    await fetchUsage();
    checkUpgradeTriggers();
  } catch (error) {
    mainError.textContent = error.message;
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML = 'Generate Response';
    toneButtons.forEach(btn => btn.disabled = false);
  }
}

// Tab switching
previewTab.addEventListener('click', () => {
  previewTab.classList.add('active');
  textTab.classList.remove('active');
  previewView.classList.remove('hidden');
  textView.classList.add('hidden');
});

textTab.addEventListener('click', () => {
  textTab.classList.add('active');
  previewTab.classList.remove('active');
  textView.classList.remove('hidden');
  previewView.classList.add('hidden');
});

// Tone buttons
toneButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const tone = btn.dataset.tone;
    generateResponse(tone);
  });
});

function updateToneButtons(activeTone) {
  toneButtons.forEach(btn => {
    if (btn.dataset.tone === activeTone) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Copy to clipboard
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(currentResponse);
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '✓ Copied!';
    copyBtn.style.background = '#059669';
    setTimeout(() => {
      copyBtn.innerHTML = 'Copy';
      copyBtn.style.background = '';
    }, 2000);
  } catch (error) {
    mainError.textContent = 'Failed to copy';
  }
});

// Fetch usage
async function fetchUsage() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      user = data.user;
      await chrome.storage.local.set({ user });
      updateUsageDisplay();
      updatePreviewBusinessName();
    }
  } catch (error) {
    console.error('Failed to fetch usage:', error);
  }
}

// Update usage display
function updateUsageDisplay() {
  const used = user.responsesUsed || 0;
  const limit = user.responsesLimit || 20;
  const plan = user.plan || 'free';

  usageCount.textContent = used;
  usageLimit.textContent = limit === 999999 ? '∞' : limit;

  // Update plan badge
  const planNames = {
    free: 'Free Plan',
    starter: 'Starter',
    pro: 'Pro',
    unlimited: 'Unlimited'
  };
  planBadge.textContent = planNames[plan] || 'Free Plan';
  planBadge.className = 'plan-badge ' + plan;

  const percentage = limit === 999999 ? 0 : (used / limit) * 100;
  progress.style.width = `${Math.min(percentage, 100)}%`;

  // Show upgrade link when >80% used (not for unlimited)
  if (percentage >= 80 && plan !== 'unlimited') {
    upgradeLink.classList.remove('hidden');
  } else {
    upgradeLink.classList.add('hidden');
  }

  if (percentage >= 90 && limit !== 999999) {
    progress.style.background = '#ef4444';
  } else {
    progress.style.background = '';
  }
}

// Update preview business name
function updatePreviewBusinessName() {
  const name = user.businessName || 'Your Business';
  previewBusinessName.textContent = name;
  businessAvatar.textContent = name.charAt(0).toUpperCase();
}

// Fetch stats
async function fetchStats() {
  try {
    const response = await fetch(`${API_URL}/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      if (statToday) statToday.textContent = data.today || 0;
      if (statWeek) statWeek.textContent = data.thisWeek || 0;
      if (statTotal) statTotal.textContent = data.total || 0;
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error);
  }
}

// Show/hide sections
function showLoginSection() {
  loginSection.classList.remove('hidden');
  mainSection.classList.add('hidden');
  responseSection.classList.add('hidden');
  loginError.textContent = '';
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
}

function showMainSection() {
  loginSection.classList.add('hidden');
  mainSection.classList.remove('hidden');
  userEmail.textContent = user.email;
  updateUsageDisplay();
  updatePreviewBusinessName();

  // Show onboarding card for first-time users
  checkOnboarding();
}

// Onboarding logic
function checkOnboarding() {
  const onboardingSeen = localStorage.getItem('rr_onboarding_seen');
  if (!onboardingSeen && onboardingCard) {
    onboardingCard.classList.remove('hidden');
  }
}

// Dismiss onboarding
if (dismissOnboarding) {
  dismissOnboarding.addEventListener('click', () => {
    localStorage.setItem('rr_onboarding_seen', 'true');
    onboardingCard.classList.add('hidden');
  });
}

// Close limit modal
if (closeLimitModal) {
  closeLimitModal.addEventListener('click', () => {
    limitModal.classList.add('hidden');
  });
}

// Check if user needs upgrade prompts
function checkUpgradeTriggers() {
  if (!user) return;

  const used = user.responsesUsed || 0;
  const limit = user.responsesLimit || 20;
  const plan = user.plan || 'free';

  // Don't show triggers for unlimited plan
  if (plan === 'unlimited' || limit === 999999) return;

  const percentage = (used / limit) * 100;

  // Show limit modal at 100%
  if (percentage >= 100) {
    if (limitModal) limitModal.classList.remove('hidden');
    if (upgradeBanner) upgradeBanner.classList.add('hidden');
    return;
  }

  // Show upgrade banner at 80%
  if (percentage >= 80) {
    if (upgradeBanner) upgradeBanner.classList.remove('hidden');
  } else {
    if (upgradeBanner) upgradeBanner.classList.add('hidden');
  }
}
