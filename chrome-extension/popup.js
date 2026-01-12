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
const planBadge = document.getElementById('plan-badge');
const upgradeLink = document.getElementById('upgrade-link');

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

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Check for stored token
    const stored = await chrome.storage.local.get(['token', 'user']);
    if (stored.token && stored.user) {
      token = stored.token;
      user = stored.user;
      showMainSection();
      fetchUsage();
    }
  } catch (e) {
    console.error('Failed to load stored credentials:', e);
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
    try {
      await chrome.storage.local.set({ token, user });
    } catch (e) {
      console.error('Failed to save credentials:', e);
    }

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
  try {
    await chrome.storage.local.remove(['token', 'user']);
  } catch (e) {
    console.error('Failed to clear credentials:', e);
  }
  showLoginSection();
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
      try {
        await chrome.storage.local.set({ user });
      } catch (e) {
        console.error('Failed to update user:', e);
      }
      updateUsageDisplay();
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

  // Check upgrade triggers
  checkUpgradeTriggers();
}

// Show/hide sections
function showLoginSection() {
  loginSection.classList.remove('hidden');
  mainSection.classList.add('hidden');
  loginError.textContent = '';
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
}

function showMainSection() {
  loginSection.classList.add('hidden');
  mainSection.classList.remove('hidden');
  userEmail.textContent = user.email;
  updateUsageDisplay();

  // Show onboarding card for first-time users
  checkOnboarding();
}

// Onboarding logic - use chrome.storage.local for persistence
async function checkOnboarding() {
  try {
    const stored = await chrome.storage.local.get(['rr_onboarding_seen']);
    if (!stored.rr_onboarding_seen && onboardingCard) {
      onboardingCard.classList.remove('hidden');
    }
  } catch (e) {
    console.error('Failed to check onboarding:', e);
  }
}

// Dismiss onboarding
if (dismissOnboarding) {
  dismissOnboarding.addEventListener('click', async () => {
    try {
      await chrome.storage.local.set({ rr_onboarding_seen: true });
    } catch (e) {
      console.error('Failed to save onboarding:', e);
    }
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
