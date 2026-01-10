// Content script for ReviewResponder
// Universal review response generator - works on any website

const API_URL = 'https://review-responder.onrender.com/api';

// Sentiment Analysis
function analyzeSentiment(text) {
  const lowerText = text.toLowerCase();

  const positiveWords = [
    'great', 'amazing', 'awesome', 'excellent', 'fantastic', 'wonderful', 'love', 'loved', 'best', 'perfect',
    'outstanding', 'brilliant', 'superb', 'delicious', 'friendly', 'helpful', 'recommend', 'highly',
    'toll', 'super', 'wunderbar', 'perfekt', 'ausgezeichnet', 'fantastisch', 'lecker', 'freundlich',
    'genial', 'klasse', 'prima', 'hervorragend', 'excelente', 'bueno', 'increíble', 'magnifique'
  ];

  const negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'worst', 'poor', 'disappointed', 'disappointing', 'rude',
    'slow', 'cold', 'dirty', 'disgusting', 'never', 'waste', 'overpriced', 'avoid', 'mediocre',
    'schlecht', 'furchtbar', 'schrecklich', 'enttäuscht', 'langsam', 'kalt', 'dreckig', 'teuer',
    'nie wieder', 'malo', 'horrible', 'décevant', 'mauvais'
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
      return { emoji: '🟢', label: 'Positive Review', recommendedTone: 'friendly', color: '#10b981' };
    case 'negative':
      return { emoji: '🔴', label: 'Negative Review', recommendedTone: 'apologetic', color: '#ef4444' };
    default:
      return { emoji: '🟡', label: 'Neutral Review', recommendedTone: 'professional', color: '#f59e0b' };
  }
}

// Create floating response panel with all features
function createResponsePanel() {
  const panel = document.createElement('div');
  panel.id = 'rr-response-panel';
  panel.innerHTML = `
    <div class="rr-panel-header">
      <span>ReviewResponder</span>
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
      <div class="rr-message"></div>
    </div>
  `;
  document.body.appendChild(panel);

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

  return panel;
}

// Generate response with all options
async function generateResponse(panel) {
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
        businessName: stored.user?.businessName || ''
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Generation failed');
    }

    panel.querySelector('.rr-response-text').value = data.response;
    responseArea.classList.remove('hidden');
    messageEl.textContent = '';
  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.className = 'rr-message rr-error';
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate Response';
  }
}

// Copy response to clipboard
async function copyResponse(panel) {
  const responseText = panel.querySelector('.rr-response-text').value;
  const messageEl = panel.querySelector('.rr-message');
  const copyBtn = panel.querySelector('.rr-copy-btn');

  try {
    await navigator.clipboard.writeText(responseText);
    copyBtn.textContent = '✅ Copied!';
    messageEl.textContent = '';
    setTimeout(() => {
      copyBtn.textContent = '📋 Copy';
    }, 2000);
  } catch (error) {
    messageEl.textContent = 'Failed to copy';
    messageEl.className = 'rr-message rr-error';
  }
}

// Clean review text
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

// Show response panel with sentiment analysis
function showResponsePanel(reviewText) {
  let panel = document.getElementById('rr-response-panel');
  if (!panel) {
    panel = createResponsePanel();
  }

  // Analyze sentiment
  const sentiment = analyzeSentiment(reviewText);
  const sentimentInfo = getSentimentInfo(sentiment);

  // Reset panel
  panel.dataset.reviewText = reviewText;
  panel.querySelector('.rr-review-preview').textContent =
    reviewText.length > 100 ? reviewText.substring(0, 100) + '...' : reviewText;

  // Update sentiment display
  const sentimentBadge = panel.querySelector('.rr-sentiment-badge');
  sentimentBadge.textContent = `${sentimentInfo.emoji} ${sentimentInfo.label}`;
  sentimentBadge.style.color = sentimentInfo.color;

  const sentimentTip = panel.querySelector('.rr-sentiment-tip');
  sentimentTip.textContent = `💡 Recommended: ${sentimentInfo.recommendedTone.charAt(0).toUpperCase() + sentimentInfo.recommendedTone.slice(1)}`;

  // Auto-select recommended tone
  panel.querySelector('.rr-tone-select').value = sentimentInfo.recommendedTone;

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

  // Show panel
  panel.classList.add('rr-visible');
}

// Floating mini-button for quick access
let floatingBtn = null;

function createFloatingButton() {
  if (floatingBtn) return floatingBtn;

  floatingBtn = document.createElement('button');
  floatingBtn.id = 'rr-floating-btn';
  floatingBtn.innerHTML = '⚡';
  floatingBtn.title = 'Generate Response';
  floatingBtn.style.cssText = `
    position: fixed;
    display: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    font-size: 18px;
    cursor: pointer;
    z-index: 999998;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    transition: transform 0.2s, box-shadow 0.2s;
  `;

  floatingBtn.addEventListener('mouseenter', () => {
    floatingBtn.style.transform = 'scale(1.1)';
    floatingBtn.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
  });

  floatingBtn.addEventListener('mouseleave', () => {
    floatingBtn.style.transform = 'scale(1)';
    floatingBtn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
  });

  floatingBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const selection = window.getSelection().toString().trim();
    if (selection && selection.length > 10) {
      showResponsePanel(cleanReviewText(selection));
    }
    hideFloatingButton();
  });

  document.body.appendChild(floatingBtn);
  return floatingBtn;
}

function showFloatingButton(x, y) {
  const btn = createFloatingButton();
  btn.style.left = `${Math.min(x + 10, window.innerWidth - 50)}px`;
  btn.style.top = `${Math.min(y - 40, window.innerHeight - 50)}px`;
  btn.style.display = 'block';
}

function hideFloatingButton() {
  if (floatingBtn) {
    floatingBtn.style.display = 'none';
  }
}

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
      btn.textContent = '💬 Generate Response';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showResponsePanel(reviewText);
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
    showResponsePanel(reviewText);
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
      showResponsePanel(cleanReviewText(selection));
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

console.log('ReviewResponder loaded! Select text + ⚡ button or Right-click to generate responses.');
