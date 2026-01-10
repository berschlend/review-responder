// Content script for Google Maps/Business reviews
// Adds "Generate Response" buttons next to reviews

const API_URL = 'https://review-responder.onrender.com/api';

// Create floating response panel
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
      <select class="rr-tone-select">
        <option value="professional">Professional</option>
        <option value="friendly">Friendly</option>
        <option value="formal">Formal</option>
        <option value="apologetic">Apologetic</option>
      </select>
      <button class="rr-generate-btn">Generate Response</button>
      <div class="rr-response-area hidden">
        <div class="rr-response-text"></div>
        <div class="rr-button-row">
          <button class="rr-copy-btn">Copy</button>
          <button class="rr-regenerate-btn">Regenerate</button>
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
    console.log('[RR] Generate button clicked');
    generateResponse(panel);
  });
  panel.querySelector('.rr-regenerate-btn').addEventListener('click', () => {
    console.log('[RR] Regenerate button clicked');
    generateResponse(panel);
  });
  panel.querySelector('.rr-copy-btn').addEventListener('click', () => copyResponse(panel));

  // Quick tone switch buttons
  panel.querySelectorAll('.rr-tone-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tone = btn.dataset.tone;
      console.log('[RR] Quick tone button clicked:', tone);
      // Update dropdown to match
      panel.querySelector('.rr-tone-select').value = tone;
      // Update active state
      panel.querySelectorAll('.rr-tone-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Generate with new tone
      generateResponse(panel);
    });
  });

  return panel;
}

// Generate response
async function generateResponse(panel) {
  console.log('[RR] generateResponse called');

  // Safely get reviewText with optional chaining
  const reviewText = panel?.dataset?.reviewText || '';
  const tone = panel.querySelector('.rr-tone-select').value;
  const generateBtn = panel.querySelector('.rr-generate-btn');
  const messageEl = panel.querySelector('.rr-message');
  const responseArea = panel.querySelector('.rr-response-area');

  // Defensive check: ensure reviewText exists
  if (!reviewText || reviewText.trim().length === 0) {
    console.error('[RR] Error: No review text found in panel.dataset');
    messageEl.textContent = 'Error: No review text found. Please close and try again.';
    messageEl.className = 'rr-message rr-error';
    return;
  }

  console.log('[RR] Review text:', reviewText?.substring(0, 50) + '...');
  console.log('[RR] Tone:', tone);

  // Get token from storage
  let stored;
  try {
    stored = await chrome.storage.local.get(['token']);
    console.log('[RR] Token retrieved:', stored.token ? 'Yes' : 'No');
  } catch (storageError) {
    console.error('[RR] Storage error:', storageError);
    // Handle "Extension context invalidated" error
    if (storageError.message && storageError.message.includes('Extension context invalidated')) {
      messageEl.textContent = 'Extension was updated. Please refresh this page (F5).';
    } else {
      messageEl.textContent = 'Error accessing storage. Please refresh the page.';
    }
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
    console.log('[RR] Making API request to:', `${API_URL}/generate`);
    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${stored.token}`
      },
      body: JSON.stringify({ reviewText, tone, outputLanguage: 'auto' })
    });

    console.log('[RR] Response status:', response.status);
    const data = await response.json();
    console.log('[RR] Response data received');

    if (!response.ok) {
      throw new Error(data.error || 'Generation failed');
    }

    panel.querySelector('.rr-response-text').textContent = data.response;
    responseArea.classList.remove('hidden');
    messageEl.textContent = '';
    console.log('[RR] Response generated successfully');
  } catch (error) {
    console.error('[RR] Error:', error);
    messageEl.textContent = error.message;
    messageEl.className = 'rr-message rr-error';
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate Response';
  }
}

// Copy response to clipboard
async function copyResponse(panel) {
  const responseText = panel.querySelector('.rr-response-text').textContent;
  const messageEl = panel.querySelector('.rr-message');

  try {
    await navigator.clipboard.writeText(responseText);
    messageEl.textContent = 'Copied!';
    messageEl.className = 'rr-message rr-success';
    setTimeout(() => {
      messageEl.textContent = '';
    }, 2000);
  } catch (error) {
    messageEl.textContent = 'Failed to copy';
    messageEl.className = 'rr-message rr-error';
  }
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

  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');

  return cleaned.trim();
}

// Add buttons to reviews
function addButtonsToReviews() {
  // Google Maps reviews selector
  const reviewSelectors = [
    '.jftiEf', // Google Maps review cards
    '[data-review-id]', // Alternative selector
    '.WMbnJf', // Review container
  ];

  for (const selector of reviewSelectors) {
    const reviews = document.querySelectorAll(selector);
    reviews.forEach(review => {
      // Skip if already has button
      if (review.querySelector('.rr-btn')) return;

      // Find review text - be more specific to get only the actual review content
      const textEl = review.querySelector('.wiI7pd, .MyEned, .Jtu6Td');
      if (!textEl) return;

      // Clean the text to remove UI elements
      const reviewText = cleanReviewText(textEl.textContent);
      if (!reviewText || reviewText.length < 10) return;

      // Create button
      const btn = document.createElement('button');
      btn.className = 'rr-btn';
      btn.textContent = '💬 Generate Response';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showResponsePanel(reviewText);
      });

      // Find action area or append to review
      const actionArea = review.querySelector('.k8MTF, .GBkF3d') || review;
      actionArea.appendChild(btn);
    });
  }
}

// Show response panel
function showResponsePanel(reviewText) {
  let panel = document.getElementById('rr-response-panel');
  if (!panel) {
    panel = createResponsePanel();
  }

  // DEBUG: Log what text was extracted
  console.log('[RR] Raw review text extracted:', reviewText);
  console.log('[RR] Text length:', reviewText.length);

  // Reset panel
  panel.dataset.reviewText = reviewText;
  panel.querySelector('.rr-review-preview').textContent =
    reviewText.length > 100 ? reviewText.substring(0, 100) + '...' : reviewText;
  panel.querySelector('.rr-response-area').classList.add('hidden');
  panel.querySelector('.rr-response-text').textContent = '';
  panel.querySelector('.rr-message').textContent = '';

  // Show panel
  panel.classList.add('rr-visible');
}

// Initialize
let panel = null;

// Run on page load
addButtonsToReviews();

// Watch for dynamic content (Google Maps loads reviews dynamically)
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

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Listen for messages from background script (context menu)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[RR] Message received:', message.action);

  if (message.action === 'showPanelWithText') {
    // Show panel with the selected text from context menu
    const reviewText = cleanReviewText(message.reviewText);
    console.log('[RR] Showing panel with selected text:', reviewText.substring(0, 50) + '...');
    showResponsePanel(reviewText);
    sendResponse({ success: true });
  }

  if (message.action === 'getSelection') {
    // Return currently selected text
    const selection = window.getSelection().toString().trim();
    sendResponse({ text: selection });
  }

  return true; // Keep channel open for async
});

// Also allow keyboard shortcut: Select text + press Alt+R to generate
document.addEventListener('keydown', (e) => {
  if (e.altKey && e.key === 'r') {
    const selection = window.getSelection().toString().trim();
    if (selection && selection.length > 10) {
      console.log('[RR] Keyboard shortcut triggered with selection');
      showResponsePanel(cleanReviewText(selection));
    }
  }
});

console.log('ReviewResponder content script loaded - Right-click on selected text to generate response!');
