const API_URL = 'https://review-responder.onrender.com/api';

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
      body: JSON.stringify({ reviewText: review, tone })
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

    // Update usage
    fetchUsage();
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
  const limit = user.responsesLimit || 5;

  usageCount.textContent = used;
  usageLimit.textContent = limit === 999999 ? '∞' : limit;

  const percentage = limit === 999999 ? 0 : (used / limit) * 100;
  progress.style.width = `${Math.min(percentage, 100)}%`;

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
}
