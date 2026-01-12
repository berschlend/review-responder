const API_URL = 'https://review-responder.onrender.com/api';

// Constants
const UNLIMITED_LIMIT = 999999;
const UPGRADE_THRESHOLD_PERCENT = 80;
const CRITICAL_THRESHOLD_PERCENT = 90;
const LIMIT_REACHED_PERCENT = 100;

// Plan display names
const PLAN_NAMES = {
  free: 'Free Plan',
  starter: 'Starter',
  pro: 'Pro',
  unlimited: 'Unlimited'
};

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

  // Show loading state
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Logging in...';
  submitBtn.disabled = true;

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  console.log('[RR Popup] Attempting login for:', email);

  try {
    console.log('[RR Popup] Sending request to:', `${API_URL}/auth/login`);
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    console.log('[RR Popup] Response status:', response.status);
    const data = await response.json();
    console.log('[RR Popup] Response data:', data.user ? 'User received' : data.error || 'Unknown');

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    token = data.token;
    user = data.user;

    // Store in extension storage
    try {
      await chrome.storage.local.set({ token, user });
      console.log('[RR Popup] Credentials saved to storage');
    } catch (e) {
      console.error('[RR Popup] Failed to save credentials:', e);
    }

    showMainSection();
    fetchUsage();
  } catch (error) {
    console.error('[RR Popup] Login error:', error);
    loginError.textContent = error.message || 'Connection failed. Please try again.';
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
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

// Helper: Extract user usage data with defaults
function getUserUsageData() {
  return {
    used: user?.responsesUsed || 0,
    limit: user?.responsesLimit || 20,
    plan: user?.plan || 'free'
  };
}

// Helper: Calculate usage percentage (0 for unlimited)
function getUsagePercentage(used, limit) {
  return limit === UNLIMITED_LIMIT ? 0 : (used / limit) * 100;
}

// Helper: Check if user has unlimited plan
function isUnlimitedPlan(plan, limit) {
  return plan === 'unlimited' || limit === UNLIMITED_LIMIT;
}

// Update usage display
function updateUsageDisplay() {
  const { used, limit, plan } = getUserUsageData();
  const percentage = getUsagePercentage(used, limit);
  const isUnlimited = isUnlimitedPlan(plan, limit);

  usageCount.textContent = used;
  usageLimit.textContent = isUnlimited ? '∞' : limit;

  // Update plan badge
  planBadge.textContent = PLAN_NAMES[plan] || 'Free Plan';
  planBadge.className = 'plan-badge ' + plan;

  progress.style.width = `${Math.min(percentage, 100)}%`;

  // Show upgrade link when >80% used (not for unlimited)
  upgradeLink.classList.toggle('hidden', isUnlimited || percentage < UPGRADE_THRESHOLD_PERCENT);

  // Critical progress bar color
  progress.style.background = (!isUnlimited && percentage >= CRITICAL_THRESHOLD_PERCENT) ? '#ef4444' : '';

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

  const { used, limit, plan } = getUserUsageData();

  // Don't show triggers for unlimited plan
  if (isUnlimitedPlan(plan, limit)) return;

  const percentage = getUsagePercentage(used, limit);

  // Show limit modal at 100%
  if (percentage >= LIMIT_REACHED_PERCENT) {
    limitModal?.classList.remove('hidden');
    upgradeBanner?.classList.add('hidden');
    return;
  }

  // Show upgrade banner at 80%
  upgradeBanner?.classList.toggle('hidden', percentage < UPGRADE_THRESHOLD_PERCENT);
}
