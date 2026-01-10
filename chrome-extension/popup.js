const API_URL = 'https://review-responder.onrender.com/api';

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

  // Clean the review text to remove UI elements that might confuse language detection
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
      body: JSON.stringify({ reviewText: cleanedReview, tone, outputLanguage: 'auto' })
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

    // Record activity for streak and achievements
    recordActivity();
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
  loadStreakAndAchievements();
}

// ========== DAILY STREAK & ACHIEVEMENTS ==========

// Achievement definitions
const ACHIEVEMENTS = [
  { id: 'first_response', emoji: '🎯', name: 'First Response', description: 'Generate your first response', target: 1 },
  { id: 'responses_10', emoji: '🚀', name: 'Getting Started', description: 'Generate 10 responses', target: 10 },
  { id: 'responses_50', emoji: '⭐', name: 'Rising Star', description: 'Generate 50 responses', target: 50 },
  { id: 'responses_100', emoji: '🌟', name: 'Pro Status', description: 'Generate 100 responses', target: 100 },
  { id: 'streak_7', emoji: '🔥', name: 'Week Warrior', description: 'Maintain a 7-day streak', target: 7 },
  { id: 'streak_30', emoji: '💎', name: 'Dedication', description: 'Maintain a 30-day streak', target: 30 },
];

// DOM Elements for achievements
const streakBadge = document.getElementById('streak-badge');
const streakCount = document.getElementById('streak-count');
const achievementsToggle = document.getElementById('achievements-toggle');
const achievementsUnlocked = document.getElementById('achievements-unlocked');
const achievementsTotal = document.getElementById('achievements-total');
const achievementsPanel = document.getElementById('achievements-panel');
const achievementsClose = document.getElementById('achievements-close');
const achievementsList = document.getElementById('achievements-list');
const nextAchievement = document.getElementById('next-achievement');

// Load streak and achievements
async function loadStreakAndAchievements() {
  try {
    const stored = await chrome.storage.local.get(['rr_streak', 'rr_achievements']);

    // Initialize streak data
    let streakData = stored.rr_streak || {
      lastActiveDate: null,
      currentStreak: 0,
      longestStreak: 0
    };

    // Initialize achievements
    let achievementsData = stored.rr_achievements || {
      unlocked: [],
      totalResponses: 0
    };

    // Update streak based on today's date
    streakData = updateStreak(streakData);

    // Save updated data
    await chrome.storage.local.set({ rr_streak: streakData });

    // Update UI
    updateStreakUI(streakData);
    updateAchievementsUI(achievementsData, streakData);

  } catch (e) {
    console.error('Error loading streak/achievements:', e);
  }
}

// Update streak logic
function updateStreak(streakData) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (streakData.lastActiveDate === today) {
    // Already active today, no change
    return streakData;
  } else if (streakData.lastActiveDate === yesterday) {
    // Continue streak
    return streakData;
  } else if (streakData.lastActiveDate) {
    // Streak broken
    return {
      ...streakData,
      currentStreak: 0
    };
  }

  return streakData;
}

// Record activity (called after generating a response)
async function recordActivity() {
  try {
    const stored = await chrome.storage.local.get(['rr_streak', 'rr_achievements']);

    let streakData = stored.rr_streak || {
      lastActiveDate: null,
      currentStreak: 0,
      longestStreak: 0
    };

    let achievementsData = stored.rr_achievements || {
      unlocked: [],
      totalResponses: 0
    };

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    // Update streak
    if (streakData.lastActiveDate !== today) {
      if (streakData.lastActiveDate === yesterday || !streakData.lastActiveDate) {
        // Continue or start streak
        streakData.currentStreak++;
      } else {
        // Streak was broken, restart
        streakData.currentStreak = 1;
      }
      streakData.lastActiveDate = today;

      // Update longest streak
      if (streakData.currentStreak > streakData.longestStreak) {
        streakData.longestStreak = streakData.currentStreak;
      }
    }

    // Update total responses
    achievementsData.totalResponses++;

    // Check for new achievements
    const newAchievements = checkAchievements(achievementsData, streakData);

    // Save data
    await chrome.storage.local.set({
      rr_streak: streakData,
      rr_achievements: achievementsData
    });

    // Update UI
    updateStreakUI(streakData);
    updateAchievementsUI(achievementsData, streakData);

    // Show toast for new achievements
    newAchievements.forEach(achievement => {
      showAchievementToast(achievement);
    });

    // Show streak milestone toast
    if ([3, 7, 14, 30, 100].includes(streakData.currentStreak) &&
        streakData.lastActiveDate === today) {
      showStreakToast(streakData.currentStreak);
    }

  } catch (e) {
    console.error('Error recording activity:', e);
  }
}

// Check for new achievements
function checkAchievements(achievementsData, streakData) {
  const newUnlocked = [];

  ACHIEVEMENTS.forEach(achievement => {
    if (achievementsData.unlocked.includes(achievement.id)) return;

    let unlocked = false;

    if (achievement.id === 'first_response' && achievementsData.totalResponses >= 1) {
      unlocked = true;
    } else if (achievement.id === 'responses_10' && achievementsData.totalResponses >= 10) {
      unlocked = true;
    } else if (achievement.id === 'responses_50' && achievementsData.totalResponses >= 50) {
      unlocked = true;
    } else if (achievement.id === 'responses_100' && achievementsData.totalResponses >= 100) {
      unlocked = true;
    } else if (achievement.id === 'streak_7' && streakData.currentStreak >= 7) {
      unlocked = true;
    } else if (achievement.id === 'streak_30' && streakData.currentStreak >= 30) {
      unlocked = true;
    }

    if (unlocked) {
      achievementsData.unlocked.push(achievement.id);
      newUnlocked.push(achievement);
    }
  });

  return newUnlocked;
}

// Update streak UI
function updateStreakUI(streakData) {
  if (streakCount) {
    streakCount.textContent = streakData.currentStreak;
  }

  if (streakBadge) {
    if (streakData.currentStreak >= 7) {
      streakBadge.classList.add('on-fire');
    } else {
      streakBadge.classList.remove('on-fire');
    }
  }
}

// Update achievements UI
function updateAchievementsUI(achievementsData, streakData) {
  const unlockedCount = achievementsData.unlocked.length;

  if (achievementsUnlocked) {
    achievementsUnlocked.textContent = unlockedCount;
  }
  if (achievementsTotal) {
    achievementsTotal.textContent = ACHIEVEMENTS.length;
  }

  // Populate achievements list
  if (achievementsList) {
    achievementsList.innerHTML = ACHIEVEMENTS.map(achievement => {
      const isUnlocked = achievementsData.unlocked.includes(achievement.id);
      return `
        <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}">
          <span class="achievement-emoji">${achievement.emoji}</span>
          <div class="achievement-info">
            <span class="achievement-name">${achievement.name}</span>
            <span class="achievement-desc">${achievement.description}</span>
          </div>
          ${isUnlocked ? '<span class="achievement-check">✓</span>' : ''}
        </div>
      `;
    }).join('');
  }

  // Show next achievement to unlock
  if (nextAchievement) {
    const nextToUnlock = ACHIEVEMENTS.find(a => !achievementsData.unlocked.includes(a.id));
    if (nextToUnlock) {
      let progress = 0;
      let current = 0;

      if (nextToUnlock.id.startsWith('responses_')) {
        current = achievementsData.totalResponses;
        progress = (current / nextToUnlock.target) * 100;
      } else if (nextToUnlock.id.startsWith('streak_')) {
        current = streakData.currentStreak;
        progress = (current / nextToUnlock.target) * 100;
      } else if (nextToUnlock.id === 'first_response') {
        current = achievementsData.totalResponses;
        progress = current >= 1 ? 100 : 0;
      }

      nextAchievement.innerHTML = `
        <div class="next-achievement-label">Next: ${nextToUnlock.emoji} ${nextToUnlock.name}</div>
        <div class="next-achievement-progress">
          <div class="next-achievement-bar" style="width: ${Math.min(progress, 100)}%"></div>
        </div>
        <div class="next-achievement-count">${current}/${nextToUnlock.target}</div>
      `;
    } else {
      nextAchievement.innerHTML = '<div class="all-unlocked">🎉 All achievements unlocked!</div>';
    }
  }
}

// Show achievement toast
function showAchievementToast(achievement) {
  const toast = document.createElement('div');
  toast.className = 'achievement-toast';
  toast.innerHTML = `
    <span class="toast-emoji">${achievement.emoji}</span>
    <div class="toast-content">
      <div class="toast-title">Achievement Unlocked!</div>
      <div class="toast-name">${achievement.name}</div>
    </div>
  `;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Show streak toast
function showStreakToast(days) {
  const toast = document.createElement('div');
  toast.className = 'streak-toast';
  toast.innerHTML = `
    <span class="toast-emoji">🔥</span>
    <div class="toast-content">
      <div class="toast-title">${days} Day Streak!</div>
      <div class="toast-name">Keep it up!</div>
    </div>
  `;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Event listeners for achievements panel
if (achievementsToggle) {
  achievementsToggle.addEventListener('click', () => {
    achievementsPanel.classList.toggle('hidden');
  });
}

if (achievementsClose) {
  achievementsClose.addEventListener('click', () => {
    achievementsPanel.classList.add('hidden');
  });
}
